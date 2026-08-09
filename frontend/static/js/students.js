/* ==========================================================
   STUDENTS PAGE LOGIC
   Endpoints used (exact schema from student_routes.py):
     GET    /students                -> [{student_id, name, email, course}, ...]
     POST   /students   {name, email, course}
     PUT    /students/{student_id}   {name, email, course}
     DELETE /students/{student_id}

   NOTE: The backend has no endpoint to check per-student face
   enrollment status, so this page intentionally does not show
   an "Enrolled / Not Enrolled" badge — that would require
   inventing data the API doesn't provide. "Enroll Face" is
   always available as an action.
   ========================================================== */

let allStudents = [];
let editingStudentId = null;
let pendingDeleteId = null;
let enrollFile = null;

/* ---------- Load & render ---------- */
async function loadStudents() {
  const body = document.getElementById("studentsBody");
  try {
    const data = await apiGet("/students");
    allStudents = Array.isArray(data) ? data : [];
    renderStudents(allStudents);
  } catch (err) {
    toastError(err.message || "Failed to load students");
    body.innerHTML = `<tr><td colspan="5">
      <div class="empty-state">
        <i data-lucide="alert-triangle"></i>
        <span class="empty-title">Couldn't load students</span>
        <span class="empty-sub">${escapeHtml(err.message || "Check that the backend is running.")}</span>
      </div>
    </td></tr>`;
    if (window.lucide) lucide.createIcons();
  }
}

function renderStudents(list) {
  const body = document.getElementById("studentsBody");

  if (list.length === 0) {
    body.innerHTML = `<tr><td colspan="5">
      <div class="empty-state">
        <i data-lucide="users"></i>
        <span class="empty-title">No students found</span>
        <span class="empty-sub">Add your first student to get started.</span>
      </div>
    </td></tr>`;
    if (window.lucide) lucide.createIcons();
    return;
  }

  body.innerHTML = list
    .map(
      (s) => `
    <tr>
      <td class="mono">${escapeHtml(s.student_id)}</td>
      <td>${escapeHtml(s.name)}</td>
      <td>${escapeHtml(s.email)}</td>
      <td>${escapeHtml(s.course)}</td>
      <td>
        <div class="cell-actions">
          <button class="btn btn-ghost btn-sm" data-action="view" data-id="${escapeHtml(s.student_id)}" aria-label="View student"><i data-lucide="eye"></i></button>
          <button class="btn btn-ghost btn-sm" data-action="edit" data-id="${escapeHtml(s.student_id)}" aria-label="Edit student"><i data-lucide="pencil"></i></button>
          <button class="btn btn-ghost btn-sm" data-action="enroll" data-id="${escapeHtml(s.student_id)}" aria-label="Enroll face"><i data-lucide="scan-face"></i></button>
          <button class="btn btn-ghost btn-sm" data-action="delete" data-id="${escapeHtml(s.student_id)}" aria-label="Delete student"><i data-lucide="trash-2"></i></button>
        </div>
      </td>
    </tr>`
    )
    .join("");

  if (window.lucide) lucide.createIcons();

  body.querySelectorAll("button[data-action]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      const action = btn.getAttribute("data-action");
      if (action === "view") openViewModal(id);
      if (action === "edit") openEditModal(id);
      if (action === "enroll") openEnrollModal(id);
      if (action === "delete") openDeleteModal(id);
    });
  });
}

/* ---------- Search ---------- */
function initSearch() {
  const input = document.getElementById("studentSearch");
  input.addEventListener("input", () => {
    const q = input.value.trim().toLowerCase();
    if (!q) return renderStudents(allStudents);
    const filtered = allStudents.filter(
      (s) =>
        (s.name || "").toLowerCase().includes(q) ||
        (s.email || "").toLowerCase().includes(q) ||
        (s.course || "").toLowerCase().includes(q) ||
        (s.student_id || "").toLowerCase().includes(q)
    );
    renderStudents(filtered);
  });
}

/* ---------- Add / Edit modal ---------- */
function openAddModal() {
  editingStudentId = null;
  document.getElementById("studentModalTitle").textContent = "Add Student";
  document.getElementById("studentSubmitLabel").textContent = "Add Student";
  document.getElementById("studentForm").reset();
  document.getElementById("studentModalOverlay").classList.add("open");
}

function openEditModal(id) {
  const student = allStudents.find((s) => s.student_id === id);
  if (!student) return;
  editingStudentId = id;
  document.getElementById("studentModalTitle").textContent = "Edit Student";
  document.getElementById("studentSubmitLabel").textContent = "Save Changes";
  document.getElementById("studentName").value = student.name || "";
  document.getElementById("studentEmail").value = student.email || "";
  document.getElementById("studentCourse").value = student.course || "";
  document.getElementById("studentModalOverlay").classList.add("open");
}

function closeStudentModal() {
  document.getElementById("studentModalOverlay").classList.remove("open");
  editingStudentId = null;
}

async function submitStudentForm() {
  const name = document.getElementById("studentName").value.trim();
  const email = document.getElementById("studentEmail").value.trim();
  const course = document.getElementById("studentCourse").value.trim();

  if (!name || !email || !course) {
    toastError("Please fill in all required fields");
    return;
  }

  const btn = document.getElementById("submitStudentForm");
  const originalLabel = document.getElementById("studentSubmitLabel").textContent;
  btn.disabled = true;
  document.getElementById("studentSubmitLabel").textContent = editingStudentId ? "Saving..." : "Adding...";

  try {
    if (editingStudentId) {
      await apiPutJSON(`/students/${encodeURIComponent(editingStudentId)}`, { name, email, course });
      toastSuccess("Student updated successfully");
    } else {
      await apiPostJSON("/students", { name, email, course });
      toastSuccess("Student created successfully");
    }
    closeStudentModal();
    await loadStudents();
  } catch (err) {
    toastError(err.message || "Failed to save student");
  } finally {
    btn.disabled = false;
    document.getElementById("studentSubmitLabel").textContent = originalLabel;
  }
}

/* ---------- View modal ---------- */
function openViewModal(id) {
  const student = allStudents.find((s) => s.student_id === id);
  if (!student) return;

  document.getElementById("viewModalBody").innerHTML = `
    <div class="field"><label>Student ID</label><div class="mono" style="font-size:13px;">${escapeHtml(student.student_id)}</div></div>
    <div class="field"><label>Name</label><div style="font-size:13.5px;">${escapeHtml(student.name)}</div></div>
    <div class="field"><label>Email</label><div style="font-size:13.5px;">${escapeHtml(student.email)}</div></div>
    <div class="field" style="margin-bottom:0;"><label>Course</label><div style="font-size:13.5px;">${escapeHtml(student.course)}</div></div>
  `;
  document.getElementById("viewModalOverlay").classList.add("open");
}

/* ---------- Delete modal ---------- */
function openDeleteModal(id) {
  const student = allStudents.find((s) => s.student_id === id);
  if (!student) return;
  pendingDeleteId = id;
  document.getElementById("deleteStudentName").textContent = student.name || "";
  document.getElementById("deleteStudentId").textContent = student.student_id;
  document.getElementById("deleteModalOverlay").classList.add("open");
}

async function confirmDelete() {
  if (!pendingDeleteId) return;
  const btn = document.getElementById("confirmDeleteBtn");
  btn.disabled = true;

  try {
    await apiDelete(`/students/${encodeURIComponent(pendingDeleteId)}`);
    toastSuccess("Student deleted successfully");
    document.getElementById("deleteModalOverlay").classList.remove("open");
    pendingDeleteId = null;
    await loadStudents();
  } catch (err) {
    toastError(err.message || "Failed to delete student");
  } finally {
    btn.disabled = false;
  }
}

/* ---------- Enroll face modal ---------- */
function openEnrollModal(id) {
  enrollFile = null;
  document.getElementById("enrollStudentId").value = id;
  document.getElementById("enrollEmptyState").style.display = "flex";
  document.getElementById("enrollPreviewWrap").style.display = "none";
  document.getElementById("submitEnrollForm").disabled = true;
  document.getElementById("enrollModalOverlay").classList.add("open");
}

function closeEnrollModal() {
  document.getElementById("enrollModalOverlay").classList.remove("open");
}

function handleEnrollFile(file) {
  if (!file) return;
  const allowed = ["image/jpeg", "image/png", "image/jpg"];
  if (!allowed.includes(file.type)) {
    toastError("Only JPG, JPEG and PNG images are allowed");
    return;
  }
  enrollFile = file;
  const reader = new FileReader();
  reader.onload = (e) => {
    document.getElementById("enrollPreviewImg").src = e.target.result;
    document.getElementById("enrollEmptyState").style.display = "none";
    document.getElementById("enrollPreviewWrap").style.display = "block";
    document.getElementById("submitEnrollForm").disabled = false;
  };
  reader.readAsDataURL(file);
}

async function submitEnrollForm() {
  const studentId = document.getElementById("enrollStudentId").value;
  if (!enrollFile || !studentId) return;

  const btn = document.getElementById("submitEnrollForm");
  const label = document.getElementById("enrollSubmitLabel");
  btn.disabled = true;
  label.textContent = "Enrolling...";

  try {
    const formData = new FormData();
    formData.append("student_id", studentId);
    formData.append("file", enrollFile);

    const result = await apiPostForm("/enroll-face", formData);

    if (result && result.encoding_path) {
      toastSuccess(result.message || "Face enrolled successfully");
      closeEnrollModal();
    } else {
      // Backend returns 200 with a message even on face-detection failures
      toastError((result && result.message) || "Face enrollment failed");
    }
  } catch (err) {
    toastError(err.message || "Face enrollment failed");
  } finally {
    btn.disabled = false;
    label.textContent = "Enroll Face";
  }
}

/* ---------- Init ---------- */
document.addEventListener("DOMContentLoaded", () => {
  loadStudents();
  initSearch();

  document.getElementById("openAddStudent").addEventListener("click", openAddModal);
  document.getElementById("closeStudentModal").addEventListener("click", closeStudentModal);
  document.getElementById("cancelStudentModal").addEventListener("click", closeStudentModal);
  document.getElementById("submitStudentForm").addEventListener("click", submitStudentForm);

  document.getElementById("closeViewModal").addEventListener("click", () => document.getElementById("viewModalOverlay").classList.remove("open"));
  document.getElementById("closeViewModalBtn").addEventListener("click", () => document.getElementById("viewModalOverlay").classList.remove("open"));

  document.getElementById("closeDeleteModal").addEventListener("click", () => document.getElementById("deleteModalOverlay").classList.remove("open"));
  document.getElementById("cancelDeleteModal").addEventListener("click", () => document.getElementById("deleteModalOverlay").classList.remove("open"));
  document.getElementById("confirmDeleteBtn").addEventListener("click", confirmDelete);

  document.getElementById("closeEnrollModal").addEventListener("click", closeEnrollModal);
  document.getElementById("cancelEnrollModal").addEventListener("click", closeEnrollModal);
  document.getElementById("submitEnrollForm").addEventListener("click", submitEnrollForm);

  const dropzone = document.getElementById("enrollDropzone");
  const fileInput = document.getElementById("enrollFileInput");
  dropzone.addEventListener("click", (e) => {
    if (e.target.closest(".scanner-remove")) return;
    fileInput.click();
  });
  fileInput.addEventListener("change", (e) => handleEnrollFile(e.target.files[0]));
  dropzone.addEventListener("dragover", (e) => { e.preventDefault(); dropzone.classList.add("drag-over"); });
  dropzone.addEventListener("dragleave", () => dropzone.classList.remove("drag-over"));
  dropzone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropzone.classList.remove("drag-over");
    if (e.dataTransfer.files[0]) handleEnrollFile(e.dataTransfer.files[0]);
  });
  document.getElementById("enrollRemoveImg").addEventListener("click", (e) => {
    e.stopPropagation();
    enrollFile = null;
    document.getElementById("enrollEmptyState").style.display = "flex";
    document.getElementById("enrollPreviewWrap").style.display = "none";
    document.getElementById("submitEnrollForm").disabled = true;
  });

  // Close modals on overlay click
  document.querySelectorAll(".modal-overlay").forEach((overlay) => {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) overlay.classList.remove("open");
    });
  });
});
