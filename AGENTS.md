# Introduction

This repo contains an application that simplifies browsing LinkedIn data export.

The purpose of this application is to:

1. Act as the missing LinkedIn UI to browse your own data (e.g. your past posts, comments, messages, etc.) in order to support use cases like:
   - Removing old posts that you no longer want to be visible on your profile.
   - Reposting content that was performing well.
   - Get an understanding of your general activity on LinkedIn (e.g. how many posts you made, how many messages you sent, etc.).
2. Understand what data LinkedIn has on you.
3. Provide direct link to LinkedIn resources whenever possible (e.g. a post in this app links to your actual post on LinkedIn) in order to make it easy to take actions on LinkedIn based on the insights you get from this app.

# Tech Stack

The application is a client-only SPA — no server, no backend.

- Code: TypeScript
- Build Tool: Vite (two build targets: web + Chrome extension)
- UI Library: React 19
- Routing: React Router 7
- Test: Vitest + React Testing Library
- State Management: React Context
- Data Storage: IndexedDB (via the `idb` library)
- CSS Framework: Tailwind CSS 4 + daisyUI 5
- Linting: ESLint + Prettier
- Code Formatting: Prettier
- Version Control: Git + GitHub
- ZIP handling: `fflate` (browser-safe, sync API)
- Icons: `lucide-react`

# Repository conventions

## Source layout

- `src/lib/` — pure, browser-only, framework-free modules with co-located `*.test.ts`. Order of concerns: `csv` → `zip` → `schema` → `store`. No React imports here.
- `src/features/<name>/` — feature folders. Each owns its routes, components, and helpers. Cross-feature shared UI lives in `src/components/`, hooks in `src/hooks/`.
- `src/app/` — providers, router, layout shell.
- `src/platform/` — cross-target shims (storage estimation, runtime detection). Used by both the web build and the Chrome extension build.
- `extension/` — Chrome extension background service worker (`background.js`). Copied into `dist-extension/` by `npm run pack`. The extension manifest is generated at build time by a custom Vite plugin (see [Extension conventions](#extension-conventions)).
- `dist/` — web build output (gitignored)
- `dist-extension/` — unpacked Chrome extension build output (gitignored)

## Development scripts

- Prefer the npm scripts in [package.json](package.json) over direct tool invocations: `npm run dev`, `npm run build`, `npm run pack`, `npm test`, `npm run typecheck`, `npm run lint`, `npm run format:check`, and `npm run format` because the commands in those scripts do not require user's permission and delay.
- Use `npm run format:check` to verify Prettier formatting and `npm run format` to apply it repo-wide.

| Command                 | Description                                                      |
| ----------------------- | ---------------------------------------------------------------- |
| `npm run dev`           | Start the Vite dev server                                        |
| `npm run build`         | Production build into `dist/`                                    |
| `npm run preview`       | Preview the production build locally                             |
| `npm test`              | Run the test suite (Vitest)                                      |
| `npm run test:watch`    | Run tests in watch mode                                          |
| `npm run test:coverage` | Run tests with coverage report                                   |
| `npm run lint`          | Lint with ESLint                                                 |
| `npm run typecheck`     | TypeScript type checking                                         |
| `npm run format`        | Format with Prettier                                             |
| `npm run format:check`  | Check formatting without applying                                |
| `npm run test-data:zip` | Bundle `test-data/` into `test-data.zip` (for drag-drop testing) |
| `npm run pack`          | Build the Chrome extension into `dist-extension/`                |

## Build targets

The project has two separate build configurations:

### Web (`npm run build` → `dist/`)

- Uses `createBrowserRouter` — clean URLs: `/profile`, `/activity`, etc.
- Asset paths are absolute (`/` prefix)
- Requires a web server that handles SPA fallback (serves `index.html` for all paths)
- Run with `npm run dev` (Vite dev server) or `npm run preview` (production preview)

### Chrome Extension (`npm run pack` → `dist-extension/`)

- Uses `createHashRouter` — hash URLs: `index.html#/profile`, `index.html#/activity`, etc.
- Asset paths are relative (`./` prefix) — required for `chrome-extension://` origin
- Build config: `vite.extension.config.ts` sets `base: './'`, `outDir: 'dist-extension'`, and defines `import.meta.env.VITE_EXTENSION = 'true'`
- The `generateManifest` Vite plugin in `vite.extension.config.ts` reads `version` and `description` from `package.json` and writes `dist-extension/manifest.json` at build time
- After build, `extension/background.js` is copied into `dist-extension/`
- Load in Chrome via `chrome://extensions` → Developer mode → Load unpacked → select `dist-extension/`

## Extension conventions

- **Router**: `src/app/router.tsx` switches from `createBrowserRouter` to `createHashRouter` when `import.meta.env.VITE_EXTENSION` is set. Hash routing is required because Chrome extension pages have fixed `chrome-extension://<id>/index.html` origins — there is no server to handle SPA path fallback. See `src/vite-env.d.ts` for the `VITE_EXTENSION` type declaration.
- **CSP**: Manifest V3's default Content Security Policy (`script-src 'self'`) forbids inline `<script>` tags. The theme hydration script is in `public/theme-init.js` (loaded via `<script src="/theme-init.js">`) rather than inline in `index.html`.
- **Icons**: The `manifest.json` references the same branding assets as the web build (`out-logo.png`, etc.) — they're in `public/` and get copied into both build outputs by Vite.
- **Permissions**: The extension only requests `"storage"` (needed for IndexedDB). No other permissions are required — the data never leaves the browser.
- **Background**: `extension/background.js` is a minimal service worker that opens `index.html` in a new tab when the user clicks the extension icon.
- **Manifest generation**: `extension/manifest.json` is generated at build time by the `generateManifest()` Vite plugin in `vite.extension.config.ts`. It reads `version` and `description` from `package.json` so they only need to be maintained in one place. The display name is hardcoded as `LinkedOut` in the plugin. The generated manifest is written directly to `dist-extension/manifest.json` — there is no checked-in source copy.
- **Cross-target shims**: `src/platform/runtime.ts` exports `isExtension()` for runtime detection; `src/platform/storage.ts` exports `getStorageEstimate()` for quota checks. Both work in web and extension contexts.

## Data conventions

- [test-data/](test-data) is the **anonymized canonical fixture export** (committed). Use it for day-to-day development, screenshots, demos, and as the source for Vitest fixtures.
- `Complete_LinkedInDataExport_*` is the **real, private export** — gitignored, used only for occasional end-to-end smoke checks. Never commit it.
- `npm run test-data:zip` produces `test-data.zip` from [test-data/](test-data) for dragging into the dropzone (exercises the real import path).
- Vitest unit tests do not read [test-data/](test-data) from disk; they use small curated subsets copied into `src/lib/**/__fixtures__/`.

## Agent customization

- DaisyUI usage is governed by [.github/instructions/daisyui.instructions.md](.github/instructions/daisyui.instructions.md) (the official daisyUI `llms.txt`, auto-loaded by VS Code Copilot via `applyTo: "**"`). Treat it as the source of truth for component class names, theme tokens, and customization rules.
- The session plan lives in agent memory at `/memories/session/plan.md`.

## Entity Icons

When rendering distinct entity types across the app, maintain consistency by using the following standard `lucide-react` icons:

- **Raw table**: `Table`
- **Pages / Companies**: `Building2`
- **Jobs / Work experience**: `BriefcaseBusiness`
- **Profiles / Persons / Users**: `User` or `Users` (for network/groups)
- **Events**: `CalendarDays`
- **Hashtags**: `Hash`
- **Learning**: `GraduationCap`
- **Courses**: `BookOpen`
- **Honors**: `Trophy`
- **Languages**: `Languages`
- **Recommendations**: `Quote`
- **Endorsements**: `Grape`
- **Honor**: `Award`
- **Skill**: `Star`
- **Ads**: `Megaphone`
- **Activity**: `ActivityIcon` (or `Activity`)
- **Messages**: `Mail`
- **Education**: `GraduationCap`
- **Received**: `ArrowRightFromLine` for example:
  - Received Recommendation
  - Pending Received Invitation
- **Sent**: `ArrowLeftToLine` for example:
  - Given Recommendation
  - Pending Sent Invitation
