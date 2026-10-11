<div align="center">

# ◆ Shapeshift

**Shapeshift your files. Privately, in your browser.**

Convert, compress, and resize images without uploading a single byte.
No accounts, no file limits, no watermarks. Everything runs on your device.

![React](https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white)
![HeroUI](https://img.shields.io/badge/HeroUI-v3-000000?logo=heroui&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss&logoColor=white)
![Bun](https://img.shields.io/badge/Bun-1.3-000000?logo=bun&logoColor=white)

</div>

---

## ✨ Why Shapeshift?

|  |  |
| --- | --- |
| 🔒 **Private by design** | Files are decoded and encoded in the browser. Nothing is sent to a server, so you can safely convert personal photos and documents. |
| 📦 **Built for bulk** | Drop hundreds of files or an entire folder at once, then grab everything in a single ZIP. |
| ⚡ **No installs, no limits** | No sign-up, no file-size caps, no watermarks, no queue. Open it and go. |
| 🌗 **Dark & light mode** | Deep navy by night, warm cream by day. Follows your system theme, with a one-click toggle. |
| 🌐 **English & Bahasa Indonesia** | Switch languages from the sidebar; your choice is remembered. |

## 🧰 Tools

### 🔄 Image Converter

Turn photos from any device into formats that open everywhere.

| Input | Output |
| --- | --- |
| HEIC · HEIF · WEBP · AVIF · PNG · JPG · GIF · BMP | **JPG** · **PNG** · **WEBP** |

- Adjustable quality for JPG and WEBP (PNG is lossless)
- Transparent areas are filled with white when exporting to JPG, so they don't turn black
- Perfect for iPhone photos (HEIC) that Windows and many websites can't open

### 🗜️ Compress & Resize

Shrink images for email, chat, or the web.

| Option | What it does |
| --- | --- |
| **Output format** | Keep the original format, or switch to JPG or WEBP for smaller files |
| **Quality** | 10–100%, trading size for detail |
| **Max dimension** | Caps the longest side (640 px up to 4096 px) while keeping the aspect ratio |
| **Strip metadata** | Always on: EXIF data such as GPS location and camera info is removed |

Every file shows its before and after size, and the queue shows the total space saved.

### 🛣️ Coming soon

- 📄 **PDF Tools**: images to PDF, PDF to images, merge PDFs
- 🧾 **Data Formats**: JSON ⇄ CSV ⇄ YAML

## 🚀 Getting started

Requires [Bun](https://bun.sh).

```bash
bun install
bun run dev
```

Then open http://localhost:5173.

### Scripts

| Command | Description |
| --- | --- |
| `bun run dev` | Start the dev server |
| `bun run build` | Typecheck and build a static site into `dist/` |
| `bun run preview` | Serve the production build locally |
| `bun run typecheck` | Run the TypeScript compiler |
| `bun run lint` | Lint and format-check with Biome |

## ⚙️ How it works

```
 File / folder ─▶ Decode ─────────────▶ Canvas ──────────▶ Encode ──────▶ Download / ZIP
                  heic-to (HEIC/HEIF)   resize + flatten   JPG/PNG/WEBP   fflate
                  createImageBitmap     (EXIF is dropped)
```

1. **Decode**: HEIC/HEIF goes through [`heic-to`](https://github.com/hoppergee/heic-to) (libheif compiled to WebAssembly). Everything else uses the browser's native `createImageBitmap`, which also applies EXIF orientation.
2. **Draw**: the bitmap is painted onto an `OffscreenCanvas`, scaled down if a max dimension is set. Only pixels survive this step, which is what strips the metadata.
3. **Encode**: `canvas.convertToBlob()` produces the final JPG, PNG, or WEBP.
4. **Bundle**: files are processed one by one to keep memory low, and [`fflate`](https://github.com/101arrowz/fflate) zips the results on demand. Duplicate names are renamed automatically (`photo.jpg`, `photo (2).jpg`).

## 🗂️ Project structure

```
src/
├── components/     Sidebar, dropzone, file queue, shared option controls
├── i18n/           en.json, id.json, and the locale provider (react-intl)
├── lib/            Image pipeline, batch queue, ZIP helpers, theme hook
├── pages/          Home, Image Converter, Compress & Resize
└── tools.ts        Tool registry used by the sidebar and home page
```

### Adding a language

1. Copy `src/i18n/en.json` to e.g. `src/i18n/fr.json` and translate the values.
2. Register it in `MESSAGES` inside `src/i18n/LocaleProvider.tsx`.
3. Add a button for it in the language switch in `src/components/Sidebar.tsx`.

## 🧱 Tech stack

- [React 19](https://react.dev) + [TypeScript](https://www.typescriptlang.org)
- [HeroUI v3](https://heroui.com) (formerly NextUI) on [Tailwind CSS v4](https://tailwindcss.com), themed with a deep-navy and electric-cyan palette
- [Inter](https://rsms.me/inter/), [Barlow Condensed](https://fonts.google.com/specimen/Barlow+Condensed), and [JetBrains Mono](https://www.jetbrains.com/lp/mono/), bundled locally via Fontsource
- [React Aria Components](https://react-spectrum.adobe.com/react-aria/) for the accessible drop zone and file picker
- [React Router](https://reactrouter.com) and [react-intl](https://formatjs.github.io/docs/react-intl/)
- [Vite](https://vite.dev), [Bun](https://bun.sh), [Biome](https://biomejs.dev)
- [lucide-react](https://lucide.dev) icons
