# 🎓 Lumina — Full-Stack Education Website

A complete, production-ready education platform with a beautiful frontend and a Node.js/Express backend.

---

## 🚀 Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Run the server
```bash
node server.js
# or for auto-reload:
npx nodemon server.js
```

### 3. Open your browser
```
http://localhost:3000
```

---

## 📁 Project Structure
```
edusite/
├── server.js          ← Express backend (API + static file server)
├── package.json
└── public/
    └── index.html     ← Full frontend (HTML + CSS + JS)
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/courses` | List all courses (filter by `?category=Math&search=`) |
| GET | `/api/courses/:id` | Get single course details |
| POST | `/api/courses` | Create a new course |
| POST | `/api/enroll` | Enroll a student in a course |
| GET | `/api/enrollments` | List enrollments (filter by `?email=`) |
| GET | `/api/quiz/math` | Get math quiz questions |
| GET | `/api/quiz/science` | Get science quiz questions |
| POST | `/api/quiz/math/submit` | Submit quiz answers |
| POST | `/api/quiz/science/submit` | Submit quiz answers |
| POST | `/api/contact` | Send a contact message |
| GET | `/api/stats` | Platform statistics |

---

## 🎨 Features

### Frontend
- **Home page** — Hero section with animated floating cards, live stats
- **Courses page** — Filterable course grid with search, category filters
- **Course modal** — Full course details + enrollment form
- **Quiz system** — Multi-question quizzes with instant scoring & review
- **Contact page** — Message form with validation

### Backend (REST API)
- Course management (CRUD)
- Student enrollment with duplicate detection
- Quiz engine with server-side answer validation
- Contact message storage
- Platform statistics

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vanilla HTML/CSS/JS (no framework needed) |
| Backend | Node.js + Express |
| Data | In-memory (replace with PostgreSQL/MongoDB for production) |
| Fonts | Google Fonts (Playfair Display + DM Sans) |

---

## 🔧 Adding a Database

The in-memory arrays in `server.js` can be swapped for a real database:

```js
// Example: swap in-memory courses array for MongoDB
const Course = require('./models/Course');
app.get('/api/courses', async (req, res) => {
  const courses = await Course.find();
  res.json({ success: true, courses });
});
```

---

## 📝 Example API Calls

```bash
# Get all courses
curl http://localhost:3000/api/courses

# Enroll in a course
curl -X POST http://localhost:3000/api/enroll \
  -H "Content-Type: application/json" \
  -d '{"studentName":"Jane Doe","email":"jane@example.com","courseId":1}'

# Submit a quiz
curl -X POST http://localhost:3000/api/quiz/math/submit \
  -H "Content-Type: application/json" \
  -d '{"studentName":"Jane","answers":[1,2,0,1,1]}'
```
