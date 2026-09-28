import os
import uuid

from dotenv import load_dotenv
from supabase import create_client, Client


load_dotenv()


SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv(
    "SUPABASE_SERVICE_ROLE_KEY"
)
SUPABASE_BUCKET = os.getenv(
    "SUPABASE_BUCKET",
    "product-images"
)


if not SUPABASE_URL:
    raise ValueError(
        "SUPABASE_URL is not set in .env"
    )

if not SUPABASE_SERVICE_ROLE_KEY:
    raise ValueError(
        "SUPABASE_SERVICE_ROLE_KEY is not set in .env"
    )


supabase: Client = create_client(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY
)


def get_content_type(extension: str) -> str:
    content_types = {
        "jpg": "image/jpeg",
        "jpeg": "image/jpeg",
        "png": "image/png",
        "webp": "image/webp",
        "jfif": "image/jpeg",
    }

    return content_types.get(
        extension,
        "application/octet-stream"
    )


def upload_product_image(
    file_bytes: bytes,
    original_filename: str,
    product_id: int
):
    extension = (
        original_filename.rsplit(".", 1)[-1].lower()
        if "." in original_filename
        else "jpg"
    )

    if extension == "jfif":
        extension = "jpg"

    filename = f"{uuid.uuid4()}.{extension}"

    storage_path = (
        f"products/product_{product_id}/{filename}"
    )

    content_type = get_content_type(extension)

    print("")
    print("========== SUPABASE UPLOAD DEBUG ==========")
    print("Bucket:", SUPABASE_BUCKET)
    print("Storage path:", storage_path)
    print("Content type:", content_type)
    print("File size:", len(file_bytes), "bytes")
    print("============================================")

    try:
        response = (
            supabase.storage
            .from_(SUPABASE_BUCKET)
            .upload(
                path=storage_path,
                file=file_bytes,
                file_options={
                    "content-type": content_type,
                    "cache-control": "3600",
                    "upsert": "false",
                }
            )
        )

        print("")
        print("========== SUPABASE UPLOAD SUCCESS =========")
        print("Response:", response)
        print("============================================")

    except Exception as e:

        print("")
        print("========== SUPABASE UPLOAD FAILED ==========")
        print("Exception type:", type(e).__name__)
        print("Exception:", repr(e))
        print("Exception string:", str(e))

        # The current storage3 SDK can hide the
        # original HTTP error behind:
        # AttributeError: 'dict' object has no attribute 'text'
        #
        # Check the exception context/cause so we can
        # see the real Storage API response.

        if e.__context__:
            print("")
            print("========== ORIGINAL EXCEPTION =============")
            print(
                "Context type:",
                type(e.__context__).__name__
            )
            print(
                "Context:",
                repr(e.__context__)
            )
            print(
                "Context string:",
                str(e.__context__)
            )

            context = e.__context__

            if hasattr(context, "response"):
                response_obj = context.response

                print("")
                print(
                    "========== ORIGINAL HTTP RESPONSE ========="
                )
                print(
                    "Status code:",
                    getattr(
                        response_obj,
                        "status_code",
                        None
                    )
                )
                print(
                    "Response text:",
                    getattr(
                        response_obj,
                        "text",
                        None
                    )
                )
                print(
                    "Response headers:",
                    getattr(
                        response_obj,
                        "headers",
                        None
                    )
                )

        print("")
        print("============================================")

        raise

    public_url = (
        supabase.storage
        .from_(SUPABASE_BUCKET)
        .get_public_url(
            storage_path
        )
    )

    print("")
    print("========== PUBLIC URL ======================")
    print(public_url)
    print("============================================")

    return {
        "storage_path": storage_path,
        "public_url": public_url
    }