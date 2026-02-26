const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

function hashPassword(p) { return crypto.createHash('sha256').update(p + 'lumina_salt_2026').digest('hex'); }
function generateToken() { return crypto.randomBytes(32).toString('hex'); }

// ── DATA ──────────────────────────────────────────────────────────────────────
let users = [
  { id:1, name:'Demo Student', email:'demo@lumina.edu', password:hashPassword('demo123'), role:'student', createdAt:new Date().toISOString(), avatar:'DS' },
  { id:2, name:'Admin', email:'admin@lumina.edu', password:hashPassword('admin123'), role:'admin', createdAt:new Date().toISOString(), avatar:'AD' }
];
let sessions = {};
let nextUserId = 3;

let courses = [
  { id:1, title:"Mathematics Mastery", category:"Math", instructor:"Dr. Aisha Patel", level:"Beginner", students:1240, rating:4.9, duration:"12 weeks", price:0, image:"math", description:"Build rock-solid foundations in algebra, geometry, and calculus through interactive problem solving.", lessons:["Number Systems","Algebra Basics","Geometry","Trigonometry","Calculus Introduction"] },
  { id:2, title:"Python for Everyone", category:"Programming", instructor:"Prof. James Carter", level:"Beginner", students:3580, rating:4.8, duration:"8 weeks", price:0, image:"code", description:"Learn programming from scratch using Python — the world's most beginner-friendly language.", lessons:["Hello World","Variables & Types","Control Flow","Functions","OOP Basics","Projects"] },
  { id:3, title:"World History: Ancient to Modern", category:"History", instructor:"Dr. Fatima Al-Hassan", level:"Intermediate", students:890, rating:4.7, duration:"10 weeks", price:0, image:"history", description:"Journey through civilizations, revolutions, and the forces that shaped our modern world.", lessons:["Ancient Civilizations","Medieval Era","Renaissance","Industrial Revolution","Modern World"] },
  { id:4, title:"Biology & Life Sciences", category:"Science", instructor:"Dr. Lucas Mendes", level:"Intermediate", students:1100, rating:4.6, duration:"14 weeks", price:0, image:"biology", description:"From cells to ecosystems, explore the living world through experiments and discovery.", lessons:["Cell Biology","Genetics","Evolution","Ecology","Human Anatomy","Microbiology"] },
  { id:5, title:"Creative Writing Workshop", category:"English", instructor:"Maya Thompson", level:"All Levels", students:2100, rating:4.9, duration:"6 weeks", price:0, image:"writing", description:"Unlock your voice and craft compelling stories, essays, and poetry with expert guidance.", lessons:["Finding Your Voice","Narrative Structure","Character Development","Poetry","Editing"] },
  { id:6, title:"Physics: Forces & Motion", category:"Science", instructor:"Prof. Yuki Tanaka", level:"Advanced", students:670, rating:4.8, duration:"12 weeks", price:0, image:"physics", description:"Deep-dive into Newtonian mechanics, thermodynamics, and the laws governing our universe.", lessons:["Kinematics","Newton's Laws","Energy","Waves","Thermodynamics","Quantum Intro"] }
];

let enrollments = [];
let messages = [];

// ── MIDDLEWARE ────────────────────────────────────────────────────────────────
function authRequired(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token || !sessions[token]) return res.status(401).json({ success:false, message:'Please log in to continue.' });
  const user = users.find(u => u.id === sessions[token]);
  if (!user) return res.status(401).json({ success:false, message:'Session expired.' });
  req.user = user;
  next();
}

function adminRequired(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token || !sessions[token]) return res.status(401).json({ success:false, message:'Authentication required.' });
  const user = users.find(u => u.id === sessions[token]);
  if (!user || user.role !== 'admin') return res.status(403).json({ success:false, message:'Admin access required.' });
  req.user = user;
  next();
}

// ── AUTH ──────────────────────────────────────────────────────────────────────
app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ success:false, message:'All fields are required.' });
  if (password.length < 6) return res.status(400).json({ success:false, message:'Password must be at least 6 characters.' });
  if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) return res.status(409).json({ success:false, message:'An account with this email already exists.' });
  const user = { id:nextUserId++, name:name.trim(), email:email.toLowerCase().trim(), password:hashPassword(password), role:'student', createdAt:new Date().toISOString(), avatar:name.trim().split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2) };
  users.push(user);
  const token = generateToken();
  sessions[token] = user.id;
  res.status(201).json({ success:true, message:`Welcome to Lumina, ${user.name}!`, token, user:{ id:user.id, name:user.name, email:user.email, role:user.role, avatar:user.avatar } });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ success:false, message:'Email and password are required.' });
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user || user.password !== hashPassword(password)) return res.status(401).json({ success:false, message:'Invalid email or password.' });
  const token = generateToken();
  sessions[token] = user.id;
  res.json({ success:true, message:`Welcome back, ${user.name}!`, token, user:{ id:user.id, name:user.name, email:user.email, role:user.role, avatar:user.avatar } });
});

app.post('/api/auth/logout', authRequired, (req, res) => {
  delete sessions[req.headers.authorization?.replace('Bearer ', '')];
  res.json({ success:true, message:'Logged out.' });
});

app.get('/api/auth/me', authRequired, (req, res) => {
  const u = req.user;
  res.json({ success:true, user:{ id:u.id, name:u.name, email:u.email, role:u.role, avatar:u.avatar, createdAt:u.createdAt }, enrollments:enrollments.filter(e=>e.userId===u.id) });
});

app.put('/api/auth/profile', authRequired, (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ success:false, message:'Name required.' });
  req.user.name = name.trim();
  req.user.avatar = name.trim().split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2);
  res.json({ success:true, message:'Profile updated!', user:{ id:req.user.id, name:req.user.name, email:req.user.email, avatar:req.user.avatar } });
});

// ── COURSES ───────────────────────────────────────────────────────────────────
app.get('/api/courses', (req, res) => {
  const { category, search } = req.query;
  let result = [...courses];
  if (category && category !== 'All') result = result.filter(c => c.category === category);
  if (search) result = result.filter(c => c.title.toLowerCase().includes(search.toLowerCase()) || c.description.toLowerCase().includes(search.toLowerCase()));
  res.json({ success:true, count:result.length, courses:result });
});

app.get('/api/courses/:id', (req, res) => {
  const course = courses.find(c => c.id === parseInt(req.params.id));
  if (!course) return res.status(404).json({ success:false, message:'Course not found' });
  res.json({ success:true, course });
});

// ── ENROLLMENT ────────────────────────────────────────────────────────────────
app.post('/api/enroll', authRequired, (req, res) => {
  const { courseId } = req.body;
  const course = courses.find(c => c.id === parseInt(courseId));
  if (!course) return res.status(404).json({ success:false, message:'Course not found.' });
  if (enrollments.find(e => e.userId === req.user.id && e.courseId === parseInt(courseId))) return res.status(409).json({ success:false, message:'Already enrolled in this course.' });
  const e = { id:enrollments.length+1, userId:req.user.id, studentName:req.user.name, email:req.user.email, courseId:parseInt(courseId), courseName:course.title, enrolledAt:new Date().toISOString(), progress:0 };
  enrollments.push(e);
  course.students++;
  res.status(201).json({ success:true, enrollment:e, message:`Successfully enrolled in ${course.title}!` });
});

app.get('/api/enrollments', authRequired, (req, res) => {
  res.json({ success:true, enrollments:enrollments.filter(e=>e.userId===req.user.id) });
});

// ── QUIZ ──────────────────────────────────────────────────────────────────────
const quizzes = {
  math:{ title:"Mathematics Quiz", questions:[{id:1,q:"What is 15% of 200?",options:["25","30","35","40"],answer:1},{id:2,q:"Solve: 3x + 7 = 22",options:["x=3","x=4","x=5","x=6"],answer:2},{id:3,q:"Area of circle with radius 5?",options:["25π","10π","5π","50π"],answer:0},{id:4,q:"What is √144?",options:["11","12","13","14"],answer:1},{id:5,q:"What is 2³ × 2²?",options:["16","32","64","128"],answer:1}]},
  science:{ title:"Science Quiz", questions:[{id:1,q:"Powerhouse of the cell?",options:["Nucleus","Ribosome","Mitochondria","Golgi"],answer:2},{id:2,q:"Chemical formula for water?",options:["H2O2","HO","H2O","H3O"],answer:2},{id:3,q:"Planets in our solar system?",options:["7","8","9","10"],answer:1},{id:4,q:"Gas plants absorb for photosynthesis?",options:["Oxygen","Nitrogen","CO2","Hydrogen"],answer:2},{id:5,q:"Boiling point of water (°C)?",options:["90","95","100","110"],answer:2}]}
};

app.get('/api/quiz/:subject', (req, res) => {
  const quiz = quizzes[req.params.subject];
  if (!quiz) return res.status(404).json({ success:false, message:'Quiz not found' });
  res.json({ success:true, quiz:{ ...quiz, questions:quiz.questions.map(({answer,...q})=>q) } });
});

app.post('/api/quiz/:subject/submit', (req, res) => {
  const quiz = quizzes[req.params.subject];
  if (!quiz) return res.status(404).json({ success:false, message:'Quiz not found' });
  const { answers } = req.body;
  let score = 0;
  const results = quiz.questions.map((q,i) => { const ok=answers[i]===q.answer; if(ok)score++; return{question:q.q,yourAnswer:q.options[answers[i]],correctAnswer:q.options[q.answer],correct:ok}; });
  const pct = Math.round((score/quiz.questions.length)*100);
  res.json({ success:true, score, total:quiz.questions.length, percentage:pct, grade:pct>=90?'A':pct>=80?'B':pct>=70?'C':pct>=60?'D':'F', results });
});

// ── CONTACT ───────────────────────────────────────────────────────────────────
app.post('/api/contact', (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!name||!email||!message) return res.status(400).json({ success:false, message:'Name, email and message required' });
  messages.push({ id:messages.length+1, name, email, subject:subject||'(no subject)', message, receivedAt:new Date().toISOString(), read:false });
  res.json({ success:true, message:"Message received! We'll get back to you within 24 hours." });
});

// ── STATS ─────────────────────────────────────────────────────────────────────
app.get('/api/stats', (req, res) => {
  res.json({ success:true, stats:{ totalCourses:courses.length, totalStudents:courses.reduce((s,c)=>s+c.students,0), totalUsers:users.length, totalEnrollments:enrollments.length, categories:[...new Set(courses.map(c=>c.category))].length, avgRating:(courses.reduce((s,c)=>s+c.rating,0)/courses.length).toFixed(1) } });
});

// ── ADMIN ROUTES ──────────────────────────────────────────────────────────────

// Overview stats
app.get('/api/admin/stats', adminRequired, (req, res) => {
  res.json({ success:true, stats:{
    totalUsers: users.filter(u=>u.role==='student').length,
    totalEnrollments: enrollments.length,
    totalMessages: messages.length,
    unreadMessages: messages.filter(m=>!m.read).length,
    totalCourses: courses.length,
    popularCourse: courses.reduce((a,b) => enrollments.filter(e=>e.courseId===b.id).length > enrollments.filter(e=>e.courseId===a.id).length ? b : a, courses[0])?.title || 'N/A'
  }});
});

// All users
app.get('/api/admin/users', adminRequired, (req, res) => {
  const result = users
    .filter(u => u.role !== 'admin')
    .map(({ password, ...u }) => ({ ...u, enrollmentCount: enrollments.filter(e=>e.userId===u.id).length }));
  res.json({ success:true, count:result.length, users:result });
});

// Delete user
app.delete('/api/admin/users/:id', adminRequired, (req, res) => {
  const id = parseInt(req.params.id);
  if (id === req.user.id) return res.status(400).json({ success:false, message:"Can't delete yourself." });
  const idx = users.findIndex(u=>u.id===id);
  if (idx===-1) return res.status(404).json({ success:false, message:'User not found.' });
  users.splice(idx,1);
  enrollments = enrollments.filter(e=>e.userId!==id);
  res.json({ success:true, message:'User deleted.' });
});

// All enrollments (detailed)
app.get('/api/admin/enrollments', adminRequired, (req, res) => {
  const detailed = enrollments.map(e => {
    const user = users.find(u=>u.id===e.userId);
    return { ...e, userName:user?.name||'Deleted', userEmail:user?.email||'—' };
  });
  res.json({ success:true, count:detailed.length, enrollments:detailed });
});

// Per-course enrollment breakdown
app.get('/api/admin/courses/stats', adminRequired, (req, res) => {
  const stats = courses.map(c => ({
    ...c,
    enrollmentCount: enrollments.filter(e=>e.courseId===c.id).length,
    enrolledUsers: enrollments.filter(e=>e.courseId===c.id).map(e => {
      const user = users.find(u=>u.id===e.userId);
      return { id:e.id, name:user?.name||'Deleted', email:user?.email||'—', enrolledAt:e.enrolledAt };
    })
  }));
  res.json({ success:true, courses:stats });
});

// Messages
app.get('/api/admin/messages', adminRequired, (req, res) => {
  res.json({ success:true, count:messages.length, messages:[...messages].reverse() });
});

app.patch('/api/admin/messages/:id/read', adminRequired, (req, res) => {
  const msg = messages.find(m=>m.id===parseInt(req.params.id));
  if (!msg) return res.status(404).json({ success:false, message:'Not found.' });
  msg.read = true;
  res.json({ success:true });
});

app.delete('/api/admin/messages/:id', adminRequired, (req, res) => {
  messages = messages.filter(m=>m.id!==parseInt(req.params.id));
  res.json({ success:true, message:'Message deleted.' });
});

// ── CATCH ALL ─────────────────────────────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n🎓 Lumina running at http://localhost:${PORT}`);
  console.log('Student demo : demo@lumina.edu  / demo123');
  console.log('Admin access : admin@lumina.edu / admin123\n');
});
