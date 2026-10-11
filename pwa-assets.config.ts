import {
	defineConfig,
	minimal2023Preset,
} from "@vite-pwa/assets-generator/config";

const navy = { background: "#001e2b" };

export default defineConfig({
	headLinkOptions: { preset: "2023" },
	preset: {
		...minimal2023Preset,
		transparent: { ...minimal2023Preset.transparent, padding: 0 },
		maskable: {
			...minimal2023Preset.maskable,
			padding: 0.1,
			resizeOptions: navy,
		},
		apple: { ...minimal2023Preset.apple, padding: 0, resizeOptions: navy },
	},
	images: ["public/logo.svg"],
});
