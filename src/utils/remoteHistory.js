import supabase from '../lib/supabaseClient.js';

const TABLE_NAME = 'quiz_attempts';

export const guardarIntentoRemoto = async (usuarioId, intento) => {
  if (!usuarioId || !intento) {
    return { success: false, error: new Error('Faltan datos para guardar el intento remoto') };
  }

  try {
    const payload = {
      user_id: usuarioId,
      intento_id: intento.id,
      fecha: intento.fecha,
      configuracion: intento.configuracion,
      preguntas: intento.preguntas,
      respuestas: intento.respuestas,
      respuestas_texto: intento.respuestasTexto ?? null,
      aciertos: intento.aciertos,
      tiempo_total: intento.tiempoTotal,
      tiempo_empleado: intento.tiempoEmpleado,
    };

    const { error } = await supabase.from(TABLE_NAME).insert(payload);

    if (error) {
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
};

export const cargarIntentosRemotos = async (usuarioId, limite = 20) => {
  if (!usuarioId) {
    return { success: false, data: [], error: new Error('Falta el identificador de usuario') };
  }

  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('user_id', usuarioId)
      .order('fecha', { ascending: false })
      .limit(limite);

    if (error) {
      return { success: false, data: [], error };
    }

    const adaptados =
      data?.map((registro) => ({
        id: registro.intento_id ?? registro.id,
        fecha: registro.fecha,
        configuracion: registro.configuracion,
        preguntas: registro.preguntas ?? [],
        respuestas: registro.respuestas ?? [],
        respuestasTexto: registro.respuestas_texto ?? [],
        aciertos: registro.aciertos ?? 0,
        tiempoTotal: registro.tiempo_total ?? null,
        tiempoEmpleado: registro.tiempo_empleado ?? null,
      })) ?? [];

    return { success: true, data: adaptados };
  } catch (error) {
    return { success: false, data: [], error };
  }
};
