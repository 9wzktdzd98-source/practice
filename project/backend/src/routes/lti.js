const express = require('express');
const router = express.Router();
const db = require('../db');
const jwt = require('jsonwebtoken');

/**
 * LTI INTEGRATION - READ ME FIRST
 * ---------------------------------------------------------------------------
 * This file is a working SKELETON for LTI launches, not a certified LTI
 * implementation. To actually plug into Moodle/Canvas/Google Classroom you
 * still need to do the "real" LTI handshake, which this file intentionally
 * simplifies so you can see the shape of the integration without drowning
 * in OAuth/JWT boilerplate on day one.
 *
 * Two LTI versions exist:
 *   - LTI 1.1: signs launch requests with OAuth1 (consumer key + secret).
 *              Simpler, older, still widely supported.
 *   - LTI 1.3: uses OAuth2 + signed JWTs + a platform registration (JWKS
 *              endpoints, deployment ids, etc.). This is what Moodle/Canvas
 *              now recommend for new tools.
 *
 * For a real deployment, swap this file's logic for a maintained library:
 *   - LTI 1.3: https://www.npmjs.com/package/ltijs   (recommended)
 *   - LTI 1.1: https://www.npmjs.com/package/ims-lti
 *
 * Below, `/lti/launch` shows where the LMS handshake plugs in, and issues
 * your OWN short-lived JWT so the frontend quiz can identify the student
 * without re-implementing LTI auth on every request.
 */

const APP_JWT_SECRET = process.env.APP_JWT_SECRET || 'dev-secret-change-me';

function findOrCreateUser({ ltiUserId, name, email }) {
  let user = db.prepare('SELECT * FROM users WHERE lti_user_id = ?').get(ltiUserId);
  if (!user) {
    const info = db
      .prepare('INSERT INTO users (lti_user_id, name, email) VALUES (?, ?, ?)')
      .run(ltiUserId, name || 'LMS Student', email || null);
    user = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
  }
  return user;
}

function findOrCreateContext({ contextId, contextTitle, consumerKey }) {
  let ctx = db
    .prepare('SELECT * FROM lti_contexts WHERE context_id = ? AND consumer_key = ?')
    .get(contextId, consumerKey);
  if (!ctx) {
    const info = db
      .prepare('INSERT INTO lti_contexts (context_id, context_title, consumer_key) VALUES (?, ?, ?)')
      .run(contextId, contextTitle, consumerKey);
    ctx = db.prepare('SELECT * FROM lti_contexts WHERE id = ?').get(info.lastInsertRowid);
  }
  return ctx;
}

// POST /lti/launch
// This is the URL you register as the tool's "Launch URL" in the LMS.
// TODO before production: verify the OAuth1 signature (LTI 1.1) or the
// signed JWT (LTI 1.3) before trusting ANY of these params — right now
// this trusts the incoming form body as-is, which is only OK for local
// testing against your own dummy LMS payloads.
router.post('/launch', (req, res) => {
  const {
    user_id: ltiUserId,
    lis_person_name_full: name,
    lis_person_contact_email_primary: email,
    context_id: contextId,
    context_title: contextTitle,
    oauth_consumer_key: consumerKey,
    custom_subject: subject, // optional: LMS admin can set which subject this link opens
  } = req.body;

  if (!ltiUserId) {
    return res.status(400).send('Missing required LTI launch parameter: user_id');
  }

  const user = findOrCreateUser({ ltiUserId, name, email });
  const context = findOrCreateContext({ contextId, contextTitle, consumerKey });

  const sessionToken = jwt.sign(
    { userId: user.id, ltiContextId: context.id, subject: subject || null },
    APP_JWT_SECRET,
    { expiresIn: '3h' }
  );

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4000';
  res.redirect(`${frontendUrl}/quiz.html?token=${sessionToken}`);
});

// GET /lti/config -> a starter XML config an LMS admin can import when
// registering this tool (LTI 1.1 style). Fill in your real deployed URL.
router.get('/config', (req, res) => {
  const toolUrl = process.env.PUBLIC_URL || 'http://localhost:4000';
  res.set('Content-Type', 'application/xml');
  res.send(`<?xml version="1.0" encoding="UTF-8"?>
<cartridge_basiclti_link xmlns="http://www.imsglobal.org/xsd/imslticc_v1p0">
  <blti:title xmlns:blti="http://www.imsglobal.org/xsd/imsbasiclti_v1p0">WAEC Practice</blti:title>
  <blti:description xmlns:blti="http://www.imsglobal.org/xsd/imsbasiclti_v1p0">Practice WAEC/UTME past questions inside your course.</blti:description>
  <blti:launch_url xmlns:blti="http://www.imsglobal.org/xsd/imsbasiclti_v1p0">${toolUrl}/lti/launch</blti:launch_url>
  <blti:extensions platform="moodle.org" xmlns:blti="http://www.imsglobal.org/xsd/imsbasiclti_v1p0"/>
</cartridge_basiclti_link>`);
});

module.exports = router;
