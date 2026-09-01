import io
import logging
import os
import uuid
from pathlib import Path
from django.conf import settings
from PIL import Image
from rest_framework.exceptions import ValidationError

logger = logging.getLogger(__name__)

MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB
ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"]
ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"]
ALLOWED_IMAGE_FORMATS = ["JPEG", "PNG", "WEBP"]

# Cloudinary standard folder paths
FOLDER_USERS = "globetrotter/users"
FOLDER_TRIPS = "globetrotter/trips"
FOLDER_ACTIVITIES = "globetrotter/activities"


def validate_image_file(uploaded_file, min_width=None, min_height=None):
    """
    Validate uploaded file size, extension, MIME type, and dimensions.
    Rejects SVG, GIF, TIFF, PDF, ZIP, executables, and corrupted files.
    """
    if not uploaded_file:
        raise ValidationError("No image file was provided.")

    # 1. Size check
    file_size = getattr(uploaded_file, "size", 0)
    if file_size > MAX_FILE_SIZE:
        raise ValidationError(
            f"This image is too large ({file_size / (1024 * 1024):.1f}MB). Please choose an image under 5 MB."
        )

    # 2. Extension check
    name = getattr(uploaded_file, "name", "").lower()
    ext = Path(name).suffix.lower()
    if ext and ext not in ALLOWED_EXTENSIONS:
        raise ValidationError("Please upload a JPG, PNG, or WebP image.")

    # 3. Content Type check
    content_type = getattr(uploaded_file, "content_type", "").lower()
    if content_type and content_type not in ALLOWED_MIME_TYPES:
        raise ValidationError("Please upload a JPG, PNG, or WebP image.")

    # 4. Binary Inspection with Pillow
    try:
        if hasattr(uploaded_file, "seek"):
            uploaded_file.seek(0)
        file_bytes = uploaded_file.read()
        if hasattr(uploaded_file, "seek"):
            uploaded_file.seek(0)

        img = Image.open(io.BytesIO(file_bytes))
        img.verify()

        img_format = (img.format or "").upper()
        if img_format not in ALLOWED_IMAGE_FORMATS:
            raise ValidationError(f"Unsupported image format: {img_format}. Allowed formats: JPEG, PNG, WebP.")

        # Re-open after verify to inspect dimensions
        img = Image.open(io.BytesIO(file_bytes))
        width, height = img.size

        if min_width and width < min_width:
            raise ValidationError(
                f"Image width ({width}px) is too small. Minimum required width is {min_width}px."
            )
        if min_height and height < min_height:
            raise ValidationError(
                f"Image height ({height}px) is too small. Minimum required height is {min_height}px."
            )

        return {"width": width, "height": height, "format": img_format}
    except ValidationError:
        raise
    except Exception as exc:
        logger.warning("Image verification failed: %s", exc)
        raise ValidationError("The provided file is not a valid or readable image.")


def upload_image(uploaded_file, folder=FOLDER_USERS, public_id=None, min_width=None, min_height=None) -> dict:
    """
    Validate and upload an image to Cloudinary.
    Returns dict with url, public_id, width, height, format.
    Falls back gracefully in local dev/testing if CLOUDINARY_URL is unset or not configured.
    """
    img_meta = validate_image_file(uploaded_file, min_width=min_width, min_height=min_height)

    cloudinary_url = (os.getenv("CLOUDINARY_URL") or getattr(settings, "CLOUDINARY_URL", "")).strip()

    if cloudinary_url and cloudinary_url.startswith("cloudinary://"):
        try:
            import cloudinary
            import cloudinary.uploader

            if hasattr(uploaded_file, "seek"):
                uploaded_file.seek(0)

            upload_kwargs = {
                "folder": folder,
                "resource_type": "image",
                "overwrite": True,
            }
            if public_id:
                upload_kwargs["public_id"] = public_id

            result = cloudinary.uploader.upload(uploaded_file, **upload_kwargs)

            return {
                "url": result.get("secure_url") or result.get("url"),
                "public_id": result.get("public_id"),
                "format": result.get("format"),
                "width": result.get("width", img_meta.get("width")),
                "height": result.get("height", img_meta.get("height")),
            }
        except Exception as exc:
            logger.error("Cloudinary upload failed: %s", exc)
            raise ValidationError(
                "We couldn't upload that image. Your current image is still safe. Please try again."
            )

    # Local development / test fallback
    mock_id = f"{folder}/{uuid.uuid4().hex[:12]}"
    mock_url = f"https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80"
    return {
        "url": mock_url,
        "public_id": mock_id,
        "format": img_meta.get("format", "JPEG").lower(),
        "width": img_meta.get("width", 800),
        "height": img_meta.get("height", 600),
    }


def delete_image(public_id: str) -> bool:
    """
    Delete an image asset from Cloudinary by its public_id.
    """
    if not public_id:
        return False

    cloudinary_url = (os.getenv("CLOUDINARY_URL") or getattr(settings, "CLOUDINARY_URL", "")).strip()
    if cloudinary_url and cloudinary_url.startswith("cloudinary://"):
        try:
            import cloudinary
            import cloudinary.uploader

            result = cloudinary.uploader.destroy(public_id, invalidate=True)
            return result.get("result") in ["ok", "not found"]
        except Exception as exc:
            logger.warning("Cloudinary delete_image failed for %s: %s", public_id, exc)
            return False

    return True


def get_transformed_url(public_id_or_url: str, variant="avatar") -> str:
    """
    Generate optimized delivery URL using Cloudinary dynamic transformations.
    Variants:
      - avatar: 200x200 square crop with face detection
      - trip_card: 600x375 landscape crop
      - trip_hero: 1400x700 wide landscape
      - thumbnail: 100x100 square thumbnail
    """
    if not public_id_or_url:
        return ""

    cloudinary_url = (os.getenv("CLOUDINARY_URL") or getattr(settings, "CLOUDINARY_URL", "")).strip()
    if not cloudinary_url or not cloudinary_url.startswith("cloudinary://"):
        return public_id_or_url

    transformation_map = {
        "avatar": {"width": 200, "height": 200, "crop": "fill", "gravity": "face", "fetch_format": "auto", "quality": "auto"},
        "trip_card": {"width": 600, "height": 375, "crop": "fill", "fetch_format": "auto", "quality": "auto"},
        "trip_hero": {"width": 1400, "height": 700, "crop": "fill", "fetch_format": "auto", "quality": "auto"},
        "thumbnail": {"width": 100, "height": 100, "crop": "fill", "fetch_format": "auto", "quality": "auto"},
    }

    transform_options = transformation_map.get(variant, {"fetch_format": "auto", "quality": "auto"})

    try:
        import cloudinary
        import cloudinary.utils

        if public_id_or_url.startswith("http://") or public_id_or_url.startswith("https://"):
            return public_id_or_url

        url, _ = cloudinary.utils.cloudinary_url(public_id_or_url, **transform_options)
        return url or public_id_or_url
    except Exception:
        return public_id_or_url
