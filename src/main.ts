import { heicTo } from "heic-to";

type Format = "image/jpeg" | "image/png";

const EXTENSIONS: Record<Format, string> = {
	"image/jpeg": "jpg",
	"image/png": "png",
};

function byId<T extends HTMLElement>(id: string): T {
	const element = document.getElementById(id);
	if (!element) throw new Error(`Missing element #${id}`);
	return element as T;
}

const fileInput = byId<HTMLInputElement>("file-input");
const dropzone = byId<HTMLLabelElement>("dropzone");
const qualityField = byId<HTMLLabelElement>("quality-field");
const qualityInput = byId<HTMLInputElement>("quality");
const qualityValue = byId<HTMLOutputElement>("quality-value");
const results = byId<HTMLElement>("results");
const fileList = byId<HTMLUListElement>("file-list");
const downloadAll = byId<HTMLButtonElement>("download-all");

const converted: HTMLAnchorElement[] = [];
let queue = Promise.resolve();

function selectedFormat(): Format {
	const checked = document.querySelector<HTMLInputElement>(
		'input[name="format"]:checked',
	);
	return checked?.value as Format;
}

function formatSize(bytes: number): string {
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
	return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function outputName(name: string, format: Format): string {
	return `${name.replace(/\.(heic|heif)$/i, "")}.${EXTENSIONS[format]}`;
}

function createRow(file: File) {
	const item = document.createElement("li");
	const thumb = document.createElement("div");
	thumb.className = "thumb";
	const info = document.createElement("div");
	info.className = "info";
	const name = document.createElement("span");
	name.className = "name";
	name.textContent = file.name;
	const status = document.createElement("span");
	status.className = "status";
	status.textContent = "Waiting…";
	info.append(name, status);
	item.append(thumb, info);
	fileList.append(item);
	return { item, thumb, status };
}

async function convertFile(file: File, format: Format, quality: number) {
	const row = createRow(file);
	row.status.textContent = "Converting…";
	try {
		const blob = await heicTo({ blob: file, type: format, quality });
		const url = URL.createObjectURL(blob);
		const filename = outputName(file.name, format);

		const img = document.createElement("img");
		img.src = url;
		img.alt = "";
		row.thumb.append(img);

		row.status.textContent = `${formatSize(file.size)} → ${formatSize(blob.size)}`;

		const link = document.createElement("a");
		link.href = url;
		link.download = filename;
		link.className = "download";
		link.textContent = `Download ${EXTENSIONS[format].toUpperCase()}`;
		row.item.append(link);

		converted.push(link);
		downloadAll.disabled = false;
	} catch (error) {
		row.item.classList.add("error");
		row.status.textContent =
			error instanceof Error ? error.message : "Conversion failed";
	}
}

function handleFiles(files: FileList | null) {
	if (!files?.length) return;
	results.hidden = false;
	const format = selectedFormat();
	const quality = Number(qualityInput.value) / 100;
	for (const file of Array.from(files)) {
		queue = queue.then(() => convertFile(file, format, quality));
	}
}

fileInput.addEventListener("change", () => {
	handleFiles(fileInput.files);
	fileInput.value = "";
});

dropzone.addEventListener("dragover", (event) => {
	event.preventDefault();
	dropzone.classList.add("dragging");
});

dropzone.addEventListener("dragleave", () => {
	dropzone.classList.remove("dragging");
});

dropzone.addEventListener("drop", (event) => {
	event.preventDefault();
	dropzone.classList.remove("dragging");
	handleFiles(event.dataTransfer?.files ?? null);
});

qualityInput.addEventListener("input", () => {
	qualityValue.textContent = `${qualityInput.value}%`;
});

for (const radio of document.querySelectorAll<HTMLInputElement>(
	'input[name="format"]',
)) {
	radio.addEventListener("change", () => {
		qualityField.hidden = selectedFormat() === "image/png";
	});
}

downloadAll.addEventListener("click", () => {
	for (const link of converted) link.click();
});
