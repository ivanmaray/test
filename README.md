# Simuped Onco Test

Simulador de preguntas tipo test para preparar el BS de oncología. Construido con React + Vite.

## Requisitos

- Node.js 20
- npm 10 (o superior)

## Instalación

```bash
npm install
```

### Configuración de Supabase

1. Copia el archivo `.env.example` a `.env`.
2. Rellena `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` con las credenciales de tu proyecto de Supabase.
3. Reinicia `npm run dev` para que Vite cargue las nuevas variables de entorno.

Si las variables no están presentes, la autenticación mostrará un aviso en consola y no se podrá iniciar sesión.

#### Sincronización de intentos en Supabase

El historial sigue guardándose en `localStorage`, pero también se envía a Supabase. Para ello crea (o adapta) una tabla `quiz_attempts` con la siguiente estructura mínima:

| Columna           | Tipo              | Detalles                                   |
|-------------------|-------------------|--------------------------------------------|
| `id`              | `uuid`            | `default uuid_generate_v4()` (opcional)    |
| `user_id`         | `uuid`            | referenciada a `auth.users`                |
| `intento_id`      | `text`            | ID generado en la app (index adicional)    |
| `fecha`           | `timestamptz`     |                                            |
| `configuracion`   | `jsonb`           |                                            |
| `preguntas`       | `jsonb`           |                                            |
| `respuestas`      | `jsonb`           |                                            |
| `respuestas_texto`| `jsonb`           | opcional; respuestas abiertas (rosco)      |
| `aciertos`        | `integer`         |                                            |
| `tiempo_total`    | `integer`         | segundos                                   |
| `tiempo_empleado` | `integer`         | segundos                                   |

Activa RLS y añade una política que permita a cada usuario insertar y leer sus propios intentos:

```sql
create policy \"Insert own attempts\" on quiz_attempts
  for insert with check (auth.uid() = user_id);

create policy \"Select own attempts\" on quiz_attempts
  for select using (auth.uid() = user_id);
```

## Scripts

- `npm run dev`: levanta Vite en modo desarrollo.
- `npm run build`: genera el build de producción en `dist/`.
- `npm run preview`: sirve el build generado para validarlo.
- `npm run lint`: ejecuta ESLint sobre `src/`.

## Flujo de trabajo

1. Ajusta filtros (categoría, subcategoría, dificultad y tiempo) y lanza el test.
2. Navega entre preguntas, consulta tiempo restante y finaliza cuando quieras.
3. Revisa el resumen con estadísticas por categoría/dificultad, descarga el CSV y consulta el historial reciente.

## CI/CD

Existe un workflow en `.github/workflows/ci.yml` que al hacer push o abrir PR:

1. Instala dependencias con `npm ci`.
2. Lanza `npm run lint` para asegurar calidad de código.
3. Ejecuta `npm run build` y guarda el artefacto `dist/` como adjunto.

## Despliegue en Vercel

1. Importa el repositorio en Vercel.
2. Selecciona framework **Vite** (Vercel detecta automáticamente los scripts).
3. Comandos por defecto: `npm run build` y directorio de salida `dist`.
4. (Opcional) Activa despliegues previos (Preview) para ramas/PR que ejecutan la acción de GitHub.

## Historial local

Los resultados del simulacro se guardan en `localStorage` (máximo 20 intentos recientes). Puedes limpiar el historial desde el inspector del navegador o extendiendo la UI con un botón de borrado.
