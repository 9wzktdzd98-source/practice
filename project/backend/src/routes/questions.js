const express = require('express');
const router = express.Router();
const bank = require('../questionBank');

// GET /api/questions/subjects -> list of subjects with question counts
router.get('/subjects', (req, res) => {
  res.json({ subjects: bank.listSubjects(), total: bank.allCount });
});

// GET /api/questions?subject=chemistry&examtype=utme&examyear=2010&limit=20
// Returns questions WITHOUT the correct answer (so the frontend can't cheat)
router.get('/', (req, res) => {
  const { subject, examtype, examyear, limit } = req.query;
  const results = bank.getQuestions({ subject, examtype, examyear, limit });
  res.json({
    count: results.length,
    questions: results.map(bank.toPublicQuestion),
  });
});

// GET /api/questions/:id -> single question, still without the answer
router.get('/:id', (req, res) => {
  const q = bank.getQuestionById(req.params.id);
  if (!q) return res.status(404).json({ error: 'Question not found' });
  res.json(bank.toPublicQuestion(q));
});

module.exports = router;
