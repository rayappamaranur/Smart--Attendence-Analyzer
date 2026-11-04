# Smart Attendance Analyzer

A responsive full-stack attendance management project built with **Node.js, Express, HTML, CSS and JavaScript**. It lets an administrator manage a student list, record daily attendance, and review class-level attendance insights.

## Features

- Dashboard with student count, present/absent counts and overall attendance rate
- Mark students as **Present**, **Absent** or **Late** for a selected date
- Add and remove students
- Search students by name or ID and filter by attendance status
- Export attendance records as a CSV report
- JSON file storage (no database installation required)
- Responsive layout for desktop, tablet and mobile

## Requirements

- Node.js 18 or newer
- npm

## Run locally

1. Download and extract this repository.
2. Open a terminal in the project folder.
3. Install dependencies:

   ```bash
   npm install
   ```

4. Start the server:

   ```bash
   npm start
   ```

5. Open **http://localhost:3000** in your browser.

The first run creates `data/attendance.json` with sample students. Attendance changes are saved to that file.

## CSV export

Use the **Export CSV** button in the dashboard. The downloaded file contains student ID, name, course, date and attendance status.

## Deploy

This project can be deployed to Render or another Node.js host.

### Render

1. Push this project to a GitHub repository.
2. In Render, create a **New Web Service** and connect the repository.
3. Set **Build Command** to `npm install`.
4. Set **Start Command** to `npm start`.
5. Deploy.

**Persistence note:** The default JSON file is suitable for a learning/demo project. On hosting platforms with an ephemeral filesystem, records may reset on redeploy/restart. For a production deployment, connect a persistent disk or replace JSON storage with PostgreSQL/MongoDB.

## API routes

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/data` | Get students and attendance records |
| POST | `/api/students` | Add a student |
| DELETE | `/api/students/:id` | Remove a student and their records |
| POST | `/api/attendance` | Create/update a daily attendance record |
| POST | `/api/import` | Import validated attendance rows |
| GET | `/api/export` | Download attendance CSV |

### Attendance import payload

`POST /api/import` accepts JSON:

```json
{
  "rows": [
    { "studentId": "STU001", "date": "2026-11-04", "status": "Present" }
  ]
}
```

## Project structure

```text
smart-attendance-analyzer/
├── data/
│   └── attendance.json
├── public/
│   ├── app.js
│   ├── index.html
│   └── styles.css
├── package.json
├── server.js
└── README.md
```

## Future improvements

- User authentication and role-based access
- PostgreSQL database and audit history
- Excel import and downloadable PDF reports
- Course-wise and monthly analytics
- Notifications for low attendance

## Author

**Your Name** — update this line before publishing.

## License

MIT
