"""
Signed Cloudinary image upload helper using the shared post-fork requests.Session.
Zero extra dependencies; never logs API keys or secrets.
"""

import hashlib
import logging
import time
from django.conf import settings
from core.email_transport import get_shared_http_session

logger = logging.getLogger("shopcraft.media")


class CloudinaryUploadError(Exception):
    pass


def is_cloudinary_configured() -> bool:
    return bool(
        getattr(settings, "CLOUDINARY_CLOUD_NAME", "").strip()
        and getattr(settings, "CLOUDINARY_API_KEY", "").strip()
        and getattr(settings, "CLOUDINARY_API_SECRET", "").strip()
    )


def upload_store_image_to_cloudinary(*, uploaded_file, clean_store_slug: str, public_id: str, store_id: int) -> str:
    """
    Uploads a validated image file to Cloudinary under shopcraft/stores/<slug>/products
    and returns the HTTPS secure_url.
    """
    cloud_name = getattr(settings, "CLOUDINARY_CLOUD_NAME", "").strip()
    api_key = getattr(settings, "CLOUDINARY_API_KEY", "").strip()
    api_secret = getattr(settings, "CLOUDINARY_API_SECRET", "").strip()

    folder = f"shopcraft/stores/{clean_store_slug}/products"
    timestamp = str(int(time.time()))

    params_to_sign = f"folder={folder}&public_id={public_id}&timestamp={timestamp}{api_secret}"
    signature = hashlib.sha1(params_to_sign.encode("utf-8")).hexdigest()

    endpoint = f"https://api.cloudinary.com/v1_1/{cloud_name}/image/upload"
    uploaded_file.seek(0)

    try:
        session = get_shared_http_session()
        resp = session.post(
            endpoint,
            data={
                "api_key": api_key,
                "timestamp": timestamp,
                "folder": folder,
                "public_id": public_id,
                "signature": signature,
            },
            files={
                "file": (
                    uploaded_file.name,
                    uploaded_file.read(),
                    getattr(uploaded_file, "content_type", "image/jpeg"),
                )
            },
            timeout=10.0,
        )
    except Exception as exc:
        logger.error(
            "Cloudinary upload transport error: error_class=%s store_id=%s",
            type(exc).__name__,
            store_id,
        )
        raise CloudinaryUploadError("Media storage service is temporarily unreachable.") from exc

    if resp.status_code != 200:
        logger.error(
            "Cloudinary upload HTTP failure: status=%s store_id=%s",
            resp.status_code,
            store_id,
        )
        raise CloudinaryUploadError("Media upload rejected by cloud storage.")

    payload = resp.json()
    secure_url = str(payload.get("secure_url") or "").strip()
    if not secure_url.startswith("https://"):
        raise CloudinaryUploadError("Invalid media URL returned by cloud storage.")
    return secure_url
