"use client";

import { useEffect, useState } from "react";
import { ProductService } from "@/services/product.service";
import { DollarSign, Edit, Tag, TrendingUp, History } from "lucide-react";
import TableSkeleton from "@/components/tables/TableSkeleton";
import PageHeader from "@/components/layout/PageHeader";
import SearchBar from "@/components/ui/SearchBar";
import SortableHeader from "@/components/tables/SortableHeader";
import { useTableSort } from "@/hooks/useTableSort";
import EditPricingModal from "@/components/products/EditPricingModal";
import PriceHistoryModal from "@/components/products/PriceHistoryModal"; // <-- Nuevo modal
import { Product } from "@/types/product";

export default function PricingPage() {
	const [products, setProducts] = useState<Product[]>([]);
	const [loading, setLoading] = useState(true);

	// Controles para el modal de edición (Base y Ofertas)
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);
	const [editingProduct, setEditingProduct] = useState<Product | null>(null);

	// Controles para el nuevo modal de Historial
	const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
	const [historyProduct, setHistoryProduct] = useState<Product | null>(null);

	const [searchTerm, setSearchTerm] = useState("");

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
		const handleClose = () => {
			setIsEditModalOpen(false);
			setIsHistoryModalOpen(false);
		};
		window.addEventListener("close-modals", handleClose);
		return () => window.removeEventListener("close-modals", handleClose);
	}, []);

	const handleEditClick = (product: Product) => {
		setEditingProduct(product);
		setIsEditModalOpen(true);
	};

	const handleHistoryClick = (product: Product) => {
		setHistoryProduct(product);
		setIsHistoryModalOpen(true);
	};

	const calculateDiscount = (base: number, sale: number) =>
		base === 0 ? 0 : Math.round(((base - sale) / base) * 100);

	const calculateMargin = (cost: number | null, price: number) =>
		!cost || cost === 0 || price === 0
			? null
			: Math.round(((price - cost) / price) * 100);

	const filteredProducts = products.filter((p) =>
		p.name.toLowerCase().includes(searchTerm.toLowerCase()),
	);

	const {
		sortedData: processedProducts,
		sortKey,
		sortDirection,
		handleSort,
	} = useTableSort(filteredProducts, {
		cost: (p) => p.cost_price || 0,
		margin: (p) =>
			calculateMargin(p.cost_price, p.sale_price || p.base_price) ?? -9999,
		sale_price: (p) => p.sale_price || p.base_price,
	});

	if (loading) return <TableSkeleton />;

	return (
		<div className="p-6 relative">
			<div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<PageHeader
					title="Costos y Precios"
					description="Gestión de márgenes, historial y ofertas temporales"
					icon={DollarSign}
				/>
				<SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />
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
								label="Costo ($)"
								columnKey="cost"
								currentSortKey={sortKey}
								currentDirection={sortDirection}
								onSort={handleSort}
							/>
							<SortableHeader
								label="Precio Base"
								columnKey="base_price"
								currentSortKey={sortKey}
								currentDirection={sortDirection}
								onSort={handleSort}
							/>
							<SortableHeader
								label="Margen"
								columnKey="margin"
								currentSortKey={sortKey}
								currentDirection={sortDirection}
								onSort={handleSort}
							/>
							<SortableHeader
								label="Precio Oferta"
								columnKey="sale_price"
								currentSortKey={sortKey}
								currentDirection={sortDirection}
								onSort={handleSort}
							/>
							<th className="px-6 py-4 font-semibold text-right">Acciones</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-swapp-tiza dark:divide-swapp-azul-petroleo">
						{processedProducts.map((p) => {
							const curP = p.sale_price || p.base_price;
							const marg = calculateMargin(p.cost_price, curP);
							return (
								<tr
									key={p.product_uuid}
									className="transition-colors hover:bg-swapp-tiza/30 dark:hover:bg-swapp-azul-petroleo/30">
									<td className="px-6 py-4 font-medium text-swapp-negro-azulado dark:text-swapp-blanco">
										{p.name}
									</td>
									<td className="px-6 py-4 text-swapp-azul-petroleo/70 dark:text-swapp-tiza/70">
										{p.cost_price ? `$${p.cost_price.toFixed(2)}` : "-"}
									</td>
									<td className="px-6 py-4">${p.base_price.toFixed(2)}</td>
									<td className="px-6 py-4">
										{marg !== null ? (
											<span
												className={`inline-flex items-center gap-1 font-medium ${marg > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
												<TrendingUp
													className={`h-3 w-3 ${marg < 0 && "rotate-180"}`}
												/>{" "}
												{marg}%
											</span>
										) : (
											<span className="text-swapp-azul-petroleo/30 dark:text-swapp-tiza/30">
												N/A
											</span>
										)}
									</td>
									<td className="px-6 py-4">
										{p.sale_price ? (
											<div>
												<span className="font-bold text-swapp-turquesa-oscuro dark:text-swapp-menta block">
													${p.sale_price.toFixed(2)}
												</span>
												<span className="inline-flex items-center gap-1 rounded-full bg-swapp-verde-agua/10 dark:bg-swapp-menta/10 px-2 py-0.5 text-[10px] font-medium text-swapp-turquesa-oscuro dark:text-swapp-menta mt-1">
													<Tag className="h-3 w-3" />{" "}
													{calculateDiscount(p.base_price, p.sale_price)}% OFF
												</span>
											</div>
										) : (
											<span className="text-swapp-azul-petroleo/40 dark:text-swapp-tiza/40">
												Regular
											</span>
										)}
									</td>
									<td className="px-6 py-4 text-right">
										<div className="flex justify-end gap-2">
											<button
												onClick={() => handleHistoryClick(p)}
												title="Ver historial de cambios"
												className="p-2 text-swapp-azul-petroleo/40 dark:text-swapp-tiza/40 hover:text-swapp-azul-oceano dark:hover:text-swapp-verde-agua transition-colors">
												<History className="h-4 w-4" />
											</button>
											<button
												onClick={() => handleEditClick(p)}
												title="Ajustar precio y ofertas"
												className="p-2 text-swapp-azul-petroleo/40 dark:text-swapp-tiza/40 hover:text-swapp-turquesa-oscuro dark:hover:text-swapp-menta transition-colors">
												<Edit className="h-4 w-4" />
											</button>
										</div>
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>

			<EditPricingModal
				isOpen={isEditModalOpen}
				onClose={() => setIsEditModalOpen(false)}
				product={editingProduct}
				onSuccess={fetchProducts}
			/>

			{isHistoryModalOpen && (
				<PriceHistoryModal
					isOpen={isHistoryModalOpen}
					onClose={() => setIsHistoryModalOpen(false)}
					product={historyProduct}
				/>
			)}
		</div>
	);
}
