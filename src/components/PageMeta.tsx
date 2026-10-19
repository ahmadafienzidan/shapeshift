import { useLocale } from "../i18n/locale";
import { type MetaPage, seoDescription, seoTitle } from "../seo/text";

// React hoists these into <head>; the prerendered pages carry the same text.
export function PageMeta({ page }: { page: MetaPage }) {
	const { locale } = useLocale();
	return (
		<>
			<title>{seoTitle(locale, page)}</title>
			<meta name="description" content={seoDescription(locale, page)} />
		</>
	);
}
