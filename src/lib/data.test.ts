import { describe, expect, it } from "vitest";
import { convertData, detectFormat } from "./data";

const options = { indent: 2, delimiter: "," };

describe("detectFormat", () => {
	it("maps file extensions to formats", () => {
		expect(detectFormat("people.JSON")).toBe("json");
		expect(detectFormat("table.tsv")).toBe("csv");
		expect(detectFormat("config.yml")).toBe("yaml");
		expect(detectFormat("notes.txt")).toBeUndefined();
	});
});

describe("convertData", () => {
	it("flattens nested objects into dotted CSV columns", () => {
		const json = JSON.stringify([
			{ name: "Ayu", contact: { city: "Bandung" }, tags: ["a", "b"] },
			{ name: "Budi", contact: { city: "Surabaya" }, tags: [] },
		]);
		expect(convertData(json, "json", "csv", options)).toBe(
			'name,contact.city,tags\r\nAyu,Bandung,"[""a"",""b""]"\r\nBudi,Surabaya,[]',
		);
	});

	it("rebuilds nesting, numbers, and arrays from CSV", () => {
		const csv =
			'name,age,contact.city,tags\nAyu,29,Bandung,"[""a""]"\nBudi,31,,[draft] notes';
		expect(JSON.parse(convertData(csv, "csv", "json", options))).toEqual([
			{ name: "Ayu", age: 29, contact: { city: "Bandung" }, tags: ["a"] },
			{ name: "Budi", age: 31, contact: { city: null }, tags: "[draft] notes" },
		]);
	});

	it("round-trips YAML", () => {
		const yaml = convertData('{"a":{"b":[1,2]}}', "json", "yaml", options);
		expect(yaml).toBe("a:\n  b:\n    - 1\n    - 2\n");
		expect(JSON.parse(convertData(yaml, "yaml", "json", options))).toEqual({
			a: { b: [1, 2] },
		});
	});

	it("uses the chosen CSV delimiter", () => {
		expect(
			convertData('[{"a":1,"b":2}]', "json", "csv", {
				indent: 2,
				delimiter: ";",
			}),
		).toBe("a;b\r\n1;2");
	});

	it("explains why a value cannot become CSV", () => {
		expect(() => convertData("[1]", "json", "csv", options)).toThrow(
			"CSV needs a list of objects, but item 1 is number.",
		);
	});

	it("returns an empty string for empty input", () => {
		expect(convertData("   ", "json", "yaml", options)).toBe("");
	});
});
