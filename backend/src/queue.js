// Funciones auxiliares matematicas
function factorial(n) {
  if (n === 0 || n === 1) return 1;
  let result = 1;
  for (let i = n; i > 1; i--) {
    result *= i;
  }
  return result;
}

class QueueSystem {
  constructor() {
    // Parametros iniciales basados en su caso de alta demanda
    this.lambda = 45; // Tasa de llegadas (clientes/hora)
    this.mu = 20; // Tasa de servicio (clientes/hora)
    this.servers = 3; // Numero de cajeros (c)

    this.queue = []; // Arreglo en memoria para los turnos activos
    this.ticketCounter = 0;
  }

  // 1. Factor de utilizacion (rho)
  getUtilization() {
    return this.lambda / (this.servers * this.mu);
  }

  // 2. Probabilidad de que el sistema este vacio (P0)
  getP0() {
    const rho = this.getUtilization();
    if (rho >= 1) return 0; // Evita colapso matematico si la demanda supera la capacidad

    let sum = 0;
    const ratio = this.lambda / this.mu;

    for (let n = 0; n < this.servers; n++) {
      sum += Math.pow(ratio, n) / factorial(n);
    }

    const lastTerm =
      (Math.pow(ratio, this.servers) / factorial(this.servers)) *
      (1 / (1 - rho));
    return 1 / (sum + lastTerm);
  }

  // 3. Numero promedio de clientes en la cola (Lq)
  getLq() {
    const rho = this.getUtilization();
    if (rho >= 1) return Infinity;

    const p0 = this.getP0();
    const ratio = this.lambda / this.mu;

    const numerator = p0 * Math.pow(ratio, this.servers) * rho;
    const denominator = factorial(this.servers) * Math.pow(1 - rho, 2);

    return numerator / denominator;
  }

  // 4. Tiempo promedio de espera en la cola (Wq) en minutos
  getWqMinutes() {
    const lq = this.getLq();
    if (lq === Infinity) return Infinity;

    const wqHours = lq / this.lambda;
    return wqHours * 60; // Convertir de horas a minutos
  }

  // Metodos operativos del negocio
  generateTicket() {
    this.ticketCounter++;
    const ticketId = `A-${this.ticketCounter.toString().padStart(3, "0")}`;
    const estimatedWait = this.getWqMinutes();

    const newTicket = {
      id: ticketId,
      timestamp: new Date().toISOString(),
      // Calculo estimado: Wq base * posicion en la cola (simplificacion para UX)
      estimatedWaitMinutes: (estimatedWait * (this.queue.length + 1)).toFixed(
        2,
      ),
    };

    this.queue.push(newTicket);
    return newTicket;
  }

  callNext() {
    if (this.queue.length === 0) return null;
    return this.queue.shift(); // Saca y retorna el primer turno de la fila
  }

  getMetrics() {
    return {
      lambda: this.lambda,
      mu: this.mu,
      servers: this.servers,
      utilizationPercentage: (this.getUtilization() * 100).toFixed(2),
      avgWaitTimeMinutes: this.getWqMinutes().toFixed(2),
      peopleInQueue: this.queue.length,
      activeTickets: this.queue,
    };
  }
}

module.exports = new QueueSystem();
