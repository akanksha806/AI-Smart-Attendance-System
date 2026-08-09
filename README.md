┌──────────────────────────────────────────────────────┐
│  ✦ AI ATTENDANCE             Dashboard  Students     │
│                              Attendance  Settings    │
├───────────────┬──────────────────────────┬───────────┤
│               │                          │           │
│  TODAY        │      LIVE CAMERA         │ STUDENT   │
│               │                          │           │
│  42 Present   │     ┌────────────┐       │ Akanksha  │
│   5 Absent    │     │    FACE    │       │ STU-4821  │
│   3 Late      │     │  DETECTED  │       │           │
│               │     └────────────┘       │ 🟢 Present │
│               │                          │           │
├───────────────┴──────────────────────────┴───────────┤
│                                                      │
│  Attendance Overview        Recent Attendance        │
│       📈 chart                    📋 table          │
│                                                      │
└──────────────────────────────────────────────────────┘

AI-Smart-Attendance-System
│
├── app
│   ├── main.py
│   └── routes
│       ├── student_routes.py
│       └── attendance_routes.py
│
├── face_ai
│   └── enroll.py
│
└── frontend
    ├── static
    │   ├── css
    │   │   └── style.css
    │   │
    │   └── js
    │       ├── app.js
    │       ├── attendance.js
    │       ├── dashboard.js
    │       ├── recognition.js
    │       └── students.js
    │
    └── templates
        ├── base.html
        ├── index.html
        ├── students.html
        ├── attendance.html
        ├── recognition.html
        └── settings.html