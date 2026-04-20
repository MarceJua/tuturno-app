const { pool } = require("./db");

async function createTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tickets (
      id SERIAL PRIMARY KEY,
      ticket_number VARCHAR(10),
      status VARCHAR(20) DEFAULT 'waiting',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      called_at TIMESTAMP,
      served_at TIMESTAMP
    );
  `);

  console.log("Tabla Tickets creada");
}

module.exports = { createTables };