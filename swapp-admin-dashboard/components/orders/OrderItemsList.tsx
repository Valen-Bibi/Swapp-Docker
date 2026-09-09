"use client";

import React, { useEffect, useState } from "react";
import { useFieldArray, useFormContext, Controller } from "react-hook-form";
import { Plus, Trash2, Recycle, Loader2, Tag } from "lucide-react";
import { ProductService } from "@/services/product.service";
import { Product } from "@/types/product";
import { formatCurrency } from "@/lib/utils";
import { api } from "@/lib/api";

const OrderItemRow = ({
	index,
	remove,
	products,
	discounts,
}: {
	index: number;
	remove: (index: number) => void;
	products: Product[];
	discounts: any[];
}) => {
	const { control, setValue, getValues, watch } = useFormContext();

	const productId = watch(`items.${index}.product_id`);
	const unitPrice = watch(`items.${index}.unit_price`);
	const subtotal = watch(`items.${index}.subtotal`);
	const requiresReturn = watch(`items.${index}.requires_return`);
	const quantity = watch(`items.${index}.quantity`);

	// Observamos la campaña aplicada para la UI
	const campaignName = watch(`items.${index}.campaign_name`);

	const selectedProduct = products.find((p) => p.product_id === productId);

	// CENTRALIZAMOS LAS CLASES DEL INPUT USANDO TU PALETA ESTRICTA
	const inputStyles =
		"w-full rounded-md border border-swapp-tiza-verdoso dark:border-swapp-azul-petroleo bg-swapp-blanco dark:bg-swapp-azul-oscuro px-3 py-2 text-sm text-swapp-azul-oscuro dark:text-swapp-tiza-verdoso outline-none focus:ring-1 focus:ring-swapp-verde-oscuro dark:focus:ring-swapp-verde-menta transition-colors disabled:opacity-50";

	return (
		<tr className="border-b border-swapp-tiza-verdoso/40 dark:border-swapp-azul-petroleo/40 last:border-0 transition-colors duration-200 hover:bg-swapp-blanco/60 dark:hover:bg-swapp-azul-petroleo/20">
			{/* Selector de Producto */}
			<td className="px-4 py-3">
				<Controller
					control={control}
					name={`items.${index}.product_id`}
					render={({ field }) => (
						<select
							className={inputStyles}
							value={field.value || ""}
							onChange={(e) => {
								const val = e.target.value;
								const newProductId = val ? parseInt(val) : 0;

								field.onChange(newProductId);

								const product = products.find(
									(p) => p.product_id === newProductId,
								);
								const currentQty = getValues(`items.${index}.quantity`) || 1;

								// Reset de todos los campos asociados
								setValue(`items.${index}.variant_id`, null);
								setValue(`items.${index}.unit_price`, 0);
								setValue(`items.${index}.subtotal`, 0);
								setValue(`items.${index}.discount_id`, null);
								setValue(`items.${index}.campaign_name`, null);
								setValue(`items.${index}.discount_amount`, 0);

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
							className={inputStyles}
							value={field.value === null ? "" : field.value}
							disabled={!selectedProduct || !selectedProduct.variants?.length}
							onChange={(e) => {
								const val = e.target.value;
								const newVariantId = val ? parseInt(val) : null;

								field.onChange(newVariantId);

								const variant = selectedProduct?.variants?.find(
									(v) => v.variant_id === newVariantId,
								);

								if (variant && selectedProduct) {
									const basePrice = Number(variant.price);
									let finalPrice = basePrice;
									let dId = null;
									let dName = null;
									let dAmount = 0;

									const activeDiscount = discounts.find((d) => {
										if (d.product_uuid !== selectedProduct.product_uuid)
											return false;

										const isGlobal =
											!d.variant_uuids || d.variant_uuids.length === 0;
										if (isGlobal) return true;

										return d.variant_uuids.includes(variant.variant_uuid);
									});

									if (activeDiscount) {
										dId = activeDiscount.discount_id;
										dName = activeDiscount.name;

										if (activeDiscount.discount_type === "percentage") {
											dAmount =
												basePrice * (Number(activeDiscount.value) / 100);
										} else {
											dAmount = Number(activeDiscount.value);
										}
										finalPrice = basePrice - dAmount;
									}

									const currentQty = getValues(`items.${index}.quantity`) || 1;

									setValue(`items.${index}.unit_price`, finalPrice);
									setValue(`items.${index}.subtotal`, finalPrice * currentQty);
									setValue(`items.${index}.discount_id`, dId);
									setValue(`items.${index}.campaign_name`, dName);
									setValue(`items.${index}.discount_amount`, dAmount);
								}
							}}>
							<option value="" disabled>
								Variante...
							</option>
							{selectedProduct?.variants?.map((v) => (
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
								className={`${inputStyles} w-20 text-center`}
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

									// Si cambian la cantidad entregada, forzamos a que el retorno esperado
									// vuelva a igualarse a la nueva cantidad por defecto.
									if (isReturnable) {
										setValue(`items.${index}.expected_return_qty`, newQty);
									}
								}}
							/>
						)}
					/>

					{/* NUEVO INPUT INTERACTIVO PARA RETORNOS */}
					{requiresReturn && (
						<div className="flex items-center gap-1.5 mt-1 bg-swapp-verde-pastel/10 dark:bg-swapp-verde-menta/10 px-2 py-1.5 rounded-lg border border-swapp-verde-pastel/20 dark:border-swapp-verde-menta/20 w-max transition-colors">
							<Recycle className="h-3.5 w-3.5 text-swapp-verde-oscuro dark:text-swapp-verde-menta" />
							<span className="text-[10px] font-bold text-swapp-verde-oscuro dark:text-swapp-verde-menta uppercase tracking-wider">
								Recoger:
							</span>
							<Controller
								control={control}
								name={`items.${index}.expected_return_qty`}
								render={({ field }) => (
									<input
										type="number"
										min="0"
										max={quantity || 0}
										className="w-60 h-7 rounded bg-swapp-blanco dark:bg-swapp-azul-oscuro border border-swapp-verde-oscuro/30 dark:border-swapp-verde-menta/30 px-1 py-0.5 text-center text-xs font-bold text-swapp-verde-oscuro dark:text-swapp-verde-menta outline-none focus:ring-1 focus:ring-swapp-verde-oscuro dark:focus:ring-swapp-verde-menta transition-all"
										value={field.value ?? ""}
										onChange={(e) => {
											let val = parseInt(e.target.value);
											if (isNaN(val)) val = 0;

											// Regla de Negocio: No puede devolver más de lo que recibe en este pedido
											if (val > (quantity || 0)) val = quantity || 0;
											// Regla de Negocio: No existen retornos negativos
											if (val < 0) val = 0;

											field.onChange(val);
										}}
									/>
								)}
							/>
						</div>
					)}
				</div>
			</td>

			{/* Precio Unitario y Subtotal (Solo Lectura) */}
			<td className="px-4 py-3 align-top">
				<div className="flex flex-col gap-1">
					<span className="text-sm font-semibold text-swapp-azul-oscuro dark:text-swapp-blanco">
						{formatCurrency(subtotal || 0)}
					</span>

					{campaignName && (
						<span className="inline-flex items-center gap-1 text-[9px] font-medium text-swapp-verde-oscuro dark:text-swapp-verde-menta bg-swapp-verde-pastel/20 dark:bg-swapp-verde-menta/10 px-1.5 py-0.5 rounded uppercase tracking-wider w-max mt-0.5 border border-swapp-verde-pastel/20 dark:border-swapp-verde-menta/20">
							<Tag className="h-2.5 w-2.5" />
							{campaignName}
						</span>
					)}

					{unitPrice > 0 && quantity > 1 && (
						<span className="text-xs text-swapp-azul-petroleo/70 dark:text-swapp-tiza-verdoso/60">
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
	const [discounts, setDiscounts] = useState<any[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const loadData = async () => {
			try {
				const [productsData, discountsRes] = await Promise.all([
					ProductService.getAll(),
					api.get("/api/products/admin/discounts"),
				]);

				const activeProducts = productsData.filter((p) => p.is_active);
				setProducts(activeProducts);
				setDiscounts(discountsRes.data);
			} catch (error) {
				console.error("Error al cargar datos", error);
			} finally {
				setIsLoading(false);
			}
		};
		loadData();
	}, []);

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
					className="inline-flex items-center gap-2 rounded-lg bg-swapp-verde-oscuro dark:bg-swapp-verde-menta px-3 py-1.5 text-xs font-medium text-swapp-blanco dark:text-swapp-azul-oscuro hover:bg-swapp-verde-pastel dark:hover:bg-swapp-tiza-verdoso transition-colors">
					<Plus className="h-4 w-4" /> Agregar Ítem
				</button>
			</div>

			{/* TABLA ESTANDARIZADA (GLASSMORPHISM) */}
			<div className="rounded-xl border border-swapp-tiza-verdoso/60 dark:border-swapp-azul-petroleo/60 bg-swapp-blanco/40 dark:bg-swapp-azul-oscuro/40 backdrop-blur-sm shadow-sm transition-all duration-300 overflow-visible sm:overflow-auto">
				<table className="w-full text-left text-sm text-swapp-azul-petroleo dark:text-swapp-tiza-verdoso">
					<thead className="bg-swapp-tiza-verdoso/30 dark:bg-swapp-azul-petroleo/20 border-b border-swapp-tiza-verdoso/60 dark:border-swapp-azul-petroleo/60 select-none">
						<tr>
							<th className="px-4 py-3 text-xs uppercase tracking-wider text-swapp-azul-petroleo/60 dark:text-swapp-tiza-verdoso/60 w-1/3">
								Producto
							</th>
							<th className="px-4 py-3 text-xs uppercase tracking-wider text-swapp-azul-petroleo/60 dark:text-swapp-tiza-verdoso/60 w-1/4">
								Variante (SKU)
							</th>
							<th className="px-4 py-3 text-xs uppercase tracking-wider text-swapp-azul-petroleo/60 dark:text-swapp-tiza-verdoso/60 w-1/6">
								Cantidad
							</th>
							<th className="px-4 py-3 text-xs uppercase tracking-wider text-swapp-azul-petroleo/60 dark:text-swapp-tiza-verdoso/60 w-1/6">
								Total
							</th>
							<th className="px-4 py-3 w-16 text-right"></th>
						</tr>
					</thead>
					<tbody className="">
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
									className="px-4 py-8 text-center text-swapp-azul-petroleo/60 dark:text-swapp-tiza-verdoso/50 italic">
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
									discounts={discounts}
								/>
							))
						)}
					</tbody>
				</table>
			</div>
		</div>
	);
}
