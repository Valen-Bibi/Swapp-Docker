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
			className="px-6 py-4 text-xs tracking-wider text-swapp-azul-petroleo/60 dark:text-swapp-tiza-verdoso/60 cursor-pointer group hover:bg-swapp-tiza-verdoso/40 dark:hover:bg-swapp-azul-petroleo/40 transition-colors"
			onClick={() => onSort(columnKey)}>
			<div className="flex items-center gap-2">
				<span className={isActive ? "text-swapp-verde-oscuro dark:text-swapp-verde-menta font-bold" : ""}>
					{label}
				</span>
				{!isActive && (
					<ArrowUpDown className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
				)}
				{isActive && currentDirection === "asc" && (
					<ChevronUp className="h-4 w-4 text-swapp-verde-oscuro dark:text-swapp-verde-menta" />
				)}
				{isActive && currentDirection === "desc" && (
					<ChevronDown className="h-4 w-4 text-swapp-verde-oscuro dark:text-swapp-verde-menta" />
				)}
			</div>
		</th>
	);
}