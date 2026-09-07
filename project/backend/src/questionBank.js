const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '../data/all_questions.json');

let questions = [];
try {
  questions = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
} catch (err) {
  console.error('Could not load question bank at', DATA_PATH, err.message);
}

const byId = new Map(questions.map((q) => [q.id, q]));

function listSubjects() {
  const counts = {};
  for (const q of questions) {
    counts[q.subject] = (counts[q.subject] || 0) + 1;
  }
  return Object.entries(counts)
    .map(([subject, count]) => ({ subject, count }))
    .sort((a, b) => a.subject.localeCompare(b.subject));
}

function getQuestions({ subject, examtype, examyear, limit = 20 }) {
  let pool = questions;
  if (subject) pool = pool.filter((q) => q.subject === subject.toLowerCase());
  if (examtype) pool = pool.filter((q) => q.examtype.toLowerCase() === examtype.toLowerCase());
  if (examyear) pool = pool.filter((q) => q.examyear === String(examyear));

  // shuffle (Fisher-Yates) then slice
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, Number(limit));
}

function getQuestionById(id) {
  return byId.get(Number(id));
}

// Strips the answer/solution so the client can't see it before submitting
function toPublicQuestion(q) {
  return {
    id: q.id,
    subject: q.subject,
    question: q.question,
    options: q.options,
    examtype: q.examtype,
    examyear: q.examyear,
    image: q.image || null,
  };
}

module.exports = { listSubjects, getQuestions, getQuestionById, toPublicQuestion, allCount: questions.length };
