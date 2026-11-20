import { buttonVariants } from "@heroui/styles";
import { FormattedMessage, useIntl } from "react-intl";
import { Link } from "react-router";
import { Eyebrow } from "../components/Eyebrow";
import { useLocalePath } from "../i18n/locale";

export function NotFoundPage() {
	const intl = useIntl();
	const localize = useLocalePath();

	return (
		<div className="flex flex-col items-start gap-6 py-16">
			<title>{`${intl.formatMessage({ id: "notFound.title" })} | Shapeshift`}</title>
			<meta name="robots" content="noindex" />
			<Eyebrow dot>404</Eyebrow>
			<h1 className="headline text-4xl sm:text-6xl">
				<FormattedMessage id="notFound.title" />
			</h1>
			<p className="max-w-2xl text-muted">
				<FormattedMessage id="notFound.body" />
			</p>
			<Link
				to={localize("/")}
				className={buttonVariants({
					variant: "primary",
					className: "font-semibold",
				})}
			>
				<FormattedMessage id="notFound.home" />
			</Link>
		</div>
	);
}
