# TuTurno EMI

Todo el código inicial ya está fusionado en la rama develop.

### **📌 Reglas de GitFlow (¡Muy Importante!)**

1. **NO hacer push a main.**
2. Todo el trabajo se debe hacer sacando una rama desde develop. Ejemplo: git checkout -b feature/frontend-cliente.
3. Cuando terminen su parte, hacemos un *Pull Request* hacia develop.

---

## 🛠️ Guía de Instalación y Ejecución Local

Antes de empezar a programar, asegúrense de tener el entorno preparado. El proyecto está dividido en dos partes principales: el `backend` (Motor de colas y Sockets) y el `frontend` (Interfaz en React con Vite). **Ambos deben estar corriendo al mismo tiempo en terminales separadas.**

### 1️⃣ Prerrequisitos (Lo que necesitas instalado)

Si aún no los tienen, instalen estos programas en sus computadoras:

- **Node.js**: Descarguen la versión LTS (Recomendado v20+) desde [nodejs.org](https://nodejs.org/).
- **Git**: Para clonar y manejar las ramas del repositorio.

---

### 2️⃣ Levantar el Backend (Rol 1 y Rol 3)

Este servidor maneja la lógica matemática (Teoría de Colas M/M/c) y las conexiones en tiempo real.

Abre una terminal, ubícate en la carpeta raíz del proyecto y ejecuta:

```bash
# 1. Entra a la carpeta del backend
cd backend

# 2. Instala todas las dependencias (express, socket.io, cors, nodemon)
npm install

# 3. Arranca el servidor en modo desarrollo
npm run dev
```

---

### 3️⃣ Levantar el Frontend (Rol 2 y Rol 3)

Esta es la interfaz visual construida con React y empaquetada con Vite para máxima velocidad.

**Abre una NUEVA ventana de terminal** (no cierres la del backend), ubícate en la raíz del proyecto y ejecuta:

```bash
# 1. Entra a la carpeta del frontend
cd frontend

# 2. Instala todas las dependencias (react, react-dom, socket.io-client)
npm install

# 3. Arranca el servidor de desarrollo de Vite
npm run dev
```

---

### 💡 Tip Pro para el flujo de trabajo

- Si apagan la computadora y vuelven a trabajar al día siguiente, **ya no necesitan correr `npm install`** (a menos que alguien haya agregado una nueva librería al `package.json`).
- Solo necesitan abrir dos terminales: en una corren `cd backend && npm run dev` y en la otra `cd frontend && npm run dev`.

---

### **🧪 El Entorno de Pruebas**

En la carpeta backend/public/ dejé un archivo llamado test.html. **Abran ese archivo en su navegador mientras corren el servidor local (npm run dev).** Ahí podrán ver en vivo cómo el backend emite y recibe los eventos de Socket.io. Úsenlo como "guia" para saber cómo conectar sus componentes de React.

---

## **📱 Rol 2: Frontend Cliente (Experiencia del Usuario)**

**Objetivo:** Desarrollar la vista móvil (React) que verá el usuario final tras escanear el código QR en la sucursal.

**Responsabilidades Técnicas:**

- **Interfaz "Mobile-First":** Crear una vista limpia y sencilla. El usuario debe ver un botón claro de "Pedir Turno" (esto disparará el evento request_ticket al servidor).
- **Conexión en Tiempo Real:** Usar socket.io-client para escuchar el evento ticket_assigned. Debes mostrar en pantalla grande el número de turno asignado y el tiempo de espera estimado (Wq).
- **Accesibilidad (Text-to-Speech):** Implementar la Web Speech API para que el celular lea el turno en voz alta cuando se escuche el evento ticket_called.
    - *Nota técnica:* Los navegadores bloquean el audio si el usuario no ha interactuado con la pantalla.

---

## **💻 Rol 3: Frontend Administrador y Base de Datos**

**Objetivo:** Crear el panel de control del cajero/administrador (React) y estructurar la persistencia de datos del sistema.

**Responsabilidades Técnicas (Frontend):**

- **Dashboard Desktop:** Diseñar la vista donde el cajero atenderá la fila. Debe contener:
    - Un botón gigante de "Llamar Siguiente" (dispara el evento call_next).
    - Botones para simular la apertura o cierre de ventanillas (eventos add_server y remove_server).
    - Indicadores en tiempo real: Cuánta gente hay en fila y la utilización del sistema ($\rho$).
- **Sistema de Alertas Dinámicas:** El backend está evaluando los datos de nuestra encuesta en tiempo real. Si el tiempo de espera supera los 10, 20 o 30 minutos, el backend enviará un objeto metrics.systemAlert. **Debes renderizar banners de colores (Info, Advertencia, Peligro, Crítico)** para avisarle al administrador que debe abrir o cerrar cajas.

**Responsabilidades Técnicas (Base de Datos):**

- **Diseño e Integración:** Decidir y configurar PostgreSQL o SQLite.
- **Persistencia:** Actualmente, los turnos viven en un arreglo en memoria en el archivo queue.js del backend. Tu tarea es reemplazar ese arreglo por consultas a la base de datos (ej. guardar la hora exacta en la que se creó el turno y la hora en la que fue atendido).
- **Diseño Unificado:** Asegurarte de que ambas vistas (Cliente y Admin) compartan la misma paleta de colores (ej. usando Tailwind CSS o Bootstrap).

---

### **🔌 Referencia Rápida de Sockets (Backend) (Lo que agregue)**

- **Eventos que el Frontend ESCUCHA (socket.on):**
    - queue_update: Recibe un objeto con las métricas (personas en fila, $W_q$, $\rho$ y el sistema de alertas).
    - ticket_assigned: Recibe el ticket específico para el cliente que lo pidió (Vista Cliente).
    - ticket_called: Recibe el ID del turno que debe pasar a ventanilla (Vista Admin y Cliente).
- **Eventos que el Frontend EMITE (socket.emit):**
    - request_ticket: Lo dispara el botón "Pedir Turno" del cliente.
    - call_next: Lo dispara el botón "Llamar Siguiente" del cajero.

add_server / remove_server: Lo disparan los botones de control de ventanillas del cajero.