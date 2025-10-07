import { descargarResultadoComoCSV } from '../utils/exporters.js';

const formatTime = (seconds) => {
  if (seconds === null || seconds === undefined) {
    return '--:--';
  }
  const minutos = Math.floor(seconds / 60);
  const segundos = seconds % 60;
  return `${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;
};

const buildAggregate = (preguntas, respuestas, clave) => {
  return preguntas.reduce((acc, pregunta, index) => {
    const key = pregunta[clave] ?? 'Sin categoría';
    if (!acc[key]) {
      acc[key] = { total: 0, aciertos: 0 };
    }
    acc[key].total += 1;
    if (respuestas[index] === pregunta.respuestaCorrecta) {
      acc[key].aciertos += 1;
    }
    return acc;
  }, {});
};

const Summary = ({ resultado, onRestart, onLaunchPreset }) => {
  const { respuestas, preguntas, aciertos, configuracion, tiempoTotal, tiempoEmpleado, respuestasTexto } = resultado;
  const respuestasLibres = respuestasTexto ?? [];
  const totalPreguntas = preguntas.length;
  const sinResponder = respuestas.filter((respuesta) => respuesta === undefined).length;
  const fallos = totalPreguntas - aciertos - sinResponder;
  const porcentaje = Math.round((aciertos / totalPreguntas) * 100);

  const resumenPorCategoria = buildAggregate(preguntas, respuestas, 'categoria');
  const resumenPorDificultad = buildAggregate(preguntas, respuestas, 'dificultad');
  const resumenPorSubcategoria = buildAggregate(preguntas, respuestas, 'subcategoria');

  const tiempoMedio = tiempoEmpleado && totalPreguntas > 0 ? Math.round(tiempoEmpleado / totalPreguntas) : null;

  const recomendaciones = (() => {
    const lista = [];

    const categoriasProblematicas = Object.entries(resumenPorCategoria)
      .map(([categoria, datos]) => ({
        tipo: 'categoria',
        etiqueta: categoria,
        total: datos.total,
        aciertos: datos.aciertos,
        precision: datos.total === 0 ? 0 : datos.aciertos / datos.total,
      }))
      .filter((item) => item.total >= 3 && item.precision < 0.8 && item.etiqueta !== 'Sin categoría')
      .sort((a, b) => a.precision - b.precision)
      .slice(0, 2);

    const subcategoriasProblematicas = Object.entries(resumenPorSubcategoria)
      .map(([subcategoria, datos]) => ({
        tipo: 'subcategoria',
        etiqueta: subcategoria,
        total: datos.total,
        aciertos: datos.aciertos,
        precision: datos.total === 0 ? 0 : datos.aciertos / datos.total,
      }))
      .filter(
        (item) =>
          item.total >= 2 &&
          item.precision < 0.75 &&
          item.etiqueta &&
          item.etiqueta !== 'Sin categoría',
      )
      .sort((a, b) => a.precision - b.precision)
      .slice(0, 2);

    const tiempoReferencia = configuracion?.tiempoPorPregunta ?? 60;
    const dificultadReferencia = configuracion?.dificultad ?? 'Todas';

    categoriasProblematicas.forEach((item) => {
      lista.push({
        titulo: `Refuerza ${item.etiqueta}`,
        descripcion: `Acertaste ${item.aciertos} de ${item.total} (${Math.round(item.precision * 100)}%).`,
        config: {
          modo: 'personalizado',
          categoria: item.etiqueta,
          subcategoria: 'todas',
          dificultad: dificultadReferencia,
          mezclarDificultades: false,
          numeroPreguntas: Math.min(20, Math.max(10, item.total * 2)),
          tiempoPorPregunta: tiempoReferencia,
        },
      });
    });

    subcategoriasProblematicas.forEach((item) => {
      lista.push({
        titulo: `Repasa ${item.etiqueta}`,
        descripcion: `Solo ${Math.round(item.precision * 100)}% de acierto (${item.aciertos}/${item.total}).`,
        config: {
          modo: 'personalizado',
          categoria: preguntas.find((pregunta) => pregunta.subcategoria === item.etiqueta)?.categoria ?? configuracion.categoria,
          subcategoria: item.etiqueta,
          dificultad: dificultadReferencia,
          mezclarDificultades: false,
          numeroPreguntas: Math.min(15, Math.max(8, item.total * 2)),
          tiempoPorPregunta: tiempoReferencia,
        },
      });
    });

    return lista.slice(0, 3);
  })();

  return (
    <section className="summary">
      <header className="summary__header">
        <h2>Resultado final</h2>
        <p>
          Puntuación: <strong>{aciertos}</strong> / {totalPreguntas} ({porcentaje}%)
        </p>
        <p>
          Configuración:{' '}
          {configuracion.modo === 'aleatorio'
            ? 'Test aleatorio'
            : configuracion.modo === 'rosco'
            ? 'PasaPalabra'
            : configuracion.categoria ?? 'Sin categoría'}
          {configuracion.modo === 'personalizado' &&
          configuracion.subcategoria &&
          configuracion.subcategoria !== 'todas'
            ? ` · ${configuracion.subcategoria}`
            : ''}
          {' · '}
          {configuracion.mezclarDificultades
            ? 'Mezcla de dificultades'
            : configuracion.dificultad === 'Todas'
            ? 'Todas las dificultades'
            : configuracion.dificultad}
        </p>
        {tiempoEmpleado !== null && tiempoTotal !== null && (
          <p>
            Tiempo empleado: {formatTime(tiempoEmpleado)} de {formatTime(tiempoTotal)} · promedio {formatTime(tiempoMedio)} por
            pregunta
          </p>
        )}
        <div className="summary__stats">
          <div>
            <strong>Aciertos</strong>
            <span>{aciertos}</span>
          </div>
          <div>
            <strong>Fallos</strong>
            <span>{fallos}</span>
          </div>
          <div>
            <strong>Sin responder</strong>
            <span>{sinResponder}</span>
          </div>
        </div>
      </header>

      {recomendaciones.length > 0 && (
        <section className="summary__recommendations">
          <h3>Revisión inteligente</h3>
          <p>
            Te proponemos entrenamientos focalizados según los bloques donde obtuviste menor precisión. Lánzalos al instante o toma nota
            para el configurador.
          </p>
          <ul>
            {recomendaciones.map((recomendacion) => (
              <li key={recomendacion.titulo}>
                <div>
                  <strong>{recomendacion.titulo}</strong>
                  <span>{recomendacion.descripcion}</span>
                </div>
                <button
                  type="button"
                  onClick={() => onLaunchPreset?.(recomendacion.config)}
                  disabled={!onLaunchPreset}
                >
                  Lanzar repaso dirigido
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="summary__aggregates">
        <div>
          <h3>Por categoría</h3>
          <ul>
            {Object.entries(resumenPorCategoria).map(([categoria, valores]) => (
              <li key={categoria}>
                {categoria}: {valores.aciertos}/{valores.total}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3>Por dificultad</h3>
          <ul>
            {Object.entries(resumenPorDificultad).map(([nivel, valores]) => (
              <li key={nivel}>
                {nivel}: {valores.aciertos}/{valores.total}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3>Por subcategoría</h3>
          <ul>
            {Object.entries(resumenPorSubcategoria).map(([sub, valores]) => (
              <li key={sub}>
                {sub}: {valores.aciertos}/{valores.total}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="summary__list">
        {preguntas.map((pregunta, index) => {
          const respuestaUsuario = respuestas[index];
          const correcta = respuestaUsuario === pregunta.respuestaCorrecta;

          return (
            <article
              key={pregunta.id}
              className={`summary__item ${correcta ? 'summary__item--correcta' : 'summary__item--incorrecta'}`}
            >
              <h3>{pregunta.pregunta}</h3>
              <p>
                <strong>Categoría:</strong> {pregunta.categoria}
                {pregunta.subcategoria ? ` · ${pregunta.subcategoria}` : ''}
              </p>
              <p>
                Tu respuesta:{' '}
                <strong>
                  {(() => {
                    const libre = respuestasLibres[index]?.trim();
                    if (libre) {
                      return libre;
                    }
                    if (typeof respuestaUsuario === 'number' && respuestaUsuario >= 0) {
                      return pregunta.opciones?.[respuestaUsuario] ?? 'Sin responder';
                    }
                    if (respuestaUsuario === undefined) {
                      return 'Sin responder';
                    }
                    return '—';
                  })()}
                </strong>
              </p>
              {!correcta && (
                <p>
                  Respuesta correcta:{' '}
                  <strong>{pregunta.respuestaCorrectaTexto ?? pregunta.opciones?.[pregunta.respuestaCorrecta]}</strong>
                </p>
              )}
              <p className="summary__explicacion">{pregunta.explicacion}</p>
            </article>
          );
        })}
      </section>

      <footer className="summary__footer">
        <button type="button" onClick={() => descargarResultadoComoCSV(resultado)}>
          Descargar CSV
        </button>
        <button type="button" onClick={onRestart}>
          Volver al inicio
        </button>
      </footer>
    </section>
  );
};

export default Summary;
