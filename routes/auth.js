const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const { SECRET_KEY } = require('../config');
const router = new express.Router();

const app = express();
// allow both form-encoded and json body parsing
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

/** POST /login - login: {username, password} => {token}
 *
 * Make sure to update their last-login!
 *
 **/
router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (await User.authenticate(username, password)) {
      let token = jwt.sign({ username }, SECRET_KEY);

      return res.json({ token });
    }

    return next({ message: 'Invalid user/password' });
  } catch (err) {
    return next(err);
  }
});

/** POST /register - register user: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 *
 *  Make sure to update their last-login!
 */
router.post('/register', async (req, res, next) => {
  try {
    // console.log(req.body);
    // const { username, password, first_name, last_name, phone } = req.body;
    // console.log('PASSWORD', req.body);

    await User.register(req.body);

    let token = jwt.sign({ username: req.body.username }, SECRET_KEY);

    return res.json({ token });
  } catch (err) {
    return next(err);
  }
});

// exports router for app.js use
module.exports = router;
