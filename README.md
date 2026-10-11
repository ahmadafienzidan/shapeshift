<div align="center">

# ◆ Shapeshift

**Shapeshift your files. Privately, in your browser.**

Convert images, compress photos, build and split PDFs, and transform data files
without uploading a single byte.
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

### 📄 PDF Tools

Three modes in one place:

| Mode | Input | Output | Options |
| --- | --- | --- | --- |
| **Images → PDF** | Any supported image, including HEIC | One PDF, one page per image | Page size (fit image, A4, Letter), margin, quality |
| **PDF → Images** | One or more PDFs | One image per page, zipped per PDF | PNG, JPG, or WEBP at 72, 150, or 300 DPI |
| **Merge PDFs** | Two or more PDFs | One combined PDF | |

- Reorder files with the arrows, or sort them A–Z with natural ordering (`page-2` before `page-10`)
- A4 and Letter pages rotate to landscape automatically for wide images

### 🧾 Data Formats

A two-pane editor that converts as you type.

| From / To | JSON | CSV | YAML |
| --- | :---: | :---: | :---: |
| **JSON** | ✓ | ✓ | ✓ |
| **CSV** | ✓ | ✓ | ✓ |
| **YAML** | ✓ | ✓ | ✓ |

- Drop or upload a `.json`, `.csv`, `.tsv`, `.yaml`, or `.yml` file and the input format is detected
- Nested objects become dot-separated CSV columns (`contact.email`) and turn back into objects on the way in, so JSON → CSV → JSON round-trips cleanly
- Comma, semicolon (handy for Excel in many locales), or tab delimiters
- 2- or 4-space indentation, one-click swap, copy, and download
- Parse errors are shown inline with the row or position that failed

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

PDF pages are rendered by pdf.js in a Web Worker and exported through the same canvas encoder, while new PDFs are assembled with pdf-lib. Heavy libraries (the HEIC decoder and pdf.js) are only downloaded the first time you use them.

## 🗂️ Project structure

```
src/
├── components/     Sidebar, dropzone, batch and combine tools, option controls
├── i18n/           en.json, id.json, and the locale provider (react-intl)
├── lib/            Image, PDF, and data pipelines, batch queue, ZIP helpers
├── pages/          Home, Image Converter, Compress & Resize, PDF Tools, Data Formats
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
- [pdf.js](https://mozilla.github.io/pdf.js/) to render PDF pages and [@cantoo/pdf-lib](https://github.com/cantoo-scribe/pdf-lib) (a maintained pdf-lib fork) to build and merge PDFs
- [Papa Parse](https://www.papaparse.com) and [yaml](https://eemeli.org/yaml/) for data conversion
- [React Router](https://reactrouter.com) and [react-intl](https://formatjs.github.io/docs/react-intl/)
- [Vite](https://vite.dev), [Bun](https://bun.sh), [Biome](https://biomejs.dev)
- [lucide-react](https://lucide.dev) icons
