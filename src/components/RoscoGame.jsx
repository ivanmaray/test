import { useEffect, useMemo, useRef, useState } from 'react';
import { buildRoscoQuestionSet } from '../data/roscoQuestions.js';

const TOTAL_TIME_SECONDS = 300;

const normalizeText = (text) =>
  text
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');

const buildPreguntasResumen = (preguntasBase) => {
  return preguntasBase.map((item) => ({
    id: `rosco-${item.letra}`,
    pregunta: `Con la ${item.letra}: ${item.pista}`,
    categoria: item.categoria ?? 'Rosco',
    subcategoria: item.letra,
    opciones: [item.respuesta],
    respuestaCorrecta: 0,
    tipo: 'rosco',
    letra: item.letra,
    pista: item.pista,
    respuestaCorrectaTexto: item.respuesta,
  }));
};

const RoscoGame = ({ onComplete, onAbort }) => {
  const preguntasBase = useMemo(() => buildRoscoQuestionSet(), []);
  const [queue, setQueue] = useState(() => preguntasBase.map((_, index) => index));
  const [status, setStatus] = useState(() =>
    preguntasBase.map(() => ({ estado: 'pendiente', respuesta: '' })),
  );
  const [input, setInput] = useState('');
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME_SECONDS);
  const [elapsed, setElapsed] = useState(0);
  const circleRef = useRef(null);
  const [circleSize, setCircleSize] = useState(0);

  const currentIndex = queue[0];
  const preguntaActual = currentIndex !== undefined ? preguntasBase[currentIndex] : null;
  const totalPreguntas = preguntasBase.length;
  const aciertos = status.filter((item) => item.estado === 'acierto').length;
  const fallos = status.filter((item) => item.estado === 'fallo').length;
  const pendientes = status.filter((item) => item.estado === 'pendiente').length;
  const progresoPorcentaje =
    totalPreguntas > 0 ? Math.round((aciertos / totalPreguntas) * 100) : 0;
  const estimatedCircle = circleSize || 320;
  const letterRadius = Math.max(estimatedCircle / 2 - 32, 0);

  useEffect(() => {
    if (timeLeft <= 0) {
      finalizar(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  useEffect(() => {
    if (queue.length === 0 || timeLeft <= 0) {
      return undefined;
    }
    const id = window.setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => window.clearInterval(id);
  }, [queue.length, timeLeft]);

  useEffect(() => {
    if (!circleRef.current) {
      return undefined;
    }
    const element = circleRef.current;
    const updateSize = () => {
      setCircleSize(element.offsetWidth);
    };

    updateSize();

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', updateSize);
      return () => window.removeEventListener('resize', updateSize);
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setCircleSize(entry.contentRect.width);
      }
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const finalizar = (porTiempo) => {
    const estadoFinal = status.map((item) =>
      item.estado === 'pendiente' ? { ...item, estado: 'sin_responder' } : item,
    );
    const preguntasResumen = buildPreguntasResumen(preguntasBase);
    const respuestasTexto = estadoFinal.map((item) => item.respuesta);
    const respuestasIndices = estadoFinal.map((item) => {
      if (item.estado === 'acierto') return 0;
      if (item.estado === 'sin_responder') return undefined;
      return -1;
    });
    const aciertos = estadoFinal.filter((item) => item.estado === 'acierto').length;
    const tiempoEmpleado = Math.min(TOTAL_TIME_SECONDS, elapsed);

    onComplete({
      preguntas: preguntasResumen,
      respuestasIndices,
      respuestasTexto,
      aciertos,
      tiempoTotal: TOTAL_TIME_SECONDS,
      tiempoEmpleado,
      configuracion: {
        modo: 'rosco',
        categoria: 'Todas',
        dificultad: 'Todas',
        mezclarDificultades: true,
        subcategoria: 'todas',
        numeroPreguntas: preguntasResumen.length,
        tiempoPorPregunta: 30,
      },
      finalizadoPorTiempo: porTiempo,
    });
  };

  const actualizarEstado = (indexPregunta, nuevoEstado, respuestaUsuario) => {
    setStatus((prev) => {
      const copia = [...prev];
      copia[indexPregunta] = { estado: nuevoEstado, respuesta: respuestaUsuario };
      return copia;
    });
  };

  const avanzarCola = (nuevaCola) => {
    if (nuevaCola.length === 0) {
      finalizar(false);
    }
    setQueue(nuevaCola);
    setInput('');
  };

  const manejarRespuesta = (event) => {
    event.preventDefault();
    if (currentIndex === undefined) return;
    const esperado = normalizeText(preguntaActual.respuesta);
    const recibido = normalizeText(input);
    const esCorrecto = recibido === esperado;
    actualizarEstado(
      currentIndex,
      esCorrecto ? 'acierto' : 'fallo',
      input.trim(),
    );
    avanzarCola(queue.slice(1));
  };

  const manejarPasar = () => {
    if (currentIndex === undefined) return;
    avanzarCola([...queue.slice(1), currentIndex]);
  };

  const letras = preguntasBase.map((item, index) => {
    const estado = status[index]?.estado ?? 'pendiente';
    return {
      letra: item.letra,
      estado,
      index,
    };
  });

  const posicionLetra = (indice, total, esActiva) => {
    if (total === 0) {
      return undefined;
    }
    const angulo = (indice / total) * 2 * Math.PI - Math.PI / 2;
    const x = Math.cos(angulo) * letterRadius;
    const y = Math.sin(angulo) * letterRadius;
    const base = `translate(-50%, -50%) translate(${x}px, ${y}px)`;
    return {
      transform: esActiva ? `${base} scale(1.1)` : base,
    };
  };

  return (
    <section className="rosco">
      <header className="rosco__header">
        <div>
          <h2>Modo PasaPalabra</h2>
          <p>Responde el rosco completo antes de que el tiempo se agote. Pulsa “Pasar” para volver a la letra al final.</p>
        </div>
        <div className="rosco__meta">
          <div className="rosco__timer">
            <span>Tiempo restante</span>
            <strong>{new Date(timeLeft * 1000).toISOString().substring(14, 19)}</strong>
          </div>
          <div className="rosco__progress">
            <span>Progreso</span>
            <strong>{progresoPorcentaje}%</strong>
            <div
              className="rosco__progress-bar"
              role="progressbar"
              aria-valuemin={0}
              aria-valuenow={aciertos}
              aria-valuemax={totalPreguntas}
              aria-label="Letras resueltas"
            >
              <div style={{ width: `${progresoPorcentaje}%` }} />
            </div>
            <small>
              {aciertos}/{totalPreguntas} letras
            </small>
          </div>
          <button type="button" onClick={onAbort}>
            Abandonar
          </button>
        </div>
      </header>

      <div className="rosco__status">
        <div className="rosco__status-item rosco__status-item--aciertos">
          <span>Aciertos</span>
          <strong>{aciertos}</strong>
        </div>
        <div className="rosco__status-item rosco__status-item--fallos">
          <span>Fallos</span>
          <strong>{fallos}</strong>
        </div>
        <div className="rosco__status-item rosco__status-item--pendientes">
          <span>Pendientes</span>
          <strong>{pendientes}</strong>
        </div>
      </div>

      <div className="rosco__circle" ref={circleRef}>
        <div className="rosco__circle-core" aria-hidden />
        <div className="rosco__circle-glow" aria-hidden />
        <div className="rosco__center-badge" aria-hidden />
        {letras.map((item) => (
          <span
            key={item.letra}
            style={posicionLetra(item.index, letras.length, item.index === currentIndex)}
            className={`rosco__letter rosco__letter--${item.estado} ${
              item.index === currentIndex ? 'rosco__letter--active' : ''
            }`}
            aria-label={`Letra ${item.letra}`}
          >
            {item.letra}
          </span>
        ))}
      </div>

      {preguntaActual ? (
        <form className="rosco__panel" onSubmit={manejarRespuesta}>
          <div className="rosco__prompt">
            <span className="rosco__prompt-letter">{preguntaActual.letra}</span>
            <p>{preguntaActual.pista}</p>
          </div>

          <input
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Escribe tu respuesta"
            autoFocus
          />

          <div className="rosco__actions">
            <button type="button" onClick={manejarPasar}>
              Pasar
            </button>
            <button type="submit" className="rosco__submit">
              Responder
            </button>
          </div>
        </form>
      ) : (
        <div className="rosco__panel rosco__panel--fin">
          <p>¡Rosco completado!</p>
        </div>
      )}
    </section>
  );
};

export default RoscoGame;
