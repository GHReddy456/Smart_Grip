use serde::{Deserialize, Serialize};
use sqlx::{PgPool, FromRow};
use uuid::Uuid;

// ── Legacy structs (kept for backward compat) ────────────────────────────────

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct FingerDimensions {
    pub length_mm: f32,
    pub base_width_mm: f32,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct HandFingers {
    pub thumb: FingerDimensions,
    pub index: FingerDimensions,
    pub middle: FingerDimensions,
    pub ring: FingerDimensions,
    pub pinky: FingerDimensions,
}

#[derive(Serialize, Deserialize, FromRow, Debug)]
pub struct PatientHandProfile {
    pub id: Uuid,
    pub patient_id: Uuid,
    pub palm_width_mm: f64,
    pub palm_height_mm: f64,
    pub finger_metrics: sqlx::types::Json<HandFingers>,
    pub fabrication_status: String,
    pub created_at: Option<chrono::DateTime<chrono::Utc>>,
}

#[derive(Deserialize, Debug)]
pub struct TelemetryPayload {
    pub patient_id: Uuid,
    pub palm_width_mm: f64,
    pub palm_height_mm: f64,
    pub finger_metrics: HandFingers,
}

#[derive(Deserialize, Debug)]
pub struct StatusUpdatePayload {
    pub fabrication_status: String,
}

// ── New CV pipeline structs ──────────────────────────────────────────────────

/// Persisted scan job record.
#[derive(Serialize, Deserialize, FromRow, Debug)]
pub struct HandScan {
    pub job_id: Uuid,
    pub patient_id: Uuid,
    pub status: String,
    pub error_message: Option<String>,
    pub view_count: i32,
    pub created_at: Option<chrono::DateTime<chrono::Utc>>,
    pub completed_at: Option<chrono::DateTime<chrono::Utc>>,
}

/// Final fused + calibrated measurements stored per job.
#[derive(Serialize, Deserialize, FromRow, Debug)]
pub struct MeasurementRecord {
    pub id: Uuid,
    pub job_id: Uuid,
    pub patient_id: Uuid,
    pub palm_width_mm: Option<f64>,
    pub palm_length_mm: Option<f64>,
    pub thumb_length_mm: Option<f64>,
    pub index_length_mm: Option<f64>,
    pub middle_length_mm: Option<f64>,
    pub ring_length_mm: Option<f64>,
    pub pinky_length_mm: Option<f64>,
    pub thumb_girth_mm: Option<f64>,
    pub index_girth_mm: Option<f64>,
    pub middle_girth_mm: Option<f64>,
    pub ring_girth_mm: Option<f64>,
    pub pinky_girth_mm: Option<f64>,
    pub confidence_score: Option<f64>,
    pub raw_measurements: Option<sqlx::types::Json<serde_json::Value>>,
    pub created_at: Option<chrono::DateTime<chrono::Utc>>,
}

/// Payload arriving from the CV microservice after pipeline completion.
#[derive(Deserialize, Debug)]
pub struct CvResultPayload {
    pub job_id: Uuid,
    pub result: serde_json::Value,
}

// ── Database initialisation ──────────────────────────────────────────────────

pub async fn init_db(pool: &PgPool) -> Result<(), sqlx::Error> {
    // Legacy table
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS hand_tailoring_dimensions (
            id UUID PRIMARY KEY,
            patient_id UUID UNIQUE NOT NULL,
            palm_width_mm FLOAT NOT NULL,
            palm_height_mm FLOAT NOT NULL,
            finger_metrics JSONB NOT NULL,
            fabrication_status VARCHAR(50) NOT NULL DEFAULT 'Processing',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        "#,
    )
    .execute(pool)
    .await?;

    // New CV pipeline tables
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS hand_scans (
            job_id        UUID PRIMARY KEY,
            patient_id    UUID NOT NULL,
            status        VARCHAR(20) NOT NULL DEFAULT 'pending',
            error_message TEXT,
            view_count    INT NOT NULL DEFAULT 0,
            created_at    TIMESTAMPTZ DEFAULT NOW(),
            completed_at  TIMESTAMPTZ
        )
        "#,
    )
    .execute(pool)
    .await?;

    sqlx::query(
        "CREATE INDEX IF NOT EXISTS idx_hand_scans_patient ON hand_scans(patient_id)"
    )
    .execute(pool)
    .await?;

    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS image_metadata (
            id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            job_id              UUID REFERENCES hand_scans(job_id) ON DELETE CASCADE,
            frame_index         INT NOT NULL,
            view_type           VARCHAR(30) NOT NULL,
            blur_score          FLOAT,
            lighting_score      FLOAT,
            hand_visibility     FLOAT,
            landmark_confidence FLOAT,
            accepted            BOOLEAN DEFAULT TRUE
        )
        "#,
    )
    .execute(pool)
    .await?;

    sqlx::query(
        "CREATE INDEX IF NOT EXISTS idx_image_metadata_job ON image_metadata(job_id)"
    )
    .execute(pool)
    .await?;

    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS measurements (
            id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            job_id            UUID UNIQUE REFERENCES hand_scans(job_id) ON DELETE CASCADE,
            patient_id        UUID NOT NULL,
            palm_width_mm     FLOAT,
            palm_length_mm    FLOAT,
            thumb_length_mm   FLOAT,
            index_length_mm   FLOAT,
            middle_length_mm  FLOAT,
            ring_length_mm    FLOAT,
            pinky_length_mm   FLOAT,
            thumb_girth_mm    FLOAT,
            index_girth_mm    FLOAT,
            middle_girth_mm   FLOAT,
            ring_girth_mm     FLOAT,
            pinky_girth_mm    FLOAT,
            confidence_score  FLOAT,
            raw_measurements  JSONB,
            created_at        TIMESTAMPTZ DEFAULT NOW()
        )
        "#,
    )
    .execute(pool)
    .await?;

    sqlx::query(
        "CREATE INDEX IF NOT EXISTS idx_measurements_patient ON measurements(patient_id)"
    )
    .execute(pool)
    .await?;

    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS glove_profiles (
            id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            patient_id          UUID UNIQUE NOT NULL,
            job_id              UUID REFERENCES hand_scans(job_id),
            glove_size          VARCHAR(10),
            actuator_positions  JSONB,
            sensor_positions    JSONB,
            calibration_data    JSONB,
            created_at          TIMESTAMPTZ DEFAULT NOW()
        );
        "#,
    )
    .execute(pool)
    .await?;

    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS calibration_history (
            id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            patient_id       UUID NOT NULL,
            job_id           UUID REFERENCES hand_scans(job_id),
            ground_truth_mm  JSONB NOT NULL,
            estimated_mm     JSONB NOT NULL,
            capture_metadata JSONB,
            created_at       TIMESTAMPTZ DEFAULT NOW()
        );
        "#,
    )
    .execute(pool)
    .await?;

    Ok(())
}

// ── Query helpers ────────────────────────────────────────────────────────────

pub async fn create_scan_job(
    pool: &PgPool,
    job_id: Uuid,
    patient_id: Uuid,
    view_count: i32,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"
        INSERT INTO hand_scans (job_id, patient_id, status, view_count)
        VALUES ($1, $2, 'pending', $3)
        ON CONFLICT (job_id) DO NOTHING
        "#,
    )
    .bind(job_id)
    .bind(patient_id)
    .bind(view_count)
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn update_scan_status(
    pool: &PgPool,
    job_id: Uuid,
    status: &str,
    error_message: Option<&str>,
) -> Result<(), sqlx::Error> {
    if status == "done" || status == "failed" {
        sqlx::query(
            r#"
            UPDATE hand_scans
            SET status = $1, error_message = $2, completed_at = NOW()
            WHERE job_id = $3
            "#,
        )
        .bind(status)
        .bind(error_message)
        .bind(job_id)
        .execute(pool)
        .await?;
    } else {
        sqlx::query(
            r#"UPDATE hand_scans SET status = $1 WHERE job_id = $2"#,
        )
        .bind(status)
        .bind(job_id)
        .execute(pool)
        .await?;
    }
    Ok(())
}

pub async fn get_scan_status(
    pool: &PgPool,
    job_id: Uuid,
) -> Result<Option<HandScan>, sqlx::Error> {
    sqlx::query_as::<_, HandScan>(
        "SELECT * FROM hand_scans WHERE job_id = $1",
    )
    .bind(job_id)
    .fetch_optional(pool)
    .await
}

pub async fn persist_cv_result(
    pool: &PgPool,
    job_id: Uuid,
    result: &serde_json::Value,
) -> Result<(), sqlx::Error> {
    let patient_id_str = result["patient_id"].as_str().unwrap_or_default();
    let patient_id = Uuid::parse_str(patient_id_str).unwrap_or_else(|_| Uuid::nil());

    let get_f64 = |key: &str| -> Option<f64> {
        result[key].as_f64()
    };

    // Upsert measurements
    sqlx::query(
        r#"
        INSERT INTO measurements (
            id, job_id, patient_id,
            palm_width_mm, palm_length_mm,
            thumb_length_mm, index_length_mm, middle_length_mm,
            ring_length_mm, pinky_length_mm,
            thumb_girth_mm, index_girth_mm, middle_girth_mm,
            ring_girth_mm, pinky_girth_mm,
            confidence_score, raw_measurements
        ) VALUES (
            gen_random_uuid(), $1, $2,
            $3, $4, $5, $6, $7, $8, $9,
            $10, $11, $12, $13, $14,
            $15, $16
        )
        ON CONFLICT (job_id) DO UPDATE SET
            palm_width_mm    = EXCLUDED.palm_width_mm,
            palm_length_mm   = EXCLUDED.palm_length_mm,
            thumb_length_mm  = EXCLUDED.thumb_length_mm,
            index_length_mm  = EXCLUDED.index_length_mm,
            middle_length_mm = EXCLUDED.middle_length_mm,
            ring_length_mm   = EXCLUDED.ring_length_mm,
            pinky_length_mm  = EXCLUDED.pinky_length_mm,
            confidence_score = EXCLUDED.confidence_score,
            raw_measurements = EXCLUDED.raw_measurements
        "#,
    )
    .bind(job_id)
    .bind(patient_id)
    .bind(get_f64("palm_width_mm"))
    .bind(get_f64("palm_length_mm"))
    .bind(get_f64("thumb_length_mm"))
    .bind(get_f64("index_length_mm"))
    .bind(get_f64("middle_length_mm"))
    .bind(get_f64("ring_length_mm"))
    .bind(get_f64("pinky_length_mm"))
    .bind(result["finger_girths_mm"]["thumb"].as_f64())
    .bind(result["finger_girths_mm"]["index"].as_f64())
    .bind(result["finger_girths_mm"]["middle"].as_f64())
    .bind(result["finger_girths_mm"]["ring"].as_f64())
    .bind(result["finger_girths_mm"]["pinky"].as_f64())
    .bind(get_f64("confidence_score"))
    .bind(sqlx::types::Json(result))
    .execute(pool)
    .await?;

    // Upsert glove profile
    if let Some(glove_cal) = result.get("glove_calibration") {
        sqlx::query(
            r#"
            INSERT INTO glove_profiles (
                id, patient_id, job_id, glove_size,
                actuator_positions, sensor_positions, calibration_data
            ) VALUES (
                gen_random_uuid(), $1, $2, $3, $4, $5, $6
            )
            ON CONFLICT (patient_id) DO UPDATE SET
                job_id             = EXCLUDED.job_id,
                glove_size         = EXCLUDED.glove_size,
                actuator_positions = EXCLUDED.actuator_positions,
                sensor_positions   = EXCLUDED.sensor_positions,
                calibration_data   = EXCLUDED.calibration_data,
                created_at         = NOW()
            "#,
        )
        .bind(patient_id)
        .bind(job_id)
        .bind(glove_cal["glove_size"].as_str().unwrap_or("M"))
        .bind(sqlx::types::Json(&glove_cal["actuator_positions"]))
        .bind(sqlx::types::Json(&glove_cal["sensor_positions"]))
        .bind(sqlx::types::Json(glove_cal))
        .execute(pool)
        .await?;
    }

    // Update scan status to done
    update_scan_status(pool, job_id, "done", None).await?;

    Ok(())
}

pub async fn get_measurements_by_job(
    pool: &PgPool,
    job_id: Uuid,
) -> Result<Option<MeasurementRecord>, sqlx::Error> {
    sqlx::query_as::<_, MeasurementRecord>(
        "SELECT * FROM measurements WHERE job_id = $1",
    )
    .bind(job_id)
    .fetch_optional(pool)
    .await
}

// ── Legacy functions (kept unchanged) ────────────────────────────────────────

pub async fn insert_telemetry(pool: &PgPool, payload: TelemetryPayload) -> Result<PatientHandProfile, sqlx::Error> {
    let id = Uuid::new_v4();

    let profile = sqlx::query_as::<_, PatientHandProfile>(
        r#"
        INSERT INTO hand_tailoring_dimensions
        (id, patient_id, palm_width_mm, palm_height_mm, finger_metrics)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (patient_id) DO UPDATE
        SET palm_width_mm = EXCLUDED.palm_width_mm,
            palm_height_mm = EXCLUDED.palm_height_mm,
            finger_metrics = EXCLUDED.finger_metrics,
            fabrication_status = 'Processing'
        RETURNING *
        "#,
    )
    .bind(id)
    .bind(payload.patient_id)
    .bind(payload.palm_width_mm)
    .bind(payload.palm_height_mm)
    .bind(sqlx::types::Json(payload.finger_metrics))
    .fetch_one(pool)
    .await?;

    Ok(profile)
}

pub async fn get_all_patients(pool: &PgPool) -> Result<Vec<PatientHandProfile>, sqlx::Error> {
    let profiles = sqlx::query_as::<_, PatientHandProfile>(
        "SELECT * FROM hand_tailoring_dimensions ORDER BY created_at DESC"
    )
    .fetch_all(pool)
    .await?;
    Ok(profiles)
}

pub async fn update_status(pool: &PgPool, patient_id: Uuid, status: String) -> Result<PatientHandProfile, sqlx::Error> {
    let profile = sqlx::query_as::<_, PatientHandProfile>(
        r#"
        UPDATE hand_tailoring_dimensions
        SET fabrication_status = $1
        WHERE patient_id = $2
        RETURNING *
        "#,
    )
    .bind(status)
    .bind(patient_id)
    .fetch_one(pool)
    .await?;

    Ok(profile)
}
