export type Searchable = { names: string[]; keywords: string };

const normalize = (text: string) =>
	text
		.normalize("NFD")
		.replace(/\p{Diacritic}/gu, "")
		.toLowerCase();

// Every word of the query must appear somewhere; entries with a name starting
// with the query come first, then those with a name holding every word.
export function search<T extends Searchable>(entries: T[], query: string): T[] {
	const words = normalize(query).split(/\s+/).filter(Boolean);
	if (words.length === 0) return entries;
	const phrase = words.join(" ");
	const rank = (entry: T) => {
		const names = entry.names.map(normalize);
		if (names.some((name) => name.startsWith(phrase))) return 0;
		return names.some((name) => words.every((word) => name.includes(word)))
			? 1
			: 2;
	};
	return entries
		.filter((entry) => {
			const text = normalize(`${entry.names.join(" ")} ${entry.keywords}`);
			return words.every((word) => text.includes(word));
		})
		.map((entry) => ({ entry, rank: rank(entry) }))
		.sort((a, b) => a.rank - b.rank)
		.map(({ entry }) => entry);
}
