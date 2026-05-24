// mesh.rs — Post-processing pipeline and OBJ export
//
// Stages (applied in order):
//   1. Laplacian smoothing      — removes blocky voxel stepping
//   2. Wrist Z-plane clip       — opens hollow cylindrical base
//   3. 1.5 mm normal inflation  — adds fabric weave clearance

use std::{
    collections::HashMap,
    io::Write,
    path::Path,
};

pub use crate::reconstruct::marching_cubes::Mesh;

// ─── 1. Laplacian Smoothing ───────────────────────────────────────────────────
//
// For every vertex v_i:
//     Δv_i = (1/|N(i)|) Σ_{j ∈ N(i)} (v_j − v_i)
//     v_i  ← v_i + λ · Δv_i
//
// Repeated for `iters` passes with λ = 0.5 (standard dampened Laplacian).

pub fn laplacian_smooth(mesh: &Mesh, iters: usize, lambda: f64) -> Mesh {
    let n = mesh.vertices.len();
    if n == 0 {
        return mesh.clone();
    }

    // Build neighbour adjacency from triangle index list
    let mut neighbours: Vec<Vec<usize>> = vec![Vec::new(); n];
    for &[i0, i1, i2] in &mesh.triangles {
        for &(a, b) in &[(i0, i1), (i1, i2), (i2, i0), (i1, i0), (i2, i1), (i0, i2)] {
            if !neighbours[a].contains(&b) {
                neighbours[a].push(b);
            }
        }
    }

    let mut verts = mesh.vertices.clone();

    for _ in 0..iters {
        let prev = verts.clone();
        for (i, v) in verts.iter_mut().enumerate() {
            let nb = &neighbours[i];
            if nb.is_empty() {
                continue;
            }
            let k = nb.len() as f64;
            let mut sum = [0.0_f64; 3];
            for &j in nb {
                sum[0] += prev[j][0];
                sum[1] += prev[j][1];
                sum[2] += prev[j][2];
            }
            // Δv = mean(neighbours) − v
            let delta = [
                sum[0] / k - prev[i][0],
                sum[1] / k - prev[i][1],
                sum[2] / k - prev[i][2],
            ];
            v[0] = prev[i][0] + lambda * delta[0];
            v[1] = prev[i][1] + lambda * delta[1];
            v[2] = prev[i][2] + lambda * delta[2];
        }
    }

    Mesh { vertices: verts, triangles: mesh.triangles.clone() }
}

// ─── 2. Wrist / Forearm Z-plane clip ─────────────────────────────────────────
//
// Find the minimum Y coordinate (forearm entry), clip everything below
// `min_y + clearance_mm`, remove the capping faces, and leave the base open
// to form a hollow glove entry canal.

pub fn clip_wrist(mesh: &Mesh, clearance_mm: f64) -> Mesh {
    if mesh.vertices.is_empty() {
        return mesh.clone();
    }

    // The "wrist" is at the bottom of the hand — minimum Y in world coords.
    let min_y = mesh
        .vertices
        .iter()
        .map(|v| v[1])
        .fold(f64::INFINITY, f64::min);

    let cut_y = min_y + clearance_mm;

    // Keep vertices above the cut plane and build a remapping table.
    let mut remap: Vec<Option<usize>> = vec![None; mesh.vertices.len()];
    let mut new_verts: Vec<[f64; 3]> = Vec::new();

    for (i, &v) in mesh.vertices.iter().enumerate() {
        if v[1] >= cut_y {
            remap[i] = Some(new_verts.len());
            new_verts.push(v);
        }
    }

    // Keep only triangles whose three vertices all survived the clip.
    let new_tris: Vec<[usize; 3]> = mesh
        .triangles
        .iter()
        .filter_map(|&[i0, i1, i2]| {
            Some([remap[i0]?, remap[i1]?, remap[i2]?])
        })
        .collect();

    Mesh { vertices: new_verts, triangles: new_tris }
}

// ─── 3. Vertex Normal Inflation (fabric clearance) ───────────────────────────
//
//   v_final = v_initial + 1.5 mm · n̂_vertex
//
// n̂_vertex is computed as the area-weighted average of face normals that
// share that vertex, then normalised to unit length.

pub fn inflate_normals(mesh: &Mesh, offset_mm: f64) -> Mesh {
    let n = mesh.vertices.len();
    if n == 0 {
        return mesh.clone();
    }

    let mut normals: Vec<[f64; 3]> = vec![[0.0; 3]; n];

    for &[i0, i1, i2] in &mesh.triangles {
        let a = mesh.vertices[i0];
        let b = mesh.vertices[i1];
        let c = mesh.vertices[i2];

        // Edge vectors
        let ab = [b[0]-a[0], b[1]-a[1], b[2]-a[2]];
        let ac = [c[0]-a[0], c[1]-a[1], c[2]-a[2]];

        // Cross product (not normalised — magnitude = 2 × triangle area)
        let cross = [
            ab[1]*ac[2] - ab[2]*ac[1],
            ab[2]*ac[0] - ab[0]*ac[2],
            ab[0]*ac[1] - ab[1]*ac[0],
        ];

        // Accumulate (area-weighted) face normal into each vertex
        for &vi in &[i0, i1, i2] {
            normals[vi][0] += cross[0];
            normals[vi][1] += cross[1];
            normals[vi][2] += cross[2];
        }
    }

    // Normalise and inflate
    let new_verts: Vec<[f64; 3]> = mesh
        .vertices
        .iter()
        .enumerate()
        .map(|(i, &v)| {
            let n = normals[i];
            let len = (n[0]*n[0] + n[1]*n[1] + n[2]*n[2]).sqrt();
            if len < 1e-10 {
                return v; // degenerate — leave as-is
            }
            let inv = offset_mm / len;
            [v[0] + n[0]*inv, v[1] + n[1]*inv, v[2] + n[2]*inv]
        })
        .collect();

    Mesh { vertices: new_verts, triangles: mesh.triangles.clone() }
}

// ─── 4. OBJ export ───────────────────────────────────────────────────────────

/// Serialise `mesh` to a Wavefront `.obj` file at `path`.
///
/// Includes per-vertex normals (vn) computed from face adjacency, and
/// emits faces as `f v//n v//n v//n` records.
pub fn export_obj(mesh: &Mesh, path: &Path) -> std::io::Result<()> {
    let n = mesh.vertices.len();

    // Compute per-vertex normals (same method as inflate, but normalised)
    let mut normals: Vec<[f64; 3]> = vec![[0.0; 3]; n];
    for &[i0, i1, i2] in &mesh.triangles {
        let a = mesh.vertices[i0];
        let b = mesh.vertices[i1];
        let c = mesh.vertices[i2];
        let ab = [b[0]-a[0], b[1]-a[1], b[2]-a[2]];
        let ac = [c[0]-a[0], c[1]-a[1], c[2]-a[2]];
        let cross = [
            ab[1]*ac[2] - ab[2]*ac[1],
            ab[2]*ac[0] - ab[0]*ac[2],
            ab[0]*ac[1] - ab[1]*ac[0],
        ];
        for &vi in &[i0, i1, i2] {
            normals[vi][0] += cross[0];
            normals[vi][1] += cross[1];
            normals[vi][2] += cross[2];
        }
    }
    for n in normals.iter_mut() {
        let len = (n[0]*n[0] + n[1]*n[1] + n[2]*n[2]).sqrt();
        if len > 1e-10 { n[0] /= len; n[1] /= len; n[2] /= len; }
    }

    let mut f = std::io::BufWriter::new(std::fs::File::create(path)?);

    writeln!(f, "# Smart Grip — hand_model.obj")?;
    writeln!(f, "# Generated by assistive-smart-glove-backend")?;
    writeln!(f, "# Vertices: {}  Triangles: {}", n, mesh.triangles.len())?;
    writeln!(f)?;

    // Vertices
    for &[x, y, z] in &mesh.vertices {
        writeln!(f, "v {:.4} {:.4} {:.4}", x, y, z)?;
    }
    writeln!(f)?;

    // Vertex normals
    for &[nx, ny, nz] in &normals {
        writeln!(f, "vn {:.6} {:.6} {:.6}", nx, ny, nz)?;
    }
    writeln!(f)?;

    // Faces (1-indexed, format: v//vn)
    for &[i0, i1, i2] in &mesh.triangles {
        writeln!(
            f,
            "f {}//{}  {}//{} {}//{} ",
            i0 + 1, i0 + 1,
            i1 + 1, i1 + 1,
            i2 + 1, i2 + 1,
        )?;
    }

    f.flush()?;
    Ok(())
}
