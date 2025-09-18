const { Pool } = require('pg');
const { dbUrl } = require('../config');


const cfg = require('../config');
const pool = new Pool({ connectionString: cfg.dbUrl });

pool.on('error', (err) => {
  console.error('Unexpected PG client error', err);
  process.exit(-1);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};
