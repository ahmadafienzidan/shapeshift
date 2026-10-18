import { Button, Dropdown, Header } from "@heroui/react";
import { ArrowRight } from "lucide-react";
import { FormattedMessage, useIntl } from "react-intl";
import { useLocation, useNavigate } from "react-router";
import { handOff } from "../lib/incoming";
import { TARGET_GROUPS } from "../targets";

// Hands a tool's results straight to another tool, without a download and
// re-upload in between.
export function ContinueWith({
	files,
	isDisabled,
}: {
	files: File[];
	isDisabled?: boolean;
}) {
	const intl = useIntl();
	const navigate = useNavigate();
	const { pathname, search } = useLocation();
	const groups = TARGET_GROUPS.map((group) => ({
		...group,
		targets: group.targets.filter(
			(target) => target.path !== `${pathname}${search}`,
		),
	})).filter((group) => files.some(group.matches));

	if (groups.length === 0) return null;

	return (
		<Dropdown>
			<Button variant="outline" size="sm" isDisabled={isDisabled}>
				<FormattedMessage id="continue.label" />
				<ArrowRight size={16} />
			</Button>
			<Dropdown.Popover placement="bottom end" className="min-w-56">
				<Dropdown.Menu
					aria-label={intl.formatMessage({ id: "continue.label" })}
					className="max-h-[min(60dvh,24rem)] overflow-y-auto"
					onAction={(key) => {
						const target = groups
							.flatMap((group) => group.targets)
							.find((candidate) => candidate.id === key);
						if (!target) return;
						handOff(files);
						navigate(target.path);
					}}
				>
					{groups.map((group) => (
						<Dropdown.Section key={group.titleId}>
							<Header>
								<FormattedMessage id={group.titleId} />
							</Header>
							{group.targets.map((target) => (
								<Dropdown.Item
									key={target.id}
									id={target.id}
									textValue={intl.formatMessage({ id: target.nameId })}
									className="gap-3"
								>
									<div
										className={`grid size-6 shrink-0 place-items-center rounded ${target.tile}`}
									>
										<target.icon size={13} />
									</div>
									<span className="min-w-0 flex-1 truncate">
										<FormattedMessage id={target.nameId} />
									</span>
									{target.contextId && (
										<span className="shrink-0 text-muted text-xs">
											<FormattedMessage id={target.contextId} />
										</span>
									)}
								</Dropdown.Item>
							))}
						</Dropdown.Section>
					))}
				</Dropdown.Menu>
			</Dropdown.Popover>
		</Dropdown>
	);
}
