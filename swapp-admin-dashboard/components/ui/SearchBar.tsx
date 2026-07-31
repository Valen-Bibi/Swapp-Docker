import { Search } from "lucide-react";

interface SearchBarProps {
	searchTerm: string;
	onSearchChange: (value: string) => void;
	placeholder?: string;
}

export default function SearchBar({
	searchTerm,
	onSearchChange,
	placeholder = "Buscar producto...",
}: SearchBarProps) {
	return (
		<div className="relative w-full sm:w-auto">
			<div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
				<Search className="h-4 w-4 text-swapp-azul-petroleo/40 dark:text-swapp-tiza/40" />
			</div>
			<input
				type="text"
				placeholder={placeholder}
				value={searchTerm}
				onChange={(e) => onSearchChange(e.target.value)}
				className="block w-full rounded-lg border border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo bg-swapp-blanco dark:bg-swapp-negro-azulado py-2 pl-10 pr-3 text-sm text-swapp-negro-azulado dark:text-swapp-blanco placeholder:text-swapp-azul-petroleo/40 dark:placeholder:text-swapp-tiza/40 focus:border-swapp-turquesa-oscuro dark:focus:border-swapp-menta focus:outline-none focus:ring-1 focus:ring-swapp-turquesa-oscuro dark:focus:ring-swapp-menta sm:w-64 transition-colors"
			/>
		</div>
	);
}
