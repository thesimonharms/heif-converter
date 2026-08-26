# HEIF Converter

A local [Pondoknusa](https://pondoknusa.dev) app for turning HEIF/HEIC photos into JPEG, PNG, or PDF. The UI runs in the browser and opens automatically when you start the app.

Nothing is uploaded to a remote server. Files are converted on your machine and downloaded back to you.

## Requirements

- Node.js 26 or newer

## Run

```bash
npm install
npm run dev
```

That starts the Pondoknusa server at [http://127.0.0.1:3000](http://127.0.0.1:3000) and opens your browser. Set `OPEN_BROWSER=0` if you want the server without launching a window.

## Use

1. Drop one or more `.heic` / `.heif` files (iPhone photos work).
2. Pick JPEG, PNG, or PDF.
3. Convert. A single image downloads as that format. Several JPEGs or PNGs come back as a zip. Several images to PDF become one multi-page document.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server, no queue worker, opens the browser |
| `npm start` | Production server, opens the browser |
| `npm test` | Feature and unit tests |

## License

MIT
