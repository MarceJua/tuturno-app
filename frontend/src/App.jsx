import { useState, useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import './App.css'

// Personalizable por cliente
const CLIENT_NAME = 'TuTurno'

function App() {
  const [status, setStatus] = useState('idle')
  const [myTicket, setMyTicket] = useState(null)
  const [queueInfo, setQueueInfo] = useState(null)

  const socketRef = useRef(null)
  const myTicketRef = useRef(null)
  const audioUnlockedRef = useRef(false)

  useEffect(() => {
    myTicketRef.current = myTicket
  }, [myTicket])

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
        setMyTicket(prev => ({ ...prev, windowNumber: ticket.windowNumber }))
        setStatus('called')
        speakTicket(ticket.id, ticket.windowNumber)
      }
    })

    socket.on('queue_update', (metrics) => {
      setQueueInfo(metrics)
      if (myTicketRef.current && metrics.activeTickets) {
        const pos = metrics.activeTickets.findIndex(t => t.id === myTicketRef.current.id)
        if (pos !== -1) {
          const wq = parseFloat(metrics.avgWaitTimeMinutes)
          const individualWait = isFinite(wq) ? (wq * (pos + 1)).toFixed(2) : 'Infinity'
          setMyTicket(prev => ({ ...prev, estimatedWaitMinutes: individualWait }))
        }
      }
    })

    return () => socket.disconnect()
  }, [])

  function handlePedirTurno() {
    if (!audioUnlockedRef.current) {
      window.speechSynthesis.speak(new SpeechSynthesisUtterance(''))
      audioUnlockedRef.current = true
    }
    setStatus('waiting')
    socketRef.current.emit('request_ticket')
  }

  function speakTicket(ticketId, windowNumber) {
    if (!audioUnlockedRef.current) return
    window.speechSynthesis.cancel()
    const windowText = windowNumber ? `, ventanilla ${windowNumber}` : ', pasar a ventanilla'
    const utterance = new SpeechSynthesisUtterance(
      `Turno ${ticketId}${windowText}`
    )
    utterance.rate = 0.9
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

      {/* ─── IDLE ─── */}
      {status === 'idle' && (
        <div className="screen screen--idle">
          <header className="wordmark" aria-label="TuTurno">
            <img src="/favicon.png" className="wordmark__logo" alt="" aria-hidden="true" />
            <span className="wordmark__text">TuTurno</span>
          </header>

          <div className="idle__body">
            {/* Ícono representativo de cola/turno */}
            <div className="idle__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>

            <p className="idle__heading">
              Bienvenido a<br /><span>{CLIENT_NAME}</span>
            </p>

            {queueInfo && (
              <div className="idle__pill" aria-live="polite">
                <span className="idle__pill-dot" aria-hidden="true" />
                <span>
                  {queueInfo.peopleInQueue === 0
                    ? 'Sin espera ahora'
                    : `${queueInfo.peopleInQueue} ${queueInfo.peopleInQueue === 1 ? 'persona' : 'personas'} en espera`}
                </span>
                {isFinite(parseFloat(queueInfo.avgWaitTimeMinutes)) && queueInfo.peopleInQueue > 0 && (
                  <>
                    <span className="idle__pill-sep" aria-hidden="true">·</span>
                    <span>~{Math.ceil(parseFloat(queueInfo.avgWaitTimeMinutes))} min</span>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="idle__cta-zone">
            <p className="idle__hint">Toque para obtener su número de turno</p>
            <button
              className="btn-cta"
              onClick={handlePedirTurno}
              aria-label="Solicitar número de turno"
            >
              Pedir Turno
            </button>
          </div>
        </div>
      )}

      {/* ─── WAITING ─── */}
      {status === 'waiting' && (
        <div className="screen screen--waiting" aria-live="polite">
          <div className="waiting__spinner" aria-hidden="true" />
          <p className="waiting__label">Asignando tu turno…</p>
        </div>
      )}

      {/* ─── ASSIGNED ─── */}
      {status === 'assigned' && myTicket && (
        <div className="screen screen--assigned">
          <header className="wordmark wordmark--sm" aria-label="TuTurno">
            <img src="/favicon.png" className="wordmark__logo" alt="" aria-hidden="true" />
            <span className="wordmark__text">TuTurno</span>
          </header>

          <div className="assigned__body">
            <div className="assigned__badge">
              <span className="assigned__badge-dot" aria-hidden="true" />
              En cola
            </div>

            <p className="assigned__eyebrow">Su número de turno</p>
            <p className="assigned__number" aria-live="polite" aria-atomic="true">
              {myTicket.id}
            </p>

            <div className="assigned__row">
              <div className="assigned__stat assigned__stat--highlight">
                <span className="assigned__stat-icon" aria-hidden="true">⏱</span>
                <span className="assigned__stat-value">
                  {isFinite(parseFloat(myTicket.estimatedWaitMinutes))
                    ? `~${Math.ceil(parseFloat(myTicket.estimatedWaitMinutes))} min`
                    : '—'}
                </span>
                <span className="assigned__stat-label">Espera est.</span>
              </div>
              {queueInfo && (
                <div className="assigned__stat">
                  <span className="assigned__stat-icon" aria-hidden="true">👥</span>
                  <span className="assigned__stat-value">{queueInfo.peopleInQueue}</span>
                  <span className="assigned__stat-label">En cola</span>
                </div>
              )}
              {queueInfo && (
                <div className="assigned__stat">
                  <span className="assigned__stat-icon" aria-hidden="true">🏦</span>
                  <span className="assigned__stat-value">{queueInfo.servers}</span>
                  <span className="assigned__stat-label">Ventanillas</span>
                </div>
              )}
            </div>

            {/* Barra de progreso animada — señal visual de que el sistema está activo */}
            <div className="assigned__progress" aria-hidden="true">
              <div className="assigned__progress-fill" />
            </div>
          </div>

          <p className="assigned__footer">
            Le avisaremos cuando sea tu turno
          </p>
        </div>
      )}

      {/* ─── CALLED ─── */}
      {status === 'called' && myTicket && (
        <div className="screen screen--called" role="alert" aria-live="assertive" aria-atomic="true">
          <div className="called__top">
            {/* Ícono de campana */}
            <div className="called__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
            </div>
            <p className="called__label">Pase a ventanilla</p>
          </div>
          <p className="called__number">{myTicket.id}</p>
          {myTicket.windowNumber && (
            <div className="called__window">
              <span className="called__window-label">Ventanilla</span>
              <span className="called__window-number">{myTicket.windowNumber}</span>
            </div>
          )}
          <div className="called__divider" aria-hidden="true" />
        </div>
      )}

    </main>
  )
}

export default App
