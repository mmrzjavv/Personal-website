from __future__ import annotations

import logging
from io import BytesIO

import boto3
from botocore.client import Config

from .settings import Settings

logger = logging.getLogger(__name__)


class ObjectStorage:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.client = boto3.client(
            "s3",
            endpoint_url=settings.minio_endpoint,
            aws_access_key_id=settings.minio_access_key,
            aws_secret_access_key=settings.minio_secret_key,
            region_name=settings.minio_region,
            config=Config(signature_version="s3v4"),
        )

    def ensure_bucket(self) -> None:
        try:
            self.client.head_bucket(Bucket=self.settings.minio_bucket)
        except self.client.exceptions.NoSuchBucket:
            self.client.create_bucket(Bucket=self.settings.minio_bucket)
        except Exception:
            # MinIO can return a generic ClientError for a missing bucket.
            # A second head call keeps startup tolerant while uploads still
            # report the real storage error to the admin.
            try:
                self.client.create_bucket(Bucket=self.settings.minio_bucket)
            except Exception as error:
                logger.warning("MinIO bucket is not ready: %s", error)

    def put(self, object_key: str, payload: bytes, content_type: str) -> None:
        self.client.upload_fileobj(
            BytesIO(payload),
            self.settings.minio_bucket,
            object_key,
            ExtraArgs={"ContentType": content_type, "CacheControl": "public, max-age=31536000"},
        )

    def delete(self, object_key: str) -> None:
        self.client.delete_object(Bucket=self.settings.minio_bucket, Key=object_key)

    def read(self, object_key: str) -> tuple[bytes, str]:
        response = self.client.get_object(Bucket=self.settings.minio_bucket, Key=object_key)
        try:
            content_type = response.get("ContentType") or "application/octet-stream"
            return response["Body"].read(), content_type
        finally:
            response["Body"].close()
