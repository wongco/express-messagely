// indicates test dev env - check config.js
process.env.NODE_ENV = 'test';

// npm packages
const request = require('supertest');

// app imports
const app = require('../app');
const db = require('../db');
const User = require('../models/user');

beforeEach(async () => {
  await db.query('DELETE FROM users');
  await db.query('DELETE FROM messages');
});

describe('POST /auth/register', () => {
  test('User registered successfully', async () => {
    const response = await request(app)
      .post('/auth/register')
      .send({
        username: 'jawesome',
        password: '1234567',
        first_name: 'jeremy',
        last_name: 'awesome'
      });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('_token');
  });

  test('User failed to register correctly due to no body', async () => {
    const response = await request(app).post('/auth/register');
    expect(response.statusCode).toBe(400);
    expect(response.body).not.toHaveProperty('_token');
  });
});

describe('POST /auth/login', () => {
  test('User logged in successfully', async () => {
    await User.register({
      username: 'jkool',
      password: '1234567',
      first_name: 'joey',
      last_name: 'kool',
      phone: '+14151231234'
    });

    const response = await request(app)
      .post('/auth/login')
      .send({
        username: 'jkool',
        password: '1234567'
      });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('_token');
  });

  test('User logs in unsuccessfully', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({
        username: 'joey',
        password: '123798712907'
      });

    expect(response.statusCode).toBe(401);
    expect(response.body.message).toEqual('Invalid user/password');
    expect(response.body).not.toHaveProperty('_token');
  });
});

afterEach(async () => {
  // delete any data created by test
  await db.query('DELETE FROM users');
  await db.query('DELETE FROM messages');
});

afterAll(async () => {
  // close db connection
  await db.end();
});
