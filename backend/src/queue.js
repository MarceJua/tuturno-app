const {pool} = require("../BaseDatos/db")

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

  // SISTEMA DE ALERTAS GERENCIALES ---
  checkServerAlerts() {
    const wq = this.getWqMinutes();
    const rho = this.getUtilization() * 100;
    let alert = null;

    // 1. Nivel CRITICO: > 30 min (Perdiendo casi el 80% de los clientes)
    if (wq >= 30) {
      alert = {
        type: "CRITICAL",
        message: `🚨 CRÍTICO: Espera de ${wq.toFixed(1)} min. ¡Casi el 80% de los clientes podrían abandonar! Abrir cajas urgente.`,
        action: "ADD_SERVER",
      };
    }
    // 2. Nivel PELIGRO: > 20 min (Perdiendo el 50% de los clientes)
    else if (wq >= 20) {
      alert = {
        type: "DANGER",
        message: `🔥 PELIGRO: Espera de ${wq.toFixed(1)} min. La mitad de los clientes superó su límite de tolerancia.`,
        action: "ADD_SERVER",
      };
    }
    // 3. Nivel ADVERTENCIA: > 10 min (Perdiendo al 15.6% más impaciente)
    else if (wq >= 10) {
      alert = {
        type: "WARNING",
        message: `⚡ ADVERTENCIA: Espera de ${wq.toFixed(1)} min. El primer grupo de clientes está perdiendo la paciencia.`,
        action: "ADD_SERVER",
      };
    }
    // 4. Nivel OCIOSO: Mantener costos bajos
    else if (wq <= 2 && rho <= 40 && this.servers > 1) {
      alert = {
        type: "INFO",
        message: `ℹ️ Capacidad ociosa. Utilización: ${rho.toFixed(1)}%. Se recomienda cerrar 1 ventanilla para ahorrar costos.`,
        action: "REMOVE_SERVER",
      };
    }

    return alert;
  }

  // Metodos operativos del negocio
  addServer() {
    this.servers++;
    return this.servers;
  }

  removeServer() {
    if (this.servers > 1) {
      this.servers--;
    }

    return this.servers;
  }

async initCounter() {
  const result = await pool.query(`
    SELECT ticket_number
    FROM tickets
    ORDER BY id DESC
    LIMIT 1
  `);

  if (result.rows.length === 0) {
    this.ticketCounter = 0;
  } else {
    const lastTicket = result.rows[0].ticket_number;
    const number = parseInt(lastTicket.split("-")[1]);

    this.ticketCounter = number;
  }
}


async generateTicket() {
  this.ticketCounter++;

  const ticketId = `A-${this.ticketCounter.toString().padStart(3, "0")}`;

  const result = await pool.query(
    `INSERT INTO tickets (ticket_number)
     VALUES ($1)
     RETURNING *`,
    [ticketId]
  );

  return {
    id: result.rows[0].ticket_number,
    estimatedWaitMinutes: this.getWqMinutes().toFixed(2),
  };
}

async callNext() {
  const result = await pool.query(`
    UPDATE tickets
    SET status = 'called',
        called_at = NOW()
    WHERE id = (
      SELECT id FROM tickets
      WHERE status = 'waiting'
      ORDER BY created_at ASC
      LIMIT 1
    )
    RETURNING *
  `);

  if (result.rows.length === 0) return null;

  return {
    id: result.rows[0].ticket_number,
  };
}

  async getMetrics() {
    const result = await pool.query(
    `SELECT COUNT(*) FROM tickets WHERE status = 'waiting'`
  );

  const peopleInQueue = parseInt(result.rows[0].count);

   return {
      lambda: this.lambda,
      mu: this.mu,
      servers: this.servers,
      utilizationPercentage: (this.getUtilization() * 100).toFixed(2),
      avgWaitTimeMinutes: this.getWqMinutes().toFixed(2),
      peopleInQueue,
      activeTickets: this.queue,
      systemAlert: this.checkServerAlerts(),
    };
}
}

module.exports = new QueueSystem();
