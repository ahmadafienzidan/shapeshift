import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
	plugins: [
		react(),
		tailwindcss(),
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
			},
		}),
	],
});
