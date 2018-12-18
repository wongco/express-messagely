process.env.NODE_ENV = 'test';

// npm pacakges
const request = require('supertest');
const bcrypt = require('bcrypt');

// app imports
const app = require('../app');
const db = require('../db');
const Message = require('../models/message');

let auth = {};
let user;
let user2; // just for length count

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

  await Message.create({
    from_username: user.username,
    to_username: user2.username,
    body: 'Hello From Bob!'
  });

  await Message.create({
    from_username: user.username,
    to_username: user2.username,
    body: 'Bob Sends XMas Greetings!'
  });

  await Message.create({
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

describe('GET /users', async function() {
  test('Get all users', async () => {
    const response = await request(app)
      .get('/users')
      .send({
        _token: auth.token
      });
    expect(response.statusCode).toBe(200);
    expect(response.body.users).toHaveLength(2);
    expect(response.body.users[0].username).toEqual('bob');
  });
});

describe('GET /users/:username', async function() {
  test('Get specific user success', async () => {
    const response = await request(app)
      .get(`/users/${user.username}`)
      .send({
        _token: auth.token
      });
    expect(response.statusCode).toBe(200);
    expect(response.body.user.username).toEqual('bob');
  });

  test('Get specific user detail fail invalid token', async () => {
    const response = await request(app)
      .get(`/users/${user.username}`)
      .send({
        _token: 'garbage'
      });
    expect(response.statusCode).toBe(401);
  });

  test('Get specific wrong user detail, valid token', async () => {
    const response = await request(app)
      .get(`/users/${user2.username}`)
      .send({
        _token: auth.token
      });
    expect(response.statusCode).toBe(401);
  });

  test('Get specific user detail no token', async () => {
    const response = await request(app).get(`/users/${user.username}`);
    expect(response.statusCode).toBe(401);
  });
});

describe('GET /users/:username/to', async function() {
  test("Get specific user's to messages success", async () => {
    const response = await request(app)
      .get(`/users/${user.username}/to`)
      .send({
        _token: auth.token
      });
    expect(response.statusCode).toBe(200);
    const { messages } = response.body;
    expect(messages).toHaveLength(2);
    expect(messages[0].body).toEqual('Jon says hello!');
    expect(messages[1].body).toEqual('Jon sends back XMas Greetings');
  });

  test("Get specific user's to messages fail bad token", async () => {
    const response = await request(app)
      .get(`/users/${user.username}/to`)
      .send({
        _token: 'garbage'
      });
    expect(response.statusCode).toBe(401);
  });

  test("Get specific user's to messages fail wrong user token", async () => {
    const response = await request(app)
      .get(`/users/${user2.username}/to`)
      .send({
        _token: auth.token
      });
    expect(response.statusCode).toBe(401);
  });

  test("Get specific user's to messages fail no token", async () => {
    const response = await request(app).get(`/users/${user.username}/to`);
    expect(response.statusCode).toBe(401);
  });
});

describe('GET /users/:username/from', async function() {
  test("Get specific user's to messages success", async () => {
    const response = await request(app)
      .get(`/users/${user.username}/from`)
      .send({
        _token: auth.token
      });
    expect(response.statusCode).toBe(200);
    console.log(response.body);
    const { messages } = response.body;
    // console.log(messages);
    expect(messages).toHaveLength(2);
    expect(messages[0].body).toEqual('Hello From Bob!');
    expect(messages[1].body).toEqual('Bob Sends XMas Greetings!');
  });

  test("Get specific user's from messages fail bad token", async () => {
    const response = await request(app)
      .get(`/users/${user.username}/from`)
      .send({
        _token: 'garbage'
      });
    expect(response.statusCode).toBe(401);
  });

  test("Get specific user's from messages fail wrong user token", async () => {
    const response = await request(app)
      .get(`/users/${user2.username}/from`)
      .send({
        _token: auth.token
      });
    expect(response.statusCode).toBe(401);
  });

  test("Get specific user's from messages fail no token", async () => {
    const response = await request(app).get(`/users/${user.username}/from`);
    expect(response.statusCode).toBe(401);
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
