import { useState, useMemo } from "react";

export type SortDirection = "asc" | "desc" | null;

export function useTableSort<T>(
	data: T[],
	extractors?: Record<string, (item: T) => any>
) {
	const [sortKey, setSortKey] = useState<string | null>(null);
	const [sortDirection, setSortDirection] = useState<SortDirection>(null);

	const handleSort = (key: string) => {
		if (sortKey === key) {
			if (sortDirection === "asc") setSortDirection("desc");
			else {
				setSortDirection(null);
				setSortKey(null);
			}
		} else {
			setSortKey(key);
			setSortDirection("asc");
		}
	};

	const sortedData = useMemo(() => {
		if (!sortKey || !sortDirection) return data;

		return [...data].sort((a, b) => {

			let valA = extractors && extractors[sortKey] 
				? extractors[sortKey](a) 
				: a[sortKey as keyof T];
				
			let valB = extractors && extractors[sortKey] 
				? extractors[sortKey](b) 
				: b[sortKey as keyof T];

			if (typeof valA === "string") valA = valA.toLowerCase();
			if (typeof valB === "string") valB = valB.toLowerCase();

			if (valA == null) valA = "";
			if (valB == null) valB = "";

			if (valA < valB) return sortDirection === "asc" ? -1 : 1;
			if (valA > valB) return sortDirection === "asc" ? 1 : -1;
			return 0;
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [data, sortKey, sortDirection]);

	return { sortedData, sortKey, sortDirection, handleSort };
}