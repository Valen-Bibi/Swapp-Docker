"use client";

import { useEffect, useState } from "react";
import { ProductService } from "@/services/product.service";
import { Package, Plus, Minus, AlertTriangle } from "lucide-react";
import TableSkeleton from "@/components/tables/TableSkeleton";
import PageHeader from "@/components/layout/PageHeader";
import SearchBar from "@/components/ui/SearchBar";
import SortableHeader from "@/components/tables/SortableHeader";
import { useTableSort } from "@/hooks/useTableSort";
import StockMovementModal from "@/components/products/StockMovementModal";
import { Product } from "@/types/product";

export default function StockPage() {
	const [products, setProducts] = useState<Product[]>([]);
	const [loading, setLoading] = useState(true);

	const [isModalOpen, setIsModalOpen] = useState(false);
	const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
	const [movementType, setMovementType] = useState<"ingreso" | "egreso">(
		"ingreso",
	);

	const [searchTerm, setSearchTerm] = useState("");
	const [showLowStockOnly, setShowLowStockOnly] = useState(false);

	const fetchProducts = async () => {
		try {
			const data = await ProductService.getAll();
			setProducts(data);
		} catch (error) {
			console.error("Error obteniendo el catálogo:", error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchProducts();
	}, []);

	useEffect(() => {
		const handleClose = () => setIsModalOpen(false);
		window.addEventListener("close-modals", handleClose);
		return () => window.removeEventListener("close-modals", handleClose);
	}, []);

	const handleMovementClick = (
		product: Product,
		type: "ingreso" | "egreso",
	) => {
		setSelectedProduct(product);
		setMovementType(type);
		setIsModalOpen(true);
	};

	const filteredProducts = products.filter((product) => {
		const matchesSearch = product.name
			.toLowerCase()
			.includes(searchTerm.toLowerCase());
		const threshold = product.low_stock_threshold ?? 5;
		const matchesLowStock = showLowStockOnly
			? product.stock_quantity <= threshold
			: true;
		return matchesSearch && matchesLowStock;
	});

	const {
		sortedData: processedProducts,
		sortKey,
		sortDirection,
		handleSort,
	} = useTableSort(filteredProducts, {
		type: (p) => (p.is_returnable ? 1 : 0),
		stock: (p) => p.stock_quantity,
	});

	if (loading) return <TableSkeleton />;

	return (
		<div className="p-6 relative">
			<div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<PageHeader
					title="Control de Inventario"
					description="Gestión de ingresos y descartes físicos"
					icon={Package}
				/>

				<div className="flex flex-col sm:flex-row items-center gap-3">
					<button
						onClick={() => setShowLowStockOnly(!showLowStockOnly)}
						className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors border ${
							showLowStockOnly
								? "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400"
								: "bg-swapp-blanco dark:bg-swapp-negro-azulado border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo text-swapp-azul-petroleo dark:text-swapp-tiza hover:bg-swapp-tiza dark:hover:bg-swapp-azul-petroleo"
						}`}>
						<AlertTriangle
							className={`h-4 w-4 ${showLowStockOnly ? "text-red-600 dark:text-red-400" : "text-swapp-azul-petroleo/50 dark:text-swapp-tiza/50"}`}
						/>
						{showLowStockOnly ? "Viendo Stock Crítico" : "Filtrar Stock Bajo"}
					</button>
					<SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />
				</div>
			</div>

			<div className="overflow-hidden rounded-xl border border-swapp-tiza dark:border-swapp-azul-petroleo bg-swapp-blanco dark:bg-swapp-negro-azulado shadow-sm transition-colors">
				<table className="w-full text-left text-sm text-swapp-azul-petroleo dark:text-swapp-tiza">
					<thead className="bg-swapp-tiza/50 dark:bg-swapp-azul-petroleo/30 text-swapp-negro-azulado dark:text-swapp-tiza select-none">
						<tr>
							<SortableHeader
								label="Producto"
								columnKey="name"
								currentSortKey={sortKey}
								currentDirection={sortDirection}
								onSort={handleSort}
							/>
							<SortableHeader
								label="Tipo"
								columnKey="type"
								currentSortKey={sortKey}
								currentDirection={sortDirection}
								onSort={handleSort}
							/>
							<SortableHeader
								label="Stock Actual"
								columnKey="stock"
								currentSortKey={sortKey}
								currentDirection={sortDirection}
								onSort={handleSort}
							/>
							<th className="px-6 py-4 font-semibold text-right">
								Ajuste Rápido
							</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-swapp-tiza dark:divide-swapp-azul-petroleo">
						{processedProducts.map((product) => {
							// Calculamos el threshold para cada producto individualmente en el renderizado
							const threshold = product.low_stock_threshold ?? 5;
							const isLowStock = product.stock_quantity <= threshold;

							return (
								<tr
									key={product.product_uuid}
									className="transition-colors hover:bg-swapp-tiza/30 dark:hover:bg-swapp-azul-petroleo/30">
									<td className="px-6 py-4 font-medium text-swapp-negro-azulado dark:text-swapp-blanco">
										{product.name}
									</td>
									<td className="px-6 py-4">
										<span
											className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${product.is_returnable ? "bg-swapp-azul-oceano/10 dark:bg-swapp-menta/10 text-swapp-azul-oceano dark:text-swapp-menta" : "bg-swapp-tiza dark:bg-swapp-azul-petroleo text-swapp-azul-petroleo dark:text-swapp-tiza"}`}>
											{product.is_returnable ? "Retornable" : "Estándar"}
										</span>
									</td>
									<td className="px-6 py-4">
										<span
											className={`inline-flex items-center rounded-full px-2.5 py-1 text-sm font-semibold ${!isLowStock ? "bg-swapp-verde-agua/10 dark:bg-swapp-menta/10 text-swapp-turquesa-oscuro dark:text-swapp-menta" : "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400"}`}>
											{product.stock_quantity} unidades
										</span>
									</td>
									<td className="px-6 py-4 text-right flex justify-end gap-2">
										<button
											onClick={() => handleMovementClick(product, "ingreso")}
											className="p-2 text-swapp-turquesa-oscuro dark:text-swapp-menta bg-swapp-verde-agua/10 dark:bg-swapp-menta/10 rounded-lg hover:bg-swapp-verde-agua/20 dark:hover:bg-swapp-menta/20 transition-colors">
											<Plus className="h-4 w-4" />
										</button>
										<button
											onClick={() => handleMovementClick(product, "egreso")}
											className="p-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 rounded-lg hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors">
											<Minus className="h-4 w-4" />
										</button>
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>

			<StockMovementModal
				isOpen={isModalOpen}
				onClose={() => setIsModalOpen(false)}
				product={selectedProduct}
				movementType={movementType}
				onSuccess={fetchProducts}
			/>
		</div>
	);
}
