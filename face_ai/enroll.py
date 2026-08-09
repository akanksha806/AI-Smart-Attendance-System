import os
import shutil

from fastapi import APIRouter, UploadFile, File, Form

from app.database import get_db_connection
from face_ai.recognition import save_face_encoding

router = APIRouter()


BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATASET_DIR = os.path.join(BASE_DIR, "face_recognition", "dataset")

os.makedirs(DATASET_DIR, exist_ok=True)


@router.post("/enroll-face")
async def enroll_face(
    student_id: str = Form(...),
    file: UploadFile = File(...)
):
    # Check image format
    allowed_extensions = [".jpg", ".jpeg", ".png"]

    file_extension = os.path.splitext(file.filename)[1].lower()

    if file_extension not in allowed_extensions:
        return {
            "message": "Only JPG, JPEG and PNG images are allowed"
        }

    # Create student's image path
    image_filename = f"{student_id}{file_extension}"
    image_path = os.path.join(DATASET_DIR, image_filename)

    # Save uploaded image
    with open(image_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        # Generate and save face encoding
        encoding_path = save_face_encoding(
            student_id,
            image_path
        )

        # Save encoding information in database
        connection = get_db_connection()
        cursor = connection.cursor()

        query = """
        INSERT INTO face_data (student_id, encoding_path)
        VALUES (%s, %s)
        """

        cursor.execute(
            query,
            (
                student_id,
                encoding_path
            )
        )

        connection.commit()

        cursor.close()
        connection.close()

        return {
            "message": "Face enrolled successfully",
            "student_id": student_id,
            "encoding_path": encoding_path
        }

    except ValueError as e:
        # Remove image if face processing fails
        if os.path.exists(image_path):
            os.remove(image_path)

        return {
            "message": str(e)
        }

    except Exception as e:
        if os.path.exists(image_path):
            os.remove(image_path)

        return {
            "message": "Face enrollment failed",
            "error": str(e)
        }