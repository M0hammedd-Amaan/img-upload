import boto3
import os

s3 = boto3.client(
    's3',
    aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
    aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
    region_name='eu-north-1'  # ✅ CORRECT
)


BUCKET_NAME = os.getenv('S3_BUCKET_NAME')

def upload_file_to_s3(file, filename):
    try:
        print("[S3] Uploading file to bucket...")
        s3.upload_fileobj(
            file,
            BUCKET_NAME,
            filename,
            ExtraArgs={"ACL": "public-read"}
        )
        print("[S3] File uploaded successfully!")
        url = f"https://{BUCKET_NAME}.s3.{os.getenv('AWS_REGION')}.amazonaws.com/{filename}"
        return url
    except Exception as e:
        print("[S3 ERROR] Failed to upload file:", e)
        raise e

