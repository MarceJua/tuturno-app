const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const { createDatabase } = require("../BaseDatos/setup")
const { createTables } = require("../BaseDatos/Tablas.js");

async function startServer() {
  //Crear DB si no existe
  await createDatabase();

  //Crear tablas
  await createTables();

  //Iniciar contador
  await queueSystem.initCounter();

  //Levantar servidor
  server.listen(3000, () => {
    console.log("=========================================");
    console.log("Servidor corriendo en el puerto 3000");
    console.log("=========================================");
  });
}
startServer();

const queueSystem = require("./queue");

const app = express();
const server = http.createServer(app);

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST"],
  }),
);

app.use(express.json());
app.use(express.static('public'));

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Rutas REST (para que el frontend consulte el estado inicial)
app.get("/api/metrics", (req, res) => {
  res.json(queueSystem.getMetrics());
});

// Comunicacion en tiempo real con WebSockets
io.on("connection", (socket) => {
  console.log(`Nuevo cliente conectado: ${socket.id}`);

  // Enviar el estado actual apenas alguien se conecta
  socket.emit("queue_update", queueSystem.getMetrics());

  // Evento: Cliente pide un turno nuevo
socket.on("request_ticket", async () => {
  const result = await queueSystem.generateTicket()
  socket.emit("ticket_assigned", result);

    // Avisarle a TODOS los conectados que la fila se actualizo
    const metrics = await queueSystem.getMetrics();
    io.emit("queue_update", metrics);
  });

  // Evento: Administrador llama al siguiente turno
socket.on("call_next", async () => {
  const result = await queueSystem.callNext()

  if (result) {
  io.emit("ticket_called", result);
}
  const metrics = await queueSystem.getMetrics();

  io.emit("queue_update", metrics); 
});

  // Evento: Admin abre una nueva ventanilla
  socket.on("add_server", async () => {
    queueSystem.addServer();
    const metrics =await queueSystem.getMetrics()
    io.emit("queue_update", metrics);
  });

  // Evento: Admin cierra una ventanilla
  socket.on("remove_server", async () => {
    queueSystem.removeServer();
    const metrics =await queueSystem.getMetrics()
    io.emit("queue_update", metrics);
  });

  socket.on("disconnect", () => {
    console.log(`Cliente desconectado: ${socket.id}`);
  });
});
