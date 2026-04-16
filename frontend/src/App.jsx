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
      : 'https://adbb-216-230-142-67.ngrok-free.app'
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
