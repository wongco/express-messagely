/** User class for message.ly */

const db = require('../db');
const bcrypt = require('bcrypt');
const { BCRYPT_WORK_ROUNDS } = require('../config');

/** User of the site. */

class User {
  // constructor({ username, password, first_name, last_name, phone }) {
  //   this.username = username;
  //   this.password = password;
  //   this.firstName = first_name;
  //   this.lastName = last_name;
  //   this.phone = phone;
  // }

  /** register new user -- returns
   *    {username, password, first_name, last_name, phone}
   */
  static async register({ username, password, first_name, last_name, phone }) {
    const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_ROUNDS);
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
      [username, hashedPassword, first_name, last_name, phone]
    );
    return result.rows[0];
  }

  /** Authenticate: is this username/password valid? Returns boolean. */

  static async authenticate(username, password) {
    const result = await db.query(
      'SELECT password FROM users WHERE username = $1',
      [username]
    );
    const userObj = result.rows[0];

    // if userPassword exists
    if (userObj) {
      return await bcrypt.compare(password, userObj.password);
    }
    return false;
  }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) {
    const result = await db.query(
      `UPDATE users
        SET last_login_at = current_timestamp
        WHERE username = $1
        RETURNING *`,
      [username]
    );
    return result.rows[0];
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name}, ...] */

  static async all() {
    const result = await db.query(
      `SELECT username,
              first_name,
              last_name
       FROM users`
    );
    return result.rows;
  }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) {
    const result = await db.query(
      `SELECT username,
              first_name,
              last_name,
              phone,
              join_at,
              last_login_at
       FROM users
       WHERE username = $1`,
      [username]
    );

    const userObj = result.rows[0];
    if (!userObj) {
      throw new Error(`No such user: ${username}`);
    }

    return userObj;
  }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) {
    const result = await db.query(
      `SELECT
        id,
        to_username AS to_user,
        body,
        sent_at,
        read_at
      FROM
        messages
      WHERE
        from_username = $1`,
      [username]
    );

    const messages = result.rows;
    // if (userObj.length === 0) {
    //   throw new Error(`No messages from: ${username}`);
    // }

    return messages;
  }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {id, first_name, last_name, phone}
   */

  static async messagesTo(username) {
    const result = await db.query(
      `SELECT
        id,
        from_username AS from_user,
        body,
        sent_at,
        read_at
      FROM
        messages
      WHERE
        to_username = $1`,
      [username]
    );

    const messages = result.rows;
    // if (userObj.length === 0) {
    //   throw new Error(`No messages to: ${username}`);
    // }

    return messages;
  }

  /** helper function to retreive phone number */
  static async getPhoneNum(username) {
    const phoneNum = (await db.query(
      `SELECT phone FROM users WHERE username = $1`,
      [username]
    )).rows[0].phone;

    if (!phoneNum) {
      throw new Error(`No phone number is available for user: ${username}`);
    }

    return phoneNum;
  }
}

module.exports = User;
