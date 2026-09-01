import os
import logging
from django.conf import settings
from rest_framework.exceptions import ValidationError

logger = logging.getLogger(__name__)

MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB
ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/jpg"]
ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"]


def validate_image_file(uploaded_file):
    """Validate uploaded image file size and content type."""
    if not uploaded_file:
        raise ValidationError("No image file was provided.")

    if uploaded_file.size > MAX_FILE_SIZE:
        raise ValidationError("Image file size must not exceed 5MB.")

    content_type = getattr(uploaded_file, "content_type", "").lower()
    name = getattr(uploaded_file, "name", "").lower()
    ext = os.path.splitext(name)[1]

    if content_type and content_type not in ALLOWED_MIME_TYPES:
        if ext not in ALLOWED_EXTENSIONS:
            raise ValidationError("Unsupported image format. Allowed formats: JPEG, PNG, WebP.")

    return True


def upload_image_to_cloudinary(uploaded_file, folder="globetrotter") -> str:
    """
    Upload image to Cloudinary and return secure URL.
    Falls back gracefully in test/dev environment if CLOUDINARY_URL is unset.
    """
    validate_image_file(uploaded_file)

    cloudinary_url = os.getenv("CLOUDINARY_URL") or getattr(settings, "CLOUDINARY_URL", "")

    if cloudinary_url:
        try:
            import cloudinary
            import cloudinary.uploader

            # Reset file pointer if needed
            if hasattr(uploaded_file, "seek"):
                uploaded_file.seek(0)

            result = cloudinary.uploader.upload(
                uploaded_file,
                folder=folder,
                resource_type="image",
                overwrite=True,
            )
            return result.get("secure_url") or result.get("url")
        except Exception as exc:
            logger.error("Cloudinary upload failed: %s", exc)
            raise ValidationError(f"Failed to upload image to Cloudinary: {exc}")

    # Development fallback
    logger.info("CLOUDINARY_URL not configured; returning mock/fallback asset URL.")
    return f"https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80"
