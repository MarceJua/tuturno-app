# TuTurno — Cambios Rol 2 (Frontend Cliente)

Documento para replicar todos los cambios hechos en la sesión de trabajo.
Aplica los archivos en el orden indicado.

---

## 1. `frontend/index.html`

Agrega el título y las fuentes de Google al `<head>`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>TuTurno</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Space+Mono:wght@400;700&family=Outfit:wght@300;400;500;600&display=swap" rel="stylesheet">
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

---

## 2. `frontend/vite.config.js`

Reemplazar el archivo completo. El proxy ya no es necesario porque conectamos directo al backend, pero `allowedHosts` es necesario para ngrok.

> **Nota:** Cambia el host de `allowedHosts` por el que te genere ngrok para el frontend.

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ['fc73-216-230-142-67.ngrok-free.app'],
    proxy: {
      '/socket.io': {
        target: 'http://localhost:3000',
        ws: true,
        changeOrigin: true,
      },
    },
  },
})
```

---

## 3. `frontend/src/index.css`

Solo cambiar una línea dentro de `#root`: `width` de `1126px` a `480px`.

```css
#root {
  width: 480px;        /* Era: 1126px */
  max-width: 100%;
  margin: 0 auto;
  text-align: center;
  border-inline: 1px solid var(--border);
  min-height: 100svh;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}
```

---

## 4. `frontend/src/App.jsx`

Reemplazar el archivo completo:

> **Nota:** Si vas a probar con ngrok, cambia la URL del backend en la línea marcada con `← CAMBIAR`.

```jsx
import { useState, useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import './App.css'

function App() {
  const [status, setStatus] = useState('idle')
  const [myTicket, setMyTicket] = useState(null)
  const [queueInfo, setQueueInfo] = useState(null)

  const socketRef = useRef(null)
  const myTicketRef = useRef(null)
  const audioUnlockedRef = useRef(false)

  // Keep ref in sync with state to avoid stale closure in socket listeners
  useEffect(() => {
    myTicketRef.current = myTicket
  }, [myTicket])

  // Socket lifecycle — connect once on mount, disconnect on unmount
  useEffect(() => {
    const backendUrl = window.location.hostname === 'localhost'
      ? 'http://localhost:3000'
      : 'https://adbb-216-230-142-67.ngrok-free.app'  // ← CAMBIAR por tu URL de ngrok del backend
    const socket = io(backendUrl)
    socketRef.current = socket

    socket.on('ticket_assigned', (ticket) => {
      setMyTicket(ticket)
      setStatus('assigned')
    })

    socket.on('ticket_called', (ticket) => {
      if (myTicketRef.current && ticket.id === myTicketRef.current.id) {
        setStatus('called')
        speakTicket(ticket.id)
      }
    })

    socket.on('queue_update', (metrics) => {
      setQueueInfo(metrics)
      // Recalcular tiempo estimado individual según posición actual en la cola
      if (myTicketRef.current && metrics.activeTickets) {
        const pos = metrics.activeTickets.findIndex(t => t.id === myTicketRef.current.id)
        if (pos !== -1) {
          const wq = parseFloat(metrics.avgWaitTimeMinutes)
          const individualWait = isFinite(wq) ? (wq * (pos + 1)).toFixed(2) : 'Infinity'
          setMyTicket(prev => ({ ...prev, estimatedWaitMinutes: individualWait }))
        }
      }
    })

    return () => {
      socket.disconnect()
    }
  }, [])

  function handlePedirTurno() {
    // Unlock Web Speech API on first real user gesture (browser requirement)
    if (!audioUnlockedRef.current) {
      window.speechSynthesis.speak(new SpeechSynthesisUtterance(''))
      audioUnlockedRef.current = true
    }
    setStatus('waiting')
    socketRef.current.emit('request_ticket')
  }

  function speakTicket(ticketId) {
    if (!audioUnlockedRef.current) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(
      `Turno ${ticketId}, pasar a ventanilla`
    )
    utterance.rate = 0.9

    // Preferir voz en español latinoamericano, con fallback a cualquier español
    const voices = window.speechSynthesis.getVoices()
    const preferred = ['es-GT', 'es-419', 'es-MX', 'es-US', 'es-CO', 'es-AR']
    const voice =
      preferred.reduce((found, lang) =>
        found || voices.find(v => v.lang === lang), null
      ) || voices.find(v => v.lang.startsWith('es'))

    if (voice) {
      utterance.voice = voice
      utterance.lang = voice.lang
    } else {
      utterance.lang = 'es-MX'
    }

    window.speechSynthesis.speak(utterance)
  }

  return (
    <main className={`app app--${status}`}>
      {/* Ambient background orb */}
      <div className="app__orb" aria-hidden="true" />

      {/* Header — always visible */}
      <header className="app__header">
        <div className="app__logo">
          <span className="app__logo-mark">T</span>
          <span className="app__logo-text">TuTurno</span>
        </div>
        <p className="app__tagline">Colas más cortas, servicio más inteligente</p>
      </header>

      {/* ─── IDLE STATE ─── */}
      {status === 'idle' && (
        <section className="state state--idle" key="idle">
          <div className="idle__illustration" aria-hidden="true">
            <div className="idle__ring idle__ring--1" />
            <div className="idle__ring idle__ring--2" />
            <div className="idle__ring idle__ring--3" />
            <span className="idle__icon">◈</span>
          </div>

          <div className="idle__copy">
            <h2 className="idle__headline">Su turno digital,<br />sin filas de papel.</h2>
            <p className="idle__sub">
              Toque el botón para recibir su número de turno y esperar donde prefiera.
            </p>
          </div>

          {queueInfo && (
            <div className="idle__stats">
              <div className="idle__stat">
                <span className="idle__stat-value">{queueInfo.peopleInQueue}</span>
                <span className="idle__stat-label">en espera</span>
              </div>
              <div className="idle__stat-divider" />
              <div className="idle__stat">
                <span className="idle__stat-value">
                  {isFinite(parseFloat(queueInfo.avgWaitTimeMinutes))
                    ? `~${Math.ceil(parseFloat(queueInfo.avgWaitTimeMinutes))} min`
                    : '—'}
                </span>
                <span className="idle__stat-label">tiempo estimado</span>
              </div>
              <div className="idle__stat-divider" />
              <div className="idle__stat">
                <span className="idle__stat-value">{queueInfo.servers}</span>
                <span className="idle__stat-label">ventanillas</span>
              </div>
            </div>
          )}

          <button
            className="btn-primary"
            onClick={handlePedirTurno}
            aria-label="Solicitar número de turno"
          >
            Pedir Turno
          </button>
        </section>
      )}

      {/* ─── WAITING STATE ─── */}
      {status === 'waiting' && (
        <section className="state state--waiting" key="waiting">
          <div className="waiting__spinner" aria-hidden="true">
            <div className="waiting__ring" />
            <div className="waiting__dot" />
          </div>
          <p className="waiting__text">Asignando su turno</p>
          <p className="waiting__sub">Un momento, por favor…</p>
        </section>
      )}

      {/* ─── ASSIGNED STATE ─── */}
      {status === 'assigned' && myTicket && (
        <section className="state state--assigned" key="assigned">
          <p className="ticket__label">Su número de turno</p>

          <div className="ticket__card">
            <div className="ticket__card-inner">
              <div className="ticket__number" aria-live="polite">
                {myTicket.id}
              </div>
              <div className="ticket__divider">
                <span />
                <span className="ticket__divider-circle" />
                <span />
              </div>
              <div className="ticket__meta">
                <div className="ticket__meta-item">
                  <span className="ticket__meta-value">
                    {isFinite(parseFloat(myTicket.estimatedWaitMinutes))
                      ? `~${Math.ceil(parseFloat(myTicket.estimatedWaitMinutes))} min`
                      : 'pronto'}
                  </span>
                  <span className="ticket__meta-label">espera estimada</span>
                </div>
                {queueInfo && (
                  <div className="ticket__meta-item">
                    <span className="ticket__meta-value">{queueInfo.peopleInQueue}</span>
                    <span className="ticket__meta-label">personas antes</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <p className="assigned__hint">
            Le avisaremos aquí cuando sea su turno.
          </p>
        </section>
      )}

      {/* ─── CALLED STATE ─── */}
      {status === 'called' && myTicket && (
        <section className="state state--called" key="called">
          <div className="called__banner" role="alert" aria-live="assertive">
            <span className="called__banner-pulse" aria-hidden="true" />
            <span className="called__banner-text">Es su turno</span>
          </div>

          <p className="ticket__label ticket__label--called">Su número de turno</p>

          <div className="ticket__card ticket__card--called">
            <div className="ticket__card-inner">
              <div className="ticket__number ticket__number--called" aria-live="assertive">
                {myTicket.id}
              </div>
              <div className="ticket__divider">
                <span />
                <span className="ticket__divider-circle" />
                <span />
              </div>
              <div className="ticket__meta">
                <div className="ticket__meta-item ticket__meta-item--full">
                  <span className="ticket__meta-value called__instruction">
                    Pase a ventanilla
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="app__footer">
        <span>TuTurno · Sistema M/M/c</span>
      </footer>
    </main>
  )
}

export default App
```

---

## 5. `frontend/src/App.css`

Reemplazar el archivo completo:

```css
/* ─────────────────────────────────────────────
   TuTurno · Frontend Cliente
   Aesthetic: "Digital Ticket Booth"
   Serif ticket number + mono accents + clean Outfit body
   ───────────────────────────────────────────── */

/* ── App Shell ── */
.app {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100svh;
  padding: 0 24px 24px;
  overflow: hidden;
  gap: 0;
  box-sizing: border-box;
  font-family: 'Outfit', var(--sans);
}

/* Ambient purple orb — atmospheric glow behind everything */
.app__orb {
  position: fixed;
  top: -120px;
  left: 50%;
  transform: translateX(-50%);
  width: 340px;
  height: 340px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    var(--accent-bg) 0%,
    transparent 70%
  );
  pointer-events: none;
  z-index: 0;
  transition: opacity 0.8s ease;
}

.app--called .app__orb {
  opacity: 2;
  background: radial-gradient(
    circle,
    rgba(170, 59, 255, 0.25) 0%,
    transparent 70%
  );
  animation: orb-pulse 2s ease-in-out infinite;
}

@keyframes orb-pulse {
  0%, 100% { transform: translateX(-50%) scale(1); opacity: 1; }
  50%       { transform: translateX(-50%) scale(1.15); opacity: 0.7; }
}

/* ── Header ── */
.app__header {
  position: relative;
  z-index: 1;
  width: 100%;
  text-align: center;
  padding: 40px 0 28px;
}

.app__logo {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
}

.app__logo-mark {
  font-family: 'DM Serif Display', Georgia, serif;
  font-size: 28px;
  font-weight: 400;
  color: var(--accent);
  width: 36px;
  height: 36px;
  border: 2px solid var(--accent);
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  flex-shrink: 0;
}

.app__logo-text {
  font-family: 'Outfit', var(--sans);
  font-size: 22px;
  font-weight: 600;
  letter-spacing: -0.5px;
  color: var(--text-h);
}

.app__tagline {
  font-size: 13px;
  color: var(--text);
  letter-spacing: 0.3px;
  margin: 0;
  font-weight: 300;
}

/* ── States shared wrapper ── */
.state {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  width: 100%;
  animation: state-in 0.45s cubic-bezier(0.22, 1, 0.36, 1) both;
}

@keyframes state-in {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ───────────────────────────────────────
   IDLE STATE
─────────────────────────────────────── */
.state--idle {
  gap: 28px;
  padding-top: 4px;
}

/* Concentric ring illustration */
.idle__illustration {
  position: relative;
  width: 120px;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.idle__ring {
  position: absolute;
  border-radius: 50%;
  border: 1.5px solid var(--accent-border);
  animation: ring-breathe 3s ease-in-out infinite;
}

.idle__ring--1 { width: 120px; height: 120px; opacity: 0.25; animation-delay: 0s; }
.idle__ring--2 { width: 84px;  height: 84px;  opacity: 0.45; animation-delay: 0.4s; }
.idle__ring--3 { width: 52px;  height: 52px;  opacity: 0.7;  animation-delay: 0.8s; }

@keyframes ring-breathe {
  0%, 100% { transform: scale(1); opacity: var(--ring-base-opacity, 0.4); }
  50%       { transform: scale(1.04); opacity: calc(var(--ring-base-opacity, 0.4) * 1.6); }
}

.idle__icon {
  font-size: 28px;
  color: var(--accent);
  position: relative;
  z-index: 1;
  animation: icon-float 3s ease-in-out infinite;
}

@keyframes icon-float {
  0%, 100% { transform: translateY(0px); }
  50%       { transform: translateY(-4px); }
}

.idle__copy { text-align: center; }

.idle__headline {
  font-family: 'DM Serif Display', Georgia, serif;
  font-size: 26px;
  font-weight: 400;
  line-height: 1.3;
  color: var(--text-h);
  margin: 0 0 10px;
  letter-spacing: -0.3px;
}

.idle__sub {
  font-size: 15px;
  color: var(--text);
  line-height: 1.6;
  max-width: 280px;
  margin: 0 auto;
  font-weight: 300;
}

/* Live queue stats strip */
.idle__stats {
  display: flex;
  align-items: center;
  background: var(--accent-bg);
  border: 1px solid var(--accent-border);
  border-radius: 14px;
  padding: 14px 20px;
  width: 100%;
  box-sizing: border-box;
}

.idle__stat {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
}

.idle__stat-value {
  font-family: 'Space Mono', monospace;
  font-size: 18px;
  font-weight: 700;
  color: var(--accent);
  line-height: 1;
}

.idle__stat-label {
  font-size: 11px;
  color: var(--text);
  text-transform: uppercase;
  letter-spacing: 0.6px;
  font-weight: 500;
}

.idle__stat-divider {
  width: 1px;
  height: 32px;
  background: var(--accent-border);
  flex-shrink: 0;
}

/* ── Primary CTA Button ── */
.btn-primary {
  width: 100%;
  padding: 20px 32px;
  font-family: 'Outfit', var(--sans);
  font-size: 18px;
  font-weight: 600;
  letter-spacing: 0.3px;
  color: #fff;
  background: var(--accent);
  border: none;
  border-radius: 16px;
  cursor: pointer;
  box-shadow:
    0 4px 24px rgba(170, 59, 255, 0.35),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);
  transition:
    transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1),
    box-shadow 0.2s ease,
    opacity 0.2s;
  position: relative;
  overflow: hidden;
}

.btn-primary::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 60%);
  pointer-events: none;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow:
    0 8px 32px rgba(170, 59, 255, 0.45),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);
}

.btn-primary:active  { transform: scale(0.97) translateY(0); }
.btn-primary:focus-visible { outline: 3px solid var(--accent); outline-offset: 3px; }

/* ───────────────────────────────────────
   WAITING STATE
─────────────────────────────────────── */
.state--waiting {
  gap: 20px;
  justify-content: center;
  padding-bottom: 80px;
}

.waiting__spinner {
  position: relative;
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.waiting__ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 3px solid var(--border);
  border-top-color: var(--accent);
  animation: spin 0.9s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.waiting__dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--accent);
  animation: dot-pulse 0.9s ease-in-out infinite;
}

@keyframes dot-pulse {
  0%, 100% { transform: scale(0.8); opacity: 0.6; }
  50%       { transform: scale(1.2); opacity: 1; }
}

.waiting__text {
  font-family: 'DM Serif Display', Georgia, serif;
  font-size: 22px;
  color: var(--text-h);
  margin: 0;
  font-weight: 400;
}

.waiting__sub { font-size: 14px; color: var(--text); margin: 0; font-weight: 300; }

/* ───────────────────────────────────────
   TICKET CARD — shared by assigned + called
─────────────────────────────────────── */
.ticket__label {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: var(--text);
  font-weight: 500;
  margin: 0 0 14px;
  align-self: flex-start;
}

.ticket__label--called { color: var(--accent); }

.ticket__card {
  width: 100%;
  border: 1.5px solid var(--border);
  border-radius: 20px;
  background: var(--bg);
  box-shadow: var(--shadow);
  overflow: hidden;
  position: relative;
  transition: border-color 0.4s ease, box-shadow 0.4s ease;
}

/* Scanline texture — "physical ticket" feel */
.ticket__card::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: repeating-linear-gradient(
    0deg,
    transparent, transparent 3px,
    rgba(0, 0, 0, 0.012) 3px, rgba(0, 0, 0, 0.012) 4px
  );
  pointer-events: none;
  z-index: 0;
  border-radius: 18px;
}

.ticket__card--called {
  border-color: var(--accent);
  box-shadow:
    0 0 0 3px var(--accent-bg),
    0 0 40px rgba(170, 59, 255, 0.2),
    var(--shadow);
  animation: card-glow 2s ease-in-out infinite;
}

@keyframes card-glow {
  0%, 100% { box-shadow: 0 0 0 3px var(--accent-bg), 0 0 40px rgba(170,59,255,0.2), var(--shadow); }
  50%       { box-shadow: 0 0 0 5px var(--accent-bg), 0 0 60px rgba(170,59,255,0.35), var(--shadow); }
}

.ticket__card-inner { position: relative; z-index: 1; padding: 32px 28px 28px; }

/* THE ticket number */
.ticket__number {
  font-family: 'DM Serif Display', Georgia, serif;
  font-size: clamp(72px, 22vw, 96px);
  font-weight: 400;
  color: var(--text-h);
  line-height: 1;
  letter-spacing: -2px;
  text-align: center;
  margin: 0 0 24px;
  animation: number-appear 0.6s cubic-bezier(0.22, 1, 0.36, 1) both;
}

@keyframes number-appear {
  from { opacity: 0; transform: scale(0.85); }
  to   { opacity: 1; transform: scale(1); }
}

.ticket__number--called {
  color: var(--accent);
  animation:
    number-appear 0.3s cubic-bezier(0.22, 1, 0.36, 1) both,
    number-called-pulse 1.5s ease-in-out 0.3s 3;
}

@keyframes number-called-pulse {
  0%, 100% { transform: scale(1); }
  50%       { transform: scale(1.03); }
}

/* Perforated divider */
.ticket__divider {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 20px;
  overflow: hidden;
}

.ticket__divider span:first-child,
.ticket__divider span:last-child {
  flex: 1;
  height: 1px;
  background: repeating-linear-gradient(
    90deg,
    var(--border) 0px, var(--border) 6px,
    transparent 6px, transparent 12px
  );
}

.ticket__divider-circle {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--accent-bg);
  border: 1.5px solid var(--accent-border);
  flex-shrink: 0;
}

.ticket__meta { display: flex; gap: 16px; justify-content: center; }

.ticket__meta-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  flex: 1;
}

.ticket__meta-item--full { flex: unset; width: 100%; }

.ticket__meta-value {
  font-family: 'Space Mono', monospace;
  font-size: 16px;
  font-weight: 700;
  color: var(--text-h);
}

.ticket__meta-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: var(--text);
  font-weight: 500;
}

/* ───────────────────────────────────────
   ASSIGNED STATE
─────────────────────────────────────── */
.state--assigned { gap: 0; padding-top: 0; }

.assigned__hint {
  font-size: 13px;
  color: var(--text);
  text-align: center;
  margin: 16px 0 0;
  font-weight: 300;
  line-height: 1.6;
}

/* ───────────────────────────────────────
   CALLED STATE
─────────────────────────────────────── */
.state--called { gap: 0; padding-top: 0; }

.called__banner {
  width: 100%;
  background: var(--accent);
  border-radius: 14px;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 20px;
  box-sizing: border-box;
  position: relative;
  overflow: hidden;
  animation: banner-drop 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
}

@keyframes banner-drop {
  from { opacity: 0; transform: translateY(-20px) scale(0.95); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

.called__banner::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.18) 50%, transparent 70%);
  animation: shimmer 2.5s ease-in-out 0.5s infinite;
}

@keyframes shimmer {
  0%   { transform: translateX(-100%); }
  100% { transform: translateX(200%); }
}

.called__banner-pulse {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  flex-shrink: 0;
  animation: banner-dot-pulse 1.2s ease-in-out infinite;
}

@keyframes banner-dot-pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50%       { transform: scale(1.5); opacity: 0.5; }
}

.called__banner-text {
  font-family: 'Outfit', var(--sans);
  font-size: 18px;
  font-weight: 600;
  color: #fff;
  letter-spacing: 0.2px;
}

.called__instruction {
  font-size: 18px;
  color: var(--accent);
  font-family: 'Outfit', var(--sans);
  font-weight: 500;
}

/* ── Footer ── */
.app__footer {
  position: relative;
  z-index: 1;
  margin-top: auto;
  padding-top: 24px;
  font-size: 11px;
  color: var(--text);
  opacity: 0.5;
  font-family: 'Space Mono', monospace;
  letter-spacing: 0.3px;
}

/* ───────────────────────────────────────
   DARK MODE
─────────────────────────────────────── */
@media (prefers-color-scheme: dark) {
  .ticket__card::before {
    background-image: repeating-linear-gradient(
      0deg,
      transparent, transparent 3px,
      rgba(255,255,255,0.018) 3px, rgba(255,255,255,0.018) 4px
    );
  }

  .btn-primary {
    box-shadow: 0 4px 24px rgba(192,132,252,0.3), inset 0 1px 0 rgba(255,255,255,0.1);
  }

  .btn-primary:hover {
    box-shadow: 0 8px 32px rgba(192,132,252,0.4), inset 0 1px 0 rgba(255,255,255,0.1);
  }

  .ticket__card--called {
    box-shadow: 0 0 0 3px var(--accent-bg), 0 0 50px rgba(192,132,252,0.25), var(--shadow);
  }
}
```

---

## 6. `backend/src/index.js`

Agregar una línea después de `app.use(express.json())`:

```js
app.use(express.json());
app.use(express.static('public'));  // ← línea nueva
```

---

## 7. `backend/public/test.html`

Cambiar la línea del CDN de Socket.IO para que cargue desde el propio backend:

```html
<!-- Antes: -->
<script src="https://cdn.socket.io/4.7.5/socket.io.min.js"></script>

<!-- Después: -->
<script src="/socket.io/socket.io.js"></script>
```

---

## 8. ngrok (configuración opcional, para pruebas desde celular)

Editar `~/.config/ngrok/ngrok.yml` y agregar al final:

```yaml
tunnels:
  frontend:
    proto: http
    addr: 5173
  backend:
    proto: http
    addr: 3000
```

Luego correr:
```bash
ngrok start --all
```

Esto da dos URLs. Copiar la del backend (puerto 3000) y pegarla en `App.jsx` donde dice `CAMBIAR por tu URL de ngrok del backend`. También agregar la URL del frontend (puerto 5173) a `allowedHosts` en `vite.config.js`.

---

## Resumen de flujo para probar

1. Terminal 1: `cd backend && npm run dev`
2. Terminal 2: `cd frontend && npm run dev`
3. Abrir `http://localhost:5173` — vista cliente
4. Abrir `http://localhost:3000/test.html` — tablero de pruebas (admin)
5. En el cliente: clic **"Pedir Turno"** → aparece número y tiempo estimado
6. En el admin: clic **"Llamar Siguiente"** → el cliente ve el banner y escucha el TTS
