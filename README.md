# heic-converter

Convert HEIC/HEIF photos to JPG or PNG in the browser. Conversion runs client-side with [heic-to](https://github.com/hoppergee/heic-to), so files never leave your device.

## Development

```bash
bun install
bun run dev
```

Open http://localhost:3000, pick JPG or PNG, then drop HEIC files onto the page.

## Build

```bash
bun run build
```

The static site is written to `dist/` and can be hosted on any static host (GitHub Pages, Netlify, Vercel, Cloudflare Pages).
