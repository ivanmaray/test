import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import SetupForm from './components/SetupForm.jsx';
import TestRunner from './components/TestRunner.jsx';
import Summary from './components/Summary.jsx';
import HistoryPanel from './components/HistoryPanel.jsx';
import LoginForm from './components/LoginForm.jsx';
import { useAuth } from './context/AuthContext.jsx';
import {
  preguntasDisponibles,
  categoriasDisponibles,
  dificultadesDisponibles,
  subcategoriasDisponibles,
} from './data/questions.js';
import { guardarResultado, cargarHistorial, eliminarHistorial } from './utils/historyStorage.js';

const mezclarPreguntas = (lista) => [...lista].sort(() => Math.random() - 0.5);

const calcularAciertos = (preguntas, respuestas) =>
  preguntas.reduce((total, pregunta, index) => total + (respuestas[index] === pregunta.respuestaCorrecta ? 1 : 0), 0);

const LegalFooter = () => (
  <footer className="legal-footer">
    <p>
      © 2025 Iván Maray. Plataforma elaborada para preparación educativa BPS Oncología. Preguntas generadas con apoyo de
      inteligencia artificial; no se garantiza la veracidad absoluta del contenido.
    </p>
    <p>
      Uso exclusivamente formativo. Contacto:{' '}
      <a href="mailto:ivanmaraymateos@gmail.com">ivanmaraymateos@gmail.com</a>
    </p>
  </footer>
);

const App = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const storageKey = user?.id ?? 'Invitado';
  const displayName = useMemo(
    () => user?.user_metadata?.full_name?.trim() || user?.email || 'Invitado',
    [user],
  );

  const FECHA_ACTUALIZACION = '6 de octubre de 2025';
  const [paso, setPaso] = useState('config');
  const [configuracion, setConfiguracion] = useState(null);
  const [preguntas, setPreguntas] = useState([]);
  const [indiceActual, setIndiceActual] = useState(0);
  const [respuestas, setRespuestas] = useState([]);
  const [resultado, setResultado] = useState(null);
  const [historial, setHistorial] = useState(() => cargarHistorial(storageKey));
  const [mensaje, setMensaje] = useState('');
  const [tiempoRestante, setTiempoRestante] = useState(null);
  const [tiempoTotal, setTiempoTotal] = useState(null);
  const [categoriasDesplegadas, setCategoriasDesplegadas] = useState(() => new Set());
  const setupSectionRef = useRef(null);
  const statsSectionRef = useRef(null);

  const subcategoriasPorCategoria = useMemo(() => {
    const mapa = new Map();

    categoriasDisponibles.forEach((categoria) => {
      const lista = subcategoriasDisponibles
        .filter((subcategoria) =>
          preguntasDisponibles.some(
            (pregunta) => pregunta.categoria === categoria && pregunta.subcategoria === subcategoria,
          ),
        )
        .sort();
      mapa.set(categoria, lista);
    });

    return mapa;
  }, []);

  const dificultadesConDatos = useMemo(() => {
    const base = dificultadesDisponibles.filter((dificultad) =>
      preguntasDisponibles.some((pregunta) => pregunta.dificultad === dificultad),
    );
    return ['Todas', ...base];
  }, []);

  const estadisticasPreguntas = useMemo(() => {
    const total = preguntasDisponibles.length;

    const subcategoriasPorCategoriaStats = new Map();

    const porCategoria = categoriasDisponibles
      .map((categoria) => {
        const totalCategoria = preguntasDisponibles.filter((pregunta) => pregunta.categoria === categoria).length;
        const detalleSubcategorias = subcategoriasDisponibles
          .map((subcategoria) => {
            const totalSubcategoria = preguntasDisponibles.filter(
              (pregunta) => pregunta.categoria === categoria && pregunta.subcategoria === subcategoria,
            ).length;
            return totalSubcategoria > 0
              ? {
                  etiqueta: subcategoria,
                  total: totalSubcategoria,
                  porcentajeTotal: total === 0 ? 0 : (totalSubcategoria / total) * 100,
                  porcentajeCategoria: totalCategoria === 0 ? 0 : (totalSubcategoria / totalCategoria) * 100,
                }
              : null;
          })
          .filter(Boolean)
          .sort((a, b) => b.total - a.total);

        if (detalleSubcategorias.length > 0) {
          subcategoriasPorCategoriaStats.set(categoria, detalleSubcategorias);
        }

        return {
          etiqueta: categoria,
          total: totalCategoria,
          porcentaje: total === 0 ? 0 : (totalCategoria / total) * 100,
        };
      })
      .filter((item) => item.total > 0)
      .sort((a, b) => b.total - a.total);

    const porDificultad = dificultadesDisponibles
      .map((dificultad) => {
        const totalDificultad = preguntasDisponibles.filter((pregunta) => pregunta.dificultad === dificultad).length;
        return {
          etiqueta: dificultad,
          total: totalDificultad,
          porcentaje: total === 0 ? 0 : (totalDificultad / total) * 100,
        };
      })
      .filter((item) => item.total > 0)
      .sort((a, b) => b.total - a.total);

    const porSubcategoria = subcategoriasDisponibles
      .map((subcategoria) => {
        const totalSubcategoria = preguntasDisponibles.filter((pregunta) => pregunta.subcategoria === subcategoria).length;
        return {
          etiqueta: subcategoria,
          total: totalSubcategoria,
          porcentaje: total === 0 ? 0 : (totalSubcategoria / total) * 100,
        };
      })
      .filter((item) => item.total > 0)
      .sort((a, b) => b.total - a.total);

    return {
      total,
      porCategoria,
      porDificultad,
      porSubcategoria,
      subcategoriasPorCategoria: subcategoriasPorCategoriaStats,
    };
  }, []);

  const heroHighlights = useMemo(() => {
    return [
      {
        label: 'Preguntas únicas',
        value: estadisticasPreguntas.total.toLocaleString('es-ES'),
      },
      {
        label: 'Categorías clínicas',
        value: estadisticasPreguntas.porCategoria.length.toLocaleString('es-ES'),
      },
      {
        label: 'Subcategorías disponibles',
        value: estadisticasPreguntas.porSubcategoria.length.toLocaleString('es-ES'),
      },
    ];
  }, [estadisticasPreguntas]);

  useEffect(() => {
    setHistorial(cargarHistorial(storageKey));
  }, [storageKey]);

  const alternarCategoria = useCallback((categoria) => {
    setCategoriasDesplegadas((previas) => {
      const siguiente = new Set(previas);
      if (siguiente.has(categoria)) {
        siguiente.delete(categoria);
      } else {
        siguiente.add(categoria);
      }
      return siguiente;
    });
  }, []);

  const scrollToSetup = useCallback(() => {
    if (setupSectionRef.current) {
      setupSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const scrollToStats = useCallback(() => {
    if (statsSectionRef.current) {
      statsSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const estadisticasHistorial = useMemo(() => {
    if (historial.length === 0) {
      return null;
    }

    let totalAciertos = 0;
    let totalPreguntas = 0;
    const agregadosPorCategoria = new Map();

    historial.forEach((registro) => {
      totalAciertos += registro.aciertos;
      totalPreguntas += registro.preguntas.length;

      registro.preguntas.forEach((pregunta, index) => {
        const categoria = pregunta.categoria ?? 'Sin categoría';
        const contenedor = agregadosPorCategoria.get(categoria) ?? { total: 0, aciertos: 0 };
        contenedor.total += 1;
        if (registro.respuestas[index] === pregunta.respuestaCorrecta) {
          contenedor.aciertos += 1;
        }
        agregadosPorCategoria.set(categoria, contenedor);
      });
    });

    const mediaGeneral = totalPreguntas === 0 ? null : totalAciertos / totalPreguntas;
    const categorias = Array.from(agregadosPorCategoria.entries())
      .map(([categoria, datos]) => ({
        categoria,
        aciertos: datos.aciertos,
        total: datos.total,
        porcentaje: datos.total === 0 ? 0 : datos.aciertos / datos.total,
      }))
      .sort((a, b) => b.porcentaje - a.porcentaje);

    return { mediaGeneral, categorias };
  }, [historial]);

  const iniciarTest = ({
    modo,
    categoria,
    dificultad,
    mezclarDificultades,
    subcategoria,
    numeroPreguntas,
    tiempoPorPregunta,
  }) => {
    const nombreUsuario = displayName;

    let pool = [];

    if (modo === 'aleatorio') {
      pool = mezclarDificultades
        ? preguntasDisponibles
        : dificultad === 'Todas'
          ? preguntasDisponibles
          : preguntasDisponibles.filter((pregunta) => pregunta.dificultad === dificultad);
    } else {
      const filtroBase = preguntasDisponibles.filter((pregunta) => pregunta.categoria === categoria);

      const filtroPorSubcategoria =
        subcategoria && subcategoria !== 'todas'
          ? filtroBase.filter((pregunta) => pregunta.subcategoria === subcategoria)
          : filtroBase;

      const filtradas =
        mezclarDificultades || dificultad === 'Todas'
          ? filtroPorSubcategoria
          : filtroPorSubcategoria.filter((pregunta) => pregunta.dificultad === dificultad);

      pool = filtradas.length > 0 ? filtradas : filtroPorSubcategoria;
    }

    const preguntasFinales = mezclarPreguntas(pool).slice(0, numeroPreguntas);

    if (preguntasFinales.length === 0) {
      setMensaje('No hay preguntas disponibles para la selección elegida todavía.');
      return;
    }

    setMensaje('');
    setConfiguracion({
      modo,
      categoria,
      dificultad,
      mezclarDificultades,
      subcategoria,
      numeroPreguntas: preguntasFinales.length,
      tiempoPorPregunta,
      usuario: nombreUsuario,
    });
    setPreguntas(preguntasFinales);
    setIndiceActual(0);
    setRespuestas(Array(preguntasFinales.length).fill(undefined));
    setResultado(null);
    const totalTiempo = preguntasFinales.length * tiempoPorPregunta;
    setTiempoTotal(totalTiempo);
    setTiempoRestante(totalTiempo);
    setPaso('quiz');
  };

  const seleccionarRespuesta = (indiceRespuesta) => {
    setRespuestas((respuestasPrevias) => {
      const nuevasRespuestas = [...respuestasPrevias];
      nuevasRespuestas[indiceActual] = indiceRespuesta;
      return nuevasRespuestas;
    });
  };

  const irASiguiente = () => {
    setIndiceActual((indicePrevio) => Math.min(indicePrevio + 1, preguntas.length - 1));
  };

  const irAnterior = () => {
    setIndiceActual((indicePrevio) => Math.max(indicePrevio - 1, 0));
  };

  const finalizarTest = useCallback(
    (respuestasCompletas) => {
      const respuestasFinales = respuestasCompletas ?? respuestas;
      const aciertos = calcularAciertos(preguntas, respuestasFinales);
      const nombreHistorial = storageKey;

      const nuevoResultado = {
        id: `resultado-${Date.now()}`,
        fecha: new Date().toISOString(),
        configuracion,
        preguntas,
        respuestas: respuestasFinales,
        aciertos,
        tiempoTotal,
        tiempoEmpleado: configuracion ? tiempoTotal - (tiempoRestante ?? 0) : null,
      };

      guardarResultado(nombreHistorial, nuevoResultado);
      setHistorial((historialPrevio) => [nuevoResultado, ...historialPrevio].slice(0, 20));
      setResultado(nuevoResultado);
      setPaso('summary');
    },
    [configuracion, preguntas, respuestas, tiempoRestante, tiempoTotal, storageKey],
  );

  const finalizarDesdeUI = () => {
    finalizarTest([...respuestas]);
  };

  useEffect(() => {
    if (paso !== 'quiz' || tiempoRestante === null) {
      return undefined;
    }

    if (tiempoRestante <= 0) {
      finalizarTest([...respuestas]);
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setTiempoRestante((prev) => (prev !== null && prev > 0 ? prev - 1 : prev));
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [paso, tiempoRestante, respuestas, finalizarTest]);

  useEffect(() => {
    if (paso === 'summary') {
      setTiempoRestante(null);
      setTiempoTotal(null);
    }
  }, [paso]);

  const reiniciar = () => {
    setPaso('config');
    setConfiguracion(null);
    setPreguntas([]);
    setIndiceActual(0);
    setRespuestas([]);
    setResultado(null);
    setTiempoRestante(null);
    setTiempoTotal(null);
  };

  const limpiarHistorial = () => {
    const confirmacion = window.confirm(
      `Se eliminará el historial local de ${displayName}. ¿Quieres continuar?`,
    );
    if (!confirmacion) {
      return;
    }
    eliminarHistorial(storageKey);
    setHistorial([]);
    setMensaje('Historial local eliminado.');
  };

  if (authLoading) {
    return (
      <main className="app">
        <section className="auth auth--loading">
          <h1>Preparación BPS Oncología</h1>
          <p>Cargando sesión…</p>
        </section>
        <LegalFooter />
      </main>
    );
  }

  if (!user) {
    return (
      <main className="app app--auth">
        <LoginForm />
        <LegalFooter />
      </main>
    );
  }

  return (
    <main className="app">
      <header className="hero">
        <div className="hero__content">
          <span className="hero__badge">Actualizado {FECHA_ACTUALIZACION}</span>
          <h1 className="hero__title">Diseña tu estrategia para el BPS de Oncología</h1>
          <p className="hero__description">
            Construye simulacros hiperpersonalizados, analiza tus resultados y refuerza las áreas críticas de farmacia oncológica en cuestión de minutos.
          </p>
          <ul className="hero__features">
            <li>
              <span className="hero__feature-icon" aria-hidden>
                ⚡️
              </span>
              Simulacros por categoría, subcategoría, dificultad y tiempo por pregunta.
            </li>
            <li>
              <span className="hero__feature-icon" aria-hidden>
                🧬
              </span>
              Banco enriquecido con terapias avanzadas, farmacogenética y casos clínicos reales.
            </li>
            <li>
              <span className="hero__feature-icon" aria-hidden>
                📊
              </span>
              Estadísticas instantáneas, exportación de resultados y seguimiento histórico.
            </li>
          </ul>
          <div className="hero__actions">
            <button type="button" className="hero__cta" onClick={scrollToSetup}>
              Comenzar simulacro
            </button>
            <button type="button" className="hero__ghost" onClick={scrollToStats}>
              Explorar banco de preguntas
            </button>
          </div>
        </div>
        <aside className="hero__metrics">
          <div className="hero__session">
            <span className="hero__user-label">Usuario actual:</span>
            <span className="hero__user-name">{displayName}</span>
            <button type="button" className="hero__signout" onClick={signOut}>
              Cerrar sesión
            </button>
          </div>
          <div className="hero__metric-grid">
            {heroHighlights.map((item) => (
              <div key={item.label} className="hero__metric">
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
          <p className="hero__note">Optimiza tu estudio con datos actualizados, revisiones guiadas y descarga de resultados en CSV.</p>
        </aside>
      </header>

      <div className="app__content">
        <section className="storage-note">
          <div className="storage-note__content">
            <span className="storage-note__icon" aria-hidden>
              💾
            </span>
            <p>
              <strong>Nota:</strong> El historial se guarda únicamente en este navegador. Aunque accedes con Supabase, el progreso aún
              no se sincroniza en la nube.
            </p>
          </div>
          <button type="button" className="storage-note__button" onClick={limpiarHistorial}>
            Borrar historial local
          </button>
        </section>

        {paso === 'config' && (
          <>
            <div ref={setupSectionRef}>
              <SetupForm
                categorias={categoriasDisponibles}
                dificultades={dificultadesConDatos}
                subcategoriasPorCategoria={subcategoriasPorCategoria}
                usuario={displayName}
                onStart={iniciarTest}
                deshabilitarInicio={false}
              />
            </div>

            {mensaje && (
              <section className="setup__alert">
                <p>{mensaje}</p>
              </section>
            )}

            {historial.length > 0 && (
              <HistoryPanel
                historial={historial}
                estadisticas={estadisticasHistorial}
                usuario={displayName}
              />
            )}
          </>
        )}

        {paso === 'quiz' && preguntas[indiceActual] && (
          <TestRunner
            pregunta={preguntas[indiceActual]}
            indiceActual={indiceActual}
            totalPreguntas={preguntas.length}
            respuestaSeleccionada={respuestas[indiceActual]}
            onSeleccionRespuesta={seleccionarRespuesta}
            onSiguiente={irASiguiente}
            onAnterior={irAnterior}
            esPrimera={indiceActual === 0}
            esUltima={indiceActual === preguntas.length - 1}
            onFinalizar={finalizarDesdeUI}
            tiempoRestante={tiempoRestante}
            tiempoTotal={tiempoTotal}
          />
        )}

        {paso === 'summary' && resultado && <Summary resultado={resultado} onRestart={reiniciar} />}

        {paso === 'config' && (
          <section ref={statsSectionRef} className="question-stats">
            <div className="question-stats__summary">
              <div>
                <span className="question-stats__label">Total de preguntas</span>
                <strong className="question-stats__value">{estadisticasPreguntas.total}</strong>
              </div>
              <div>
                <span className="question-stats__label">Última actualización</span>
                <strong className="question-stats__value question-stats__value--small">{FECHA_ACTUALIZACION}</strong>
              </div>
            </div>

            <div className="question-stats__lists">
              <div>
                <h3 className="question-stats__title">
                  <span aria-hidden>🗂️</span>Categorías
                </h3>
                <ul>
                  {estadisticasPreguntas.porCategoria.map((item) => {
                    const subcategorias = estadisticasPreguntas.subcategoriasPorCategoria.get(item.etiqueta) ?? null;
                    const desplegada = subcategorias ? categoriasDesplegadas.has(item.etiqueta) : false;
                    const idSubcategorias = `subcategorias-${item.etiqueta.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

                    return (
                      <li key={item.etiqueta}>
                        <div
                          className="question-stats__row"
                          role={subcategorias ? 'button' : undefined}
                          tabIndex={subcategorias ? 0 : undefined}
                          onClick={() => subcategorias && alternarCategoria(item.etiqueta)}
                          onKeyDown={(event) => {
                            if (!subcategorias) {
                              return;
                            }
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault();
                              alternarCategoria(item.etiqueta);
                            }
                          }}
                          style={{ cursor: subcategorias ? 'pointer' : 'default' }}
                          aria-expanded={subcategorias ? desplegada : undefined}
                          aria-controls={subcategorias ? idSubcategorias : undefined}
                        >
                          {subcategorias && (
                            <span className="question-stats__toggle" aria-hidden>
                              {desplegada ? '▾' : '▸'}
                            </span>
                          )}
                          <span>{item.etiqueta}</span>
                          <strong>{item.total}</strong>
                        </div>
                        <div className="question-stats__bar">
                          <div style={{ width: `${Math.max(item.porcentaje, 2).toFixed(1)}%` }} />
                        </div>
                        {subcategorias && desplegada && (
                          <ul className="question-stats__sublist" id={idSubcategorias}>
                            {subcategorias.map((sub) => (
                              <li key={sub.etiqueta}>
                                <div className="question-stats__row">
                                  <span>{sub.etiqueta}</span>
                                  <strong>{sub.total}</strong>
                                </div>
                                <div className="question-stats__bar question-stats__bar--sub">
                                  <div style={{ width: `${Math.max(sub.porcentajeCategoria, 2).toFixed(1)}%` }} />
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div>
                <h3 className="question-stats__title">
                  <span aria-hidden>🎚️</span>Dificultades
                </h3>
                <ul>
                  {estadisticasPreguntas.porDificultad.map((item) => (
                    <li key={item.etiqueta}>
                      <div className="question-stats__row">
                        <span>{item.etiqueta}</span>
                        <strong>{item.total}</strong>
                      </div>
                      <div className="question-stats__bar">
                        <div style={{ width: `${Math.max(item.porcentaje, 2).toFixed(1)}%` }} />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        )}
      </div>
      <LegalFooter />
    </main>
  );
};

export default App;
