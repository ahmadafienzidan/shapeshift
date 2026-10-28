// @vitest-environment jsdom
import { act, useState } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { KeepAlive } from "./KeepAlive";

(
	globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

function Counter({ name }: { name: string }) {
	const [count, setCount] = useState(0);
	return (
		<button type="button" data-name={name} onClick={() => setCount(count + 1)}>
			{name} {count}
		</button>
	);
}

let container: HTMLDivElement;
let root: ReturnType<typeof createRoot>;

const show = (active: string | undefined) =>
	act(() =>
		root.render(
			<KeepAlive active={active} render={(key) => <Counter name={key} />} />,
		),
	);

const button = (name: string) =>
	container.querySelector<HTMLButtonElement>(`[data-name="${name}"]`);

const visible = () =>
	[...container.querySelectorAll<HTMLButtonElement>("button")]
		.filter((element) => element.style.display !== "none")
		.map((element) => element.textContent);

beforeEach(() => {
	container = document.createElement("div");
	root = createRoot(container);
});

afterEach(() => act(() => root.unmount()));

describe("KeepAlive", () => {
	it("renders only the active key", async () => {
		await show("a");
		expect(visible()).toEqual(["a 0"]);
		expect(button("b")).toBeNull();
	});

	it("keeps a visited key's state while another key is shown", async () => {
		await show("a");
		await act(() => button("a")?.click());
		await act(() => button("a")?.click());
		await show("b");
		expect(visible()).toEqual(["b 0"]);
		expect(button("a")?.style.display).toBe("none");
		await show("a");
		expect(visible()).toEqual(["a 2"]);
	});

	it("hides every key when none is active", async () => {
		await show("a");
		await show(undefined);
		expect(visible()).toEqual([]);
		expect(button("a")).not.toBeNull();
	});
});
