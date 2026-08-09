import os

from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from app.routes.student_routes import router as student_router
from app.routes.attendance_routes import router as attendance_router

from face_ai.enroll import router as enroll_router


# ============================================================
# APP
# ============================================================

app = FastAPI(
    title="AI Smart Attendance System",
    description="Face recognition based smart attendance system",
    version="1.0.0",
)


# ============================================================
# PROJECT DIRECTORIES
# ============================================================

BASE_DIR = os.path.dirname(
    os.path.dirname(os.path.abspath(__file__))
)

FRONTEND_DIR = os.path.join(BASE_DIR, "frontend")
TEMPLATES_DIR = os.path.join(FRONTEND_DIR, "templates")
STATIC_DIR = os.path.join(FRONTEND_DIR, "static")


# ============================================================
# TEMPLATES
# ============================================================

templates = Jinja2Templates(
    directory=TEMPLATES_DIR
)


# ============================================================
# STATIC FILES
# ============================================================

app.mount(
    "/static",
    StaticFiles(directory=STATIC_DIR),
    name="static",
)


# ============================================================
# API ROUTERS
# ============================================================

# Student APIs
app.include_router(student_router)

# Attendance APIs
app.include_router(attendance_router)

# Face Enrollment API
app.include_router(enroll_router)


# ============================================================
# FRONTEND PAGE ROUTES
# ============================================================

@app.get("/")
def dashboard_page(request: Request):
    return templates.TemplateResponse(
        "index.html",
        {"request": request},
    )


@app.get("/students-page")
def students_page(request: Request):
    return templates.TemplateResponse(
        "students.html",
        {"request": request},
    )


@app.get("/attendance-page")
def attendance_page(request: Request):
    return templates.TemplateResponse(
        "attendance.html",
        {"request": request},
    )


@app.get("/recognition-page")
def recognition_page(request: Request):
    return templates.TemplateResponse(
        "recognition.html",
        {"request": request},
    )


@app.get("/settings-page")
def settings_page(request: Request):
    return templates.TemplateResponse(
        "settings.html",
        {"request": request},
    )