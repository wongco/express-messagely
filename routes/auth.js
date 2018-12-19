const express = require('express');
const router = new express.Router();
const jwt = require('jsonwebtoken');

// jsonschema validation
const { validate } = require('jsonschema');
const registerUserSchema = require('../schemas/registerUserSchema.json');
const loginUserSchema = require('../schemas/loginUserSchema.json');

const User = require('../models/user');
const { SECRET_KEY } = require('../config');

/** POST /login - login: {username, password} => {token}
 *
 * Make sure to update their last-login!
 *
 **/
router.post('/login', async (req, res, next) => {
  try {
    let validationResult = validate(req.body, loginUserSchema);
    if (!validationResult.valid) {
      // pass validation errors to error handler
      const message = validationResult.errors.map(error => error.stack);
      let error = new Error(message);
      error.status = 400;
      throw error;
    }
    const { username, password } = req.body;

    if (await User.authenticate(username, password)) {
      const _token = jwt.sign({ username }, SECRET_KEY);
      return res.json({ _token });
    }
    let error = new Error('Invalid user/password');
    error.status = 401;
    throw error;
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
    let validationResult = validate(req.body, registerUserSchema);
    if (!validationResult.valid) {
      // pass validation errors to error handler
      const message = validationResult.errors.map(error => error.stack);
      let error = new Error(message);
      error.status = 400;
      throw error;
    }

    await User.register(req.body);

    const { username } = req.body;
    const _token = jwt.sign({ username }, SECRET_KEY);

    return res.json({ _token });
  } catch (err) {
    return next(err);
  }
});

// exports router for app.js use
module.exports = router;
