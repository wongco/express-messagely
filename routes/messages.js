const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const { ensureLoggedIn, ensureCorrectUser } = require('../middleware/auth');
const Message = require('../models/message');
const User = require('../models/user');
const { SECRET_KEY } = require('../config');
const router = new express.Router();

const app = express();

// allow both form-encoded and json body parsing
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

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
    let { messageId } = req.params;
    let username = req.username;

    let message = await Message.get(messageId);

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

/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Make sure that the only the intended recipient can mark as read.
 *
 **/
router.post('/:id/read', async (req, res, next) => {
  try {
    let messageId = req.params.id;
    const token = req.body._token || req.query._token;
    const payload = jwt.verify(token, SECRET_KEY);
    const to_username = payload.username;

    let messageBefore = await Message.get(+messageId);

    if (messageBefore.to_user.username === to_username) {
      let message = await Message.markRead(+messageId);

      return res.json({ message });
    }

    return next({ message: 'Unauthorized to read/mark message' });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
