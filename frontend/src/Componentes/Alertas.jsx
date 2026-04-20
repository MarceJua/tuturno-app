export default function AlertBanner({ alert }) {
  if (!alert) return null;

  const types = {
    INFO: "alert-info",
    WARNING: "alert-warning",
    DANGER: "alert-danger",
    CRITICAL: "alert-dark",
  };

   return (
    <div className={`alert ${types[alert.type]} fw-bold`}>
      {alert.message}
    </div>
  );
}