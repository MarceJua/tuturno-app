const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

// Inicializar Express
const app = express();
// Envolver Express con el servidor HTTP nativo de Node (necesario para Socket.io)
const server = http.createServer(app);

// Configuración de seguridad CORS
app.use(
  cors({
    origin: "*", // En desarrollo permitimos todo. En prod, aquí irá "https://tuturno.lat"
    methods: ["GET", "POST"],
  }),
);

// Middleware para poder leer JSON en las peticiones POST
app.use(express.json());

// Inicializar el motor de Sockets
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Escuchar conexiones de clientes en tiempo real
io.on("connection", (socket) => {
  console.log(` Nuevo cliente conectado: ${socket.id}`);

  // Aquí agregaremos los eventos más adelante (ej. 'llamar_siguiente_turno')

  socket.on("disconnect", () => {
    console.log(` Cliente desconectado: ${socket.id}`);
  });
});

// Ruta REST de prueba
app.get("/api/status", (req, res) => {
  res.json({
    mensaje: "API de TuTurno funcionando correctamente",
    estado: "OK",
  });
});

// Definir el puerto y arrancar
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`Servidor corriendo en el puerto ${PORT}`);
  console.log(`=========================================`);
});
