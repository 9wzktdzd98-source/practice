# WAEC/UTME Practice Platform (LMS-integratable starter)

A working starter project: an API that serves ~6,700 real past WAEC/UTME/Post-UTME
questions, a simple quiz frontend, server-side scoring, and the scaffolding
needed to plug this into a school's LMS (Moodle, Canvas, etc.) via LTI.

**This is an MVP/starter, not a finished production product.** It's built so
you have a real, running thing to iterate on — see [Roadmap](#roadmap) for
what's stubbed out vs. fully working.

## What's actually working right now

- ✅ REST API serving 6,707 questions across 21 subjects (see `backend/data/subjects_summary.json`)
- ✅ Server-side scoring (the frontend never sees correct answers before submitting — can't be cheated by reading the page source)
- ✅ SQLite storage for quiz attempts, users, and LMS "contexts" (courses)
- ✅ A simple, working quiz frontend (pick subject → answer 20 questions → see score + solutions)
- ✅ LTI launch endpoint skeleton (`/lti/launch`) that shows exactly where LMS integration plugs in

## What's stubbed / needs real credentials before it works with a live LMS

- ⚠️ LTI launches are **not yet signature-verified** — `/lti/launch` trusts
  the incoming form data as-is. Fine for local testing, **not safe to deploy
  publicly** until you add real OAuth1 (LTI 1.1) or JWT (LTI 1.3) verification.
- ⚠️ Grade passback to the LMS gradebook (`backend/src/ltiGrade.js`) currently
  just logs the score — it doesn't POST it back to Moodle/Canvas yet, because
  that requires real credentials from an actual LMS registration.
- ⚠️ No authentication for standalone (non-LMS) users yet — `userId` is
  currently passed through unauthenticated.

See [Roadmap](#roadmap) below for the order to tackle these in.

## Where the question data came from

The question bank (`backend/data/*.json`) was extracted from a MySQL backup
included in the open-source [ALOC Questions API](https://github.com/Seunope/aloc-endpoints)
(MIT licensed), which itself aggregates Nigerian WAEC/WASSCE/UTME/Post-UTME
past questions. Original hosted service: https://questions.aloc.com.ng

A few honest notes:
- This snapshot is from **August 2020** — ALOC's live API almost certainly
  has more/newer questions now. Consider calling their hosted API directly
  for fresh data instead of relying only on this static export.
- Subject coverage is uneven — e.g. Mathematics has only 74 questions in this
  snapshot vs. 887 for Commerce. Check `backend/data/subjects_summary.json`
  before promising full subject coverage to users.
- This is Nigeria-focused content (WAEC/WASSCE + UTME). If you're building
  for other WAEC-administering countries (Ghana, Sierra Leone, Gambia,
  Liberia), you'll want to verify relevance/coverage for those syllabi.
- Give credit to ALOC if you use or extend this dataset — they built and
  maintain the underlying question collection.

## Project structure

```
backend/
  src/
    server.js          Express app entrypoint
    db.js               SQLite schema (users, lti_contexts, attempts)
    questionBank.js      Loads question JSON into memory, handles filtering/shuffling
    ltiGrade.js          Grade passback stub — see comments for what to wire up
    routes/
      questions.js        GET /api/questions, /api/questions/subjects
      attempts.js          POST /api/attempts (scores + stores a quiz attempt)
      lti.js               POST /lti/launch, GET /lti/config
  data/
    all_questions.json      All 6,707 questions combined
    <subject>.json          Per-subject question files
    subjects_summary.json    Question counts per subject
  package.json
  .env.example
frontend/
  index.html            Subject picker
  quiz.html             Quiz-taking + results page
  style.css
```

## Running it locally

```bash
cd backend
npm install
cp .env.example .env
npm start
```

Then open http://localhost:4000 in your browser. Pick a subject, answer the
quiz, submit, see your score and the correct answers/solutions.

## API reference

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/questions/subjects` | List subjects with question counts |
| GET | `/api/questions?subject=chemistry&examtype=utme&examyear=2010&limit=20` | Get a filtered, shuffled batch of questions (no answers included) |
| GET | `/api/questions/:id` | Get one question by id (no answer included) |
| POST | `/api/attempts` | Submit answers, get scored server-side, get correct answers + solutions back |
| GET | `/api/attempts/user/:userId` | Get a user's attempt history |
| POST | `/lti/launch` | LMS calls this when a student clicks the tool link (see caveats above) |
| GET | `/lti/config` | Starter LTI config XML for registering the tool with an LMS |

## Roadmap

Recommended order if you're taking this from prototype to something schools
can actually use:

1. **Pilot without LTI first.** Get a few students/teachers using the
   standalone quiz (`index.html`/`quiz.html`) and collect feedback. Don't
   burn time on LTI plumbing before you know the quiz itself is good.
2. **Add real user accounts** (even simple email/password) so attempt
   history and progress tracking actually mean something.
3. **Pick ONE LMS to integrate first — Moodle is the most common choice
   in Nigerian/African schools** and has the best-documented LTI support.
   Don't try to be "universal" from day one.
4. **Swap the LTI stub for a real library.** For LTI 1.3 (recommended for
   new integrations), use [`ltijs`](https://www.npmjs.com/package/ltijs) —
   it handles the JWT verification, platform registration, and deployment
   ids that `routes/lti.js` currently skips.
5. **Wire up grade passback** (`ltiGrade.js`) using ltijs's built-in
   Assignment & Grade Services (AGS) support once you have real LMS
   credentials from a pilot school's Moodle admin.
6. **Refresh the question data.** Either call ALOC's live hosted API
   instead of this static 2020 snapshot, or build a simple admin UI to
   add/edit/import new questions yourselves.
7. **Data protection basics** before handling real student data at any
   scale: don't log more than you need, get explicit consent from the
   pilot school, and know where the database is actually hosted.

## License

Your own code here can be licensed however you like (MIT recommended for a
portfolio project). The question data is derived from ALOC, which is
MIT-licensed — keep their attribution if you redistribute it.
