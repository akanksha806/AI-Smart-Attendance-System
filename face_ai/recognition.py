import os
import pickle
from typing import Optional, Tuple, List

import face_recognition
import numpy as np


BASE_DIR = os.path.dirname(os.path.abspath(__file__))

DATASET_DIR = os.path.join(BASE_DIR, "dataset")
MODELS_DIR = os.path.join(BASE_DIR, "models")

os.makedirs(DATASET_DIR, exist_ok=True)
os.makedirs(MODELS_DIR, exist_ok=True)


# ============================================================
# SAVE FACE ENCODING
# ============================================================

def save_face_encoding(student_id: str, image_path: str) -> str:
    """
    Read a face image, generate face encoding,
    and save it as a .pkl file.
    """

    image = face_recognition.load_image_file(image_path)

    face_locations = face_recognition.face_locations(image)

    if len(face_locations) == 0:
        raise ValueError("No face found in image")

    encodings = face_recognition.face_encodings(
        image,
        face_locations
    )

    if len(encodings) == 0:
        raise ValueError("Could not generate face encoding")

    encoding = encodings[0]

    encoding_path = os.path.join(
        MODELS_DIR,
        f"{student_id}.pkl"
    )

    with open(encoding_path, "wb") as f:
        pickle.dump(encoding, f)

    return encoding_path


# ============================================================
# LOAD ALL FACE ENCODINGS
# ============================================================

def load_all_encodings() -> Tuple[List[np.ndarray], List[str]]:
    """
    Load all saved face encodings from models folder.
    """

    known_encodings = []
    known_student_ids = []

    for filename in os.listdir(MODELS_DIR):

        if not filename.endswith(".pkl"):
            continue

        student_id = filename.replace(".pkl", "")

        file_path = os.path.join(
            MODELS_DIR,
            filename
        )

        with open(file_path, "rb") as f:
            encoding = pickle.load(f)

        known_encodings.append(encoding)
        known_student_ids.append(student_id)

    return known_encodings, known_student_ids


# ============================================================
# RECOGNIZE FACE
# ============================================================

def recognize_face(
    image_path: str,
    tolerance: float = 0.5
) -> Optional[str]:

    """
    Read image from image_path,
    detect face,
    compare with saved encodings,
    and return matching student_id.
    """

    # IMPORTANT:
    # image_path is a STRING.
    # First convert the file into an image array.

    image = face_recognition.load_image_file(image_path)

    # Detect faces
    face_locations = face_recognition.face_locations(image)

    if len(face_locations) == 0:
        return None

    # Generate face encodings
    face_encodings = face_recognition.face_encodings(
        image,
        face_locations
    )

    if len(face_encodings) == 0:
        return None

    # Load registered students' encodings
    known_encodings, known_student_ids = load_all_encodings()

    if not known_encodings:
        return None

    # Compare detected faces
    for face_encoding in face_encodings:

        matches = face_recognition.compare_faces(
            known_encodings,
            face_encoding,
            tolerance=tolerance
        )

        face_distances = face_recognition.face_distance(
            known_encodings,
            face_encoding
        )

        if len(face_distances) == 0:
            continue

        # Find closest face
        best_match_index = np.argmin(face_distances)

        if matches[best_match_index]:
            return known_student_ids[best_match_index]

    return None