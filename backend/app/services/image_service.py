"""
Rough turbidity estimate from a photo (Pillow + numpy). The photo is analysed
in memory and NOT stored.
"""
import io

import numpy as np
from PIL import Image, ImageOps, UnidentifiedImageError

MAX_BYTES = 5 * 1024 * 1024  # 5 MB


class InvalidImage(ValueError):
    pass


def estimate_turbidity(data: bytes) -> dict:
    if len(data) > MAX_BYTES:
        raise InvalidImage("Photo is larger than 5 MB.")
    try:
        img = Image.open(io.BytesIO(data))
        img = ImageOps.exif_transpose(img).convert("L")
    except (UnidentifiedImageError, OSError, Image.DecompressionBombError):
        raise InvalidImage("File is not a valid image.")

    img.thumbnail((256, 256))
    w, h = img.size
    crop = img.crop((int(w * 0.2), int(h * 0.2), int(w * 0.8), int(h * 0.8)))
    gray = np.asarray(crop, dtype=np.float32)

    contrast = float(gray.std())
    sharpness = float(
        (np.abs(np.diff(gray, axis=0)).mean() + np.abs(np.diff(gray, axis=1)).mean()) / 2
    )
    detail = 0.5 * min(sharpness / 12, 1) + 0.5 * min(contrast / 50, 1)
    score = round(1 - detail, 2)

    if score < 0.35:
        label = "clear"
    elif score < 0.65:
        label = "slightly_cloudy"
    else:
        label = "very_cloudy"
    return {"score": score, "label": label}