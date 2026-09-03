const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '../data/app.db');
const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');

// Students/users (created lazily on first LTI launch or direct signup)
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lti_user_id TEXT UNIQUE,       -- id passed by the LMS on launch (nullable for standalone users)
  name TEXT,
  email TEXT,
  role TEXT DEFAULT 'student',   -- student | teacher
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`);

// One row per LMS course/context an LTI launch came from
db.exec(`
CREATE TABLE IF NOT EXISTS lti_contexts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  context_id TEXT,                -- LMS course id
  context_title TEXT,
  consumer_key TEXT,               -- which LMS/tool registration this came from
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`);

// A quiz attempt = a set of questions given to a user in one sitting
db.exec(`
CREATE TABLE IF NOT EXISTS attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  subject TEXT,
  exam_type TEXT,
  question_ids TEXT,        -- JSON array of question ids given
  answers TEXT,              -- JSON object { questionId: "A" }
  score INTEGER,
  total INTEGER,
  lti_context_id INTEGER,    -- links back to the LMS course this attempt happened in, if any
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  submitted_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (lti_context_id) REFERENCES lti_contexts(id)
);
`);

module.exports = db;
