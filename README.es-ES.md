

# LinkedOut

Consulta tu exportación de datos de LinkedIn localmente en el navegador. Sin servidor, sin seguimiento: tus datos nunca salen de tu máquina.

**NOTA: este proyecto fue codificado por LLMs. Aunque el entorno de ejecución está estrictamente aislado y funciona sin conexión, creo que deberías saberlo. Lee la [declaración de privacidad](./PRIVACY.md)**

## Qué Hace

Lee más [aquí](https://blog.alexewerlof.com/p/linkedout).

## Inicio Rápido

```bash
npm install
npm run dev
```

Abre `http://localhost:5173`, luego arrastra tu ZIP de exportación de LinkedIn (o el `test-data.zip` de este repositorio) sobre la zona de arrastrar y soltar.

## Scripts Disponibles

| Comando                 | Descripción                                                      |
| ----------------------- | ---------------------------------------------------------------- |
| `npm run dev`           | Inicia el servidor de desarrollo de Vite                         |
| `npm run build`         | Compilación de producción en `dist/`                             |
| `npm run preview`       | Vista previa de la compilación de producción localmente          |
| `npm test`              | Ejecuta el conjunto de pruebas (Vitest)                          |
| `npm run test:watch`    | Ejecuta las pruebas en modo observación (watch)                  |
| `npm run test:coverage` | Ejecuta las pruebas con informe de cobertura                     |
| `npm run lint`          | Realiza lint con ESLint                                          |
| `npm run typecheck`     | Verificación de tipos de TypeScript                              |
| `npm run format`        | Formatea con Prettier                                            |
| `npm run format:check`  | Verifica el formato sin aplicarlo                                |
| `npm run test-data:zip` | Empaqueta `test-data/` en `test-data.zip` (para pruebas de arrastrar y soltar) |
| `npm run pack`          | Compila la extensión de Chrome en `dist-extension/`              |

## Extensión para Chrome

Puedes ejecutar LinkedOut como una extensión de Chrome para una experiencia más integrada:

```bash
npm run pack
```

Luego abre `chrome://extensions`, habilita el **modo de desarrollador**, haz clic en **Cargar desempaquetado** y selecciona la carpeta `dist-extension/`. Haz clic en el icono de LinkedOut en tu barra de herramientas para abrir la aplicación en una nueva pestaña.

## Tecnologías

| Capa           | Tecnología                     |
| -------------- | ------------------------------ |
| Lenguaje       | TypeScript                     |
| Interfaz       | React 19 + React Router 7      |
| Estilos        | Tailwind CSS 4 + daisyUI 5     |
| Compilación    | Vite                           |
| Almacenamiento | IndexedDB (vía `idb`)          |
| ZIP            | `fflate` (seguro para navegador, síncrono) |
| Iconos         | `lucide-react`                 |
| Pruebas        | Vitest + React Testing Library |

## Privacidad

LinkedOut es una aplicación **exclusivamente local**. Tu ZIP de exportación de LinkedIn se procesa completamente en tu navegador. Nunca se envían datos a ningún servidor, y no hay análisis ni seguimiento de ningún tipo.

## Licencia

MIT
