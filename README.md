<p align="center">
  <img src="public/out-logo-128.png" alt="LinkedOut logo" width="128" height="128" />
</p>

<h1 align="center">LinkedOut</h1>

<p align="center">
  <strong>The missing LinkedIn UI for your own data export.</strong><br />
  Browse your posts, comments, messages, and more — locally in the browser.<br />
  No server, no tracking. Your data never leaves your machine.
</p>

<p align="center">
  <a href="https://chromewebstore.google.com/detail/linkedout/dcbkghofdjbpmffcieifebmppeiedckc">
    <img src="https://img.shields.io/badge/Chrome_Web_Store-Get_it-4285F4?logo=googlechrome&amp;logoColor=white" alt="Get LinkedOut on the Chrome Web Store" />
  </a>
</p>

<p align="center">
  Read <a href="https://blog.alexewerlof.com/p/linkedout">why LinkedOut exists</a>.
</p>

LinkedIn hands you a copy of your data (thanks, GDPR). LinkedOut turns that raw ZIP into a browsable version of your own LinkedIn: your profile, activity, messages, connections, and the surprising amount of data LinkedIn keeps about you — all rendered offline, with links back to the real thing on LinkedIn wherever possible.

## Run it locally

LinkedOut is a client-only single-page app, so you can also run it yourself from source:

```bash
npm install
npm run dev
```

Open `http://localhost:5173`, then drag your LinkedIn export ZIP (or `test-data.zip` from this repo) onto the drop zone.

> Developer docs — including the Chrome extension build (`npm run pack`) — live in [AGENTS.md](./AGENTS.md).

## Features & Benefits

- **The missing LinkedIn UI.** LinkedIn's own search is useless for your history. LinkedOut lets you find and browse any post, comment, or message you've ever written.
- **Your LinkedIn, reconstructed offline.** Profile, activity, messages, connections, recommendations, and dozens of other datasets rendered as real views instead of raw CSVs.
- **Private by design.** No server, no analytics, no tracking. Everything is parsed and stored in your browser's IndexedDB — the extension requests zero permissions and your data never leaves your machine.
- **See what LinkedIn really knows about you.** Surface the eye-opening files LinkedIn buries: inferences about you, the IP address of every login, and old contact syncs you forgot about.
- **Tames LinkedIn's messy export.** Broken CSV quoting, mixed date formats, duplicates, and account-numbered filenames are handled for you.
- **Act, don't just look.** Every record links back to the real thing on LinkedIn, so deleting an old post or reposting a winner is one click away.
- **Free, open source, and yours to run.** MIT licensed — install it from the Chrome Web Store in seconds, or run it locally from source.

## Privacy

LinkedOut is a **local-only** application. Your LinkedIn export ZIP is processed entirely in your browser. No data is ever sent to any server, and there are no analytics or tracking of any kind.

## License

MIT
