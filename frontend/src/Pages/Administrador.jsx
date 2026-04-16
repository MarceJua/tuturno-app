import { useState } from "react";
import { useQueueSocket } from "../Hook/Queue";
import Metrics from "../Componentes/Metricas";
import AlertBanner from "../Componentes/Alertas";
import AdminPanel from "../Componentes/Control";

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
    <div className="container py-4">
      <h1 className="mb-4">Sistema TuTurno</h1>
      <AlertBanner alert={alert} />
      <Metrics data={metrics} />
        <div className="col-md-6">
          <AdminPanel currentTicket={currentTicket} />
        </div>
    </div>
  );
}