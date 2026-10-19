import { createContext, useContext } from "react";
import { localePath } from "../seo/routes";

export type Locale = "en" | "id";

export const LocaleContext = createContext<{
	locale: Locale;
	setLocale: (locale: Locale) => void;
} | null>(null);

export function useLocale() {
	const context = useContext(LocaleContext);
	if (!context) throw new Error("useLocale must be used inside LocaleProvider");
	return context;
}

export function useLocalePath() {
	const { locale } = useLocale();
	return (path: string) => localePath(path, locale);
}
