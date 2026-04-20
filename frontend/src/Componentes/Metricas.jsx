export default function Metrics({ data }) {
  return (
    <div className="row text-center">
      <div className="col">
        <div className="card p-3 shadow-sm">
          <h6>Cajeros</h6>
          <h3>{data.servers || 0}</h3>
        </div>
      </div>

      <div className="col">
        <div className="card p-3 shadow-sm">
          <h6>En fila</h6>
          <h3>{data.peopleInQueue || 0}</h3>
        </div>
      </div>

      <div className="col">
        <div className="card p-3 shadow-sm">
          <h6>Espera</h6>
          <h3>
            {data.avgWaitTimeMinutes === "Infinity"
              ? "∞"
              : data.avgWaitTimeMinutes || 0}
          </h3>
        </div>
      </div>

      <div className="col">
        <div className="card p-3 shadow-sm">
          <h6>Utilización</h6>
          <h3>{data.utilizationPercentage || 0}%</h3>
        </div>
      </div>
    </div>
  );
}