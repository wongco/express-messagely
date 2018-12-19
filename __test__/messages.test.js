process.env.NODE_ENV = 'test';

// npm pacakges
const request = require('supertest');
const bcrypt = require('bcrypt');

// app imports
const app = require('../app');
const db = require('../db');
const Message = require('../models/message');
const User = require('../models/user');

let auth = {};
let auth2 = {};
let auth3 = {};
let user;
let user2; // just for length count
let user3;
let message1;
let message3;

beforeEach(async () => {
  const hashedPassword = await bcrypt.hash('1234', 1);
  const result = await db.query(
    `INSERT INTO users (
      username,
      password,
      first_name,
      last_name,
      phone, 
      join_at)
    VALUES ($1, $2, $3, $4, $5, current_timestamp)
    RETURNING username`,
    ['bob', hashedPassword, 'bob', 'awesome', '14151231234']
  );
  user = result.rows[0];

  const response = await request(app)
    .post('/auth/login')
    .send({
      username: 'bob',
      password: '1234'
    });

  // store login token and username in auth object
  // output from login token is _token
  auth.token = response.body._token;
  auth.curr_user_id = 'bob';

  const result2 = await db.query(
    `INSERT INTO users (
      username,
      password,
      first_name,
      last_name,
      phone, 
      join_at)
    VALUES ($1, $2, $3, $4, $5, current_timestamp)
    RETURNING username`,
    ['jon', hashedPassword, 'jon', 'lessawesome', '151012312314']
  );

  user2 = result2.rows[0];

  const response2 = await request(app)
    .post('/auth/login')
    .send({
      username: 'jon',
      password: '1234'
    });

  // store login token and username in auth object
  // output from login token is _token
  auth2.token = response2.body._token;
  auth2.curr_user_id = 'jon';

  const result3 = await db.query(
    `INSERT INTO users (
      username,
      password,
      first_name,
      last_name,
      phone,
      join_at)
    VALUES ($1, $2, $3, $4, $5, current_timestamp)
    RETURNING username`,
    ['joe', hashedPassword, 'joe', 'awesome', '14151231234']
  );

  user3 = result3.rows[0];

  const response3 = await request(app)
    .post('/auth/login')
    .send({
      username: 'joe',
      password: '1234'
    });

  // store login token and username in auth object
  // output from login token is _token
  auth3.token = response3.body._token;
  auth3.curr_user_id = 'joe';

  message1 = await Message.create({
    from_username: user.username,
    to_username: user2.username,
    body: 'Hello From Bob!'
  });

  await Message.create({
    from_username: user.username,
    to_username: user2.username,
    body: 'Bob Sends XMas Greetings!'
  });

  message3 = await Message.create({
    from_username: user2.username,
    to_username: user.username,
    body: 'Jon says hello!'
  });

  await Message.create({
    from_username: user2.username,
    to_username: user.username,
    body: 'Jon sends back XMas Greetings'
  });
});

describe('GET messages/:id', async function() {
  test('Get message by id, succesfully with user1 logged in', async () => {
    const response = await request(app)
      .get(`/messages/${message1.id}`)
      .send({
        _token: auth.token
      });
    expect(response.statusCode).toBe(200);
    expect(response.body.message.id).toEqual(message1.id);
    expect(response.body.message.body).toEqual('Hello From Bob!');
  });

  test('Get message by id, fail with user1 and invalid token', async () => {
    const response = await request(app)
      .get(`/messages/${message1.id}`)
      .send({
        _token: 'wrongtoken'
      });
    expect(response.statusCode).toBe(401);
    expect(response.body.error).toEqual({
      message: 'Unauthorized',
      status: 401
    });
  });

  test('Get message by id, fail with wrong user and valid token', async () => {
    const response = await request(app)
      .get(`/messages/${message1.id}`)
      .send({
        _token: auth3.token
      });
    expect(response.statusCode).toBe(401);
    expect(response.body.error).toEqual({
      message: 'Unauthorized',
      status: 401
    });
  });

  test('Get message by id, succesfully with user1 logged in', async () => {
    const response = await request(app).get(`/messages/${message1.id}`);
    expect(response.statusCode).toBe(401);
    expect(response.body.error).toEqual({
      message: 'Unauthorized',
      status: 401
    });
  });
});

describe('POST /messages', async function() {
  test('Create a new message for a logged in user', async () => {
    const response = await request(app)
      .post('/messages')
      .send({
        _token: auth.token,
        to_username: 'joe',
        body: 'Hi Joe from bob'
      });
    expect(response.statusCode).toBe(200);
    expect(response.body.message.from_username).toEqual('bob');
    expect(response.body.message.to_username).toEqual('joe');
  });

  test('Create a new message for an unauthorized/not logged in user', async () => {
    const response = await request(app)
      .post('/messages')
      .send({
        _token: 'sdfsdfsdf',
        to_username: 'joe',
        body: 'Hi Joe from bob'
      });
    expect(response.statusCode).toBe(401);
  });
});

describe('POST /messages/:id/read', async function() {
  test('Receipient of a message marks it as read (correct and authorized user)', async () => {
    const response = await request(app)
      .post(`/messages/${message3.id}/read`)
      .send({
        _token: auth.token
      });
    expect(response.statusCode).toBe(200);
    expect(response.body.message).toHaveProperty('read_at');
  });
  test('Receipient of a message marks it as read (incorrect user)', async () => {
    const response = await request(app)
      .post(`/messages/${message3.id}/read`)
      .send({
        _token: auth2.token
      });
    expect(response.statusCode).toBe(401);
    expect(response.body.error.message).toEqual(
      'Unauthorized to read/mark message'
    );
  });
});

afterEach(async function() {
  // delete any data created by test
  await db.query('DELETE FROM messages');
  await db.query('DELETE FROM users');
});

afterAll(async function() {
  // close db connection
  await db.end();
});
