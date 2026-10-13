<div align="center">

# ◆ Shapeshift

**Shapeshift your files. Privately, in your browser.**

Convert and compress images, strip photo metadata, generate app icons and QR codes,
build and split PDFs, format JSON, compare text, and more, without uploading a single byte.
No accounts, no file limits, no watermarks. Everything runs on your device.

![React](https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white)
![HeroUI](https://img.shields.io/badge/HeroUI-v3-000000?logo=heroui&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss&logoColor=white)
![Bun](https://img.shields.io/badge/Bun-1.3-000000?logo=bun&logoColor=white)

**[Open Shapeshift →](https://ahmadafienzidan.github.io/shapeshift/)**

</div>

---

## ✨ Why Shapeshift?

|  |  |
| --- | --- |
| 🔒 **Private by design** | Files are decoded and encoded in the browser. Nothing is sent to a server, so you can safely convert personal photos and documents. |
| 📦 **Built for bulk** | Drop hundreds of files or an entire folder at once, then grab everything in a single ZIP. |
| ⚡ **No sign-up, no limits** | No accounts, no file-size caps, no watermarks, no queue. Open it and go. |
| 📴 **Works offline** | After the first visit everything is cached, so every tool keeps working without a connection. Install it as an app from your browser. |
| 🌗 **Dark & light mode** | Deep navy by night, warm cream by day. Follows your system theme, with a one-click toggle. |
| 🌐 **English & Bahasa Indonesia** | Switch languages from the sidebar; your choice is remembered. |

## 🧰 Tools

### 🔄 Image Converter

Turn photos from any device into formats that open everywhere.

| Input | Output |
| --- | --- |
| HEIC · HEIF · WEBP · AVIF · PNG · JPG · GIF · BMP · SVG | **JPG** · **PNG** · **WEBP** |

- Adjustable quality for JPG and WEBP (PNG is lossless)
- Transparent areas are filled with white when exporting to JPG, so they don't turn black
- Perfect for iPhone photos (HEIC) that Windows and many websites can't open

### 🗜️ Compress

Shrink images for email, chat, or the web.

| Option | What it does |
| --- | --- |
| **Output format** | Keep the original format, or switch to JPG or WEBP for smaller files |
| **Quality** | 10–100%, trading size for detail |
| **Max dimension** | Caps the longest side (640 px up to 4096 px) while keeping the aspect ratio |
| **Strip metadata** | Always on: EXIF data such as GPS location and camera info is removed |

Every file shows its before and after size, and the queue shows the total space saved.

### 📐 Resize Image

| Preset | Size |
| --- | --- |
| **Instagram post** | 1080 × 1080 (1:1) |
| **Instagram portrait** | 1080 × 1350 (4:5) |
| **Instagram landscape** | 1080 × 566 |
| **Story · Reels** | 1080 × 1920 (9:16) |
| **YouTube thumbnail** | 1280 × 720 |
| **X post** | 1600 × 900 |
| **Link preview** | 1200 × 630 |
| **Custom** | Any size up to 8192 px |

- **Crop to fill** covers the whole frame, keeping the top, center, or bottom of the photo
- **Blur fill** keeps the whole photo and fills the empty space with a soft, blurred copy of it, the classic Instagram look
- **Color fill** keeps the whole photo on a solid background
- Works on whole batches, named like `holiday-1080x1350.jpg`

### ✂️ Crop & Rotate

- Aspect presets: original, 1:1, 4:5, 3:4 (ID photo), 16:9, 9:16, and 3:2
- Rotate in 90° steps and flip horizontally or vertically
- Drag and zoom (pinch on phones) to frame the shot; the exact output size in pixels is shown live
- Exports at full resolution as JPG, PNG, or WEBP

### 🧩 Merge Images

- Stack images **vertically** (screenshots, long-scroll stories) or **side by side** (before/after, comparisons)
- Match every image to the same width (vertical) or height (horizontal), or keep original sizes centered
- Spacing between images, transparent or solid background, and JPG, PNG, or WEBP output
- Reorder or sort A–Z before merging, with a preview of the result and its pixel size
- Very large results are scaled down to fit browser canvas limits instead of failing

### 💧 Watermark

- Text (with color) or your own logo, sized relative to each photo so small and large images look consistent
- Nine positions, or **tile** a diagonal pattern across the whole image like stock photos
- Adjustable opacity; keep the original format or export JPG, PNG, or WEBP
- Works on whole batches and folders, downloaded as one ZIP

### 🔍 Image to Text

- Pull text out of screenshots, photos, and scanned pages with [Tesseract](https://github.com/tesseract-ocr/tesseract), running on your device
- English, Indonesian, or both; switching the language re-reads every image
- Paste a screenshot straight from the clipboard with **Ctrl+V**, or drop a whole batch
- Edit the result in place, then copy it or download it as `.txt` (one file per image, or all at once)
- The engine and language data (a few MB) are downloaded the first time you use it, then cached for offline use

### ✨ Icon Generator

Drop in one logo (SVG gives the sharpest result) and get a complete icon pack as a ZIP:

| File | Size | Used by |
| --- | --- | --- |
| `favicon.ico` | 16, 32, 48 px in one file | Every browser, including legacy ones |
| `favicon-16x16.png`, `favicon-32x32.png` | 16, 32 px | Modern browser tabs |
| `apple-touch-icon.png` | 180 px, always opaque | iOS home screen |
| `android-chrome-192x192.png`, `android-chrome-512x512.png` | 192, 512 px | Android and installed web apps |
| `site.webmanifest` | | App name, theme color, and icon list |

- Transparent or solid background, padding, and corner radius
- Live preview of every size, plus a browser-tab and home-screen mockup
- The `<link>` and `<meta>` tags to paste into your `<head>`, ready to copy

### 🔳 QR Code

- **Generate** QR codes for links, any text, or Wi-Fi networks (scanning the code joins the network)
- Pick error correction (L, M, Q, H), colors, and PNG size; download as PNG or SVG
- **Scan** QR codes from photos and screenshots in bulk; links open with one click, everything else copies

### 🕵️ Photo Metadata

Photos carry more than pixels: camera model, the exact time, and often the GPS location where they were taken.

- See camera, lens, exposure, date, and a **location warning** with a map link for every photo
- Browse every EXIF, GPS, XMP, and IPTC field
- **Remove metadata losslessly** from JPEG, PNG, and WebP: only the metadata blocks are cut out, and the image data stays identical byte for byte
- The photo's orientation is preserved, so pictures taken sideways don't flip after cleaning
- Colour profiles are kept, so colours look the same
- Clean a whole batch and download it as a ZIP

### 🎨 Color

- Type any CSS color (`#3ddcff`, `rgb(…)`, `hsl(…)`, `oklch(…)`, or a name like `tomato`) or use the picker
- Get HEX, RGB, HSL, OKLCH, and CMYK at once, each one click to copy
- WCAG contrast ratio against white and black, with AA and AAA pass or fail
- An 11-step shade scale (50–950) generated in OKLCH so the steps look even
- **Palette from image:** pull the 8 dominant colors out of a photo and copy them as CSS variables

### 📄 PDF Tools

Three modes in one place:

| Mode | Input | Output | Options |
| --- | --- | --- | --- |
| **Images → PDF** | Any supported image, including HEIC | One PDF, one page per image | Page size (fit image, A4, Letter), margin, quality |
| **PDF → Images** | One or more PDFs | One image per page, zipped per PDF | PNG, JPG, or WEBP at 72, 150, or 300 DPI |
| **Merge PDFs** | Two or more PDFs | One combined PDF | |
| **Compress** | One or more PDFs | Smaller PDFs | Light, recommended, or strong. *Keep text* shrinks and re-encodes the images inside while text stays selectable; *Flatten pages* turns each page into an image, best for scans. The original is kept if it is already smaller |
| **Organize pages** | One PDF | A reordered, rotated, or trimmed PDF | Drag to reorder (mouse or keyboard), rotate, delete, or extract the selected pages |
| **Sign** | One PDF | A signed PDF | Draw with mouse or finger, type your name in a handwriting font, or upload a photo of your signature (paper background removed). Drag, resize, or nudge with arrow keys; place on one page or all |
| **Password** | One or more PDFs | Protected or unlocked PDFs | Add an AES-256 password and choose whether printing, copying, and editing are allowed; or remove a password you know |
| **Watermark & numbers** | One or more PDFs | Stamped PDFs | Diagonal text watermark with adjustable opacity; page numbers centered or right in formats like `3 / 10` or `Hal. 3 dari 10` |

- Reorder files with the arrows, or sort them A–Z with natural ordering (`page-2` before `page-10`)
- A4 and Letter pages rotate to landscape automatically for wide images
- Watermarks, page numbers, and signatures respect each page's rotation, so scanned pages stored sideways still get them upright where you placed them
- Unlocking removes every trace of the old encryption, not just the password prompt

### 📝 Markdown Editor

- Write and preview side by side, or switch to a full-width editor or preview; the preview follows your scroll
- Formatting toolbar for headings, bold, italic, links, images, quotes, code, lists, task lists, tables, and dividers, plus **Ctrl + B / I / K**
- Lists and quotes continue when you press Enter, and toolbar edits can be undone with **Ctrl + Z**
- GitHub-flavored Markdown with tables, task lists, and syntax-highlighted code
- Open or drop a `.md` file; export to `.md`, a standalone styled **HTML** page, or print to **PDF**
- Your draft is saved in this browser as you type, and the preview is sanitized so a downloaded `.md` file cannot run scripts

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

### #️⃣ Checksum

- MD5, SHA-1, SHA-256, and SHA-512, several at once
- Files are streamed in chunks, so multi-gigabyte downloads hash without filling memory
- Paste the published checksum (even a `sha256sum` line like `abc123…  file.iso`) and every file is marked **Matches** or **Does not match**

### 📝 Text Tools

- Live counts: words, characters (with and without spaces), sentences, paragraphs, lines, plus reading and speaking time
- Counting uses the browser's language-aware segmenter, so emoji count as one character and languages without spaces (Japanese, Chinese, Thai) count correctly
- Change case: UPPERCASE, lowercase, Title Case, Sentence case, camelCase, PascalCase, snake_case, kebab-case, CONSTANT_CASE
- Line tools: sort A–Z or Z–A with natural ordering, reverse, remove duplicates, remove empty lines, trim spaces
- Most-used words, and an undo history for every change

### 🔢 Base64

| Mode | What it does |
| --- | --- |
| **Text** | Encode or decode UTF-8 text (emoji and non-Latin scripts work), with an optional URL-safe alphabet |
| **File → Base64** | Turn any file into raw Base64 or a ready-to-use data URI; copy or save as `.txt` |
| **Base64 → File** | Paste Base64 or a data URI to get the original file back, with an image preview and the right extension |

### 🧑‍💻 Developer tools

#### JSON Formatter

- Pretty-print with 2 or 4 spaces or tabs, or minify; sort keys A–Z
- Full-width, syntax-colored code view with line numbers and a hanging indent, so long keys and values wrap neatly under themselves
- Wrap or scroll long lines, and expand the result to **full screen** (Esc to close)
- A collapsible **tree view** with item counts
- Errors point to the exact line and column with a caret under the problem, and trailing commas are called out by name
- Size, key, object, and depth stats; drop in a `.json` file, copy, or download

#### Text Diff

- Side-by-side line diff with line numbers, and word-level highlights inside changed lines
- Word or character mode for prose
- Ignore whitespace or letter case

#### Dev Tools

| Tab | What it does |
| --- | --- |
| **URL** | Encode or decode a single component or a whole URL, and see the URL split into protocol, host, path, hash, and query parameters |
| **JWT** | Decode the header and payload (a leading `Bearer` is fine), show `exp`, `iat`, and `nbf` as readable dates, and flag expired tokens. The signature is deliberately not verified, since that would need your secret key |
| **UUID** | Generate v4 (random) or v7 (time-ordered, better for database keys) in batches |
| **Timestamp** | Convert Unix seconds or milliseconds and ISO dates to UTC, local, and relative time, with a live clock |

## 🚀 Getting started

Requires [Bun](https://bun.sh).

```bash
bun install
bun run dev
```

Then open http://localhost:5173/shapeshift/ (the app lives under `/shapeshift/` to match GitHub Pages).

### Scripts

| Command | Description |
| --- | --- |
| `bun run dev` | Start the dev server |
| `bun run build` | Typecheck and build a static site into `dist/` |
| `bun run preview` | Serve the production build locally |
| `bun run typecheck` | Run the TypeScript compiler |
| `bun run lint` | Lint and format-check with Biome |
| `bun run test` | Run the unit tests with Vitest |

### Deployment

Every push to `main` runs [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml): it lints, builds, and publishes `dist/` to GitHub Pages at https://ahmadafienzidan.github.io/shapeshift/. `index.html` is also published as `404.html`, so deep links such as `/shapeshift/pdf` load the app instead of a GitHub error page.

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

PDF pages are rendered by pdf.js in a Web Worker and exported through the same canvas encoder, while new PDFs are assembled with pdf-lib. Heavy libraries (the HEIC decoder, pdf.js, and the OCR engine) are only downloaded the first time you use them.

## 🗂️ Project structure

```
src/
├── components/     Sidebar, dropzone, batch and combine tools, editors, option controls
├── i18n/           en.json, id.json, locale context, and provider (react-intl)
├── lib/            The logic behind each tool, independent of the UI
├── pages/          One page per tool, plus Home
└── tools.ts        Tool registry used by the sidebar and home page
```

### Adding a language

1. Copy `src/i18n/en.json` to e.g. `src/i18n/fr.json` and translate the values.
2. Add its code to the `Locale` type in `src/i18n/locale.ts` and register it in `MESSAGES` in `src/i18n/messages.ts`.
3. Add a button for it in the language switch in `src/components/Sidebar.tsx`.

## 🧱 Tech stack

- [React 19](https://react.dev) + [TypeScript](https://www.typescriptlang.org)
- [HeroUI v3](https://heroui.com) (formerly NextUI) on [Tailwind CSS v4](https://tailwindcss.com), themed with a deep-navy and electric-cyan palette
- [Inter](https://rsms.me/inter/), [Barlow Condensed](https://fonts.google.com/specimen/Barlow+Condensed), and [JetBrains Mono](https://www.jetbrains.com/lp/mono/), bundled locally via Fontsource
- [React Aria Components](https://react-spectrum.adobe.com/react-aria/) for the accessible drop zone and file picker
- [pdf.js](https://mozilla.github.io/pdf.js/) to render PDF pages and [@cantoo/pdf-lib](https://github.com/cantoo-scribe/pdf-lib) (a maintained pdf-lib fork) to build and merge PDFs
- [Papa Parse](https://www.papaparse.com) and [yaml](https://eemeli.org/yaml/) for data conversion
- [qrcode](https://github.com/soldair/node-qrcode) to generate and [jsQR](https://github.com/cozmo/jsQR) to read QR codes
- [ExifReader](https://github.com/mattiasw/ExifReader) to read photo metadata and [hash-wasm](https://github.com/Daninet/hash-wasm) for streaming checksums
- [marked](https://marked.js.org), [highlight.js](https://highlightjs.org), and [DOMPurify](https://github.com/cure53/DOMPurify) for the Markdown editor
- [Tesseract.js](https://tesseract.projectnaptha.com) for text recognition, with its engine and language data served from this site
- [jsdiff](https://github.com/kpdecker/jsdiff) for text comparison and [react-easy-crop](https://github.com/ValentinH/react-easy-crop) for the crop tool
- [vite-plugin-pwa](https://vite-pwa-org.netlify.app) for offline support, with app icons generated from `public/logo.svg`
- [React Router](https://reactrouter.com) and [react-intl](https://formatjs.github.io/docs/react-intl/)
- [Vite](https://vite.dev), [Bun](https://bun.sh), [Biome](https://biomejs.dev)
- [lucide-react](https://lucide.dev) icons
