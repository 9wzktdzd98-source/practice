require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const questionsRouter = require('./routes/questions');
const attemptsRouter = require('./routes/attempts');
const ltiRouter = require('./routes/lti');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // LTI launches arrive as form posts

// API routes
app.use('/api/questions', questionsRouter);
app.use('/api/attempts', attemptsRouter);
app.use('/lti', ltiRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'waec-practice-api' });
});

// Serve the simple built-in quiz frontend (useful for testing without an LMS)
app.use('/', express.static(path.join(__dirname, '../../frontend')));

app.listen(PORT, () => {
  console.log(`WAEC Practice API running on http://localhost:${PORT}`);
  console.log(`Quiz demo UI:        http://localhost:${PORT}/`);
  console.log(`LTI launch endpoint: http://localhost:${PORT}/lti/launch`);
});
