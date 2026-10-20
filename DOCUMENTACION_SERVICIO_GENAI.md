# Documentación: Integración con el servidor GenAI (FastAPI)
## 1. Arquitectura general

| Componente | URL base | Rol |
|---|---|---|
| Backend NestJS | `https://pumaia.onrender.com/api` (constante `API_URL` en [api.ts](app/src/utils/api.ts); en `updateInfo.service.ts` puede sobreescribirse con `NEXT_PUBLIC_API_URL`) | API principal: autenticación, BD (Supabase), orquestación. Reenvía a FastAPI los datos que requieren IA. |
| Servidor GenAI | `https://server-genai.onrender.com` | FastAPI en Render que ejecuta el modelo (Gemini): chat, análisis de experiencia, reporte vocacional. |

> [!IMPORTANT]
> El código de NestJS y de FastAPI **no está en este repositorio**. Esta documentación describe con exactitud lo que **el frontend envía** a NestJS y qué endpoints disparan el uso de IA. El payload exacto NestJS → FastAPI debe confirmarse en el repo del backend; aquí solo se indica lo que se infiere del contexto (marcado como *inferido*).

### 1.1 Única conexión directa del frontend a FastAPI: "Wake-up ping"

Render (plan gratuito) apaga los servicios inactivos. Para evitar la latencia del arranque en frío, el frontend hace un `GET` vacío a FastAPI en cuanto el usuario entra a pantallas que usarán IA.

```ts
fetch('https://server-genai.onrender.com', { method: 'GET' }).catch(() => { });
```

| Propiedad | Valor |
|---|---|
| Método | `GET` |
| URL | `https://server-genai.onrender.com` (raíz) |
| Headers | Ninguno |
| Body | Ninguno |
| Autenticación | No |
| Manejo de error | Se ignora silenciosamente (`.catch(() => {})`) |
| Respuesta usada | No, se descarta |

Lugares donde se ejecuta:

| Archivo | Momento | Detalle |
|---|---|---|
| [HomePage.tsx](app/src/components/home/HomePage.tsx) (~L45) | `useEffect` → `initializeApp` al cargar Home | Dentro de `Promise.all`, en paralelo con `getProfileSummary()` y `getProfileByAccount()`. |
| [ChatLayout.tsx](app/src/components/chat/ChatLayout.tsx) (~L51-54) | `useEffect` al montar el chat (`[]`) | Comentario en código: "para que FastAPI encienda". No bloquea. |
| [UpdateInfoPage.tsx](app/src/components/update-info/UpdateInfoPage.tsx) (~L55) | Carga de la pantalla de perfil/actualizar información | Se hace `await` secuencial tras obtener respuestas del cuestionario y el análisis guardado. |

---

## 2. Autenticación común

Todas las peticiones a NestJS llevan:

```
Content-Type: application/json
Authorization: Bearer <JWT>
```

El token se lee de `localStorage.token`; en algunos servicios hay *fallback* a `localStorage.userData` (`token`, `access_token` o `accessToken`). Ver `getHeaders()` en [chat.service.ts](app/src/services/chat.service.ts), [questionnarie.service.ts](app/src/services/questionnarie.service.ts) y [updateInfo.service.ts](app/src/services/updateInfo.service.ts).

Si falta token las peticiones fallan con `401`; en el chat se lanza `Error('Sesión expirada')`.

---

## 3. Endpoints que usan IA (GenAI / FastAPI)

### 3.1 Chat con la IA — `POST /chat/message`

| Propiedad | Valor |
|---|---|
| Función | `chatService.sendMessage(content, conversationId, profile, history)` en [chat.service.ts](app/src/services/chat.service.ts) |
| Método / URL | `POST {API_URL}/chat/message` |
| Disparador | El usuario envía un mensaje en el chat → `sendMessage(text)` en [ChatLayout.tsx](app/src/components/chat/ChatLayout.tsx) (callback `onSend`). Se ignora si el texto está vacío o `isTyping` es `true`. |
| Auth | Bearer JWT |

**Body enviado:**

```json
{
  "content": "string",
  "conversationId": "string | undefined",
  "student_profile": "string",
  "history": [ /* Message[] */ ]
}
```

| Campo | Tipo | Descripción |
|---|---|---|
| `content` | `string` | Texto que escribió el usuario (o sugerencia rápida seleccionada). |
| `conversationId` | `string \| undefined` | ID de la conversación activa. `undefined` si es un chat nuevo; el backend crea y devuelve el ID. |
| `student_profile` | `string` | Contexto del alumno en texto plano multilínea (ver abajo). Nótese el *snake_case*, pensado para FastAPI. |
| `history` | `Message[]` | Mensajes ya cargados de la conversación activa (`activeConversation?.messages`), **sin** incluir el mensaje que se envía ahora. `[]` si es chat nuevo. |

**Construcción de `student_profile`** (en `ChatLayout.sendMessage`):

```
Nombre: ${user.nombre}.
Carrera: ${user.carrera}.
Promedio: ${user.average}.
Intereses: ${user.intereses || 'No especificados'}.
```

Fuente: objeto `user` leído de `localStorage.userData` (enriquecido con `getProfileSummary`).

**Estructura de cada elemento de `history`** (tipo `Message` usado en el frontend):

```json
{
  "id": "string",
  "role": "USER | ASSISTANT",
  "content": "string",
  "createdAt": "ISO-8601"
}
```

**Respuesta esperada:** objeto con al menos `conversationId`. En error: `error` o `statusCode >= 400` con `message`.

**Flujo posterior en el frontend:**
1. *Optimistic UI*: se inserta el mensaje del usuario con `id: temp-<timestamp>` (y una conversación `temp-conv` si es chat nuevo).
2. Se llama al endpoint.
3. Si es chat nuevo: `setActiveId(response.conversationId)` → `GET /chat/conversations` → `GET /chat/conversations/{id}/messages`.
4. Si ya existía: `GET /chat/conversations/{id}/messages` para traer mensajes reales (usuario + respuesta IA).
5. En error: se agrega mensaje `ASSISTANT` con `content: '__error__'`, que `ChatMessage` renderiza como error.

*(Inferido)* NestJS reenvía a FastAPI `content`, `student_profile` y `history` y guarda la respuesta del modelo como mensaje `ASSISTANT`.

---

### 3.2 Análisis de experiencia profesional — `POST /professional-experience/analyze`

| Propiedad | Valor |
|---|---|
| Función | `updateInfoService.analyzeExperience(text)` en [updateInfo.service.ts](app/src/services/updateInfo.service.ts) |
| Método / URL | `POST {API_URL}/professional-experience/analyze` |
| Disparador | En [ExtraDataForm.tsx](app/src/components/update-info/ExtraDataForm.tsx), al guardar el campo `experiencia` con texto no vacío (`draftExperienciaText.trim() !== ''`). Se activa `isAnalyzing` mientras responde. |
| Auth | Bearer JWT (`localStorage.token`) |

**Body:**

```json
{ "text": "Descripción libre de la experiencia del alumno" }
```

| Campo | Tipo | Descripción |
|---|---|---|
| `text` | `string` | Texto libre escrito por el usuario describiendo su experiencia. |

**Respuesta:** JSON (el frontend lo ignora; tras la llamada ejecuta `loadAllData()` para recargar el perfil desde la BD). Error: `Error('Error al analizar experiencia')`.

*(Inferido)* El modelo clasifica el texto en área de expertise/categoría y NestJS persiste el resultado como experiencia profesional.

---

### 3.3 Generar análisis vocacional (reporte IA) — `POST /ai-analysis/generate`

| Propiedad | Valor |
|---|---|
| Función | `updateInfoService.generateNewAiAnalysis()` |
| Método / URL | `POST {API_URL}/ai-analysis/generate` |
| Disparador | [ReportSection.tsx](app/src/components/update-info/ReportSection.tsx) → `handleAnalyze()`, al pulsar el botón de analizar/regenerar el reporte. Muestra `AiAnalysisLoader` mientras `analyzing` es `true`. |
| Auth | Bearer JWT |

**Body:** **ninguno.** El frontend no envía datos del perfil: NestJS arma el contexto con lo que ya tiene en BD del usuario autenticado (*inferido*: cuestionario, promedio/materias, cursos, becas, concursos, idiomas, experiencia, intereses) y lo manda a FastAPI/Gemini.

**Respuesta esperada:**

```json
{
  "hasAnalysis": true,
  "data": { /* reporte */ }
}
```

Si `hasAnalysis` es `true`, se hace `setReportData(res.data)`. En error se muestra `alert("No se pudo conectar con el motor de PumaIA...")`.

**Formato del reporte consumido por la UI** (según el parseo en `ReportSection.tsx`):
- Incluye `createdAt` y campos de texto para **5 carreras recomendadas**.
- Descripciones con formato `"Match: 95%."` → se extrae el porcentaje con regex `/Match:\s*(\d+)%/i`.
- Listas en string con saltos de línea `\n` y viñetas (`•`, `-`, `*`), que se limpian con `parseBulletList`.

---

### 3.4 Consultar último análisis guardado — `GET /ai-analysis/current`

| Propiedad | Valor |
|---|---|
| Función | `updateInfoService.getSavedAiAnalysis()` |
| Método / URL | `GET {API_URL}/ai-analysis/current` |
| Disparador | [UpdateInfoPage.tsx](app/src/components/update-info/UpdateInfoPage.tsx), al cargar la pantalla (junto a `questionnaireService.getAnswers()`). |
| Body | Ninguno |
| Llama a FastAPI | No (lectura de BD) |
| Fallback | Si falla: `{ hasAnalysis: false, data: null }` |

Respuesta: `{ hasAnalysis: boolean, data: reporte | null }`.

---

## 4. Endpoints que alimentan el contexto de la IA (no llaman a FastAPI)

Guardan los datos que luego NestJS usa para generar el reporte (3.3) y que forman `student_profile` del chat (3.1).

### 4.1 Cuestionario

Servicio: [questionnarie.service.ts](app/src/services/questionnarie.service.ts).

**`POST /questionnaire/save`**

```json
{
  "answers": [
    { "id": "materias_fuertes", "category": "HABILIDADES", "value": "..." }
  ]
}
```

| Campo | Descripción |
|---|---|
| `id` | ID de la pregunta (clave del formulario). |
| `category` | Enum asignado por `CATEGORY_MAP`. |
| `value` | Respuesta normalizada con `normalizeValue` (strings con `trim`; objetos con `_list` limpiada y `exp` con `trim`). |

Mapa de categorías:

| `id` pregunta | `category` |
|---|---|
| `tiempo_traslado`, `situacion_laboral`, `equipo_computo`, `ambiente_trabajo` | `EXPECTATIVAS` |
| `materias_fuertes` | `HABILIDADES` |
| `reaccion_problema` | `INTERESES` |
| `experiencia_laboral` | `EXPERIENCIA` |
| cualquier otro | `INTERESES` (por defecto) |

**`GET /questionnaire/my-answers`** — devuelve un arreglo con `questionId` y `answer`; el frontend lo transforma a `{ [questionId]: answer }`.

### 4.2 Perfil y datos académicos / extra

Servicios: [updateInfo.service.ts](app/src/services/updateInfo.service.ts), [student.service.ts](app/src/services/student.service.ts), [grades.service.ts](app/src/services/grades.service.ts).

| Endpoint | Método | Body | Uso para la IA |
|---|---|---|---|
| `/students/profile-summary` | GET | – | Datos de `user` (nombre, carrera, promedio, intereses) usados en `student_profile`. |
| `/students/account/{accountNumber}` | GET | – | Perfil del alumno por número de cuenta. |
| `/grade/my-grades` | GET | – | Materias/calificaciones. |
| `/students/interests` | PATCH | `{ "interest": string }` | Intereses mostrados en `student_profile`. |
| `/courses/courseUser` | POST | `{ courseId, studentId }` | Cursos del alumno. |
| `/schoolarships/assign` | POST | `{ schoolarshipId, studentId }` | Becas. |
| `/contests/enroll` | POST | `{ contestId, studentId }` | Concursos. |
| `/languages/languageUsers` | POST | `{ studentId, languageId, skillId }` | Idiomas (nivel CEFR). |
| `/professional-experience` | POST | `{ studentId, areaExpertiseId, categoryId }` | Experiencia profesional. |
| `/students/avatar` | POST (`multipart/form-data`, campo `file`) | Imagen | No usado por IA (Cloudinary). |

Catálogos (GET, sin body): `/courses`, `/schoolarships`, `/contests`, `/languages`, `/areas-expertise`, `/category`, `/skills`.

---

## 5. Endpoints de gestión del chat (sin FastAPI)

| Endpoint | Método | Body | Función | Cuándo se llama |
|---|---|---|---|---|
| `/chat/conversations` | GET | – | `getConversations` | Al abrir el chat y tras crear una conversación nueva (sidebar). |
| `/chat/conversations/{id}/messages` | GET | – | `getMessages` | Al cambiar de chat activo (`activeId`) y tras cada respuesta de la IA. |
| `/chat/conversations/{id}` | PATCH | `{ "title": string }` | `updateTitle` | Renombrar conversación. |
| `/chat/conversations/{id}` | DELETE | – | `deleteConversation` | Eliminar conversación. |

---

## 6. Resumen: acciones del usuario → servicios

| Acción del usuario | Pantalla | Llamada | ¿Usa IA/FastAPI? |
|---|---|---|---|
| Entra a Home | Home | `GET server-genai.onrender.com` (ping) + `GET /students/profile-summary` + `GET /students/account/{n}` | Solo ping |
| Abre el chat | Chat | Ping a FastAPI + `GET /chat/conversations` | Solo ping |
| Envía mensaje | Chat | `POST /chat/message` → luego `GET /chat/conversations/{id}/messages` | **Sí** |
| Guarda experiencia profesional (texto libre) | Actualizar información | `POST /professional-experience/analyze` | **Sí** |
| Pulsa analizar/regenerar reporte | Actualizar información (Reporte) | `POST /ai-analysis/generate` | **Sí** |
| Abre pantalla de actualizar información | Actualizar información | `GET /questionnaire/my-answers`, `GET /ai-analysis/current`, ping a FastAPI | Solo ping |
| Guarda cuestionario | Cuestionario | `POST /questionnaire/save` | No (insumo) |
| Agrega curso / beca / concurso / idioma / intereses | Actualizar información | Ver §4.2 | No (insumo) |

---

## 7. Manejo de errores

| Situación | Comportamiento |
|---|---|
| Ping a FastAPI falla | Ignorado. |
| `401` en chat | `Error('Sesión expirada')` (solo en `getConversations`). |
| `POST /chat/message` con `error` o `statusCode >= 400` | Se lanza error y se muestra `__error__` en el chat. |
| `POST /professional-experience/analyze` no OK | `Error('Error al analizar experiencia')`. |
| `POST /ai-analysis/generate` no OK | `Error('Error al procesar el motor de PumaIA')` + alert en UI. |
| `GET /ai-analysis/current` no OK | Fallback `{ hasAnalysis: false, data: null }` en la pantalla. |

---

## 8. Consideraciones y puntos a revisar

- **Arranque en frío de Render:** la primera llamada tras inactividad puede tardar decenas de segundos; por eso el ping temprano.
- **URLs hardcodeadas:** `API_URL` y `https://server-genai.onrender.com` están fijos en el código (el ping se repite en 3 archivos). Se recomienda centralizarlos en variables de entorno (p. ej. `NEXT_PUBLIC_GENAI_URL`).
- **Privacidad:** según [PrivacyModal.tsx](app/src/pages/PrivacyModal.tsx), los datos se procesan vía FastAPI / Gemini únicamente para generar la respuesta y el análisis contextual del estudiante, sin usarse para entrenar modelos públicos.
- **Inconsistencia de nombres:** `student_profile` (snake_case) coexiste con `conversationId` (camelCase) en el mismo body.
- **Historial:** `history` incluye el formato interno del frontend (`role` en mayúsculas, `createdAt`); NestJS/FastAPI deben mapearlo al formato esperado por el modelo.
- **Pendiente para completar:** documentar contrato NestJS → FastAPI (rutas, payloads y respuestas) desde el repo del backend.
