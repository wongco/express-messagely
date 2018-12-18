const express = require('express');
const router = new express.Router();

const User = require('../models/user');
const { ensureLoggedIn, ensureCorrectUser } = require('../middleware/auth');

/** GET / - get list of users.
 *
 * => {users: [{username, first_name, last_name, phone}, ...]}
 *
 **/
router.get('/', ensureLoggedIn, async (req, res, next) => {
  try {
    const users = await User.all();
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
    const { username } = req.params;
    const user = await User.get(username);
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
    const { username } = req.params;
    const messagesResults = await User.messagesTo(username);

    // for every message, extract specific msg details and from_user details
    const messagesPromises = messagesResults.map(async message => {
      const { from_user, ...messageDetails } = message;
      const fromUserDetails = await User.get(from_user);
      const { join_at, last_login_at, ...userDetails } = fromUserDetails;
      return { ...messageDetails, from_user: userDetails };
    });

    const messages = await Promise.all(messagesPromises);

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
    const { username } = req.params;
    const messagesResults = await User.messagesFrom(username);

    // for every message, extract specific msg details and to_user details
    const messagesPromises = messagesResults.map(async message => {
      const { to_user, ...messageDetails } = message;
      const toUserDetails = await User.get(to_user);
      const { join_at, last_login_at, ...userDetails } = toUserDetails;
      return { ...messageDetails, to_user: userDetails };
    });

    const messages = await Promise.all(messagesPromises);

    return res.json({ messages });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
