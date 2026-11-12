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


def inject_f_auto_q_auto(url: str) -> str:
    """
    Injects automatic format and perceptual quality transforms (f_auto,q_auto)
    into a Cloudinary secure delivery URL if not already present.
    """
    marker = "/image/upload/"
    if marker not in url:
        return url
    idx = url.find(marker)
    after = url[idx + len(marker):]
    if (
        after.startswith("f_auto")
        or after.startswith("q_auto")
        or "/f_auto" in after
        or "/q_auto" in after
    ):
        return url
    return f"{url[:idx + len(marker)]}f_auto,q_auto/{after}"


def upload_theme_image_to_cloudinary(
    *,
    file_bytes: bytes,
    filename: str,
    content_type: str,
    store_id: int,
    clean_store_slug: str,
    asset_type: str,
    public_id: str,
) -> str:
    """
    Uploads a processed theme image (hero banner or logo) to Cloudinary under
    shopcraft/stores/{store_id}_{slug}/theme/{public_id} with signed credentials.
    Returns the secure delivery URL with f_auto,q_auto transformations applied.
    """
    cloud_name = getattr(settings, "CLOUDINARY_CLOUD_NAME", "").strip()
    api_key = getattr(settings, "CLOUDINARY_API_KEY", "").strip()
    api_secret = getattr(settings, "CLOUDINARY_API_SECRET", "").strip()

    folder = f"shopcraft/stores/{store_id}_{clean_store_slug}/theme"
    timestamp = str(int(time.time()))

    params_to_sign = f"folder={folder}&public_id={public_id}&timestamp={timestamp}{api_secret}"
    signature = hashlib.sha1(params_to_sign.encode("utf-8")).hexdigest()

    endpoint = f"https://api.cloudinary.com/v1_1/{cloud_name}/image/upload"

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
                    filename,
                    file_bytes,
                    content_type,
                )
            },
            timeout=10.0,
        )
    except Exception as exc:
        logger.error(
            "Cloudinary theme upload transport error: error_class=%s store_id=%s asset_type=%s",
            type(exc).__name__,
            store_id,
            asset_type,
        )
        raise CloudinaryUploadError("Media storage service is temporarily unreachable.") from exc

    if resp.status_code != 200:
        logger.error(
            "Cloudinary theme upload HTTP failure: status=%s store_id=%s asset_type=%s",
            resp.status_code,
            store_id,
            asset_type,
        )
        raise CloudinaryUploadError("Media upload rejected by cloud storage.")

    payload = resp.json()
    secure_url = str(payload.get("secure_url") or "").strip()
    if not secure_url.startswith("https://"):
        raise CloudinaryUploadError("Invalid media URL returned by cloud storage.")

    return inject_f_auto_q_auto(secure_url)


def extract_cloudinary_public_id(url: str, store_id: int) -> str | None:
    """
    Safely extracts the Cloudinary public_id from a delivery URL ONLY if the asset
    belongs strictly to the specified store folder (shopcraft/stores/{store_id}_...).
    Returns None if the URL does not belong to this store or is not a Cloudinary asset.
    """
    if not url or "res.cloudinary.com" not in url:
        return None

    marker = "shopcraft/stores/"
    idx = url.find(marker)
    if idx == -1:
        return None

    path_part = url[idx:]
    # Strip URL parameters or anchors if any
    path_part = path_part.split("?")[0].split("#")[0]

    # Verify store scoping prefix
    expected_prefix = f"shopcraft/stores/{store_id}_"
    if not path_part.startswith(expected_prefix):
        return None

    # Strip the file extension to get the public ID
    import os
    public_id, _ = os.path.splitext(path_part)
    return public_id


def delete_cloudinary_asset(*, public_id: str, store_id: int) -> bool:
    """
    Best-effort deletion of an old Cloudinary asset using the destroy API.
    Guards strictly that the public_id belongs to the current store.
    Never raises an exception; returns True if successfully deleted, False otherwise.
    """
    expected_prefix = f"shopcraft/stores/{store_id}_"
    if not public_id or not public_id.startswith(expected_prefix):
        logger.warning(
            "Blocked attempt to delete Cloudinary asset outside store folder: public_id=%s store_id=%s",
            public_id,
            store_id,
        )
        return False

    if not is_cloudinary_configured():
        return False

    cloud_name = getattr(settings, "CLOUDINARY_CLOUD_NAME", "").strip()
    api_key = getattr(settings, "CLOUDINARY_API_KEY", "").strip()
    api_secret = getattr(settings, "CLOUDINARY_API_SECRET", "").strip()
    timestamp = str(int(time.time()))

    params_to_sign = f"public_id={public_id}&timestamp={timestamp}{api_secret}"
    signature = hashlib.sha1(params_to_sign.encode("utf-8")).hexdigest()

    endpoint = f"https://api.cloudinary.com/v1_1/{cloud_name}/image/destroy"

    try:
        session = get_shared_http_session()
        resp = session.post(
            endpoint,
            data={
                "api_key": api_key,
                "public_id": public_id,
                "timestamp": timestamp,
                "signature": signature,
            },
            timeout=10.0,
        )
        if resp.status_code == 200:
            logger.info("Successfully deleted old Cloudinary asset: public_id=%s store_id=%s", public_id, store_id)
            return True
        else:
            logger.warning(
                "Cloudinary asset deletion returned HTTP %s: public_id=%s store_id=%s",
                resp.status_code,
                public_id,
                store_id,
            )
            return False
    except Exception as exc:
        logger.warning(
            "Cloudinary asset deletion exception: error=%s public_id=%s store_id=%s",
            exc,
            public_id,
            store_id,
        )
        return False

