const express = require('express');
const router = new express.Router();
const jwt = require('jsonwebtoken');

const { validate } = require('jsonschema');
const registerUserSchema = require('../schemas/registerUser.json');
const loginUserSchema = require('../schemas/loginUser.json');

const User = require('../models/user');
const { SECRET_KEY } = require('../config');

/** POST /login - login: {username, password} => {token}
 *
 * Make sure to update their last-login!
 *
 **/
router.post('/login', async (req, res, next) => {
  let validationResult = validate(req.body, loginUserSchema);

  if (!validationResult.valid) {
    // pass validation errors to error handler
    //  (the "stack" key is generally the most useful)
    let message = validationResult.errors.map(error => error.stack);
    let error = new Error(message);
    error.status = 400;
    error.message = message;
    return next(error);
  }

  try {
    const { username, password } = req.body;

    if (await User.authenticate(username, password)) {
      const _token = jwt.sign({ username }, SECRET_KEY);
      return res.json({ _token });
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
  let validationResult = validate(req.body, registerUserSchema);

  if (!validationResult.valid) {
    // pass validation errors to error handler
    //  (the "stack" key is generally the most useful)
    let message = validationResult.errors.map(error => error.stack);
    let error = new Error(message);
    error.status = 400;
    error.message = message;
    return next(error);
  }

  try {
    await User.register(req.body);
    const _token = jwt.sign({ username: req.body.username }, SECRET_KEY);
    return res.json({ _token });
  } catch (err) {
    return next(err);
  }
});

// exports router for app.js use
module.exports = router;
