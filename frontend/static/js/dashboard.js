/* ==========================================================
   DASHBOARD PAGE LOGIC
   Data sources:
   GET /students
   GET /attendance

   All dashboard statistics are calculated from real
   backend data.
   ========================================================== */

let attendanceChartInstance = null;


/* ==========================================================
   GREETING + DATE
   ========================================================== */

function setGreeting() {
    const hour = new Date().getHours();

    const greeting =
        hour < 12
            ? "Good Morning"
            : hour < 17
                ? "Good Afternoon"
                : "Good Evening";

    const greetingEl = document.getElementById("greetingText");

    if (greetingEl) {
        greetingEl.textContent = greeting;
    }

    const dateEl = document.getElementById("todayDate");

    if (dateEl) {
        dateEl.textContent = new Date().toLocaleDateString(undefined, {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric"
        });
    }
}


/* ==========================================================
   COMPUTE DASHBOARD STATISTICS
   ========================================================== */

function computeStats(students, attendance) {

    const today = todayISO();

    const todaysRecords = attendance.filter((record) => {
        return normalizeDate(record.attendance_date) === today;
    });

    const presentIds = new Set();
    const lateIds = new Set();

    todaysRecords.forEach((record) => {

        const studentId = record.student_id;

        if (!studentId) {
            return;
        }

        const status = String(record.status || "").toLowerCase().trim();

        if (status === "present") {
            presentIds.add(studentId);
        }

        if (status === "late") {
            lateIds.add(studentId);
        }
    });


    /* ------------------------------------------------------
       A student is considered attended if they are either
       Present OR Late.
       ------------------------------------------------------ */

    const attendedIds = new Set([
        ...presentIds,
        ...lateIds
    ]);


    const totalStudents = students.length;

    const presentToday = presentIds.size;

    const lateToday = lateIds.size;

    const attendedToday = attendedIds.size;

    const absentToday = Math.max(
        totalStudents - attendedToday,
        0
    );


    return {
        totalStudents,
        presentToday,
        absentToday,
        lateToday,
        attendedToday
    };
}


/* ==========================================================
   RENDER STAT CARDS
   ========================================================== */

function renderStats(stats) {

    const presentEl = document.getElementById("statPresent");
    const absentEl = document.getElementById("statAbsent");
    const lateEl = document.getElementById("statLate");
    const totalEl = document.getElementById("statTotal");

    if (presentEl) {
        presentEl.textContent = stats.presentToday;
    }

    if (absentEl) {
        absentEl.textContent = stats.absentToday;
    }

    if (lateEl) {
        lateEl.textContent = stats.lateToday;
    }

    if (totalEl) {
        totalEl.textContent = stats.totalStudents;
    }


    /* ------------------------------------------------------
       Present percentage
       ------------------------------------------------------ */

    const percentage =
        stats.totalStudents > 0
            ? Math.round(
                (stats.attendedToday / stats.totalStudents) * 100
            )
            : 0;


    const presentDelta =
        document.getElementById("statPresentDelta");

    if (presentDelta) {
        presentDelta.textContent =
            `${percentage}% of registered students`;
    }
}


/* ==========================================================
   ATTENDANCE DOUGHNUT CHART
   ========================================================== */

function renderChart(stats) {

    const canvas = document.getElementById("attendanceChart");

    if (!canvas) {
        return;
    }


    const data = [
        stats.presentToday,
        stats.absentToday,
        stats.lateToday
    ];


    const hasData = data.some((value) => value > 0);


    /* Destroy previous chart before creating a new one */

    if (attendanceChartInstance) {
        attendanceChartInstance.destroy();
        attendanceChartInstance = null;
    }


    attendanceChartInstance = new Chart(canvas, {

        type: "doughnut",

        data: {

            labels: [
                "Present",
                "Absent",
                "Late"
            ],

            datasets: [
                {
                    data: hasData
                        ? data
                        : [1, 0, 0],

                    backgroundColor: [
                        "#34d399",
                        "#f87171",
                        "#fbbf24"
                    ],

                    borderColor: "#0e1420",

                    borderWidth: 3,

                    hoverOffset: 6
                }
            ]
        },


        options: {

            responsive: true,

            maintainAspectRatio: false,

            cutout: "68%",


            plugins: {

                legend: {
                    display: false
                },

                tooltip: {
                    enabled: hasData
                }
            }
        }
    });
}


/* ==========================================================
   RECENT ATTENDANCE TABLE
   ========================================================== */

function renderRecentAttendance(records) {

    const body =
        document.getElementById("recentAttendanceBody");

    if (!body) {
        return;
    }


    /* Backend already returns newest records first */

    const recentRecords = records.slice(0, 8);


    /* ------------------------------------------------------
       Empty state
       ------------------------------------------------------ */

    if (recentRecords.length === 0) {

        body.innerHTML = `
            <tr>
                <td colspan="4">
                    <div class="empty-state">

                        <i data-lucide="inbox"></i>

                        <span class="empty-title">
                            No attendance records yet
                        </span>

                        <span class="empty-sub">
                            Records will appear here once attendance is marked.
                        </span>

                    </div>
                </td>
            </tr>
        `;


        if (window.lucide) {
            lucide.createIcons();
        }

        return;
    }


    /* ------------------------------------------------------
       Render records
       ------------------------------------------------------ */

    body.innerHTML = recentRecords
        .map((record) => {

            return `
                <tr>

                    <td class="mono">
                        ${escapeHtml(record.student_id || "")}
                    </td>

                    <td>
                        ${escapeHtml(
                            normalizeDate(record.attendance_date)
                        )}
                    </td>

                    <td class="mono">
                        ${escapeHtml(
                            normalizeTime(record.attendance_time)
                        )}
                    </td>

                    <td>
                        ${statusBadge(record.status)}
                    </td>

                </tr>
            `;
        })
        .join("");


    if (window.lucide) {
        lucide.createIcons();
    }
}


/* ==========================================================
   LOAD DASHBOARD DATA
   ========================================================== */

async function loadDashboard() {

    try {

        const [students, attendance] =
            await Promise.all([
                apiGet("/students"),
                apiGet("/attendance")
            ]);


        const studentList =
            Array.isArray(students)
                ? students
                : [];


        const attendanceList =
            Array.isArray(attendance)
                ? attendance
                : [];


        /* Calculate statistics */

        const stats =
            computeStats(
                studentList,
                attendanceList
            );


        /* Update cards */

        renderStats(stats);


        /* Update chart */

        renderChart(stats);


        /* Update recent attendance */

        renderRecentAttendance(
            attendanceList
        );


    } catch (error) {

        console.error(
            "Dashboard loading error:",
            error
        );


        toastError(
            error.message ||
            "Failed to load dashboard data"
        );


        /* Reset cards safely */

        renderStats({
            totalStudents: 0,
            presentToday: 0,
            absentToday: 0,
            lateToday: 0,
            attendedToday: 0
        });


        renderChart({
            totalStudents: 0,
            presentToday: 0,
            absentToday: 0,
            lateToday: 0,
            attendedToday: 0
        });


        renderRecentAttendance([]);
    }
}


/* ==========================================================
   INITIALIZE DASHBOARD
   ========================================================== */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        setGreeting();

        loadDashboard();
    }
);