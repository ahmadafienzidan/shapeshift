import { readFileSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";
import {
	type CSSProperties,
	createElement,
	type ReactElement,
	type ReactNode,
} from "react";
import satori from "satori";
import type { Locale } from "../i18n/locale";
import { OG_HEIGHT, OG_WIDTH, type Page } from "./routes";
import { pageHeading, pageSummary, text } from "./text";

const INK = "#001e2b";
const CREAM = "#fdfeec";
const ELECTRIC = "#3ddcff";
const IRIS = "#7c5cff";

// satori reads .woff but not .woff2, which is all Inter ships as.
const font = (weight: 600 | 700) => ({
	name: "Barlow Condensed",
	weight,
	style: "normal" as const,
	data: readFileSync(
		`node_modules/@fontsource/barlow-condensed/files/barlow-condensed-latin-${weight}-normal.woff`,
	),
});

type Style = CSSProperties;

const el = (style: Style, ...children: ReactNode[]): ReactElement =>
	createElement("div", { style }, ...children);

// The logo's square and circle, scaled to the given size.
const mark = (size: number, style: Style = {}) =>
	el(
		{
			display: "flex",
			position: "relative",
			width: size,
			height: size,
			...style,
		},
		[
			el({
				position: "absolute",
				left: 0,
				top: 0,
				width: size * 0.6,
				height: size * 0.6,
				borderRadius: size * 0.06,
				background: ELECTRIC,
			}),
			el({
				position: "absolute",
				right: 0,
				bottom: 0,
				width: size * 0.68,
				height: size * 0.68,
				borderRadius: "50%",
				background: IRIS,
				opacity: 0.92,
			}),
		],
	);

export function ogCard(page: Page, locale: Locale): ReactElement {
	return el(
		{
			display: "flex",
			flexDirection: "column",
			justifyContent: "space-between",
			boxSizing: "border-box",
			width: OG_WIDTH,
			height: OG_HEIGHT,
			padding: 72,
			background: INK,
			color: CREAM,
			fontFamily: "Barlow Condensed",
		},
		[
			el({ display: "flex", alignItems: "center", gap: 18 }, [
				mark(52),
				el(
					{
						fontSize: 40,
						fontWeight: 700,
						letterSpacing: 2,
						textTransform: "uppercase",
					},
					"Shapeshift",
				),
			]),
			el({ display: "flex", flexDirection: "column", gap: 24, maxWidth: 900 }, [
				el(
					{
						fontSize: 104,
						fontWeight: 700,
						lineHeight: 1,
						textTransform: "uppercase",
					},
					pageHeading(locale, page),
				),
				el(
					{
						fontSize: 40,
						fontWeight: 600,
						lineHeight: 1.25,
						color: "rgba(253, 254, 236, 0.75)",
					},
					pageSummary(locale, page),
				),
				el(
					{ marginTop: 12, fontSize: 34, fontWeight: 600, color: ELECTRIC },
					text(locale, "seo.og.tagline"),
				),
			]),
			mark(460, { position: "absolute", right: -120, top: -110, opacity: 0.2 }),
		],
	);
}

export async function ogImage(page: Page, locale: Locale): Promise<Uint8Array> {
	const svg = await satori(ogCard(page, locale), {
		width: OG_WIDTH,
		height: OG_HEIGHT,
		fonts: [font(600), font(700)],
	});
	return new Resvg(svg).render().asPng();
}
