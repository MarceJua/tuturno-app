import socket from "../Services/Socket";

export default function AdminPanel({ currentTicket }) {
  return (
    <div className="row text-center">
      <div className="row text-center">
       <h4>🧑‍💼 Administrador</h4>
        <button
              className="btn btn-warning w-100 mb-2"
              onClick={() => socket.emit("add_server")}
            >
              ➕ Abrir Ventanilla
        </button>

        <button
              className="btn btn-primary w-100 mb-3"
              onClick={() => socket.emit("remove_server")}
            >
              ➖ Cerrar Ventanilla
        </button>

      <button
              className="btn btn-success w-100 mb-3"
              onClick={() => socket.emit("call_next")}
            >
              📢 Llamar Siguiente
      </button>

        <p>Turno actual:</p>
        <h1 style={{color:"#0a1f44", fontWeight:"bold"}}>{currentTicket || "---"}</h1>
      </div>
    </div>
  );
}