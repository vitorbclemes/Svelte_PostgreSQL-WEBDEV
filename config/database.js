// Postgres connection
const Pool = require('pg').Pool;
const pool = new Pool({
  user: process.env.USER,
  host: process.env.HOST,
  database: process.env.DB_NAME,
  password: process.env.PASSWORD,
  port: 5432
});

module.exports = {
  pool,
}