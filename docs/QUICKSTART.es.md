# Inicio rápido de Premise Builder en español

Premise Builder es una herramienta local para alinear requisitos. Separa lo que una fuente aportó (Contribution) de la premisa que el proyecto adopta (Resolution). Los datos del proyecto permanecen en el navegador y no se envían a un servidor.

## 1. Abrir la interfaz en español

Abre `/es/` en el sitio compilado. Para crear un proyecto de ejemplo, puedes usar:

| Campo | Ejemplo |
|---|---|
| Nombre del proyecto | `Sitio de documentación del producto` |
| Fase actual | `Nuevo proyecto` |
| Idioma del contenido | `es` |
| Nombre de quien registra | `Responsable del proyecto` |
| Rol de quien registra | `Desarrollador/a` |
| Autoridad de decisión | Activar solo si esa persona puede tomar decisiones del proyecto |

Las interfaces inglesa (`/en/`), japonesa (`/ja/`) y española (`/es/`) utilizan los mismos identificadores y valores estables.

## 2. Registrar una respuesta y su procedencia

Selecciona una respuesta y añade el contexto necesario. Por ejemplo, para la estrategia adaptable:

| Campo | Ejemplo |
|---|---|
| Respuesta | `Escritorio prioritario` (`desktop_priority`) |
| Contexto | El trabajo principal de edición y revisión se hará en escritorio. En el móvil deben funcionar la lectura, la consulta del estado y las acciones básicas, sin desbordamiento horizontal. |
| Responde desde | `Responsable del proyecto` |
| Registrado por | `Responsable del proyecto` |
| Habla como | `Desarrollador/a` |
| Cómo se obtuvo | `Entrada directa` |
| Autoridad | `Responsable de decisión` |
| Confirmación | `Comunicado directamente` |

Usa «Añadir perspectiva» para registrar otra fuente. Si una respuesta es una inferencia, indícalo en su procedencia y mantenla sin confirmar.

## 3. Definir la resolución del proyecto

Una respuesta no se convierte automáticamente en una premisa del proyecto. En «Resolución del proyecto»:

1. Elige el estado, por ejemplo «Confirmado» o «Usar provisionalmente».
2. Selecciona la aportación que proporciona el valor adoptado.
3. Registra quién tomó la decisión.

Si todavía no existe una decisión, utiliza «Dejar sin resolver».

## 4. Revisar y confirmar la Base

En «Revisar», comprueba los elementos pendientes, los conflictos y la procedencia. Después selecciona «Confirmar revisión Base». Una modificación posterior permitirá confirmar la siguiente revisión sin sobrescribir la anterior.

## 5. Exportar y volver a importar

La vista «Exportar» ofrece Base JSON, Override JSON, Unified JSON y AI Context Markdown. Guarda Base o Unified como copia de seguridad, ya que los proyectos locales se eliminan si se borran los datos del sitio del navegador.

Ejemplo de prueba entre idiomas:

1. Crea y confirma una Base en `/en/`.
2. Exporta el JSON.
3. Impórtalo desde `/es/`.
4. Comprueba que los 42 elementos, sus valores, aportaciones, resoluciones y notas se mantienen.
5. Exporta de nuevo y valida que no haya cambios semánticos.

El conjunto automatizado ejecuta este recorrido en ambas direcciones entre inglés y español:

```sh
npm run check
```
