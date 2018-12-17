const express = require('express');
const bodyParser = require('body-parser');
const User = require('../models/user');
const { ensureLoggedIn, ensureCorrectUser } = require('../middleware/auth');
const { SECRET_KEY } = require('../config');
const router = new express.Router();

const app = express();

// allow both form-encoded and json body parsing
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

/** GET / - get list of users.
 *
 * => {users: [{username, first_name, last_name, phone}, ...]}
 *
 **/
router.get('/', ensureLoggedIn, async (req, res, next) => {
  try {
    let users = await User.all();

    return res.json({ users });
  } catch (err) {
    return next(err);
  }
});

/** GET /:username - get detail of users.
 *
 * => {user: {username, first_name, last_name, phone, join_at, last_login_at}}
 *
 **/
router.get('/:username', ensureCorrectUser, async (req, res, next) => {
  try {
    let { username } = req.params;

    let user = await User.get(username);

    return res.json({ user });
  } catch (err) {
    return next(err);
  }
});

/** GET /:username/to - get messages to user
 *
 * => {messages: [{id,
 *                 body,
 *                 sent_at,
 *                 read_at,
 *                 from_user: {username, first_name, last_name, phone}}, ...]}
 *
 **/
router.get('/:username/to', ensureCorrectUser, async (req, res, next) => {
  try {
    let { username } = req.params;
    let messagesResults = await User.messagesTo(username);

    let messages = [];

    for (let message of messagesResults) {
      let { id, body, sent_at, read_at, from_user } = message;

      let fromUserDetails = await User.get(from_user);
      let { join_at, last_login_at, ...userDetails } = fromUserDetails;

      messages.push({ id, body, sent_at, read_at, from_user: userDetails });
    }

    return res.json({ messages });
  } catch (err) {
    return next(err);
  }
});

/** GET /:username/from - get messages from user
 *
 * => {messages: [{id,
 *                 body,
 *                 sent_at,
 *                 read_at,
 *                 to_user: {username, first_name, last_name, phone}}, ...]}
 *
 **/
router.get('/:username/from', ensureCorrectUser, async (req, res, next) => {
  try {
    let { username } = req.params;
    let messagesResults = await User.messagesFrom(username);

    let messages = [];

    for (let message of messagesResults) {
      let { id, body, sent_at, read_at, to_user } = message;

      let toUserDetails = await User.get(to_user);
      let { join_at, last_login_at, ...userDetails } = toUserDetails;

      messages.push({ id, body, sent_at, read_at, to_user: userDetails });
    }

    return res.json({ messages });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
