const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "tuturno",
  password: "1234",
  port: 5432,
});

module.exports = { pool };

pool.query("SELECT NOW()", (err, res) => {
  if (err) {
    console.error('Error de conexión:', err.stack);
  } else {
    console.log('Conexión exitosa. Hora del servidor:', res.rows[0].now);
  }
});
