const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, "data");
const DB_FILE = path.join(DATA_DIR, "attendance.json");

app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify({
    students: [
      { id: "STU001", name: "Aarav Sharma", course: "Computer Science" },
      { id: "STU002", name: "Diya Patel", course: "Computer Science" },
      { id: "STU003", name: "Kabir Rao", course: "Information Technology" },
      { id: "STU004", name: "Ananya Singh", course: "Information Technology" },
      { id: "STU005", name: "Ishaan Kumar", course: "Computer Science" }
    ],
    records: []
  }, null, 2));
}

function readData() {
  return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
}
function writeData(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}
function validDate(date) {
  return /^\d{4}-\d{2}-\d{2}$/.test(date);
}

app.get("/api/data", (req, res) => res.json(readData()));

app.post("/api/students", (req, res) => {
  const { id, name, course } = req.body || {};
  if (!id || !name || !course) return res.status(400).json({ error: "ID, name and course are required." });
  const data = readData();
  if (data.students.some(s => s.id.toLowerCase() === String(id).trim().toLowerCase())) {
    return res.status(409).json({ error: "That student ID already exists." });
  }
  data.students.push({ id: String(id).trim(), name: String(name).trim(), course: String(course).trim() });
  writeData(data);
  res.status(201).json({ ok: true });
});

app.post("/api/attendance", (req, res) => {
  const { studentId, date, status } = req.body || {};
  if (!studentId || !validDate(date) || !["Present", "Absent", "Late"].includes(status)) {
    return res.status(400).json({ error: "A valid student, date and status are required." });
  }
  const data = readData();
  if (!data.students.some(s => s.id === studentId)) return res.status(404).json({ error: "Student not found." });
  const existing = data.records.findIndex(r => r.studentId === studentId && r.date === date);
  const record = { studentId, date, status, updatedAt: new Date().toISOString() };
  if (existing >= 0) data.records[existing] = record;
  else data.records.push(record);
  writeData(data);
  res.json({ ok: true, record });
});

app.post("/api/import", (req, res) => {
  const { rows } = req.body || {};
  if (!Array.isArray(rows)) return res.status(400).json({ error: "Expected a rows array." });
  const data = readData();
  let imported = 0, skipped = 0;
  for (const row of rows) {
    const studentId = String(row.studentId || row.id || "").trim();
    const date = String(row.date || "").trim();
    const status = String(row.status || "").trim();
    if (!data.students.some(s => s.id === studentId) || !validDate(date) || !["Present", "Absent", "Late"].includes(status)) {
      skipped++; continue;
    }
    const idx = data.records.findIndex(r => r.studentId === studentId && r.date === date);
    const record = { studentId, date, status, updatedAt: new Date().toISOString() };
    if (idx >= 0) data.records[idx] = record; else data.records.push(record);
    imported++;
  }
  writeData(data);
  res.json({ imported, skipped });
});

app.get("/api/export", (req, res) => {
  const data = readData();
  const header = ["studentId", "studentName", "course", "date", "status"];
  const lines = [header.join(",")];
  for (const r of data.records) {
    const s = data.students.find(x => x.id === r.studentId);
    const values = [r.studentId, s?.name || "", s?.course || "", r.date, r.status];
    lines.push(values.map(v => `"${String(v).replace(/"/g, '""')}"`).join(","));
  }
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="attendance-report.csv"');
  res.send(lines.join("\n"));
});

app.delete("/api/students/:id", (req, res) => {
  const data = readData();
  data.students = data.students.filter(s => s.id !== req.params.id);
  data.records = data.records.filter(r => r.studentId !== req.params.id);
  writeData(data);
  res.json({ ok: true });
});

app.get("*", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

app.listen(PORT, () => console.log(`Smart Attendance Analyzer running at http://localhost:${PORT}`));