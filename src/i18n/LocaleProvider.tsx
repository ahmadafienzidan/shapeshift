import { type ReactNode, useEffect } from "react";
import { IntlProvider } from "react-intl";
import { useLocation, useNavigate } from "react-router";
import { localeFromPath, switchLocalePath } from "../seo/routes";
import { type Locale, LocaleContext } from "./locale";
import { MESSAGES } from "./messages";

// The URL decides the language: /id/… is Indonesian, everything else English.
export function LocaleProvider({ children }: { children: ReactNode }) {
	const { pathname, search } = useLocation();
	const navigate = useNavigate();
	const locale = localeFromPath(pathname);

	useEffect(() => {
		document.documentElement.lang = locale;
	}, [locale]);

	const setLocale = (next: Locale) => {
		localStorage.setItem("locale", next);
		navigate(switchLocalePath(pathname, search, next));
	};

	return (
		<LocaleContext value={{ locale, setLocale }}>
			<IntlProvider
				locale={locale}
				messages={MESSAGES[locale]}
				defaultLocale="en"
			>
				{children}
			</IntlProvider>
		</LocaleContext>
	);
}
