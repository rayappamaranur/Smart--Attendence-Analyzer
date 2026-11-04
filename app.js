const $ = (id) => document.getElementById(id);
let appData = { students: [], records: [] };
const today = new Date();
const localDate = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
$("attendanceDate").value = localDate;
$("todayLabel").textContent = today.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" });

async function api(url, options = {}) {
  const response = await fetch(url, { headers: { "Content-Type": "application/json" }, ...options });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Something went wrong.");
  return data;
}
const recordFor = (id, date) => appData.records.find(r => r.studentId === id && r.date === date);
function initials(name) { return name.split(/\s+/).slice(0,2).map(p => p[0]).join("").toUpperCase(); }
function escapeHtml(value) { return String(value).replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c])); }

async function load() {
  try { appData = await api("/api/data"); render(); }
  catch (error) { alert(error.message); }
}
function render() {
  const date = $("attendanceDate").value;
  const todayRecords = appData.records.filter(r => r.date === date);
  const counts = { Present: 0, Absent: 0, Late: 0 };
  todayRecords.forEach(r => counts[r.status]++);
  const total = appData.records.length;
  const attended = appData.records.filter(r => r.status === "Present" || r.status === "Late").length;
  const rate = total ? Math.round(attended / total * 100) : 0;
  $("totalStudents").textContent = appData.students.length;
  $("presentToday").textContent = counts.Present;
  $("absentToday").textContent = counts.Absent;
  $("presentSub").textContent = `${counts.Late} late · ${Math.max(0, appData.students.length - todayRecords.length)} not marked`;
  $("attendanceRate").textContent = `${rate}%`;
  $("donutValue").textContent = `${rate}%`;
  $("donut").style.background = `conic-gradient(#159b72 ${rate*3.6}deg, #e9edf3 0deg)`;
  $("legendPresent").textContent = appData.records.filter(r => r.status === "Present").length;
  $("legendAbsent").textContent = appData.records.filter(r => r.status === "Absent").length;
  $("legendLate").textContent = appData.records.filter(r => r.status === "Late").length;
  $("insightText").textContent = total ? (rate >= 90 ? "Excellent consistency. Keep supporting this positive attendance trend." : rate >= 75 ? "Attendance is progressing. Follow up with students who have repeated absences." : "Consider checking in with students to understand attendance barriers.") : "Start marking attendance to see class insights here.";
  renderTable(); renderStudents();
}
function renderTable() {
  const date = $("attendanceDate").value;
  const search = $("searchInput").value.toLowerCase();
  const filter = $("statusFilter").value;
  const rows = appData.students.filter(s => {
    const r = recordFor(s.id, date), status = r?.status || "Not marked";
    return (s.name.toLowerCase().includes(search) || s.id.toLowerCase().includes(search)) && (filter === "All" || filter === status);
  });
  $("attendanceTable").innerHTML = rows.map(s => {
    const status = recordFor(s.id, date)?.status || "Not marked";
    return `<tr><td><div class="student-cell"><span class="mini-avatar">${escapeHtml(initials(s.name))}</span><span>${escapeHtml(s.name)}<br><small style="color:#9aa4b3;font-weight:500">${escapeHtml(s.id)}</small></span></div></td><td>${escapeHtml(s.course)}</td><td><span class="status ${status === "Not marked" ? "Unmarked" : status}">${status}</span></td><td><select class="action-select" data-student="${escapeHtml(s.id)}" aria-label="Set attendance for ${escapeHtml(s.name)}"><option value="">Update</option><option>Present</option><option>Absent</option><option>Late</option></select></td></tr>`;
  }).join("") || `<tr><td colspan="4" style="text-align:center;padding:25px;color:#9aa4b3">No matching students found.</td></tr>`;
  $("tableNote").textContent = `${rows.length} student${rows.length === 1 ? "" : "s"} shown · Changes are saved automatically`;
}
function renderStudents() {
  $("studentList").innerHTML = appData.students.map(s => `<div class="student-item"><span class="mini-avatar">${escapeHtml(initials(s.name))}</span><div class="student-meta"><strong>${escapeHtml(s.name)}</strong><small>${escapeHtml(s.id)} · ${escapeHtml(s.course)}</small></div><button class="remove-btn" data-remove="${escapeHtml(s.id)}" title="Remove student" aria-label="Remove ${escapeHtml(s.name)}">×</button></div>`).join("") || "<p>No students yet. Add your first student.</p>";
}
$("attendanceTable").addEventListener("change", async e => {
  if (!e.target.matches("[data-student]") || !e.target.value) return;
  try {
    await api("/api/attendance", { method:"POST", body:JSON.stringify({ studentId:e.target.dataset.student, date:$("attendanceDate").value, status:e.target.value }) });
    await load();
  } catch (error) { alert(error.message); }
});
$("studentList").addEventListener("click", async e => {
  const id = e.target.dataset.remove;
  if (!id || !confirm(`Remove student ${id} and their attendance records?`)) return;
  try { await api(`/api/students/${encodeURIComponent(id)}`, { method:"DELETE" }); await load(); }
  catch (error) { alert(error.message); }
});
$("attendanceDate").addEventListener("change", render);
$("searchInput").addEventListener("input", renderTable);
$("statusFilter").addEventListener("change", renderTable);
$("exportBtn").addEventListener("click", () => { window.location.href = "/api/export"; });
$("quickMark").addEventListener("click", () => { $("attendance").scrollIntoView({ behavior:"smooth" }); $("searchInput").focus(); });
$("addStudentBtn").addEventListener("click", () => { $("formError").textContent = ""; $("studentDialog").showModal(); });
$("closeDialog").addEventListener("click", () => $("studentDialog").close());
$("studentForm").addEventListener("submit", async e => {
  e.preventDefault();
  const form = new FormData(e.target), body = Object.fromEntries(form.entries());
  try {
    await api("/api/students", { method:"POST", body:JSON.stringify(body) });
    e.target.reset(); $("studentDialog").close(); await load();
  } catch (error) { $("formError").textContent = error.message; }
});
load();