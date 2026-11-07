# Estado Actual del Sistema PUMAIA (Backend y Frontend)

> **Documento de Contexto y Últimas Implementaciones**  
> **Fecha:** Noviembre 2026  
> **Institución:** Facultad de Estudios Superiores Acatlán · UNAM  
> **Licenciatura:** Matemáticas Aplicadas y Computación (MAC)  
> **Ecosistema:** PumaIA (Portal Web & API Institucional)

---

## 1. Contexto General del Proyecto

### 1.1 ¿Qué es PUMAIA?
**PUMAIA** es la plataforma tecnológica integral diseñada para la comunidad de Matemáticas Aplicadas y Computación (MAC) en la FES Acatlán de la UNAM. El sistema combina herramientas académicas, administrativas y de inteligencia artificial conversacional para acompañar la trayectoria universitaria de los estudiantes y facilitar la gestión docente.

### 1.2 Módulos Principales
1. **Asistencia Digital Inteligente:**
   - Proyección de códigos QR dinámicos rotativos en tiempo real con firmas criptográficas temporizadas.
   - Escaneo de asistencia mediante cámara móvil con validación de horario lectivo, materia y fecha.
   - Portal docente con proyección de QR, pase de lista manual, estadísticas y simulación lectiva.
2. **Chat Inteligente con PUMAIA:**
   - Asistente conversacional con contexto institucional sobre el plan de estudios de MAC, reglamentos y asesoría académica.
   - Historial de conversaciones persistente por alumno.
   - Sistema de retroalimentación (*feedback*) de respuestas para mejora continua de las sugerencias del modelo.
3. **Perfil del Alumno y Cuestionario Vocacional:**
   - Diagnóstico inicial de intereses, habilidades blandas, experiencia laboral, becas, idiomas y áreas de especialización.
   - Actualización continua de datos complementarios (`/update-info`).
4. **Portal Docente y Horarios (`/profesor`):**
   - Horario semanal docente sincronizado con las asignaturas y grupos oficiales asignados.
   - Control de sesiones de clase, listas de alumnos y exportación de reportes.
5. **Panel de Gestión Institucional (`/admin`):**
   - Métricas macro de retención, reprobación, uso del sistema y seguimiento por cohorte.

### 1.3 Arquitectura y Stack Tecnológico

| Capa | Tecnologías | Notas |
| :--- | :--- | :--- |
| **Frontend** | **Next.js 16.2.1** (Turbopack, App Router), **React 19**, **TypeScript**, **CSS Modules** | Arquitectura moderna con proxy middleware, SSR/SSG y soporte móvil responsive. |
| **Backend** | **NestJS**, **TypeScript**, **Node.js** | Arquitectura modular (Auth, Attendance, Chat, Users, Sections, Schedule). |
| **Base de Datos** | **PostgreSQL** alojado en **Supabase** gestionado con **Prisma ORM** | Modelos relacionales con índices optimizados y migraciones versionadas. |
| **Autenticación** | **JWT**, **Google OAuth 2.0 (GSI)** institucional | Restricción estricta al dominio `@pcpuma.acatlan.unam.mx`. |

---

## 2. Estado Actual del Backend (`pumaAPI`)

### 2.1 Módulo de Asistencias y Registro por Fecha (`AttendanceModule`)
- **Estructura del Modelo de Datos (Prisma):**
  - Se incorporó el campo `sessionDate DateTime @default(now()) @db.Date` en `ClassSession` y `AttendanceRecord`.
  - Se configuró el índice compuesto único `@@unique([studentId, classSessionId, sessionDate])` en `AttendanceRecord`.
  - **Resultado:** La asistencia ya no se registra de manera genérica por materia. Cada clase impartida en un día específico genera un registro independiente, permitiendo registrar múltiples asistencias a la semana/mes sin sobreescribir ni bloquear clases futuras.
- **Validación de Horario Lectivo y Ventana de Tolerancia:**
  - El backend compara la hora del servidor con los `meetings` (días y horas) de la sección (`SectionMeeting`).
  - Admite una ventana de tolerancia previa y posterior para el escaneo.
  - Cuenta con un interruptor de simulación (`/simulate-schedule`) para entornos de prueba fuera de horario lectivo.
- **Códigos QR Dinámicos y Seguros:**
  - Los códigos QR se rotan cada 5 segundos mediante un token firmado criptográficamente (HMAC).
  - El backend valida la frescura del token (`iat`, `exp`), impidiendo que los alumnos compartan capturas de pantalla fijas de días previos.
  - Las URLs emitidas son canónicas y absolutas hacia la ruta `/attendance`.

### 2.2 Módulo de Chat y Retroalimentación (`ChatModule`)
- **Calificación de Respuestas de PUMAIA:**
  - Endpoint implementado: `POST /chat/message/:id/feedback`.
  - Soporte para valores:
    - `UP`: Voto positivo (like) indicando que la respuesta resolvió la consulta, guardando comentario default.
    - `DOWN`: Voto negativo (dislike) con opción de registrar un comentario cualitativo explicando la razón (ej. "información desactualizada", "respuesta incompleta").
  - Las retroalimentaciones quedan vinculadas al mensaje para evaluación del equipo académico.

### 2.3 Autenticación y Control de Roles (`AuthModule`)
- **Flujo Institucional:**
  - Login tradicional con número de cuenta / contraseña y login nativo con Google OAuth (Google Identity Services).
  - Verificación rigurosa del dominio institucional `@pcpuma.acatlan.unam.mx`.
  - Emisión de JWT con roles (`STUDENT`, `PROFESSOR`, `INSTITUTION_ADMIN`, `ANALYST`) y `professorId` cuando aplica.

---

## 3. Estado Actual del Frontend (`puma-react`)

### 3.1 Corrección del QR y Redirección Canónica
- **URL Completa y Navegación Real:**
  - El componente `DynamicQrCode.tsx` codifica una URL HTTPS estándar (`https://.../attendance?sessionId=...&subjectId=...`).
  - Al escanear desde la cámara nativa de cualquier smartphone (iOS/Android), el sistema operativo abre el navegador directamente en lugar de mostrar texto o payloads crudos JSON.
- **Escáner de Cámara Optimizado (`AttendanceScanner.tsx`):**
  - Implementación con `BarcodeDetector` (aceleración por hardware del navegador móvil).
  - Fallback automático a `jsQR` throttled para navegadores sin API nativa.
  - Detección instantánea y fluida de los códigos proyectados en pantalla por el docente.

### 3.2 Mecanismo de Redirección y Retorno de Sesión (`auth-redirect.ts`)
- **Preservación de URL de Destino:**
  - Si un usuario abre un enlace o escanea un QR sin sesión activa o con token expirado, el sistema conserva la URL original en el query param `?returnUrl=...`.
  - Tras un inicio de sesión exitoso (sea con credenciales o mediante Google), el usuario es redirigido automáticamente a la sección de asistencia que intentaba abrir originalmente.
- **Seguridad contra Open Redirect:**
  - Validación de origen para aceptar exclusivamente URLs relativas internas que comiencen con `/` (descartando redirecciones externas maliciosas como `//evil.com` o `javascript:`).
  - La URL de retorno se preserva si el usuario falla un intento de contraseña, permitiendo reintentar sin perder la navegación.

### 3.3 Portal Docente y Corrección de Persistencia (`/profesor`)
- **Aislamiento de Sesión Docente:**
  - Sincronización transparente de las claves `puma_teacher_session` y `pumaia_teacher_session_v1`.
  - Al iniciar sesión como profesor, se limpian automáticamente los cachés de alumnos residuales (`student_schedule`, `student_profile`, `quiz_answers`, etc.).
- **Eliminación del Destello de Materias de Alumno:**
  - El estado inicial de asignaturas se configuró limpio (`[]`) y se eliminaron las materias mock de prueba del perfil por defecto.
  - Se implementó un caché local por profesor (`pumaia_teacher_courses_${teacherId}`). Al recargar la página, se muestran de inmediato sus materias reales sin parpadeos ni mezclas con materias de estudiantes.
- **Limpieza de Interfaz:**
  - Eliminado el badge de *"enlace de prueba local"* y el botón *"finalizar sesión de clase"*.
  - Eliminados emojis en cabeceras de fecha, historial y botones de acción.
  - Simplificación del botón de enlace copiador.

### 3.4 Calendario y Portal de Alumnos (`StudentScheduleCalendar.tsx`, `AttendancePage.tsx`)
- **Limpieza Visual:**
  - Retirado el emoji en *"ver en mi calendario"*.
  - Retirado el badge *"datos del servidor"*.
  - Retirados los emojis en *"vista semanal (fechas)"* y *"resumen por materias"*.
- **Unificación de Interfaz en Asistencia:**
  - La sección `/attendance` ahora utiliza exactamente la misma barra de navegación superior con el componente `HomeDrawer` e ícono de menú unificado.
  - Fondo de malla (*bg-mesh*) idéntico al del resto de la plataforma para consistencia visual.

### 3.5 Interfaz de Inicio de Sesión (`LoginPage.tsx`)
- **Loader de Google Minimalista:**
  - Al validar el token de Google, el formulario muestra un spinner animado circular dorado centrado sobre un fondo translúcido difuminado.
  - Sin textos excesivos ni bordes de tarjeta que sobrecarguen la vista.

### 3.6 Módulo de Chat con PUMAIA (`ChatArea.tsx`, `ChatMessage.tsx`)
- **Interacción de Calificación (Feedback):**
  - Cada respuesta generada por PUMAIA cuenta con botones de **Like (👍)** y **Dislike (👎)**.
  - El Like envía automáticamente la confirmación con feedback positivo.
  - El Dislike despliega un modal limpio y accesible para que el alumno pueda opcionalmente detallar qué aspecto no fue de su agrado.
- **Navegación Móvil:**
  - En pantallas móviles se incluye un botón interactivo *"← Mis chats"* en la cabecera de la conversación para desplegar el listado de conversaciones sin saturar el toolbar superior.

### 3.7 Correcciones Generales de UX / UI
- **Desplegables en Actualización de Información (`/update-info`):**
  - Corrección de stacking context y z-index en `ExtraDataForm.tsx` y `ExtraDataForm.module.css`. Los menús de cursos, concursos, idiomas, becas y experiencia laboral ahora se superponen correctamente por encima del pie de página (*AppFooter*).
- **Footer de la Pantalla Principal (`HomePage.module.css`):**
  - Corregido el contenedor principal `.main` eliminando el scroll forzado interno, permitiendo que el footer se sitúe al final del scroll natural de la página en escritorios y dispositivos móviles.
- **Alerta de Guardado del Cuestionario (`QuestionnairePage.tsx`):**
  - Ajustado el mensaje *"Guardando respuestas en PUMAIA..."* para utilizar el estilo dorado institucional de carga en lugar de un borde rojo de error.

---

## 4. Resumen de Archivos Clave Modificados

### Frontend (`puma-react`)
- `app/src/pages/LoginPage.tsx`: Loader minimalista de Google, manejo de sesión docente/alumno y soporte de redirección por URL de retorno.
- `app/src/utils/auth-redirect.ts`: Utilidad segura para captura, sanitización y redirección con `returnUrl`.
- `app/src/components/profesor/TeacherPage.tsx`: Carga asíncrona de asignaturas reales, eliminación del parpadeo de datos mock, persistencia sincronizada.
- `app/src/components/profesor/teacherMockData.ts`: Limpieza de asignaturas mock generales para evitar confusión con materias de alumnos.
- `app/src/components/profesor/TeacherGroupsPanel.tsx`: Estado de carga limpio y controles de simulación lectiva.
- `app/src/components/profesor/TeacherLoginModal.tsx`: Limpieza de cachés residuales y persistencia dual de sesión docente.
- `app/src/components/profesor/DynamicQrCode.tsx`: Codificación de URL canónica de asistencia y ciclo de refresco de 5s.
- `app/src/components/profesor/TeacherStudentsModal.tsx` & `TeacherQrModal.tsx`: Limpieza de emojis, badges innecesarios y botones redundantes.
- `app/src/components/attendance/AttendancePage.tsx`: Unificación de barra toolbar, `HomeDrawer` y fondo general.
- `app/src/components/attendance/AttendanceScanner.tsx`: Cámara acelerada por hardware con `BarcodeDetector` y fallback `jsQR`.
- `app/src/components/attendance/StudentScheduleCalendar.tsx`: Remoción de badges y emojis redundantes en vistas semanales.
- `app/src/components/chat/ChatMessage.tsx` & `ChatMessage.module.css`: Botones de Like / Dislike con modal de retroalimentación.
- `app/src/components/chat/ChatArea.tsx` & `ChatLayout.tsx`: Encabezado móvil para chats y toolbar simplificado.
- `app/src/services/chat.service.ts`: Integración con endpoint de feedback.
- `app/src/components/update-info/ExtraDataForm.tsx` & `*.module.css`: Solución de z-index en menús desplegables sobre el footer.
- `app/src/components/home/HomePage.module.css`: Eliminación de sticky antinatural en el footer principal.
- `app/src/pages/QuestionnairePage.tsx`: Corrección de alerta de guardado con paleta dorada institucional.

### Backend (`pumaAPI`)
- `prisma/schema.prisma`: Incorporación de `sessionDate` en `ClassSession` y `AttendanceRecord` con índice compuesto.
- `src/attendance/attendance.service.ts`: Lógica de registro por fecha, validación de horario lectivo y soporte de tokens QR.
- `src/chat/chat.service.ts` & `chat.controller.ts`: Endpoint de retroalimentación de mensajes.

---

## 5. Estado de Compilación y Salud del Proyecto
- **Frontend (`npm run build`):** Compilación exitosa en 4.6s con Next.js 16.2.1 Turbopack, 18 rutas generadas (estáticas y dinámicas), 0 errores de TypeScript y 0 errores de CSS.
- **Base de Datos:** Migración Prisma aplicada y esquemas sincronizados con Supabase.

