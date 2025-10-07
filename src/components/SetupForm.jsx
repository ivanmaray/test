import { useEffect, useMemo, useState } from 'react';
import { ROSCO_TOTAL } from '../data/roscoQuestions.js';

const SetupForm = ({ categorias, dificultades, subcategoriasPorCategoria, usuario, onStart, deshabilitarInicio }) => {
  const [modo, setModo] = useState('personalizado');
  const [categoria, setCategoria] = useState(categorias[0] ?? '');
  const obtenerDificultadBase = () => dificultades.find((item) => item !== 'Todas') ?? dificultades[0] ?? '';
  const [dificultad, setDificultad] = useState(obtenerDificultadBase);
  const [subcategoria, setSubcategoria] = useState('todas');
  const [mezclarDificultades, setMezclarDificultades] = useState(false);
  const [numeroPreguntas, setNumeroPreguntas] = useState('10');
  const [tiempoPorPregunta, setTiempoPorPregunta] = useState('60');

  const isRosco = modo === 'rosco';

  const subcategoriasDisponibles = useMemo(() => {
    const lista = subcategoriasPorCategoria.get(categoria) ?? [];
    return lista.length > 0 ? ['todas', ...lista] : [];
  }, [categoria, subcategoriasPorCategoria]);

  const defaultDificultad = useMemo(() => obtenerDificultadBase(), [dificultades]);
  const dificultadesDisponibles = useMemo(
    () => dificultades.filter((item) => item !== 'Todas'),
    [dificultades],
  );

  useEffect(() => {
    const lista = subcategoriasPorCategoria.get(categoria) ?? [];
    setSubcategoria((prev) => {
      if (modo === 'aleatorio' || lista.length === 0) {
        return 'todas';
      }
      if (prev !== 'todas' && lista.includes(prev)) {
        return prev;
      }
      return 'todas';
    });
  }, [categoria, modo, subcategoriasPorCategoria]);

  useEffect(() => {
    if (mezclarDificultades || modo === 'aleatorio') {
      setDificultad('Todas');
      return;
    }

    setDificultad((prev) => {
      if (prev === 'Todas' || !dificultades.includes(prev)) {
        return defaultDificultad;
      }
      return prev;
    });
  }, [mezclarDificultades, modo, dificultades, defaultDificultad]);

  useEffect(() => {
    if (!isRosco) {
      return;
    }
    if (!mezclarDificultades) {
      setMezclarDificultades(true);
    }
    if (dificultad !== 'Todas') {
      setDificultad('Todas');
    }
    if (subcategoria !== 'todas') {
      setSubcategoria('todas');
    }
    if (numeroPreguntas !== String(ROSCO_TOTAL)) {
      setNumeroPreguntas(String(ROSCO_TOTAL));
    }
    if (tiempoPorPregunta !== '30') {
      setTiempoPorPregunta('30');
    }
  }, [isRosco, mezclarDificultades, dificultad, subcategoria, numeroPreguntas, tiempoPorPregunta]);

  const resumenSeleccion = useMemo(() => {
    const chips = [
      {
        etiqueta: 'Modo',
        valor:
          modo === 'personalizado' ? 'Dirigido' : modo === 'aleatorio' ? 'Aleatorio' : 'PasaPalabra',
      },
      {
        etiqueta: 'Categoría',
        valor: modo === 'personalizado' ? categoria || '—' : 'Todas',
      },
      {
        etiqueta: 'Subcategoría',
        valor: modo === 'personalizado' && subcategoria !== 'todas' ? subcategoria : null,
      },
      {
        etiqueta: 'Dificultad',
        valor: mezclarDificultades || isRosco || modo === 'aleatorio' ? 'Mezcladas' : dificultad,
      },
      {
        etiqueta: 'Preguntas',
        valor: isRosco ? `${ROSCO_TOTAL}` : `${numeroPreguntas}`,
      },
      {
        etiqueta: 'Tiempo',
        valor: isRosco ? '5 min globales' : `${tiempoPorPregunta} seg`,
      },
    ];

    return chips.filter((chip) => chip.valor);
  }, [modo, categoria, subcategoria, dificultad, mezclarDificultades, numeroPreguntas, tiempoPorPregunta]);

  const quickPresets = useMemo(
    () => [
      {
        id: 'flash-10',
        icono: '⚡️',
        titulo: 'Flash 10 preguntas',
        descripcion: 'Aleatorio · 45 seg',
        ajustes: {
          modo: 'aleatorio',
          mezclarDificultades: true,
          numeroPreguntas: 10,
          tiempoPorPregunta: 45,
        },
      },
      {
        id: 'rosco',
        icono: '🔤',
        titulo: 'PasaPalabra',
        descripcion: 'Rosco completo · 5 min',
        ajustes: {
          modo: 'rosco',
        },
      },
      {
        id: 'dirigido-20',
        icono: '🧬',
        titulo: 'Terapias avanzadas',
        descripcion: '15 preguntas · 60 seg',
        ajustes: {
          modo: 'personalizado',
          categoria: categorias.find((item) => item.includes('Hematología')) ?? categorias[0] ?? '',
          subcategoria: 'Terapias avanzadas',
          dificultad: 'Intermedio',
          numeroPreguntas: 15,
          tiempoPorPregunta: 60,
          mezclarDificultades: false,
        },
      },
      {
        id: 'farmacogenetica-12',
        icono: '🧪',
        titulo: 'Farmacogenética exprés',
        descripcion: '12 preguntas · 55 seg',
        ajustes: {
          modo: 'personalizado',
          categoria: categorias.find((item) => item.includes('Farmacología')) ?? categorias[0] ?? '',
          subcategoria: 'Farmacogenética',
          dificultad: 'Intermedio',
          numeroPreguntas: 12,
          tiempoPorPregunta: 55,
          mezclarDificultades: false,
        },
      },
      {
        id: 'soporte-18',
        icono: '🛡️',
        titulo: 'Cuidados y soporte',
        descripcion: '18 preguntas · 50 seg',
        ajustes: {
          modo: 'personalizado',
          categoria: categorias.find((item) => item.includes('Cuidados y soporte')) ?? categorias[0] ?? '',
          dificultad: 'Intermedio',
          numeroPreguntas: 18,
          tiempoPorPregunta: 50,
          mezclarDificultades: false,
        },
      },
      {
        id: 'oncopediatria-20',
        icono: '🧒',
        titulo: 'Oncopediatría intensiva',
        descripcion: '20 preguntas · 60 seg',
        ajustes: {
          modo: 'personalizado',
          categoria: categorias.find((item) => item.includes('Casos clínicos')) ?? categorias[0] ?? '',
          subcategoria: 'Oncopediatría',
          dificultad: 'Avanzado',
          numeroPreguntas: 20,
          tiempoPorPregunta: 60,
          mezclarDificultades: false,
        },
      },
    ],
    [categorias],
  );

  const tiempoTotalEstimado = useMemo(() => {
    if (isRosco) {
      return { totalSegundos: 300, etiqueta: '5m 00s' };
    }
    const totalSegundos = Number(numeroPreguntas) * Number(tiempoPorPregunta);
    const minutos = Math.floor(totalSegundos / 60);
    const segundos = totalSegundos % 60;
    const etiqueta = `${minutos}m ${segundos.toString().padStart(2, '0')}s`;
    return { totalSegundos, etiqueta };
  }, [numeroPreguntas, tiempoPorPregunta, isRosco]);

  const insights = useMemo(
    () => [
      isRosco && {
        icono: '🔥',
        titulo: 'Reto pasaletras',
        descripcion: 'Recorre el alfabeto oncológico en 5 minutos. Ideal para repasar términos clave y vocabulario clínico.',
      },
      !isRosco && {
        icono: '🧭',
        titulo: modo === 'personalizado' ? 'Control dirigido' : 'Modo aleatorio',
        descripcion:
          modo === 'personalizado'
            ? 'Selecciona una categoría y subcategoría concreta para profundizar exactamente donde lo necesitas.'
            : 'Te proponemos una mezcla equilibrada de categorías y dificultades para descubrir puntos ciegos.',
      },
      {
        icono: '⏱️',
        titulo: 'Duración estimada',
        descripcion: `Tu simulacro actual dura aproximadamente ${tiempoTotalEstimado.etiqueta}. Ajusta tiempo o preguntas si necesitas una sesión más corta.`,
      },
      !isRosco && {
        icono: '🎓',
        titulo: 'Dificultad adaptativa',
        descripcion: mezclarDificultades
          ? 'Las preguntas alternarán niveles. Si prefieres un reto concreto, desactiva la mezcla y escoge dificultad.'
          : 'Elige el nivel que más se ajuste a tu objetivo o activa la mezcla para simular el examen completo.',
      },
      {
        icono: '🗂️',
        titulo: 'Variedad de categorías',
        descripcion: `Tienes ${categorias.length} grandes bloques temáticos disponibles. Combina clínica, farmacología y soporte para un repaso completo.`,
      },
    ].filter(Boolean),
    [modo, tiempoTotalEstimado.etiqueta, mezclarDificultades, categorias, isRosco],
  );

  const aplicarPreset = (preset) => {
    const ajustes = preset.ajustes;
    const modoDestino = ajustes.modo ?? 'personalizado';
    setModo(modoDestino);

    if (modoDestino === 'rosco') {
      setCategoria(categorias[0] ?? categoria);
      setSubcategoria('todas');
      setDificultad('Todas');
      setNumeroPreguntas(String(ajustes.numeroPreguntas ?? ROSCO_TOTAL));
      setTiempoPorPregunta(String(ajustes.tiempoPorPregunta ?? 30));
      setMezclarDificultades(true);
      return;
    }

    const categoriaDestino = ajustes.categoria && categorias.includes(ajustes.categoria)
      ? ajustes.categoria
      : categoria;
    if (categoriaDestino) {
      setCategoria(categoriaDestino);
    }

    const listaSubcategorias = subcategoriasPorCategoria.get(categoriaDestino) ?? [];
    if (modoDestino === 'aleatorio') {
      setSubcategoria('todas');
    } else if (ajustes.subcategoria && listaSubcategorias.includes(ajustes.subcategoria)) {
      setSubcategoria(ajustes.subcategoria);
    } else {
      setSubcategoria('todas');
    }

    if (ajustes.dificultad && dificultades.includes(ajustes.dificultad)) {
      setDificultad(ajustes.dificultad);
    }

    setNumeroPreguntas(
      ajustes.numeroPreguntas !== undefined ? String(ajustes.numeroPreguntas) : numeroPreguntas,
    );
    setTiempoPorPregunta(
      ajustes.tiempoPorPregunta !== undefined ? String(ajustes.tiempoPorPregunta) : tiempoPorPregunta,
    );
    setMezclarDificultades(Boolean(ajustes.mezclarDificultades));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (isRosco) {
      onStart({
        modo: 'rosco',
        categoria: 'Todas',
        dificultad: 'Todas',
        mezclarDificultades: true,
        subcategoria: 'todas',
        numeroPreguntas: 20,
        tiempoPorPregunta: 30,
      });
      return;
    }

    onStart({
      modo,
      categoria,
      dificultad,
      mezclarDificultades,
      subcategoria,
      numeroPreguntas: Number(numeroPreguntas),
      tiempoPorPregunta: Number(tiempoPorPregunta),
    });
  };

  return (
    <section className="setup">
      <header className="setup__intro">
        <h2>Configura tu simulacro</h2>
        <p>
          Bienvenido, <strong>{usuario}</strong>. Ajusta el cuestionario a tu plan de estudio o aplica una plantilla rápida para
          empezar al instante.
        </p>
      </header>

      <ul className="setup__chips">
        {resumenSeleccion.map((chip) => (
          <li key={chip.etiqueta}>
            <span>{chip.etiqueta}</span>
            <strong>{chip.valor}</strong>
          </li>
        ))}
      </ul>

      <div className="setup__quick">
        <span>Plantillas recomendadas</span>
        <div className="setup__quick-scroll">
          {quickPresets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className="setup__quick-button"
              onClick={() => aplicarPreset(preset)}
              title={`Aplicar plantilla ${preset.titulo}`}
            >
              <span className="setup__quick-icon" aria-hidden>
                {preset.icono}
              </span>
              <div>
                <strong>{preset.titulo}</strong>
                <small>{preset.descripcion}</small>
              </div>
            </button>
          ))}
        </div>
      </div>

      <form className="setup__form" onSubmit={handleSubmit}>
          <fieldset className="setup__group">
            <legend>Modo de cuestionario</legend>

            <div className="setup__options">
              <label className={`setup__card ${modo === 'personalizado' ? 'setup__card--active' : ''}`}>
                <input
                  type="radio"
                  name="modo"
                  value="personalizado"
                  checked={modo === 'personalizado'}
                  onChange={() => setModo('personalizado')}
                />
                <div className="setup__card-icon" aria-hidden>
                  🎯
                </div>
                <div className="setup__card-body">
                  <strong>Dirigido</strong>
                  <span>Control total sobre categoría, subcategoría y dificultad.</span>
                </div>
              </label>

              <label className={`setup__card ${modo === 'aleatorio' ? 'setup__card--active' : ''}`}>
                <input
                  type="radio"
                  name="modo"
                  value="aleatorio"
                  checked={modo === 'aleatorio'}
                  onChange={() => setModo('aleatorio')}
                />
                <div className="setup__card-icon" aria-hidden>
                  🔀
                </div>
                <div className="setup__card-body">
                  <strong>Aleatorio</strong>
                  <span>Te mezclamos categorías y niveles automáticamente.</span>
                </div>
              </label>

              <label className={`setup__card ${modo === 'rosco' ? 'setup__card--active' : ''}`}>
                <input
                  type="radio"
                  name="modo"
                  value="rosco"
                  checked={modo === 'rosco'}
                  onChange={() => setModo('rosco')}
                />
                <div className="setup__card-icon" aria-hidden>
                  🔤
                </div>
                <div className="setup__card-body">
                  <strong>PasaPalabra</strong>
                  <span>Un rosco oncológico completo. Responde con texto libre en 5 minutos.</span>
                </div>
              </label>
            </div>
          </fieldset>

          <div className="setup__fields">
            <label className="setup__field">
              <span>Categoría</span>
              <select
                value={categoria}
                onChange={(event) => setCategoria(event.target.value)}
                required={modo === 'personalizado'}
                disabled={modo !== 'personalizado'}
              >
                {categorias.map((categoriaActual) => (
                  <option key={categoriaActual} value={categoriaActual}>
                    {categoriaActual}
                  </option>
                ))}
              </select>
            </label>

            <label className="setup__field">
              <span>Dificultad</span>
              <select
                value={mezclarDificultades || modo !== 'personalizado' ? 'Todas' : dificultad}
                onChange={(event) => setDificultad(event.target.value)}
                disabled={mezclarDificultades || modo !== 'personalizado'}
                required
              >
                {(mezclarDificultades || modo !== 'personalizado') && (
                  <option value="Todas">Todas las dificultades (automático)</option>
                )}
                {dificultadesDisponibles.map((dificultadActual) => (
                  <option key={dificultadActual} value={dificultadActual}>
                    {dificultadActual}
                  </option>
                ))}
              </select>
            </label>

            {modo === 'personalizado' && subcategoriasDisponibles.length > 0 && (
              <label className="setup__field setup__field--wide">
                <span>Subcategoría</span>
                <select value={subcategoria} onChange={(event) => setSubcategoria(event.target.value)}>
                  {subcategoriasDisponibles.map((opcion) => (
                    <option key={opcion} value={opcion}>
                      {opcion === 'todas' ? 'Todas las subcategorías' : opcion}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <label className="setup__field">
              <span>Número de preguntas</span>
              <input
                type="number"
                min={1}
                max={50}
                value={numeroPreguntas}
                onChange={(event) => setNumeroPreguntas(event.target.value)}
                disabled={isRosco}
              />
            </label>

            <label className="setup__field">
              <span>Tiempo por pregunta (seg)</span>
              <input
                type="number"
                min={20}
                max={300}
                step={5}
                value={tiempoPorPregunta}
                onChange={(event) => setTiempoPorPregunta(event.target.value)}
                disabled={isRosco}
              />
            </label>
          </div>

          <label className="setup__toggle">
            <span>Mezclar preguntas de distintas dificultades</span>
            <input
              type="checkbox"
              checked={mezclarDificultades}
              onChange={(event) => setMezclarDificultades(event.target.checked)}
              disabled={isRosco}
            />
          </label>

          <footer className="setup__footer">
            <div className="setup__footer-copy">
              <span>
                Duración máxima estimada: <strong>{tiempoTotalEstimado.etiqueta}</strong>
              </span>
              <span>
                Preguntas configuradas: <strong>{numeroPreguntas}</strong>
              </span>
            </div>
            <button type="submit" className="setup__submit" disabled={deshabilitarInicio}>
              Lanzar simulacro
            </button>
          </footer>
      </form>

      <aside className="setup__insights">
        <h3>Consejos rápidos</h3>
        <ul className="setup__insights-list">
          {insights.map((insight) => (
            <li key={insight.titulo}>
              <span aria-hidden>{insight.icono}</span>
              <div>
                <strong>{insight.titulo}</strong>
                <p>{insight.descripcion}</p>
              </div>
            </li>
          ))}
        </ul>
      </aside>
    </section>
  );
};

export default SetupForm;
