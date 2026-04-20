const { Client } = require("pg");

async function createDatabase() {
  const client = new Client({
    user: "postgres",
    host: "localhost",
    database: "postgres", // importante
    password: "1234",
    port: 5432,
  });

  await client.connect();

  try {
    await client.query("CREATE DATABASE tuturno");
    console.log("Base de datos creada");
  } catch (error) {
    if (error.code === "42P04") {
      console.log("⚠️ La base de datos ya existe");
    } else {
      console.error(error);
    }
  }

  await client.end();
}

module.exports = { createDatabase };