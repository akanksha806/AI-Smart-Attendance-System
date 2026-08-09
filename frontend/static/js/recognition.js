/* ==========================================================
   FACE RECOGNITION PAGE LOGIC
   Endpoint: POST /recognize-face  (multipart/form-data, field "file")

   Response shapes actually returned by the backend:
     Success:        { message, student_id, status: "Present" }
     Not recognized: { message: "Face not recognized", status: "Failed" }
     Server error:   { message: "Face recognition failed", error }
   ========================================================== */

let selectedFile = null;
let cameraStream = null;
let isRecognizing = false;

/* ---------- File selection ---------- */
function setSelectedFile(file) {
  if (!file) return;
  const allowed = ["image/jpeg", "image/png", "image/jpg"];
  if (!allowed.includes(file.type)) {
    toastError("Only JPG and PNG images are supported");
    return;
  }

  selectedFile = file;
  hideResult();

  const reader = new FileReader();
  reader.onload = (e) => {
    document.getElementById("scannerPreviewImg").src = e.target.result;
    document.getElementById("scannerEmptyState").style.display = "none";
    document.getElementById("scannerPreviewWrap").style.display = "block";
    document.getElementById("scannerZone").classList.add("has-image");
    document.getElementById("recognizeBtn").disabled = false;
  };
  reader.readAsDataURL(file);
}

function clearSelectedFile() {
  selectedFile = null;
  document.getElementById("scannerEmptyState").style.display = "flex";
  document.getElementById("scannerPreviewWrap").style.display = "none";
  document.getElementById("scannerZone").classList.remove("has-image");
  document.getElementById("recognizeBtn").disabled = true;
  document.getElementById("scannerFileInput").value = "";
  hideResult();
}

/* ---------- Result panel ---------- */
function hideResult() {
  document.getElementById("resultPanel").classList.remove("show", "result-success", "result-fail");
}

function showResult(success, title, subtitle, meta) {
  const panel = document.getElementById("resultPanel");
  panel.classList.add("show", success ? "result-success" : "result-fail");
  panel.classList.remove(success ? "result-fail" : "result-success");

  document.getElementById("resultIcon").innerHTML = `<i data-lucide="${success ? "check" : "x"}"></i>`;
  document.getElementById("resultTitle").textContent = title;
  document.getElementById("resultSubtitle").textContent = subtitle;

  const metaEl = document.getElementById("resultMeta");
  if (meta && meta.length) {
    metaEl.innerHTML = meta
      .map((m) => `<div class="result-meta-item"><span>${escapeHtml(m.label)}</span><span>${escapeHtml(m.value)}</span></div>`)
      .join("");
  } else {
    metaEl.innerHTML = "";
  }

  if (window.lucide) lucide.createIcons();
}

/* ---------- Recognize ---------- */
async function recognizeFace() {
  if (!selectedFile || isRecognizing) return;

  isRecognizing = true;
  const btn = document.getElementById("recognizeBtn");
  const label = document.getElementById("recognizeLabel");
  btn.disabled = true;
  label.textContent = "Analyzing face...";
  document.getElementById("scannerPreviewWrap").classList.add("scanning");
  hideResult();

  try {
    const formData = new FormData();
    formData.append("file", selectedFile);

    const result = await apiPostForm("/recognize-face", formData);

    if (result && result.student_id && (result.status || "").toLowerCase() !== "failed") {
      showResult(true, "Face Recognized", result.message || "Attendance marked successfully.", [
        { label: "Student ID", value: result.student_id },
        { label: "Status", value: result.status || "Present" },
      ]);
      toastSuccess("Face recognized and attendance marked");
    } else {
      showResult(false, "Face Not Recognized", result?.error || result?.message || "Try another image with a clearer view of the face.");
      toastError(result?.message || "Face not recognized");
    }
  } catch (err) {
    showResult(false, "Recognition Failed", err.message || "Something went wrong while contacting the recognition service.");
    toastError(err.message || "Face recognition failed");
  } finally {
    isRecognizing = false;
    btn.disabled = !selectedFile;
    label.textContent = "Recognize Face";
    document.getElementById("scannerPreviewWrap").classList.remove("scanning");
  }
}

/* ---------- Camera ---------- */
async function openCamera() {
  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
    document.getElementById("cameraVideo").srcObject = cameraStream;
    document.getElementById("cameraPanel").style.display = "block";
  } catch (err) {
    toastError("Camera access denied or unavailable");
  }
}

function closeCamera() {
  if (cameraStream) {
    cameraStream.getTracks().forEach((track) => track.stop());
    cameraStream = null;
  }
  document.getElementById("cameraPanel").style.display = "none";
}

function captureFromCamera() {
  const video = document.getElementById("cameraVideo");
  const canvas = document.getElementById("cameraCanvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  canvas.toBlob((blob) => {
    const file = new File([blob], `capture_${Date.now()}.jpg`, { type: "image/jpeg" });
    setSelectedFile(file);
    closeCamera();
  }, "image/jpeg", 0.92);
}

/* ---------- Init ---------- */
document.addEventListener("DOMContentLoaded", () => {
  const scannerZone = document.getElementById("scannerZone");
  const fileInput = document.getElementById("scannerFileInput");

  document.getElementById("uploadImageBtn").addEventListener("click", () => fileInput.click());
  scannerZone.addEventListener("click", (e) => {
    if (e.target.closest(".scanner-remove")) return;
    if (!selectedFile) fileInput.click();
  });
  fileInput.addEventListener("change", (e) => setSelectedFile(e.target.files[0]));

  scannerZone.addEventListener("dragover", (e) => { e.preventDefault(); scannerZone.classList.add("drag-over"); });
  scannerZone.addEventListener("dragleave", () => scannerZone.classList.remove("drag-over"));
  scannerZone.addEventListener("drop", (e) => {
    e.preventDefault();
    scannerZone.classList.remove("drag-over");
    if (e.dataTransfer.files[0]) setSelectedFile(e.dataTransfer.files[0]);
  });

  document.getElementById("scannerRemoveBtn").addEventListener("click", (e) => {
    e.stopPropagation();
    clearSelectedFile();
  });

  document.getElementById("recognizeBtn").addEventListener("click", recognizeFace);

  document.getElementById("cameraBtn").addEventListener("click", openCamera);
  document.getElementById("cancelCameraBtn").addEventListener("click", closeCamera);
  document.getElementById("captureBtn").addEventListener("click", captureFromCamera);
});

window.addEventListener("beforeunload", closeCamera);
