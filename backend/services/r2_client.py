import boto3
from botocore.config import Config
from config import settings


def _get_client():
    return boto3.client(
        "s3",
        endpoint_url=f"https://{settings.R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
        aws_access_key_id=settings.R2_ACCESS_KEY_ID,
        aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
        config=Config(signature_version="s3v4"),
        region_name="auto",
    )


def upload_bytes(data: bytes, key: str, content_type: str) -> str:
    client = _get_client()
    client.put_object(
        Bucket=settings.R2_BUCKET_NAME,
        Key=key,
        Body=data,
        ContentType=content_type,
    )
    return f"{settings.R2_PUBLIC_URL}/{key}"


def upload_html(html: str, key: str) -> str:
    return upload_bytes(
        html.encode("utf-8"),
        key,
        "text/html; charset=utf-8",
    )
