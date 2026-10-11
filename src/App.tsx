import { BrowserRouter, Route, Routes } from "react-router";
import { Sidebar } from "./components/Sidebar";
import { CompressPage } from "./pages/CompressPage";
import { ConvertPage } from "./pages/ConvertPage";
import { HomePage } from "./pages/HomePage";

export function App() {
	return (
		<BrowserRouter>
			<div className="min-h-dvh bg-background text-foreground lg:flex">
				<Sidebar />
				<main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-8 lg:py-12">
					<Routes>
						<Route path="/" element={<HomePage />} />
						<Route path="/convert" element={<ConvertPage />} />
						<Route path="/compress" element={<CompressPage />} />
					</Routes>
				</main>
			</div>
		</BrowserRouter>
	);
}
