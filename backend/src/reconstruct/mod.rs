// reconstruct/mod.rs — 3-D reconstruction pipeline orchestrator
//
// Pipeline:
//   1. Load 8 silhouettes via OpenCV (Otsu + morphology)
//   2. Build 8 projection matrices (45° orbit, smartphone intrinsics)
//   3. Carve 3,750,000 voxels in parallel (rayon)
//   4. Marching Cubes surface extraction
//   5. Laplacian smoothing (λ=0.5, 10 iterations)
//   6. Wrist Z-plane clip (hollow glove canal, 5 mm clearance)
//   7. 1.5 mm outward normal inflation (fabric weave clearance)
//   8. Export  hand_model.obj  to the job directory

pub mod camera;
pub mod marching_cubes;
pub mod mesh;
pub mod silhouette;
pub mod voxel;

use std::path::{Path, PathBuf};
use std::time::Instant;

pub fn run(job_dir: &Path) -> Result<PathBuf, String> {
    let t0 = Instant::now();

    // ── 1. Load silhouettes ───────────────────────────────────────────────
    println!("[reconstruct] Loading 8 silhouettes from {:?}", job_dir);
    let mut silhouettes = Vec::with_capacity(8);
    let mut img_w = 0_i32;
    let mut img_h = 0_i32;

    for i in 1..=8 {
        let img_path = job_dir.join(format!("frame_{}.jpg", i));
        let sil = silhouette::extract(&img_path)
            .map_err(|e| format!("silhouette extraction failed for frame_{}: {}", i, e))?;

        if i == 1 {
            img_w = sil.width;
            img_h = sil.height;
        }
        silhouettes.push(sil);
    }
    println!("[reconstruct] Image resolution: {}×{} px", img_w, img_h);

    // ── 2. Camera projection matrices ─────────────────────────────────────
    println!("[reconstruct] Building 8 projection matrices");
    let projections = camera::build_projection_matrices(img_w, img_h);

    // ── 3. Space carving ──────────────────────────────────────────────────
    println!(
        "[reconstruct] Carving {}×{}×{} = {} voxels (rayon parallel) …",
        camera::GRID_W,
        camera::GRID_H,
        camera::GRID_D,
        camera::GRID_W * camera::GRID_H * camera::GRID_D,
    );
    let voxel_grid = voxel::carve(&projections, &silhouettes);
    let solid_count = voxel_grid.cells.iter().filter(|&&v| v).count();
    println!(
        "[reconstruct] Carving done in {:.1?} — {} solid voxels remain",
        t0.elapsed(),
        solid_count
    );

    // ── 4. Marching Cubes ─────────────────────────────────────────────────
    println!("[reconstruct] Running Marching Cubes surface extraction …");
    let raw_mesh = marching_cubes::extract(&voxel_grid);
    println!(
        "[reconstruct] Mesh extracted: {} vertices, {} triangles",
        raw_mesh.vertices.len(),
        raw_mesh.triangles.len()
    );

    // ── 5. Laplacian smoothing ────────────────────────────────────────────
    println!("[reconstruct] Laplacian smoothing (λ=0.5, 10 iterations) …");
    let smoothed = mesh::laplacian_smooth(&raw_mesh, 10, 0.5);

    // ── 6. Wrist clip ─────────────────────────────────────────────────────
    // Clear 5 mm above the lowest Y coordinate to open the glove entry.
    println!("[reconstruct] Applying wrist Z-plane clip (5 mm clearance) …");
    let clipped = mesh::clip_wrist(&smoothed, 5.0);
    println!(
        "[reconstruct] After clip: {} vertices, {} triangles",
        clipped.vertices.len(),
        clipped.triangles.len()
    );

    // ── 7. Normal inflation (1.5 mm fabric clearance) ─────────────────────
    println!("[reconstruct] Inflating mesh by 1.5 mm along vertex normals …");
    let final_mesh = mesh::inflate_normals(&clipped, 1.5);

    // ── 8. OBJ export ─────────────────────────────────────────────────────
    let obj_path = job_dir.join("hand_model.obj");
    println!("[reconstruct] Exporting OBJ to {:?} …", obj_path);
    mesh::export_obj(&final_mesh, &obj_path)
        .map_err(|e| format!("OBJ export failed: {}", e))?;

    println!(
        "[reconstruct] ✓ Pipeline complete in {:.1?}  →  hand_model.obj",
        t0.elapsed()
    );

    Ok(obj_path)
}
