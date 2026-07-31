import { ArrowUpDown, ChevronUp, ChevronDown } from "lucide-react";

interface SortableHeaderProps {
	label: string;
	columnKey: string;
	currentSortKey: string | null;
	currentDirection: "asc" | "desc" | null;
	onSort: (key: any) => void;
}

export default function SortableHeader({
	label,
	columnKey,
	currentSortKey,
	currentDirection,
	onSort,
}: SortableHeaderProps) {
	const isActive = currentSortKey === columnKey;

	return (
		<th
			className="px-6 py-4 font-semibold cursor-pointer group hover:bg-swapp-tiza dark:hover:bg-swapp-azul-petroleo transition-colors"
			onClick={() => onSort(columnKey)}>
			<div className="flex items-center gap-2">
				{label}
				{!isActive && (
					<ArrowUpDown className="h-4 w-4 text-swapp-azul-petroleo/20 dark:text-swapp-tiza/20 opacity-0 group-hover:opacity-100 transition-opacity" />
				)}
				{isActive && currentDirection === "asc" && (
					<ChevronUp className="h-4 w-4 text-swapp-turquesa-oscuro dark:text-swapp-menta" />
				)}
				{isActive && currentDirection === "desc" && (
					<ChevronDown className="h-4 w-4 text-swapp-turquesa-oscuro dark:text-swapp-menta" />
				)}
			</div>
		</th>
	);
}
