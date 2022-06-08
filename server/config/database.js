import Pool  from 'pg';

// Postgres connection
const pool = new Pool.Pool({
  user: process.env.USER,
  host: process.env.HOST,
  database: process.env.DB_NAME,
  password: process.env.PASSWORD,
  port: 5432
});

export default pool;