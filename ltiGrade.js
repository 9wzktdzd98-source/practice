/**
 * GRADE PASSBACK - STUB
 * ---------------------------------------------------------------------------
 * When a student finishes a quiz launched from an LMS, most schools expect
 * the score to appear automatically in the LMS gradebook. That's what this
 * file is for. Right now it just logs — wire it up once you have real LTI
 * credentials from a school's LMS.
 *
 * LTI 1.1: POST a signed XML "Basic Outcomes" request to the
 *          lis_outcome_service_url provided at launch time.
 * LTI 1.3: use the Assignment & Grade Services (AGS) REST endpoint provided
 *          in the launch's "endpoint" claim, authenticated with an OAuth2
 *          client-credentials token (this is what the `ltijs` library
 *          automates for you).
 *
 * Until that's wired up, scores are still safely stored in your own
 * `attempts` table (see db.js) — nothing is lost, the LMS just won't show
 * it automatically yet.
 */

async function maybeSendGrade({ userId, ltiContextId, score, total }) {
  const percentage = total ? score / total : 0;

  // TODO: look up the stored lis_outcome_service_url / AGS endpoint for this
  // ltiContextId + userId (you'll need to capture and store it at launch
  // time in lti.js, in a new column on lti_contexts or a per-user table)
  // and POST the grade using ltijs (LTI 1.3) or ims-lti (LTI 1.1).

  console.log(
    `[grade-passback stub] user=${userId} context=${ltiContextId} score=${score}/${total} (${Math.round(
      percentage * 100
    )}%) — not yet sent to LMS, see ltiGrade.js`
  );
}

module.exports = { maybeSendGrade };
