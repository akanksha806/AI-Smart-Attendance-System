from fastapi import APIRouter
from pydantic import BaseModel
from app.database import get_db_connection
import uuid

router = APIRouter()


class Student(BaseModel):
    name: str
    email: str
    course: str


# CREATE STUDENT
@router.post("/students")
def create_student(student: Student):

    connection = get_db_connection()
    cursor = connection.cursor()

    student_id = "STU-" + uuid.uuid4().hex[:8].upper()

    query = """
    INSERT INTO students (student_id, name, email, course)
    VALUES (%s, %s, %s, %s)
    """

    cursor.execute(
        query,
        (
            student_id,
            student.name,
            student.email,
            student.course
        )
    )

    connection.commit()

    cursor.close()
    connection.close()

    return {
        "message": "Student created successfully",
        "student_id": student_id
    }


# GET ALL STUDENTS
@router.get("/students")
def get_students():

    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)

    query = "SELECT * FROM students"

    cursor.execute(query)
    students = cursor.fetchall()

    cursor.close()
    connection.close()

    return students


# GET STUDENT BY ID
@router.get("/students/{student_id}")
def get_student(student_id: str):

    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)

    query = """
    SELECT * FROM students
    WHERE student_id = %s
    """

    cursor.execute(query, (student_id,))
    student = cursor.fetchone()

    cursor.close()
    connection.close()

    if student is None:
        return {"message": "Student not found"}

    return student


# UPDATE STUDENT
@router.put("/students/{student_id}")
def update_student(student_id: str, student: Student):

    connection = get_db_connection()
    cursor = connection.cursor()

    query = """
    UPDATE students
    SET name = %s, email = %s, course = %s
    WHERE student_id = %s
    """

    cursor.execute(
        query,
        (
            student.name,
            student.email,
            student.course,
            student_id
        )
    )

    connection.commit()

    if cursor.rowcount == 0:
        cursor.close()
        connection.close()
        return {"message": "Student not found"}

    cursor.close()
    connection.close()

    return {
        "message": "Student updated successfully",
        "student_id": student_id
    }
# DELETE STUDENT
@router.delete("/students/{student_id}")
def delete_student(student_id: str):

    connection = get_db_connection()
    cursor = connection.cursor()

    query = """
    DELETE FROM students
    WHERE student_id = %s
    """

    cursor.execute(query, (student_id,))

    connection.commit()

    if cursor.rowcount == 0:
        cursor.close()
        connection.close()
        return {"message": "Student not found"}

    cursor.close()
    connection.close()

    return {
        "message": "Student deleted successfully",
        "student_id": student_id
    }