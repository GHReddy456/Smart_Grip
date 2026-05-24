// silhouette.rs — 2-D binary silhouette extraction via OpenCV
//
// Pipeline per image:
//   1. Load colour image  (imgcodecs::imread)
//   2. Convert to grayscale
//   3. Adaptive Otsu binarisation  (THRESH_BINARY_INV | THRESH_OTSU)
//      → hand pixels = 255 (white), background = 0 (black)
//   4. Morphological OPEN  (removes salt-and-pepper noise)
//   5. Morphological CLOSE (fills interior holes in the hand mask)

use opencv::{
    core::{self, Point, Scalar, Size},
    imgcodecs,
    imgproc::{self, MORPH_CLOSE, MORPH_ELLIPSE, MORPH_OPEN, THRESH_BINARY_INV, THRESH_OTSU},
    prelude::*,
    Result,
};
use std::path::Path;

pub struct Silhouette {
    pub mat: core::Mat,
    pub width: i32,
    pub height: i32,
}

/// Extract a binary hand silhouette from `img_path`.
pub fn extract(img_path: &Path) -> Result<Silhouette> {
    // ── 1. Load ──────────────────────────────────────────────────────────
    let src = imgcodecs::imread(
        img_path.to_str().expect("invalid path"),
        imgcodecs::IMREAD_COLOR,
    )?;

    // ── 2. Grayscale conversion ──────────────────────────────────────────
    let mut gray = Mat::default();
    imgproc::cvt_color(&src, &mut gray, imgproc::COLOR_BGR2GRAY, 0)?;

    // ── 3. Otsu thresholding ─────────────────────────────────────────────
    // THRESH_BINARY_INV makes the hand WHITE (foreground) on a BLACK background,
    // assuming the hand is darker than a bright/neutral backdrop.
    // THRESH_OTSU automatically chooses the optimal global threshold value.
    let mut binary = Mat::default();
    imgproc::threshold(
        &gray,
        &mut binary,
        0.0,   // threshold ignored when THRESH_OTSU is set
        255.0,
        THRESH_BINARY_INV | THRESH_OTSU,
    )?;

    // ── 4+5. Morphological filtering ────────────────────────────────────
    // Kernel: 7×7 ellipse gives good sub-pixel edge cleanup at typical
    // smartphone resolutions (3000+ px wide).
    let kernel = imgproc::get_structuring_element(
        MORPH_ELLIPSE,
        Size::new(7, 7),
        Point::new(-1, -1),
    )?;

    let border_val = imgproc::morphology_default_border_value()?;

    // OPEN: erosion → dilation  — removes floating artifact specks
    let mut opened = Mat::default();
    imgproc::morphology_ex(
        &binary,
        &mut opened,
        MORPH_OPEN,
        &kernel,
        Point::new(-1, -1),
        2, // two iterations
        core::BORDER_CONSTANT,
        border_val,
    )?;

    // CLOSE: dilation → erosion  — fills interior shadows / holes
    let mut closed = Mat::default();
    imgproc::morphology_ex(
        &opened,
        &mut closed,
        MORPH_CLOSE,
        &kernel,
        Point::new(-1, -1),
        2,
        core::BORDER_CONSTANT,
        border_val,
    )?;

    let width = closed.cols();
    let height = closed.rows();

    Ok(Silhouette { mat: closed, width, height })
}

/// Returns `true` when pixel (u, v) is foreground (hand — value 255).
#[inline(always)]
pub fn is_foreground(sil: &Silhouette, u: i32, v: i32) -> bool {
    // at_2d is row-major: (row=v, col=u)
    sil.mat
        .at_2d::<u8>(v, u)
        .map(|&px| px > 127)
        .unwrap_or(false)
}
