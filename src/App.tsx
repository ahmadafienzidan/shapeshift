import { lazy, type ReactNode, Suspense } from "react";
import { useLocation } from "react-router";
import { KeepAlive } from "./components/KeepAlive";
import { Sidebar } from "./components/Sidebar";
import { HomePage } from "./pages/HomePage";
import { type Page, pageFromPath } from "./seo/routes";

const ConvertPage = lazy(() =>
	import("./pages/ConvertPage").then((module) => ({
		default: module.ConvertPage,
	})),
);
const CompressPage = lazy(() =>
	import("./pages/CompressPage").then((module) => ({
		default: module.CompressPage,
	})),
);
const PdfPage = lazy(() =>
	import("./pages/PdfPage").then((module) => ({ default: module.PdfPage })),
);
const IconsPage = lazy(() =>
	import("./pages/IconsPage").then((module) => ({ default: module.IconsPage })),
);
const QrPage = lazy(() =>
	import("./pages/QrPage").then((module) => ({ default: module.QrPage })),
);
const Base64Page = lazy(() =>
	import("./pages/Base64Page").then((module) => ({
		default: module.Base64Page,
	})),
);
const MetadataPage = lazy(() =>
	import("./pages/MetadataPage").then((module) => ({
		default: module.MetadataPage,
	})),
);
const ChecksumPage = lazy(() =>
	import("./pages/ChecksumPage").then((module) => ({
		default: module.ChecksumPage,
	})),
);
const WatermarkPage = lazy(() =>
	import("./pages/WatermarkPage").then((module) => ({
		default: module.WatermarkPage,
	})),
);
const MergePage = lazy(() =>
	import("./pages/MergePage").then((module) => ({ default: module.MergePage })),
);
const CropPage = lazy(() =>
	import("./pages/CropPage").then((module) => ({ default: module.CropPage })),
);
const TextPage = lazy(() =>
	import("./pages/TextPage").then((module) => ({ default: module.TextPage })),
);
const ColorPage = lazy(() =>
	import("./pages/ColorPage").then((module) => ({ default: module.ColorPage })),
);
const JsonPage = lazy(() =>
	import("./pages/JsonPage").then((module) => ({ default: module.JsonPage })),
);
const DiffPage = lazy(() =>
	import("./pages/DiffPage").then((module) => ({ default: module.DiffPage })),
);
const DevToolsPage = lazy(() =>
	import("./pages/DevToolsPage").then((module) => ({
		default: module.DevToolsPage,
	})),
);
const ResizePage = lazy(() =>
	import("./pages/ResizePage").then((module) => ({
		default: module.ResizePage,
	})),
);
const MarkdownPage = lazy(() =>
	import("./pages/MarkdownPage").then((module) => ({
		default: module.MarkdownPage,
	})),
);
const OcrPage = lazy(() =>
	import("./pages/OcrPage").then((module) => ({ default: module.OcrPage })),
);
const OpenPage = lazy(() =>
	import("./pages/OpenPage").then((module) => ({ default: module.OpenPage })),
);
const DataPage = lazy(() =>
	import("./pages/DataPage").then((module) => ({ default: module.DataPage })),
);

const PAGES: Record<Page | "open", ReactNode> = {
	home: <HomePage />,
	convert: <ConvertPage />,
	compress: <CompressPage />,
	resize: <ResizePage />,
	crop: <CropPage />,
	merge: <MergePage />,
	watermark: <WatermarkPage />,
	ocr: <OcrPage />,
	icons: <IconsPage />,
	metadata: <MetadataPage />,
	color: <ColorPage />,
	pdf: <PdfPage />,
	markdown: <MarkdownPage />,
	qr: <QrPage />,
	data: <DataPage />,
	text: <TextPage />,
	base64: <Base64Page />,
	checksum: <ChecksumPage />,
	json: <JsonPage />,
	diff: <DiffPage />,
	devtools: <DevToolsPage />,
	open: <OpenPage />,
};

export function App() {
	const { pathname } = useLocation();

	return (
		<div className="min-h-dvh bg-background text-foreground lg:flex">
			<Sidebar />
			<main className="mx-auto w-full min-w-0 max-w-6xl flex-1 px-4 py-8 sm:px-8 lg:py-12">
				{/* Pages stay mounted once opened, so files and results survive
				    switching tools or languages. */}
				<KeepAlive
					active={pageFromPath(pathname)}
					render={(page) => <Suspense>{PAGES[page]}</Suspense>}
				/>
			</main>
		</div>
	);
}
