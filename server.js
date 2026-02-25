const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── In-memory data store ─────────────────────────────────────────────────────
let courses = [
  {
    id: 1, title: "Mathematics Mastery", category: "Math",
    instructor: "Dr. Aisha Patel", level: "Beginner",
    students: 1240, rating: 4.9, duration: "12 weeks",
    price: 0, image: "math",
    description: "Build rock-solid foundations in algebra, geometry, and calculus through interactive problem solving.",
    lessons: ["Number Systems", "Algebra Basics", "Geometry", "Trigonometry", "Calculus Introduction"]
  },
  {
    id: 2, title: "Python for Everyone", category: "Programming",
    instructor: "Prof. James Carter", level: "Beginner",
    students: 3580, rating: 4.8, duration: "8 weeks",
    price: 0, image: "code",
    description: "Learn programming from scratch using Python — the world's most beginner-friendly language.",
    lessons: ["Hello World", "Variables & Types", "Control Flow", "Functions", "OOP Basics", "Projects"]
  },
  {
    id: 3, title: "World History: Ancient to Modern", category: "History",
    instructor: "Dr. Fatima Al-Hassan", level: "Intermediate",
    students: 890, rating: 4.7, duration: "10 weeks",
    price: 0, image: "history",
    description: "Journey through civilizations, revolutions, and the forces that shaped our modern world.",
    lessons: ["Ancient Civilizations", "Medieval Era", "Renaissance", "Industrial Revolution", "Modern World"]
  },
  {
    id: 4, title: "Biology & Life Sciences", category: "Science",
    instructor: "Dr. Lucas Mendes", level: "Intermediate",
    students: 1100, rating: 4.6, duration: "14 weeks",
    price: 0, image: "biology",
    description: "From cells to ecosystems, explore the living world through experiments and discovery.",
    lessons: ["Cell Biology", "Genetics", "Evolution", "Ecology", "Human Anatomy", "Microbiology"]
  },
  {
    id: 5, title: "Creative Writing Workshop", category: "English",
    instructor: "Maya Thompson", level: "All Levels",
    students: 2100, rating: 4.9, duration: "6 weeks",
    price: 0, image: "writing",
    description: "Unlock your voice and craft compelling stories, essays, and poetry with expert guidance.",
    lessons: ["Finding Your Voice", "Narrative Structure", "Character Development", "Poetry", "Editing"]
  },
  {
    id: 6, title: "Physics: Forces & Motion", category: "Science",
    instructor: "Prof. Yuki Tanaka", level: "Advanced",
    students: 670, rating: 4.8, duration: "12 weeks",
    price: 0, image: "physics",
    description: "Deep-dive into Newtonian mechanics, thermodynamics, and the laws governing our universe.",
    lessons: ["Kinematics", "Newton's Laws", "Energy", "Waves", "Thermodynamics", "Quantum Intro"]
  }
];

let enrollments = [];
let messages = [];
let quizResults = [];

let nextId = 7;

// ─── COURSES API ──────────────────────────────────────────────────────────────
app.get('/api/courses', (req, res) => {
  const { category, search } = req.query;
  let result = [...courses];
  if (category && category !== 'All') result = result.filter(c => c.category === category);
  if (search) result = result.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.description.toLowerCase().includes(search.toLowerCase())
  );
  res.json({ success: true, count: result.length, courses: result });
});

app.get('/api/courses/:id', (req, res) => {
  const course = courses.find(c => c.id === parseInt(req.params.id));
  if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
  res.json({ success: true, course });
});

app.post('/api/courses', (req, res) => {
  const { title, category, instructor, level, duration, description } = req.body;
  if (!title || !category) return res.status(400).json({ success: false, message: 'Title and category required' });
  const course = { id: nextId++, title, category, instructor: instructor || 'TBD', level: level || 'Beginner',
    students: 0, rating: 0, duration: duration || 'TBD', price: 0, image: 'default',
    description: description || '', lessons: [] };
  courses.push(course);
  res.status(201).json({ success: true, course });
});

// ─── ENROLLMENT API ───────────────────────────────────────────────────────────
app.post('/api/enroll', (req, res) => {
  const { studentName, email, courseId } = req.body;
  if (!studentName || !email || !courseId) return res.status(400).json({ success: false, message: 'All fields required' });
  const course = courses.find(c => c.id === parseInt(courseId));
  if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
  const existing = enrollments.find(e => e.email === email && e.courseId === parseInt(courseId));
  if (existing) return res.status(409).json({ success: false, message: 'Already enrolled in this course' });
  const enrollment = { id: enrollments.length + 1, studentName, email, courseId: parseInt(courseId),
    courseName: course.title, enrolledAt: new Date().toISOString(), progress: 0 };
  enrollments.push(enrollment);
  course.students++;
  res.status(201).json({ success: true, enrollment, message: `Successfully enrolled in ${course.title}!` });
});

app.get('/api/enrollments', (req, res) => {
  const { email } = req.query;
  let result = email ? enrollments.filter(e => e.email === email) : enrollments;
  res.json({ success: true, count: result.length, enrollments: result });
});

// ─── QUIZ API ─────────────────────────────────────────────────────────────────
const quizzes = {
  math: {
    title: "Math Quick Quiz",
    questions: [
      { id: 1, q: "What is 15% of 200?", options: ["25", "30", "35", "40"], answer: 1 },
      { id: 2, q: "Solve: 3x + 7 = 22", options: ["x = 3", "x = 4", "x = 5", "x = 6"], answer: 2 },
      { id: 3, q: "What is the area of a circle with radius 5?", options: ["25π", "10π", "5π", "50π"], answer: 0 },
      { id: 4, q: "What is √144?", options: ["11", "12", "13", "14"], answer: 1 },
      { id: 5, q: "What is 2³ × 2²?", options: ["16", "32", "64", "128"], answer: 1 }
    ]
  },
  science: {
    title: "Science Quick Quiz",
    questions: [
      { id: 1, q: "What is the powerhouse of the cell?", options: ["Nucleus", "Ribosome", "Mitochondria", "Golgi"], answer: 2 },
      { id: 2, q: "What is the chemical formula for water?", options: ["H2O2", "HO", "H2O", "H3O"], answer: 2 },
      { id: 3, q: "How many planets are in our solar system?", options: ["7", "8", "9", "10"], answer: 1 },
      { id: 4, q: "What gas do plants absorb for photosynthesis?", options: ["Oxygen", "Nitrogen", "CO2", "Hydrogen"], answer: 2 },
      { id: 5, q: "At what temperature does water boil (°C)?", options: ["90", "95", "100", "110"], answer: 2 }
    ]
  }
};

app.get('/api/quiz/:subject', (req, res) => {
  const quiz = quizzes[req.params.subject];
  if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });
  const safeQ = quiz.questions.map(({ answer, ...q }) => q);
  res.json({ success: true, quiz: { ...quiz, questions: safeQ } });
});

app.post('/api/quiz/:subject/submit', (req, res) => {
  const quiz = quizzes[req.params.subject];
  if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });
  const { answers, studentName } = req.body;
  let score = 0;
  const results = quiz.questions.map((q, i) => {
    const correct = answers[i] === q.answer;
    if (correct) score++;
    return { question: q.q, yourAnswer: q.options[answers[i]], correctAnswer: q.options[q.answer], correct };
  });
  const pct = Math.round((score / quiz.questions.length) * 100);
  quizResults.push({ studentName, subject: req.params.subject, score: pct, date: new Date().toISOString() });
  res.json({ success: true, score, total: quiz.questions.length, percentage: pct,
    grade: pct >= 90 ? 'A' : pct >= 80 ? 'B' : pct >= 70 ? 'C' : pct >= 60 ? 'D' : 'F', results });
});

// ─── CONTACT API ──────────────────────────────────────────────────────────────
app.post('/api/contact', (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !message) return res.status(400).json({ success: false, message: 'Name, email and message required' });
  messages.push({ id: messages.length + 1, name, email, subject, message, receivedAt: new Date().toISOString() });
  res.json({ success: true, message: 'Message received! We\'ll get back to you within 24 hours.' });
});

// ─── STATS API ────────────────────────────────────────────────────────────────
app.get('/api/stats', (req, res) => {
  res.json({
    success: true,
    stats: {
      totalCourses: courses.length,
      totalStudents: courses.reduce((s, c) => s + c.students, 0),
      totalEnrollments: enrollments.length,
      categories: [...new Set(courses.map(c => c.category))].length,
      avgRating: (courses.reduce((s, c) => s + c.rating, 0) / courses.length).toFixed(1)
    }
  });
});

// ─── Catch-all: serve frontend ────────────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n🎓 EduSite running at http://localhost:${PORT}\n`);
  console.log('API Endpoints:');
  console.log('  GET    /api/courses          - List all courses');
  console.log('  GET    /api/courses/:id      - Get course by ID');
  console.log('  POST   /api/courses          - Create course');
  console.log('  POST   /api/enroll           - Enroll in course');
  console.log('  GET    /api/enrollments      - List enrollments');
  console.log('  GET    /api/quiz/:subject    - Get quiz (math/science)');
  console.log('  POST   /api/quiz/:subject/submit - Submit quiz');
  console.log('  POST   /api/contact          - Send message');
  console.log('  GET    /api/stats            - Platform stats\n');
});
