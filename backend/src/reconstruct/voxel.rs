// voxel.rs — 3-D voxel grid and parallel space-carving
//
// Grid specification (from engineering brief):
//   X  =  150 mm  (left ↔ right across the hand)
//   Y  =  250 mm  (wrist → fingertip height)
//   Z  =  100 mm  (palm depth / fore-aft)
//   Resolution: 1 mm³ → 150 × 250 × 100 = 3,750,000 discrete voxels
//
// World origin of voxel (0,0,0): GRID_ORIGIN defined in camera.rs
//
// Carving rule:
//   For every voxel centre V(x,y,z) expressed in world-mm, project into
//   each of the 8 silhouette images.  If ANY projection lands inside the
//   image bounds AND the pixel is background (0), carve the voxel away.
//   Projections outside image bounds are conservatively ignored (not carved).

use nalgebra::Matrix3x4;
use rayon::prelude::*;

use crate::reconstruct::{
    camera::{project, GRID_D, GRID_H, GRID_ORIGIN, GRID_W},
    silhouette::{is_foreground, Silhouette},
};

pub struct VoxelGrid {
    /// Flat boolean array: true = solid, false = carved.
    /// Index: `x + y * GRID_W + z * GRID_W * GRID_H`
    pub cells: Vec<bool>,
}

impl VoxelGrid {
    /// Initialise all 3,750,000 cells as solid.
    pub fn new_solid() -> Self {
        VoxelGrid {
            cells: vec![true; GRID_W * GRID_H * GRID_D],
        }
    }

    #[inline]
    pub fn index(x: usize, y: usize, z: usize) -> usize {
        x + y * GRID_W + z * GRID_W * GRID_H
    }

    #[inline]
    pub fn get(&self, x: usize, y: usize, z: usize) -> bool {
        self.cells[Self::index(x, y, z)]
    }

    /// World-space centre of voxel (x, y, z) in mm.
    #[inline]
    pub fn world_centre(x: usize, y: usize, z: usize) -> [f64; 3] {
        [
            GRID_ORIGIN[0] + x as f64 + 0.5,
            GRID_ORIGIN[1] + y as f64 + 0.5,
            GRID_ORIGIN[2] + z as f64 + 0.5,
        ]
    }
}

/// Execute the full space-carving pass using Rayon for parallelism.
///
/// Each of the 3.75M voxels is projected into all 8 silhouette views.
/// If any in-bounds projection hits a background pixel → carved.
pub fn carve(
    projections: &[Matrix3x4<f64>],
    silhouettes: &[Silhouette],
) -> VoxelGrid {
    assert_eq!(
        projections.len(),
        silhouettes.len(),
        "projection count must equal silhouette count"
    );

    // Build a flat index list for rayon to parallelise over.
    let total = GRID_W * GRID_H * GRID_D;

    // Parallel map: each voxel independently decides keep/carve.
    // `rayon` splits the flat index range across CPU cores.
    let cells: Vec<bool> = (0..total)
        .into_par_iter()
        .map(|idx| {
            let z = idx / (GRID_W * GRID_H);
            let rem = idx % (GRID_W * GRID_H);
            let y = rem / GRID_W;
            let x = rem % GRID_W;

            let world = VoxelGrid::world_centre(x, y, z);

            // A voxel is solid ONLY if it is inside the silhouette in
            // every camera view that can see it (where the projection
            // lands within image bounds).
            let mut seen_by_any = false;

            for (proj, sil) in projections.iter().zip(silhouettes.iter()) {
                if let Some((u, v)) = project(proj, world, sil.width, sil.height) {
                    seen_by_any = true;
                    if !is_foreground(sil, u, v) {
                        // Background pixel in this view → carve away
                        return false;
                    }
                }
                // Out-of-frustum → no information → do not carve
            }

            // If no camera could see it at all (very unlikely in a 360° rig),
            // conservatively keep it solid.
            let _ = seen_by_any;
            true
        })
        .collect();

    VoxelGrid { cells }
}
