const express = require('express');
const router = new express.Router();
const jwt = require('jsonwebtoken');

const Message = require('../models/message');

const { ensureLoggedIn } = require('../middleware/auth');
const { SECRET_KEY } = require('../config');

/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Make sure that the currently-logged-in users is either the to or from user.
 *
 **/
router.get('/:id', ensureLoggedIn, async (req, res, next) => {
  try {
    let { id } = req.params;
    let username = req.username;

    let message = await Message.get(id);

    if (
      username === message.from_user.username ||
      username === message.to_user.username
    ) {
      return res.json({ message });
    }

    return next({ message: 'Unauthorized!' });
  } catch (err) {
    return next(err);
  }
});

/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/
router.post('/', ensureLoggedIn, async (req, res, next) => {
  try {
    const from_username = req.username;
    let { to_username, body } = req.body;

    let message = await Message.create({ from_username, to_username, body });

    return res.json({ message });
  } catch (err) {
    return next(err);
  }
});

/** POST / - send a SMS message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/
router.post('/sendsms', ensureLoggedIn, async (req, res, next) => {
  try {
    const from_username = req.username;
    const { to_username, body } = req.body;

    const result = await Message.sendSmsMessage({
      from_username,
      to_username,
      body
    });

    return res.json({ result });
  } catch (err) {
    return next(err);
  }
});

/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Make sure that the only the intended recipient can mark as read.
 *
 **/
router.post('/:id/read', async (req, res, next) => {
  try {
    const messageId = +req.params.id;
    const token = req.body._token || req.query._token;
    const { username } = jwt.verify(token, SECRET_KEY);

    const messageBefore = await Message.get(messageId);

    if (messageBefore.to_user.username === username) {
      const message = await Message.markRead(messageId);

      return res.json({ message });
    }

    return next({ message: 'Unauthorized to read/mark message' });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
