import socket from "../Services/Socket";

export default function AdminPanel({ currentTicket }) {
  return (
    <div className="card shadow p-4">
      <h4 className="text-success mb-3">🧑‍💼 Administrador</h4>

      <div className="d-flex gap-2 mb-3">
        <button
          className="btn btn-warning w-50"
          onClick={() => socket.emit("add_server")}
        >
          + Abrir
        </button>

        <button
          className="btn btn-danger w-50"
          onClick={() => socket.emit("remove_server")}
        >
          - Cerrar
        </button>
      </div>

      <button
        className="btn btn-success w-100 mb-3"
        onClick={() => socket.emit("call_next")}
      >
        Llamar Siguiente
      </button>

      <div className="text-center">
        <p>Turno actual:</p>
        <h2>{currentTicket || "---"}</h2>
      </div>
    </div>
  );
}