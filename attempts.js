const express = require('express');
const router = express.Router();
const db = require('../db');
const bank = require('../questionBank');
const { maybeSendGrade } = require('../ltiGrade');

// POST /api/attempts
// body: { userId, subject, questionIds: [1,2,3], answers: { "1": "A", "2": "C" }, ltiContextId? }
// Scores server-side using the real question bank (never trust client-submitted scores)
router.post('/', async (req, res) => {
  const { userId, subject, examType, questionIds, answers, ltiContextId } = req.body;

  if (!Array.isArray(questionIds) || !answers) {
    return res.status(400).json({ error: 'questionIds (array) and answers (object) are required' });
  }

  let correct = 0;
  const breakdown = questionIds.map((id) => {
    const q = bank.getQuestionById(id);
    const given = (answers[id] || '').toUpperCase();
    const isCorrect = q && q.answer === given;
    if (isCorrect) correct += 1;
    return {
      questionId: id,
      given: given || null,
      correctAnswer: q ? q.answer : null,
      isCorrect: !!isCorrect,
      solution: q ? q.solution : null,
    };
  });

  const total = questionIds.length;
  const score = correct;

  const stmt = db.prepare(`
    INSERT INTO attempts (user_id, subject, exam_type, question_ids, answers, score, total, lti_context_id, submitted_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `);
  const info = stmt.run(
    userId || null,
    subject || null,
    examType || null,
    JSON.stringify(questionIds),
    JSON.stringify(answers),
    score,
    total,
    ltiContextId || null
  );

  // If this attempt originated from an LMS launch, push the score back to the gradebook.
  // See ltiGrade.js — this is a stub until real LTI Advantage credentials are configured.
  if (ltiContextId) {
    await maybeSendGrade({ userId, ltiContextId, score, total });
  }

  res.json({
    attemptId: info.lastInsertRowid,
    score,
    total,
    percentage: total ? Math.round((score / total) * 100) : 0,
    breakdown,
  });
});

// GET /api/attempts/:userId -> attempt history for a student (for a dashboard/progress view)
router.get('/user/:userId', (req, res) => {
  const rows = db
    .prepare('SELECT id, subject, exam_type, score, total, started_at, submitted_at FROM attempts WHERE user_id = ? ORDER BY started_at DESC')
    .all(req.params.userId);
  res.json({ attempts: rows });
});

module.exports = router;
