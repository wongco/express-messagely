/** Common config for message.ly */

// read .env files and make environmental variables

require('dotenv').config();

let DB_URI;

if (process.env.NODE_ENV === 'test') {
  DB_URI = 'postgresql:///messagely-test';
} else {
  DB_URI = 'postgresql:///messagely';
}

module.exports = { DB_URI };

const BCRYPT_WORK_ROUNDS = 10;
const SECRET_KEY = process.env.SECRET_KEY || 'secret';
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;

module.exports = {
  SECRET_KEY,
  BCRYPT_WORK_ROUNDS,
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  DB_URI
};
