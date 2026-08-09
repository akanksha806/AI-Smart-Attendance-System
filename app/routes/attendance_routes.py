from fastapi import APIRouter, UploadFile, File
from pydantic import BaseModel
from app.database import get_db_connection
from datetime import date, datetime
import os
import uuid

from face_ai.recognition import recognize_face
router = APIRouter()


class Attendance(BaseModel):
    student_id: str
    status: str = "Present"


# ==========================================
# MARK ATTENDANCE MANUALLY
# ==========================================

@router.post("/attendance")
def mark_attendance(attendance: Attendance):

    connection = get_db_connection()
    cursor = connection.cursor()

    attendance_date = date.today()
    attendance_time = datetime.now().time()

    query = """
    INSERT INTO attendance
    (student_id, attendance_date, attendance_time, status)
    VALUES (%s, %s, %s, %s)
    """

    cursor.execute(
        query,
        (
            attendance.student_id,
            attendance_date,
            attendance_time,
            attendance.status
        )
    )

    connection.commit()

    cursor.close()
    connection.close()

    return {
        "message": "Attendance marked successfully",
        "student_id": attendance.student_id,
        "status": attendance.status
    }


# ==========================================
# GET ALL ATTENDANCE
# ==========================================

@router.get("/attendance")
def get_attendance():

    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)

    query = """
    SELECT * FROM attendance
    ORDER BY attendance_date DESC, attendance_time DESC
    """

    cursor.execute(query)
    records = cursor.fetchall()

    cursor.close()
    connection.close()

    return records


# ==========================================
# FACE RECOGNITION + AUTOMATIC ATTENDANCE
# ==========================================

@router.post("/recognize-face")
async def recognize_and_mark_attendance(
    file: UploadFile = File(...)
):

    # Temporary image path
    temp_dir = "temp"

    os.makedirs(temp_dir, exist_ok=True)

    image_path = os.path.join(
        temp_dir,
        f"{uuid.uuid4().hex}.jpg"
    )

    try:

        # Save uploaded image
        image_data = await file.read()

        with open(image_path, "wb") as f:
            f.write(image_data)

        # Recognize face
        student_id = recognize_face(image_path)

        # No face / unknown face
        if student_id is None:
            return {
                "message": "Face not recognized",
                "status": "Failed"
            }

        # Mark attendance
        connection = get_db_connection()
        cursor = connection.cursor()

        attendance_date = date.today()
        attendance_time = datetime.now().time()

        query = """
        INSERT INTO attendance
        (student_id, attendance_date, attendance_time, status)
        VALUES (%s, %s, %s, %s)
        """

        cursor.execute(
            query,
            (
                student_id,
                attendance_date,
                attendance_time,
                "Present"
            )
        )

        connection.commit()

        cursor.close()
        connection.close()

        return {
            "message": "Face recognized and attendance marked successfully",
            "student_id": student_id,
            "status": "Present"
        }

    except Exception as e:

        return {
            "message": "Face recognition failed",
            "error": str(e)
        }

    finally:

        # Delete temporary image
        if os.path.exists(image_path):
            os.remove(image_path)