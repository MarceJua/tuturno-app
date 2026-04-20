import socket from "../Services/Socket";

export default function ClientPanel({ ticket, currentTicket }) {
  return (
    <div className="card shadow p-4">
      <h4 className="text-primary mb-3">👤 Cliente</h4>

      <button
        className="btn btn-primary w-100 mb-3"
        onClick={() => socket.emit("request_ticket")}
      >
        Pedir Turno
      </button>

      {/* 🔥 TURNO LLAMADO GLOBAL */}
      <div className="alert alert-success text-center">
        <strong>Turno en ventanilla:</strong>
        <h2 className="mt-2">{currentTicket || "---"}</h2>
      </div>

      {/* 👇 MI TURNO */}
      <div className="text-center mt-4">
        <p>Mi turno:</p>
        <h2>{ticket?.id || "---"}</h2>
        <p>Espera: {ticket?.estimatedWaitMinutes || 0} min</p>
      </div>
    </div>
  );
}