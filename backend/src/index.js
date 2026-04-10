const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

// Importar nuestro motor de colas
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
  socket.on("request_ticket", () => {
    const newTicket = queueSystem.generateTicket();

    // Responderle solo al cliente que lo pidio con su ticket
    socket.emit("ticket_assigned", newTicket);

    // Avisarle a TODOS los conectados que la fila se actualizo
    io.emit("queue_update", queueSystem.getMetrics());
  });

  // Evento: Administrador llama al siguiente turno
  socket.on("call_next", () => {
    const calledTicket = queueSystem.callNext();

    if (calledTicket) {
      // Avisar a todos cual es el ticket que debe pasar a ventanilla
      io.emit("ticket_called", calledTicket);
      // Actualizar las metricas de la fila para todos
      io.emit("queue_update", queueSystem.getMetrics());
    }
  });

  // Evento: Admin abre una nueva ventanilla
  socket.on("add_server", () => {
    queueSystem.addServer();
    io.emit("queue_update", queueSystem.getMetrics());
  });

  // Evento: Admin cierra una ventanilla
  socket.on("remove_server", () => {
    queueSystem.removeServer();
    io.emit("queue_update", queueSystem.getMetrics());
  });

  socket.on("disconnect", () => {
    console.log(`Cliente desconectado: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("=========================================");
  console.log(`Servidor corriendo en el puerto ${PORT}`);
  console.log("=========================================");
});
