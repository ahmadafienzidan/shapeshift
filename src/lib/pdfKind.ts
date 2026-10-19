// Kept apart from pdf.ts so file pickers can recognize PDFs without loading
// pdf-lib.
export const PDF_KIND = {
	accept: ["application/pdf", ".pdf"],
	matches: (file: File) =>
		file.type === "application/pdf" || /\.pdf$/i.test(file.name),
	formats: "PDF",
};
