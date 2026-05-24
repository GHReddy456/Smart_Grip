use axum::{
    extract::{DefaultBodyLimit, Multipart, Path, State},
    routing::{get, post, put},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use tower_http::cors::CorsLayer;
use sqlx::postgres::PgPoolOptions;
use std::fs;
use std::io::Write;
use std::sync::Arc;
use uuid::Uuid;

mod db;

// ── Shared application state ──────────────────────────────────────────────────
struct AppState {
    pool: sqlx::PgPool,
    http_client: reqwest::Client,
    cv_service_url: String,
}

// ── Response types ────────────────────────────────────────────────────────────
#[derive(Serialize)]
struct HealthResponse {
    status: &'static str,
    service: &'static str,
}

#[derive(Serialize)]
struct UploadResponse {
    status: &'static str,
    job_id: String,
    saved_frames: usize,
}

#[derive(Serialize)]
struct ScanStatusResponse {
    job_id: String,
    status: String,
    error_message: Option<String>,
}

// ── Health ────────────────────────────────────────────────────────────────────
async fn health() -> Json<serde_json::Value> {
    Json(serde_json::json!({
        "status": "ok",
        "service": "assistive-smart-glove-backend"
    }))
}

// ── Upload scan frames ────────────────────────────────────────────────────────
/// Accepts 8 multipart frames, saves them to storage/{job_id}/frame_N.jpg,
/// then fires-and-forgets a call to the CV microservice to start processing.
async fn upload_scan(
    State(state): State<Arc<AppState>>,
    mut multipart: Multipart,
) -> Result<Json<UploadResponse>, axum::http::StatusCode> {
    let job_id = Uuid::new_v4();
    let job_id_str = job_id.to_string();
    let job_dir = std::path::PathBuf::from("storage").join(&job_id_str);
    fs::create_dir_all(&job_dir).map_err(|_| axum::http::StatusCode::INTERNAL_SERVER_ERROR)?;

    let mut saved_frames = 0_usize;
    let mut patient_id_str = String::new();

    while let Some(field) = multipart
        .next_field()
        .await
        .map_err(|_| axum::http::StatusCode::BAD_REQUEST)?
    {
        let name = field.name().unwrap_or_default().to_string();

        if name == "patient_id" {
            patient_id_str = field
                .text()
                .await
                .map_err(|_| axum::http::StatusCode::BAD_REQUEST)?;
            fs::write(job_dir.join("patient_id.txt"), &patient_id_str)
                .map_err(|_| axum::http::StatusCode::INTERNAL_SERVER_ERROR)?;
            continue;
        }

        if !name.starts_with("frame_") {
            continue;
        }

        let bytes = field
            .bytes()
            .await
            .map_err(|_| axum::http::StatusCode::BAD_REQUEST)?;
        let file_path = job_dir.join(format!("{}.jpg", name));
        let mut file = fs::File::create(&file_path)
            .map_err(|_| axum::http::StatusCode::INTERNAL_SERVER_ERROR)?;
        file.write_all(&bytes)
            .map_err(|_| axum::http::StatusCode::INTERNAL_SERVER_ERROR)?;
        saved_frames += 1;
    }

    if saved_frames != 8 {
        return Err(axum::http::StatusCode::BAD_REQUEST);
    }

    // Persist scan job record in PostgreSQL
    let patient_uuid = Uuid::parse_str(&patient_id_str).unwrap_or_else(|_| Uuid::new_v4());
    if let Err(e) = db::create_scan_job(&state.pool, job_id, patient_uuid, saved_frames as i32).await {
        eprintln!("Warning: could not create scan job record: {:?}", e);
    }

    // Fire-and-forget: ask CV service to start processing
    let cv_url = format!("{}/analyze", state.cv_service_url);
    let client = state.http_client.clone();
    let job_id_clone = job_id_str.clone();
    let patient_id_clone = patient_id_str.clone();
    let pool_clone = state.pool.clone();

    tokio::spawn(async move {
        let payload = serde_json::json!({
            "job_id": job_id_clone,
            "patient_id": patient_id_clone,
            "storage_base": "storage"
        });

        match client.post(&cv_url).json(&payload).send().await {
            Ok(resp) => {
                eprintln!(
                    "CV service accepted job {}: HTTP {}",
                    job_id_clone,
                    resp.status()
                );
                // Mark as processing in DB
                let job_uuid = Uuid::parse_str(&job_id_clone).unwrap_or(Uuid::nil());
                let _ = db::update_scan_status(&pool_clone, job_uuid, "processing", None).await;
            }
            Err(e) => {
                eprintln!("Failed to contact CV service for job {}: {}", job_id_clone, e);
                let job_uuid = Uuid::parse_str(&job_id_clone).unwrap_or(Uuid::nil());
                let _ = db::update_scan_status(
                    &pool_clone,
                    job_uuid,
                    "failed",
                    Some("CV service unreachable"),
                )
                .await;
            }
        }
    });

    Ok(Json(UploadResponse {
        status: "uploaded",
        job_id: job_id_str,
        saved_frames,
    }))
}

// ── CV result ingestion (called by CV service on completion) ──────────────────
async fn ingest_cv_result(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<db::CvResultPayload>,
) -> Result<Json<serde_json::Value>, axum::http::StatusCode> {
    match db::persist_cv_result(&state.pool, payload.job_id, &payload.result).await {
        Ok(_) => Ok(Json(serde_json::json!({ "status": "persisted" }))),
        Err(e) => {
            eprintln!("Error persisting CV result: {:?}", e);
            Err(axum::http::StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

// ── Polling: scan status ──────────────────────────────────────────────────────
async fn get_scan_status(
    State(state): State<Arc<AppState>>,
    Path(job_id): Path<Uuid>,
) -> Result<Json<ScanStatusResponse>, axum::http::StatusCode> {
    match db::get_scan_status(&state.pool, job_id).await {
        Ok(Some(scan)) => Ok(Json(ScanStatusResponse {
            job_id: scan.job_id.to_string(),
            status: scan.status,
            error_message: scan.error_message,
        })),
        Ok(None) => Err(axum::http::StatusCode::NOT_FOUND),
        Err(e) => {
            eprintln!("DB error fetching scan status: {:?}", e);
            Err(axum::http::StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

// ── Fetch completed measurements ──────────────────────────────────────────────
async fn get_scan_results(
    State(state): State<Arc<AppState>>,
    Path(job_id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, axum::http::StatusCode> {
    // Check scan status first
    let scan = db::get_scan_status(&state.pool, job_id)
        .await
        .map_err(|_| axum::http::StatusCode::INTERNAL_SERVER_ERROR)?;

    let scan = scan.ok_or(axum::http::StatusCode::NOT_FOUND)?;

    if scan.status == "processing" || scan.status == "pending" {
        return Err(axum::http::StatusCode::ACCEPTED); // 202 = still processing
    }

    if scan.status == "failed" {
        return Ok(Json(serde_json::json!({
            "error": scan.error_message.unwrap_or_else(|| "Processing failed".to_string())
        })));
    }

    match db::get_measurements_by_job(&state.pool, job_id).await {
        Ok(Some(m)) => {
            // Return full raw_measurements JSON if available (includes glove calibration)
            if let Some(raw) = m.raw_measurements {
                return Ok(Json(raw.0));
            }
            // Fallback: construct from individual columns
            Ok(Json(serde_json::json!({
                "job_id": m.job_id,
                "patient_id": m.patient_id,
                "palm_width_mm": m.palm_width_mm,
                "palm_length_mm": m.palm_length_mm,
                "thumb_length_mm": m.thumb_length_mm,
                "index_length_mm": m.index_length_mm,
                "middle_length_mm": m.middle_length_mm,
                "ring_length_mm": m.ring_length_mm,
                "pinky_length_mm": m.pinky_length_mm,
                "confidence_score": m.confidence_score,
            })))
        }
        Ok(None) => Err(axum::http::StatusCode::NOT_FOUND),
        Err(e) => {
            eprintln!("DB error fetching measurements: {:?}", e);
            Err(axum::http::StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

// ── Legacy endpoints (unchanged) ──────────────────────────────────────────────
async fn ingest_dimensions(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<db::TelemetryPayload>,
) -> Result<Json<db::PatientHandProfile>, axum::http::StatusCode> {
    match db::insert_telemetry(&state.pool, payload).await {
        Ok(profile) => Ok(Json(profile)),
        Err(e) => {
            eprintln!("Error inserting telemetry: {:?}", e);
            Err(axum::http::StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

async fn get_patients(
    State(state): State<Arc<AppState>>,
) -> Result<Json<Vec<db::PatientHandProfile>>, axum::http::StatusCode> {
    match db::get_all_patients(&state.pool).await {
        Ok(profiles) => Ok(Json(profiles)),
        Err(e) => {
            eprintln!("Error fetching patients: {:?}", e);
            Err(axum::http::StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

async fn update_patient_status(
    State(state): State<Arc<AppState>>,
    Path(patient_id): Path<Uuid>,
    Json(payload): Json<db::StatusUpdatePayload>,
) -> Result<Json<db::PatientHandProfile>, axum::http::StatusCode> {
    match db::update_status(&state.pool, patient_id, payload.fabrication_status).await {
        Ok(profile) => Ok(Json(profile)),
        Err(e) => {
            eprintln!("Error updating status: {:?}", e);
            Err(axum::http::StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

// ── Entry point ───────────────────────────────────────────────────────────────
#[tokio::main]
async fn main() {
    let database_url = std::env::var("DATABASE_URL")
        .unwrap_or_else(|_| "postgres://postgres:postgres@localhost:5432/smartgrip".to_string());

    let cv_service_url = std::env::var("CV_SERVICE_URL")
        .unwrap_or_else(|_| "http://localhost:8001".to_string());

    let pool = PgPoolOptions::new()
        .max_connections(10)
        .connect(&database_url)
        .await;

    let http_client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(10))
        .build()
        .expect("Failed to build HTTP client");

    let shared_state = if let Ok(pool) = pool {
        println!("Connected to PostgreSQL");
        db::init_db(&pool).await.expect("Failed to initialize database schema");
        Some(Arc::new(AppState {
            pool,
            http_client,
            cv_service_url,
        }))
    } else {
        println!("WARNING: Failed to connect to PostgreSQL. Stateful endpoints will fail.");
        None
    };

    let mut app = Router::new()
        .route("/health", get(health));

    if let Some(state) = shared_state {
        let api = Router::new()
            // Upload (triggers CV pipeline)
            .route("/api/v1/tailor/upload", post(upload_scan))
            // CV service callback
            .route("/api/v1/tailor/cv_result", post(ingest_cv_result))
            // Polling endpoints
            .route("/api/v1/tailor/status/:job_id", get(get_scan_status))
            .route("/api/v1/tailor/results/:job_id", get(get_scan_results))
            // Legacy
            .route("/api/v1/tailor/dimensions", post(ingest_dimensions))
            .route("/api/v1/patients", get(get_patients))
            .route("/api/v1/patient/:id/status", put(update_patient_status))
            .with_state(state);

        app = app.merge(api);
    }

    let app = app
        .layer(DefaultBodyLimit::max(100 * 1024 * 1024))
        .layer(CorsLayer::permissive());

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000")
        .await
        .expect("bind backend listener");

    println!("Backend server listening on 0.0.0.0:3000");
    println!("CV service URL: {}", std::env::var("CV_SERVICE_URL").unwrap_or_else(|_| "http://localhost:8001".to_string()));

    axum::serve(listener, app).await.expect("run backend");
}
