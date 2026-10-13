import { readFileSync } from "node:fs";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";
import { VitePWA } from "vite-plugin-pwa";

const BASE = "/shapeshift/";

const OCR_LANGUAGES = ["eng", "ind"];

const ocrModel = (code: string) =>
	readFileSync(
		`node_modules/@tesseract.js-data/${code}/4.0.0_best_int/${code}.traineddata.gz`,
	);

// tesseract.js loads every language from one folder by file name, so the
// models are served unhashed from tessdata/ in dev and in the build.
function tessdata(): Plugin {
	return {
		name: "tessdata",
		configureServer(server) {
			server.middlewares.use(`${BASE}tessdata`, (request, response, next) => {
				const code = request.url?.match(/^\/(\w+)\.traineddata\.gz$/)?.[1];
				if (!code || !OCR_LANGUAGES.includes(code)) return next();
				response.setHeader("Content-Type", "application/gzip");
				response.end(ocrModel(code));
			});
		},
		generateBundle() {
			for (const code of OCR_LANGUAGES) {
				this.emitFile({
					type: "asset",
					fileName: `tessdata/${code}.traineddata.gz`,
					source: ocrModel(code),
				});
			}
		},
	};
}

export default defineConfig({
	// GitHub Pages serves the site from https://<user>.github.io/shapeshift/.
	base: BASE,
	plugins: [
		react(),
		tailwindcss(),
		tessdata(),
		VitePWA({
			registerType: "autoUpdate",
			pwaAssets: { config: true, overrideManifestIcons: true },
			manifest: {
				name: "Shapeshift",
				short_name: "Shapeshift",
				description:
					"Convert, compress, and transform files privately in your browser.",
				theme_color: "#001e2b",
				background_color: "#001e2b",
				display: "standalone",
			},
			workbox: {
				globPatterns: ["**/*.{js,mjs,css,html,svg,png,ico,woff2}"],
				// The HEIC decoder (~3 MB) and pdf.js worker must be precached too,
				// or those tools would break offline.
				maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
				// The OCR engine and language data (~8 MB) are only fetched once
				// someone uses Image to Text, then kept for offline use.
				globIgnores: ["**/worker.min-*.js", "**/tesseract-core-*.js"],
				runtimeCaching: [
					{
						urlPattern: /\/(worker\.min-|tesseract-core-|tessdata\/)/,
						handler: "CacheFirst",
						options: { cacheName: "ocr" },
					},
				],
			},
		}),
	],
});
