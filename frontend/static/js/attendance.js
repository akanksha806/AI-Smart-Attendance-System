/* ==========================================================
   ATTENDANCE PAGE LOGIC
   Endpoint used: GET /attendance

   Backend records are loaded from the API.
   The frontend handles:
   - Search
   - Date filter
   - Status filter
   - Pagination
   - CSV export
   - Time formatting
========================================================== */

let allAttendance = [];
let filteredAttendance = [];

let currentPage = 1;

const PAGE_SIZE = 10;


/* ==========================================================
   TIME FORMATTER
========================================================== */

/*
   MySQL TIME values may arrive from the backend as:

   "07:17:09"

   OR sometimes as total seconds:

   26229

   Example:
   26229 seconds = 07:17:09
   82183 seconds = 22:49:43

   This function handles both formats.
*/

function formatAttendanceTime(value) {

    if (value === null || value === undefined || value === "") {
        return "—";
    }

    // Already formatted as HH:MM:SS
    if (
        typeof value === "string" &&
        /^\d{1,2}:\d{2}:\d{2}$/.test(value)
    ) {
        return value;
    }

    // Convert numeric / numeric-string value to seconds
    const totalSeconds = Number(value);

    if (Number.isFinite(totalSeconds)) {

        const hours = Math.floor(totalSeconds / 3600);

        const minutes = Math.floor(
            (totalSeconds % 3600) / 60
        );

        const seconds = Math.floor(
            totalSeconds % 60
        );

        return [
            String(hours).padStart(2, "0"),
            String(minutes).padStart(2, "0"),
            String(seconds).padStart(2, "0")
        ].join(":");
    }

    return String(value);
}


/* ==========================================================
   LOAD ATTENDANCE
========================================================== */

async function loadAttendance() {

    const body = document.getElementById("attendanceBody");

    try {

        const data = await apiGet("/attendance");

        allAttendance = Array.isArray(data)
            ? data
            : [];

        applyFilters();

    } catch (err) {

        toastError(
            err.message || "Failed to load attendance"
        );

        body.innerHTML = `
            <tr>
                <td colspan="4">
                    <div class="empty-state">

                        <i data-lucide="alert-triangle"></i>

                        <span class="empty-title">
                            Couldn't load attendance
                        </span>

                        <span class="empty-sub">
                            ${escapeHtml(
                                err.message ||
                                "Check that the backend is running."
                            )}
                        </span>

                    </div>
                </td>
            </tr>
        `;

        if (window.lucide) {
            lucide.createIcons();
        }
    }
}


/* ==========================================================
   APPLY FILTERS
========================================================== */

function applyFilters() {

    const searchInput =
        document.getElementById("attendanceSearch");

    const dateInput =
        document.getElementById("dateFilter");

    const statusInput =
        document.getElementById("statusFilter");


    const q = searchInput
        ? searchInput.value.trim().toLowerCase()
        : "";

    const dateVal = dateInput
        ? dateInput.value
        : "";

    const statusVal = statusInput
        ? statusInput.value
        : "";


    filteredAttendance = allAttendance.filter((r) => {

        const studentId =
            r.student_id || "";

        const status =
            r.status || "";


        const matchesSearch =
            !q ||
            String(studentId)
                .toLowerCase()
                .includes(q);


        const matchesDate =
            !dateVal ||
            normalizeDate(r.attendance_date) === dateVal;


        const matchesStatus =
            !statusVal ||
            String(status)
                .toLowerCase() ===
            statusVal.toLowerCase();


        return (
            matchesSearch &&
            matchesDate &&
            matchesStatus
        );
    });


    currentPage = 1;

    renderTable();
}


/* ==========================================================
   RENDER ATTENDANCE TABLE
========================================================== */

function renderTable() {

    const body =
        document.getElementById("attendanceBody");


    const totalPages =
        Math.max(
            Math.ceil(
                filteredAttendance.length /
                PAGE_SIZE
            ),
            1
        );


    currentPage =
        Math.min(
            currentPage,
            totalPages
        );


    /* ------------------------------------------------------
       NO RECORDS
    ------------------------------------------------------ */

    if (filteredAttendance.length === 0) {

        body.innerHTML = `
            <tr>
                <td colspan="4">

                    <div class="empty-state">

                        <i data-lucide="calendar-x"></i>

                        <span class="empty-title">
                            No attendance records found
                        </span>

                        <span class="empty-sub">
                            Try adjusting your search or filters.
                        </span>

                    </div>

                </td>
            </tr>
        `;


        const paginationBar =
            document.getElementById(
                "paginationBar"
            );

        if (paginationBar) {
            paginationBar.style.display =
                "none";
        }


        if (window.lucide) {
            lucide.createIcons();
        }

        return;
    }


    /* ------------------------------------------------------
       PAGINATION
    ------------------------------------------------------ */

    const start =
        (currentPage - 1) *
        PAGE_SIZE;


    const pageItems =
        filteredAttendance.slice(
            start,
            start + PAGE_SIZE
        );


    /* ------------------------------------------------------
       TABLE ROWS
    ------------------------------------------------------ */

    body.innerHTML = pageItems
        .map((r) => {

            const studentId =
                r.student_id || "";

            const date =
                normalizeDate(
                    r.attendance_date
                );

            const time =
                formatAttendanceTime(
                    r.attendance_time
                );

            const status =
                r.status || "";


            return `
                <tr>

                    <td class="mono">
                        ${escapeHtml(studentId)}
                    </td>

                    <td>
                        ${escapeHtml(date)}
                    </td>

                    <td class="mono">
                        ${escapeHtml(time)}
                    </td>

                    <td>
                        ${statusBadge(status)}
                    </td>

                </tr>
            `;
        })
        .join("");


    /* ------------------------------------------------------
       PAGINATION BAR
    ------------------------------------------------------ */

    const bar =
        document.getElementById(
            "paginationBar"
        );


    if (bar) {

        bar.style.display =
            filteredAttendance.length >
            PAGE_SIZE
                ? "flex"
                : "none";
    }


    const paginationLabel =
        document.getElementById(
            "paginationLabel"
        );


    if (paginationLabel) {

        paginationLabel.textContent =
            `Showing ${start + 1}–${Math.min(
                start + PAGE_SIZE,
                filteredAttendance.length
            )} of ${filteredAttendance.length}`;
    }


    const prevPageBtn =
        document.getElementById(
            "prevPageBtn"
        );


    const nextPageBtn =
        document.getElementById(
            "nextPageBtn"
        );


    if (prevPageBtn) {

        prevPageBtn.disabled =
            currentPage <= 1;
    }


    if (nextPageBtn) {

        nextPageBtn.disabled =
            currentPage >= totalPages;
    }


    if (window.lucide) {
        lucide.createIcons();
    }
}


/* ==========================================================
   EXPORT CSV
========================================================== */

function exportCsv() {

    if (filteredAttendance.length === 0) {

        toastError(
            "No attendance records to export"
        );

        return;
    }


    const header = [
        "Student ID",
        "Date",
        "Time",
        "Status"
    ];


    const rows =
        filteredAttendance.map((r) => [

            r.student_id || "",

            normalizeDate(
                r.attendance_date
            ),

            formatAttendanceTime(
                r.attendance_time
            ),

            r.status || ""
        ]);


    const csvContent = [
        header,
        ...rows
    ]
        .map((row) =>

            row
                .map(
                    (cell) =>
                        `"${String(cell)
                            .replace(/"/g, '""')}"`
                )
                .join(",")
        )
        .join("\n");


    const blob =
        new Blob(
            [csvContent],
            {
                type:
                    "text/csv;charset=utf-8;"
            }
        );


    const url =
        URL.createObjectURL(blob);


    const link =
        document.createElement("a");


    link.href = url;


    link.download =
        `attendance_${todayISO()}.csv`;


    document.body.appendChild(link);


    link.click();


    document.body.removeChild(link);


    URL.revokeObjectURL(url);


    toastSuccess(
        "Attendance exported to CSV"
    );
}


/* ==========================================================
   PAGE INITIALIZATION
========================================================== */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        /* Load attendance data */

        loadAttendance();


        /* --------------------------------------------------
           SEARCH
        -------------------------------------------------- */

        const attendanceSearch =
            document.getElementById(
                "attendanceSearch"
            );


        if (attendanceSearch) {

            attendanceSearch.addEventListener(
                "input",
                applyFilters
            );
        }


        /* --------------------------------------------------
           DATE FILTER
        -------------------------------------------------- */

        const dateFilter =
            document.getElementById(
                "dateFilter"
            );


        if (dateFilter) {

            dateFilter.addEventListener(
                "change",
                applyFilters
            );
        }


        /* --------------------------------------------------
           STATUS FILTER
        -------------------------------------------------- */

        const statusFilter =
            document.getElementById(
                "statusFilter"
            );


        if (statusFilter) {

            statusFilter.addEventListener(
                "change",
                applyFilters
            );
        }


        /* --------------------------------------------------
           EXPORT CSV
        -------------------------------------------------- */

        const exportCsvBtn =
            document.getElementById(
                "exportCsvBtn"
            );


        if (exportCsvBtn) {

            exportCsvBtn.addEventListener(
                "click",
                exportCsv
            );
        }


        /* --------------------------------------------------
           PREVIOUS PAGE
        -------------------------------------------------- */

        const prevPageBtn =
            document.getElementById(
                "prevPageBtn"
            );


        if (prevPageBtn) {

            prevPageBtn.addEventListener(
                "click",
                () => {

                    if (currentPage > 1) {

                        currentPage--;

                        renderTable();
                    }
                }
            );
        }


        /* --------------------------------------------------
           NEXT PAGE
        -------------------------------------------------- */

        const nextPageBtn =
            document.getElementById(
                "nextPageBtn"
            );


        if (nextPageBtn) {

            nextPageBtn.addEventListener(
                "click",
                () => {

                    const totalPages =
                        Math.max(
                            Math.ceil(
                                filteredAttendance.length /
                                PAGE_SIZE
                            ),
                            1
                        );


                    if (
                        currentPage <
                        totalPages
                    ) {

                        currentPage++;

                        renderTable();
                    }
                }
            );
        }

    }
);