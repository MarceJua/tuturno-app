import { useState } from "react";
import { useQueueSocket } from "../Hook/Queue";
import Metrics from "../Componentes/Metricas";
import AlertBanner from "../Componentes/Alertas";
import AdminPanel from "../Componentes/Control";
import ClientPanel from "../Componentes/Cliente";

export default function Dashboard() {
  const [metrics, setMetrics] = useState({});
  const [alert, setAlert] = useState(null);
  const [ticket, setTicket] = useState(null);
  const [currentTicket, setCurrentTicket] = useState(null);
  
  useQueueSocket({
    onQueueUpdate: (data) => {
      setMetrics(data);
      setAlert(data.systemAlert);
    },
    onTicketAssigned: (data) => {
      setTicket(data);
    },
    onTicketCalled: (data) => {
      setCurrentTicket(data.id);
    }
  });

  return (
    <div
    style={{
    minHeight: "100vh",
    backgroundColor: "#eef2f7",
    padding: "20px"
  }}
>
    <div className="card p-3 shadow bg-light">
      <div className="d-flex justify-content-center mb-4">
      <div
        style={{
          background: "#0a1f44",
          color: "white",
          padding: "10px 30px",
          borderRadius: "8px",
          boxShadow: "0 4px 10px rgba(0,0,0,0.2)"
        }}
      >
      <h4 className="m-0">🏦 Sistema TuTurno</h4>
    </div>
    </div>
      <AlertBanner alert={alert} />
      <div
        className="p-3 mb-4"
        style={{
          background: "#f1f4f8",
          borderRadius: "10px",
          border: "1px solid #d6dbe1"
        }}
        >
        <Metrics data={metrics} />
      </div>
      <div className="row justify-content-center">
        <div className="col-md-5">
          <AdminPanel currentTicket={currentTicket} />
         {/* <ClientPanel ticket={ticket}  currentTicket={currentTicket} />*/}
        </div>
      </div>
    </div>
    </div>
  );
}