import jsQR from "jsqr";
import QRCode, { type QRCodeErrorCorrectionLevel } from "qrcode";
import { decodeImage } from "./image";

export type QrOptions = {
	foreground: string;
	background: string;
	errorCorrection: QRCodeErrorCorrectionLevel;
	size: number;
};

export type WifiSecurity = "WPA" | "WEP" | "nopass";

function escapeWifi(value: string): string {
	return value.replace(/([\\;,:"])/g, "\\$1");
}

export function wifiPayload(
	ssid: string,
	password: string,
	security: WifiSecurity,
): string {
	const parts = [`T:${security}`, `S:${escapeWifi(ssid)}`];
	if (security !== "nopass") parts.push(`P:${escapeWifi(password)}`);
	return `WIFI:${parts.join(";")};;`;
}

export function qrSvg(text: string, options: QrOptions): Promise<string> {
	return QRCode.toString(text, {
		type: "svg",
		errorCorrectionLevel: options.errorCorrection,
		margin: 2,
		color: { dark: options.foreground, light: options.background },
	});
}

export async function qrPng(text: string, options: QrOptions): Promise<Blob> {
	const canvas = document.createElement("canvas");
	await QRCode.toCanvas(canvas, text, {
		errorCorrectionLevel: options.errorCorrection,
		margin: 2,
		width: options.size,
		color: { dark: options.foreground, light: options.background },
	});
	return new Promise((resolve, reject) =>
		canvas.toBlob((blob) =>
			blob ? resolve(blob) : reject(new Error("Canvas export failed")),
		),
	);
}

// Large photos are scaled down first; QR detection does not need the extra
// pixels and jsQR's time grows with the pixel count.
const SCAN_MAX = 1600;

export async function scanQr(file: File): Promise<string | null> {
	const bitmap = await decodeImage(file);
	const scale = Math.min(1, SCAN_MAX / Math.max(bitmap.width, bitmap.height));
	const width = Math.round(bitmap.width * scale);
	const height = Math.round(bitmap.height * scale);
	const canvas = new OffscreenCanvas(width, height);
	const context = canvas.getContext("2d", { willReadFrequently: true });
	if (!context) throw new Error("Canvas 2D context is unavailable");
	context.drawImage(bitmap, 0, 0, width, height);
	bitmap.close();
	const { data } = context.getImageData(0, 0, width, height);
	return jsQR(data, width, height)?.data ?? null;
}
