// camera.rs — Camera projection matrix construction
// 8 views at 45° increments around the Y-axis (hand center = world origin).
//
//  P = K · [R | t]   where  t = -R · cam_pos

use nalgebra::{Matrix3, Matrix3x4, Vector3, Vector4};
use std::f64::consts::PI;

/// Physical voxel grid extents (mm).
pub const GRID_W: usize = 150; // X: left-right
pub const GRID_H: usize = 250; // Y: up-down (height)
pub const GRID_D: usize = 100; // Z: depth

/// World-space origin of voxel (0, 0, 0) in mm — grid is centered on the hand.
pub const GRID_ORIGIN: [f64; 3] = [-75.0, -125.0, -50.0];

/// Build 8 projection matrices  P_i (3×4) for equally-spaced views.
///
/// `img_w` / `img_h` — pixel dimensions of the captured images.
pub fn build_projection_matrices(img_w: i32, img_h: i32) -> Vec<Matrix3x4<f64>> {
    // ── Intrinsic matrix K ──────────────────────────────────────────────
    // Approximate focal length for a typical smartphone camera at ~500 mm
    // from the subject.  Using f ≈ 1.2 × image_width gives good results
    // without explicit calibration.
    let fx = img_w as f64 * 1.2;
    let fy = fx;
    let cx = img_w as f64 / 2.0;
    let cy = img_h as f64 / 2.0;

    #[rustfmt::skip]
    let k = Matrix3::new(
        fx, 0.0,  cx,
        0.0,  fy, cy,
        0.0, 0.0, 1.0,
    );

    // ── Camera orbit parameters ──────────────────────────────────────────
    let num_views: usize = 8;
    let cam_radius = 500.0_f64; // mm — distance from hand centre to camera
    let cam_elevation = 30.0_f64; // mm — slight upward tilt for finger coverage
    let world_up = Vector3::new(0.0_f64, 1.0, 0.0);

    let mut projections = Vec::with_capacity(num_views);

    for i in 0..num_views {
        let theta = (i as f64) * 2.0 * PI / num_views as f64;

        // Camera position in world space
        let cam_pos = Vector3::new(
            cam_radius * theta.sin(),
            cam_elevation,
            cam_radius * theta.cos(),
        );

        // Camera axes (right-hand coordinate system)
        let look = (-cam_pos).normalize(); // looks toward origin
        let right = look.cross(&world_up).normalize();
        let cam_up = right.cross(&look).normalize();

        // World-to-camera rotation R (rows = camera-space axes in world coords)
        #[rustfmt::skip]
        let r = Matrix3::new(
             right.x,  right.y,  right.z,
            cam_up.x, cam_up.y, cam_up.z,
            -look.x,  -look.y,  -look.z,   // camera -Z points into the scene
        );

        let t = -(r * cam_pos); // translation vector

        #[rustfmt::skip]
        let rt = Matrix3x4::new(
            r[(0,0)], r[(0,1)], r[(0,2)], t.x,
            r[(1,0)], r[(1,1)], r[(1,2)], t.y,
            r[(2,0)], r[(2,1)], r[(2,2)], t.z,
        );

        projections.push(k * rt);
    }

    projections
}

/// Project a world-space point (mm) onto image pixel coords.
///
/// Returns `None` if the point is behind the camera or outside the image.
pub fn project(
    proj: &Matrix3x4<f64>,
    world: [f64; 3],
    img_w: i32,
    img_h: i32,
) -> Option<(i32, i32)> {
    let p = Vector4::new(world[0], world[1], world[2], 1.0);
    let uvw = proj * p;

    if uvw.z < 1e-6 {
        return None; // behind camera — do not carve
    }

    let u = (uvw.x / uvw.z).round() as i32;
    let v = (uvw.y / uvw.z).round() as i32;

    if u >= 0 && u < img_w && v >= 0 && v < img_h {
        Some((u, v))
    } else {
        None // outside image frustum — conservatively keep the voxel
    }
}
