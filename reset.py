#!/usr/bin/env python3
"""
Reset: loescht alle Betriebe (DB) und Landing Pages (R2/handwerker/).
Nicht betroffen: jobs-Tabelle, chatbot/-Prefix, Schema, Config.

Ausfuehren:
  cd /opt/handwerker-agent
  source backend/.venv/bin/activate
  python3 reset.py
"""
import os
import subprocess
import boto3
from botocore.config import Config
from dotenv import load_dotenv

load_dotenv()

# ── DB via psql ──
print("DB: loesche betriebe + kontaktversuche...")
subprocess.run(
    ["sudo", "-u", "postgres", "psql", "handwerkerdb", "-c", "TRUNCATE betriebe CASCADE;"],
    check=True,
)
result = subprocess.run(
    ["sudo", "-u", "postgres", "psql", "handwerkerdb", "-t", "-c", "SELECT COUNT(*) FROM betriebe;"],
    capture_output=True, text=True, check=True,
)
print(f"DB: betriebe nach Reset: {result.stdout.strip()}")

# ── R2 ──
print("R2: loesche handwerker/-Prefix...")
client = boto3.client(
    "s3",
    endpoint_url=f"https://{os.environ['R2_ACCOUNT_ID']}.r2.cloudflarestorage.com",
    aws_access_key_id=os.environ["R2_ACCESS_KEY_ID"],
    aws_secret_access_key=os.environ["R2_SECRET_ACCESS_KEY"],
    config=Config(signature_version="s3v4"),
    region_name="auto",
)
bucket = os.environ["R2_BUCKET_NAME"]
deleted = 0
paginator = client.get_paginator("list_objects_v2")
for page in paginator.paginate(Bucket=bucket, Prefix="handwerker/"):
    objects = page.get("Contents", [])
    if objects:
        client.delete_objects(
            Bucket=bucket,
            Delete={"Objects": [{"Key": o["Key"]} for o in objects]},
        )
        deleted += len(objects)
print(f"R2: {deleted} Dateien geloescht.")
print("Reset abgeschlossen.")
