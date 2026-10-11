import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router";
import { Sidebar } from "./components/Sidebar";
import { HomePage } from "./pages/HomePage";

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
const DataPage = lazy(() =>
	import("./pages/DataPage").then((module) => ({ default: module.DataPage })),
);

export function App() {
	return (
		<BrowserRouter basename={import.meta.env.BASE_URL}>
			<div className="min-h-dvh bg-background text-foreground lg:flex">
				<Sidebar />
				<main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-8 lg:py-12">
					<Suspense>
						<Routes>
							<Route path="/" element={<HomePage />} />
							<Route path="/convert" element={<ConvertPage />} />
							<Route path="/compress" element={<CompressPage />} />
							<Route path="/pdf" element={<PdfPage />} />
							<Route path="/icons" element={<IconsPage />} />
							<Route path="/qr" element={<QrPage />} />
							<Route path="/data" element={<DataPage />} />
							<Route path="/base64" element={<Base64Page />} />
							<Route path="/metadata" element={<MetadataPage />} />
							<Route path="/checksum" element={<ChecksumPage />} />
							<Route path="/color" element={<ColorPage />} />
							<Route path="/crop" element={<CropPage />} />
							<Route path="/text" element={<TextPage />} />
							<Route path="/json" element={<JsonPage />} />
							<Route path="/diff" element={<DiffPage />} />
							<Route path="/devtools" element={<DevToolsPage />} />
						</Routes>
					</Suspense>
				</main>
			</div>
		</BrowserRouter>
	);
}
