"use client";

import React, { useEffect, useState } from "react";
import { useFieldArray, useFormContext, Controller } from "react-hook-form";
import { Plus, Trash2, Recycle, Loader2 } from "lucide-react";
import { ProductService } from "@/services/product.service";
import { Product } from "@/types/product";
import { formatCurrency } from "@/lib/utils";

const OrderItemRow = ({
	index,
	remove,
	products,
}: {
	index: number;
	remove: (index: number) => void;
	products: Product[];
}) => {
	const { control, setValue, getValues, watch } = useFormContext();

	const productId = watch(`items.${index}.product_id`);
	const unitPrice = watch(`items.${index}.unit_price`);
	const subtotal = watch(`items.${index}.subtotal`);
	const requiresReturn = watch(`items.${index}.requires_return`);
	const expectedReturnQty = watch(`items.${index}.expected_return_qty`);
	const quantity = watch(`items.${index}.quantity`);

	const selectedProduct = products.find((p) => p.product_id === productId);

	return (
		<tr className="border-b border-swapp-tiza-verdoso dark:border-swapp-azul-petroleo transition-colors hover:bg-swapp-tiza-verdoso/10 dark:hover:bg-swapp-azul-petroleo/10">
			{/* Selector de Producto */}
			<td className="px-4 py-3">
				<Controller
					control={control}
					name={`items.${index}.product_id`}
					render={({ field }) => (
						<select
							className="w-full rounded-md border border-swapp-tiza-verdoso dark:border-swapp-azul-petroleo bg-swapp-blanco dark:bg-swapp-azul-oscuro px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-swapp-verde-oscuro dark:focus:ring-swapp-verde-menta"
							value={field.value || ""}
							onChange={(e) => {
								const val = e.target.value;
								const newProductId = val ? parseInt(val) : 0;

								field.onChange(newProductId);

								const product = products.find(
									(p) => p.product_id === newProductId,
								);
								const currentQty = getValues(`items.${index}.quantity`) || 1;

								setValue(`items.${index}.variant_id`, null);
								setValue(`items.${index}.unit_price`, 0);
								setValue(`items.${index}.subtotal`, 0);

								if (product?.is_returnable) {
									setValue(`items.${index}.requires_return`, true);
									setValue(`items.${index}.expected_return_qty`, currentQty);
								} else {
									setValue(`items.${index}.requires_return`, false);
									setValue(`items.${index}.expected_return_qty`, 0);
								}
							}}>
							<option value="" disabled>
								Seleccione un producto...
							</option>
							{products.map((p) => (
								// USAMOS UUID COMO KEY PARA EVITAR EL CRASH DE REACT
								<option key={p.product_uuid} value={p.product_id || ""}>
									{p.name} {p.is_returnable ? "♻️" : ""}
								</option>
							))}
						</select>
					)}
				/>
			</td>

			{/* Selector de Variante */}
			<td className="px-4 py-3">
				<Controller
					control={control}
					name={`items.${index}.variant_id`}
					render={({ field }) => (
						<select
							className="w-full rounded-md border border-swapp-tiza-verdoso dark:border-swapp-azul-petroleo bg-swapp-blanco dark:bg-swapp-azul-oscuro px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-swapp-verde-oscuro dark:focus:ring-swapp-verde-menta disabled:opacity-50"
							value={field.value === null ? "" : field.value}
							disabled={!selectedProduct || !selectedProduct.variants?.length}
							onChange={(e) => {
								const val = e.target.value;
								const newVariantId = val ? parseInt(val) : null;

								field.onChange(newVariantId);

								const variant = selectedProduct?.variants?.find(
									(v) => v.variant_id === newVariantId,
								);

								if (variant) {
									const price = Number(variant.price);
									const currentQty = getValues(`items.${index}.quantity`) || 1;
									setValue(`items.${index}.unit_price`, price);
									setValue(`items.${index}.subtotal`, price * currentQty);
								}
							}}>
							<option value="" disabled>
								Variante...
							</option>
							{selectedProduct?.variants?.map((v) => (
								// USAMOS UUID COMO KEY PARA EVITAR EL CRASH DE REACT
								<option
									key={v.variant_uuid || v.variant_id}
									value={v.variant_id || ""}>
									{v.sku} - {formatCurrency(Number(v.price))}
								</option>
							))}
						</select>
					)}
				/>
			</td>

			{/* Cantidad y Logística Inversa */}
			<td className="px-4 py-3">
				<div className="flex flex-col gap-2">
					<Controller
						control={control}
						name={`items.${index}.quantity`}
						render={({ field }) => (
							<input
								type="number"
								min="1"
								className="w-20 rounded-md border border-swapp-tiza-verdoso dark:border-swapp-azul-petroleo bg-swapp-blanco dark:bg-swapp-azul-oscuro px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-swapp-verde-oscuro"
								value={field.value || ""}
								onChange={(e) => {
									const newQty = parseInt(e.target.value) || 0;

									field.onChange(newQty);

									const currentUnitPrice =
										getValues(`items.${index}.unit_price`) || 0;
									const isReturnable = getValues(
										`items.${index}.requires_return`,
									);

									setValue(
										`items.${index}.subtotal`,
										newQty * currentUnitPrice,
									);

									if (isReturnable) {
										setValue(`items.${index}.expected_return_qty`, newQty);
									}
								}}
							/>
						)}
					/>

					{requiresReturn && (
						<div className="flex items-center gap-1 text-[10px] text-swapp-verde-pastel dark:text-swapp-verde-menta font-medium bg-swapp-verde-pastel/10 dark:bg-swapp-verde-menta/10 px-2 py-1 rounded-full w-max">
							<Recycle className="h-3 w-3" />
							Recoger: {expectedReturnQty}
						</div>
					)}
				</div>
			</td>

			{/* Precio Unitario y Subtotal (Solo Lectura) */}
			<td className="px-4 py-3 align-top">
				<div className="flex flex-col gap-1">
					<span className="text-sm font-medium text-swapp-azul-oscuro dark:text-swapp-blanco">
						{formatCurrency(subtotal || 0)}
					</span>
					{unitPrice > 0 && quantity > 1 && (
						<span className="text-xs text-swapp-azul-petroleo/60 dark:text-swapp-tiza-verdoso/60">
							{formatCurrency(unitPrice)} c/u
						</span>
					)}
				</div>
			</td>

			{/* Acciones */}
			<td className="px-4 py-3 text-right align-top">
				<button
					type="button"
					onClick={() => remove(index)}
					className="p-1.5 rounded-md text-swapp-azul-petroleo/40 hover:text-red-500 dark:text-swapp-tiza-verdoso/40 hover:bg-red-500/10 transition-colors">
					<Trash2 className="h-4 w-4" />
				</button>
			</td>
		</tr>
	);
};

// --- COMPONENTE PRINCIPAL (LA LISTA) ---
export default function OrderItemsList() {
	const { control, watch, setValue } = useFormContext();
	const { fields, append, remove } = useFieldArray({
		control,
		name: "items",
	});

	const [products, setProducts] = useState<Product[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const loadProducts = async () => {
			try {
				const data = await ProductService.getAll();
				const activeProducts = data.filter((p) => p.is_active);
				setProducts(activeProducts);
			} catch (error) {
				console.error("Error al cargar productos", error);
			} finally {
				setIsLoading(false);
			}
		};
		loadProducts();
	}, []);

	const currentItems = watch("items");

	return (
		<div className="flex flex-col gap-4">
			<div className="flex items-center justify-between">
				<h3 className="text-lg font-bold text-swapp-azul-oscuro dark:text-swapp-blanco">
					Ítems del Pedido
				</h3>
				<button
					type="button"
					onClick={() =>
						append({
							product_id: 0,
							variant_id: null,
							quantity: 1,
							unit_price: 0,
							subtotal: 0,
							requires_return: false,
							expected_return_qty: 0,
							discount_id: null,
							campaign_name: null,
							discount_amount: 0,
						})
					}
					className="inline-flex items-center gap-2 rounded-lg bg-swapp-verde-oscuro dark:bg-swapp-verde-menta px-3 py-1.5 text-xs font-medium text-swapp-blanco dark:text-swapp-azul-oscuro hover:bg-swapp-azul-oceano dark:hover:bg-swapp-verde-pastel transition-colors">
					<Plus className="h-4 w-4" /> Agregar Ítem
				</button>
			</div>

			<div className="rounded-xl border border-swapp-tiza-verdoso dark:border-swapp-azul-petroleo overflow-hidden">
				<table className="w-full text-left text-sm text-swapp-azul-petroleo dark:text-swapp-tiza-verdoso">
					<thead className="bg-swapp-tiza-verdoso/50 dark:bg-swapp-azul-petroleo/30 font-semibold text-swapp-azul-oscuro dark:text-swapp-tiza-verdoso">
						<tr>
							<th className="px-4 py-3 w-1/3">Producto</th>
							<th className="px-4 py-3 w-1/4">Variante (SKU)</th>
							<th className="px-4 py-3 w-1/6">Cantidad</th>
							<th className="px-4 py-3 w-1/6">Total</th>
							<th className="px-4 py-3 w-16 text-right"></th>
						</tr>
					</thead>
					<tbody>
						{isLoading ? (
							<tr>
								<td colSpan={5} className="px-4 py-8 text-center">
									<Loader2 className="h-6 w-6 animate-spin mx-auto text-swapp-verde-oscuro dark:text-swapp-verde-menta" />
								</td>
							</tr>
						) : fields.length === 0 ? (
							<tr>
								<td
									colSpan={5}
									className="px-4 py-8 text-center text-swapp-azul-petroleo/50 dark:text-swapp-tiza-verdoso/50 italic">
									No hay ítems en el pedido. Presiona "Agregar Ítem" para
									comenzar.
								</td>
							</tr>
						) : (
							fields.map((field, index) => (
								<OrderItemRow
									key={field.id}
									index={index}
									remove={remove}
									products={products}
								/>
							))
						)}
					</tbody>
				</table>
			</div>
		</div>
	);
}
