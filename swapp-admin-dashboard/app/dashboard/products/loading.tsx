import TableSkeleton from "@/components/tables/TableSkeleton";

export default function ProductsLoading() {
	return (
		<div className="p-6 relative max-w-6xl mx-auto">
			{/* Placeholder animado simulando el PageHeader */}
			<div className="mb-8">
				<div className="h-8 w-64 rounded-md bg-swapp-tiza dark:bg-swapp-azul-petroleo/30 animate-pulse mb-2"></div>
				<div className="h-4 w-96 rounded-md bg-swapp-tiza/50 dark:bg-swapp-azul-petroleo/20 animate-pulse"></div>
			</div>

			{/* El esqueleto de la grilla de datos */}
			<TableSkeleton />
		</div>
	);
}
