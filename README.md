# 🤖 AI Smart Attendance System

An AI-powered smart attendance system that uses face recognition
to identify enrolled users and automatically record attendance.

## 🚀 Live Demo

🌐 **Live Application:** [AI Smart Attendance System](https://3.27.111.51.nip.io/)

🤖 **Face Recognition:** [Try Face Recognition](https://3.27.111.51.nip.io/recognition-page)

## 📌 About The Project

The AI Smart Attendance System is a web-based application developed
to automate the attendance process using face recognition.

Instead of manually marking attendance, the system captures a
user's face through the camera, compares it with enrolled faces,
and recognizes the person when a match is found.

The project was developed as a practical implementation of
AI, backend development, database management and cloud deployment.

## ✨ Features

- 👤 Face enrollment
- 🧠 Face recognition
- 📸 Camera-based face capture
- ✅ Automatic recognition of enrolled users
- ❌ Handles unrecognized users
- 📝 Attendance recording
- 🗄️ Database integration
- 🌐 Web-based interface
- 🔐 HTTPS-enabled deployment
- ☁️ AWS EC2 deployment

## 🛠️ Tech Stack

### Backend
- Python
- FastAPI

### AI / Computer Vision
- Face Recognition
- OpenCV

### Database
- MySQL

### Frontend
- HTML
- CSS
- JavaScript

### Deployment
- AWS EC2
- Nginx
- HTTPS / SSL

## 🏗️ Project Architecture

```text
User
  │
  ▼
Web Interface
  │
  ▼
Camera
  │
  ▼
Face Detection
  │
  ▼
Face Recognition
  │
  ├── Match Found ──────► Mark Attendance
  │
  └── No Match ─────────► Unrecognized User
                             
  ▼
MySQL Database
