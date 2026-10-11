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
const DataPage = lazy(() =>
	import("./pages/DataPage").then((module) => ({ default: module.DataPage })),
);

export function App() {
	return (
		<BrowserRouter>
			<div className="min-h-dvh bg-background text-foreground lg:flex">
				<Sidebar />
				<main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-8 lg:py-12">
					<Suspense>
						<Routes>
							<Route path="/" element={<HomePage />} />
							<Route path="/convert" element={<ConvertPage />} />
							<Route path="/compress" element={<CompressPage />} />
							<Route path="/pdf" element={<PdfPage />} />
							<Route path="/data" element={<DataPage />} />
						</Routes>
					</Suspense>
				</main>
			</div>
		</BrowserRouter>
	);
}
