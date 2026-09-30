"use client";

import React, { useEffect, useState } from "react";
import { useFieldArray, useFormContext, Controller } from "react-hook-form";
import {
	Plus,
	Trash2,
	Recycle,
	Loader2,
	Tag,
	AlertCircle,
	Edit,
	RotateCcw,
} from "lucide-react";
import { ProductService } from "@/services/product.service";
import { Product } from "@/types/product";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { SwappTooltip } from "@/components/ui/SwappTooltip";

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
	const variantId = watch(`items.${index}.variant_id`);
	const quantity = watch(`items.${index}.quantity`);
	const expectedReturnQty = watch(`items.${index}.expected_return_qty`);
	const requiresReturn = watch(`items.${index}.requires_return`);
	const subtotal = watch(`items.${index}.subtotal`);
	const campaignName = watch(`items.${index}.campaign_name`);

	// NUEVO: Variables para controlar el Precio Manual Dual
	const isCustomPrice = watch(`items.${index}.is_custom_price`);
	const unitPrice = watch(`items.${index}.unit_price`); // Usado para "Cilindro Nuevo"
	const customRefillPrice = watch(`items.${index}.custom_refill_price`); // Usado para "Recarga"

	const selectedProduct = products.find((p) => p.product_id === productId);
	const selectedVariant = selectedProduct?.variants?.find(
		(v) => v.variant_id === variantId,
	);

	// --- BÚSQUEDA DEL PRODUCTO INTERNO (ENVASE) ---
	const internalProduct = selectedProduct?.linked_internal_product_id
		? products.find(
				(p) => p.product_id === selectedProduct.linked_internal_product_id,
			)
		: null;
	const internalVariant = internalProduct?.variants?.[0];

	// --- MOTOR MATEMÁTICO REACTIVO ---
	let finalPriceNew = 0;
	let finalPriceRefill = 0;
	let calcSubtotal = 0;
	let dName = null;
	let newsCount = 0;
	let refillsCount = 0;

	if (selectedProduct && selectedVariant) {
		const qty = quantity || 0;
		const rawReturns =
			expectedReturnQty !== undefined && expectedReturnQty !== null
				? expectedReturnQty
				: 0;

		refillsCount = requiresReturn ? Math.min(Math.max(0, rawReturns), qty) : 0;
		newsCount = qty - refillsCount;

		const priceNew = Number(selectedVariant.price) || 0;
		const priceRefill = internalVariant
			? Number(internalVariant.price)
			: priceNew;

		let dAmountNew = 0;
		let dAmountRefill = 0;

		const activeDiscount = discounts.find((d) => {
			if (d.product_uuid !== selectedProduct.product_uuid) return false;
			if (!d.variant_uuids || d.variant_uuids.length === 0) return true;
			return d.variant_uuids.includes(selectedVariant.variant_uuid);
		});

		if (activeDiscount) {
			dName = activeDiscount.name;
			if (activeDiscount.discount_type === "percentage") {
				const perc = Number(activeDiscount.value) / 100;
				dAmountNew = priceNew * perc;
				dAmountRefill = priceRefill * perc;
			} else {
				dAmountNew = Number(activeDiscount.value);
				dAmountRefill = Number(activeDiscount.value);
			}
		}

		finalPriceNew = priceNew - dAmountNew;
		finalPriceRefill = priceRefill - dAmountRefill;

		calcSubtotal = newsCount * finalPriceNew + refillsCount * finalPriceRefill;
	}

	useEffect(() => {
		if (isCustomPrice) {
			// MODO MANUAL: Calculamos el subtotal separando los precios custom ingresados
			const currentUnitPrice = unitPrice || 0;
			const currentRefillPrice = customRefillPrice || 0;
			const customSubtotal =
				newsCount * currentUnitPrice + refillsCount * currentRefillPrice;

			if (getValues(`items.${index}.subtotal`) !== customSubtotal) {
				setValue(`items.${index}.subtotal`, customSubtotal, {
					shouldValidate: true,
					shouldDirty: true,
				});
			}

			if (getValues(`items.${index}.campaign_name`)) {
				setValue(`items.${index}.campaign_name`, null);
			}
		} else if (selectedProduct && selectedVariant) {
			// MODO AUTOMÁTICO: Respetamos la lógica del catálogo
			const currentSubtotal = getValues(`items.${index}.subtotal`);
			if (currentSubtotal !== calcSubtotal) {
				setValue(`items.${index}.subtotal`, calcSubtotal, {
					shouldValidate: true,
					shouldDirty: true,
				});
				// Mantenemos sincronizados los valores manuales por si el usuario decide editar
				setValue(`items.${index}.unit_price`, finalPriceNew);
				setValue(`items.${index}.custom_refill_price`, finalPriceRefill);
				setValue(`items.${index}.campaign_name`, dName);
			}
		}
	}, [
		isCustomPrice,
		unitPrice,
		customRefillPrice,
		quantity,
		expectedReturnQty,
		calcSubtotal,
		finalPriceRefill,
		finalPriceNew,
		dName,
		index,
		newsCount,
		refillsCount,
		selectedProduct,
		selectedVariant,
		setValue,
		getValues,
	]);

	const inputStyles =
		"w-full rounded-md border border-swapp-tiza-verdoso dark:border-swapp-azul-petroleo bg-swapp-blanco dark:bg-swapp-azul-oscuro px-3 py-2 text-sm text-swapp-azul-oscuro dark:text-swapp-tiza-verdoso outline-none focus:ring-1 focus:ring-swapp-verde-oscuro dark:focus:ring-swapp-verde-menta transition-colors disabled:opacity-50";

	return (
		<tr className="border-b border-swapp-tiza-verdoso/40 dark:border-swapp-azul-petroleo/40 last:border-0 transition-colors duration-200 hover:bg-swapp-blanco/60 dark:hover:bg-swapp-azul-petroleo/20">
			<td className="px-4 py-3">
				<Controller
					control={control}
					name={`items.${index}.product_id`}
					render={({ field }) => (
						<select
							className={inputStyles}
							value={field.value || ""}
							onChange={(e) => {
								const newProductId = parseInt(e.target.value) || 0;
								field.onChange(newProductId);

								const product = products.find(
									(p) => p.product_id === newProductId,
								);
								const currentQty = getValues(`items.${index}.quantity`) || 1;

								let autoVariantId = null;
								if (product?.variants?.length === 1) {
									autoVariantId = product.variants[0].variant_id;
								}

								setValue(`items.${index}.variant_id`, autoVariantId);
								setValue(`items.${index}.discount_id`, null);
								setValue(`items.${index}.campaign_name`, null);
								setValue(`items.${index}.discount_amount`, 0);

								setValue(`items.${index}.is_custom_price`, false);

								if (
									product?.is_returnable &&
									product?.linked_internal_product_id
								) {
									const intProd = products.find(
										(p) => p.product_id === product.linked_internal_product_id,
									);
									const intVarId = intProd?.variants?.[0]?.variant_id || null;

									setValue(`items.${index}.requires_return`, true);
									setValue(`items.${index}.expected_return_qty`, currentQty);
									setValue(
										`items.${index}.internal_product_id`,
										product.linked_internal_product_id,
									);
									setValue(`items.${index}.internal_variant_id`, intVarId);
								} else {
									setValue(`items.${index}.requires_return`, false);
									setValue(`items.${index}.expected_return_qty`, 0);
									setValue(`items.${index}.internal_product_id`, null);
									setValue(`items.${index}.internal_variant_id`, null);
								}
							}}>
							<option value="" disabled>
								Seleccione un producto...
							</option>
							{products
								.filter((p) => !p.is_internal)
								.map((p) => (
									<option key={p.product_uuid} value={p.product_id || ""}>
										{p.name} {p.model ? `(${p.model})` : ""}{" "}
										{p.is_returnable ? "♻️" : ""}
									</option>
								))}
						</select>
					)}
				/>
			</td>

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
								field.onChange(parseInt(e.target.value) || null);
								setValue(`items.${index}.is_custom_price`, false);
							}}>
							<option value="" disabled>
								Variante...
							</option>
							{selectedProduct?.variants?.map((v) => {
								const pNew = Number(v.price) || 0;
								const pRefill = internalVariant
									? Number(internalVariant.price)
									: 0;
								const hasRefill =
									pRefill > 0 &&
									pRefill !== pNew &&
									selectedProduct.is_returnable;

								return (
									<option
										key={v.variant_uuid || v.variant_id}
										value={v.variant_id || ""}>
										{v.sku} -{" "}
										{hasRefill
											? `Nuevo: ${formatCurrency(pNew)} | Recarga: ${formatCurrency(pRefill)}`
											: formatCurrency(pNew)}
									</option>
								);
							})}
						</select>
					)}
				/>
			</td>

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

									if (requiresReturn) {
										// Ajustamos inteligentemente el retorno si superaba la nueva cantidad
										const currentReturns = getValues(
											`items.${index}.expected_return_qty`,
										);
										if (currentReturns > newQty) {
											setValue(`items.${index}.expected_return_qty`, newQty);
										}
									}
								}}
							/>
						)}
					/>

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
										className="w-12 h-7 rounded bg-swapp-blanco dark:bg-swapp-azul-oscuro border border-swapp-verde-oscuro/30 dark:border-swapp-verde-menta/30 px-1 py-0.5 text-center text-xs font-bold text-swapp-verde-oscuro dark:text-swapp-verde-menta outline-none focus:ring-1 focus:ring-swapp-verde-oscuro dark:focus:ring-swapp-verde-menta transition-all"
										value={field.value ?? ""}
										onChange={(e) => {
											let val = parseInt(e.target.value);
											if (isNaN(val)) val = 0;
											if (val > (quantity || 0)) val = quantity || 0;
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

			<td className="px-4 py-3 align-top min-w-[200px]">
				<div className="flex flex-col gap-1.5">
					{/* INTERFAZ DE PRECIO: MODO MANUAL DUAL VS MODO CATÁLOGO */}
					{isCustomPrice ? (
						<div className="flex flex-col gap-2 bg-amber-500/5 dark:bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
							<div className="flex items-start justify-between gap-2">
								<div className="flex flex-col gap-2 w-full">
									{/* INPUT PRECIO NUEVO */}
									{newsCount > 0 && (
										<div className="flex items-center gap-2">
											<span className="text-[10px] uppercase font-bold text-swapp-azul-petroleo/70 dark:text-swapp-tiza-verdoso/70 w-16">
												Nuevo:
											</span>
											<span className="text-swapp-azul-oscuro dark:text-swapp-blanco font-bold text-sm">
												$
											</span>
											<Controller
												control={control}
												name={`items.${index}.unit_price`}
												render={({ field }) => (
													<input
														type="number"
														min="0"
														step="1"
														className="w-full max-w-[100px] h-7 rounded-md bg-swapp-blanco dark:bg-swapp-azul-oscuro border border-amber-500/50 px-2 text-sm font-bold text-amber-600 dark:text-amber-500 outline-none focus:ring-1 focus:ring-amber-500 transition-all"
														value={field.value === 0 ? "" : field.value}
														onChange={(e) => {
															let val = parseFloat(e.target.value);
															if (isNaN(val)) val = 0;
															field.onChange(val);
														}}
													/>
												)}
											/>
										</div>
									)}

									{/* INPUT PRECIO RECARGA */}
									{refillsCount > 0 && (
										<div className="flex items-center gap-2">
											<span className="text-[10px] uppercase font-bold text-swapp-verde-oscuro dark:text-swapp-verde-menta w-16">
												Recarga:
											</span>
											<span className="text-swapp-azul-oscuro dark:text-swapp-blanco font-bold text-sm">
												$
											</span>
											<Controller
												control={control}
												name={`items.${index}.custom_refill_price`}
												render={({ field }) => (
													<input
														type="number"
														min="0"
														step="1"
														className="w-full max-w-[100px] h-7 rounded-md bg-swapp-blanco dark:bg-swapp-azul-oscuro border border-amber-500/50 px-2 text-sm font-bold text-amber-600 dark:text-amber-500 outline-none focus:ring-1 focus:ring-amber-500 transition-all"
														value={field.value === 0 ? "" : field.value}
														onChange={(e) => {
															let val = parseFloat(e.target.value);
															if (isNaN(val)) val = 0;
															field.onChange(val);
														}}
													/>
												)}
											/>
										</div>
									)}
								</div>

								<SwappTooltip text="Restaurar precios de catálogo">
									<button
										type="button"
										onClick={() =>
											setValue(`items.${index}.is_custom_price`, false)
										}
										className="p-1 text-swapp-azul-petroleo/40 hover:text-swapp-verde-oscuro dark:text-swapp-tiza-verdoso/40 dark:hover:text-swapp-verde-menta transition-colors bg-swapp-blanco dark:bg-swapp-azul-oscuro rounded shadow-sm border border-swapp-azul-petroleo/10">
										<RotateCcw className="h-3.5 w-3.5" />
									</button>
								</SwappTooltip>
							</div>

							<div className="border-t border-amber-500/20 my-0.5" />

							<div className="flex items-center justify-between">
								<span className="text-[9px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
									Manual
								</span>
								<span className="text-xs font-bold text-swapp-azul-oscuro dark:text-swapp-blanco">
									Subtotal: {formatCurrency(subtotal || 0)}
								</span>
							</div>
						</div>
					) : (
						<>
							<div className="flex items-center gap-2">
								<span className="text-sm font-bold text-swapp-azul-oscuro dark:text-swapp-blanco">
									{formatCurrency(subtotal || 0)}
								</span>
								<SwappTooltip text="Modificar precios manualmente">
									<button
										type="button"
										onClick={() => {
											setValue(`items.${index}.is_custom_price`, true);
											setValue(`items.${index}.unit_price`, finalPriceNew);
											setValue(
												`items.${index}.custom_refill_price`,
												finalPriceRefill,
											);
										}}
										className="p-1 text-swapp-azul-petroleo/40 hover:text-swapp-azul-petroleo dark:text-swapp-tiza-verdoso/40 dark:hover:text-swapp-tiza-verdoso transition-colors">
										<Edit className="h-3.5 w-3.5" />
									</button>
								</SwappTooltip>
							</div>

							{campaignName && (
								<span className="inline-flex items-center gap-1 text-[9px] font-medium text-swapp-verde-oscuro dark:text-swapp-verde-menta bg-swapp-verde-pastel/20 dark:bg-swapp-verde-menta/10 px-1.5 py-0.5 rounded uppercase tracking-wider w-max mt-0.5 border border-swapp-verde-pastel/20 dark:border-swapp-verde-menta/20">
									<Tag className="h-2.5 w-2.5" />
									{campaignName}
								</span>
							)}

							{selectedVariant && quantity > 0 && (
								<div className="flex flex-col mt-1 gap-0.5 text-[10px] font-medium text-swapp-azul-petroleo/70 dark:text-swapp-tiza-verdoso/70 bg-swapp-azul-petroleo/5 dark:bg-swapp-azul-petroleo/20 p-1.5 rounded border border-swapp-azul-petroleo/10 dark:border-swapp-azul-petroleo/50 w-max">
									{refillsCount > 0 && (
										<span className="flex justify-between gap-3">
											<span>
												{refillsCount} recarga{refillsCount > 1 ? "s" : ""}:
											</span>
											<span className="font-bold text-swapp-verde-oscuro dark:text-swapp-verde-menta">
												{formatCurrency(finalPriceRefill)} c/u
											</span>
										</span>
									)}
									{newsCount > 0 && (
										<span className="flex justify-between gap-3">
											<span>
												{newsCount} cilindro{newsCount > 1 ? "s" : ""} nuevo
												{newsCount > 1 ? "s" : ""}:
											</span>
											<span className="font-bold text-swapp-azul-oscuro dark:text-swapp-blanco">
												{formatCurrency(finalPriceNew)} c/u
											</span>
										</span>
									)}
								</div>
							)}
						</>
					)}
				</div>
			</td>

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

export default function OrderItemsList() {
	const { control } = useFormContext();
	const { fields, append, remove } = useFieldArray({
		control,
		name: "items",
	});

	const [products, setProducts] = useState<Product[]>([]);
	const [discounts, setDiscounts] = useState<any[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let isMounted = true;

		const loadData = async () => {
			try {
				const productsData = await ProductService.getAll();

				if (isMounted) {
					if (Array.isArray(productsData)) {
						const activeProducts = productsData.filter(
							(p: Product) => p.is_active,
						);
						setProducts(activeProducts);
					} else {
						setProducts([]);
						setError("El catálogo no tiene el formato esperado.");
					}
					setDiscounts([]);
				}
			} catch (err) {
				if (isMounted) {
					console.error("Error cargando productos:", err);
					setError(
						"No pudimos conectar con el servidor. ¿FastAPI está corriendo?",
					);
				}
			} finally {
				if (isMounted) {
					setIsLoading(false);
				}
			}
		};

		loadData();

		return () => {
			isMounted = false;
		};
	}, []);

	return (
		<div className="flex flex-col gap-4">
			<div className="flex items-center justify-between">
				<h3 className="text-lg font-bold text-swapp-azul-oscuro dark:text-swapp-blanco">
					Ítems del Pedido
				</h3>
				<button
					type="button"
					disabled={isLoading || !!error}
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
							internal_product_id: null,
							internal_variant_id: null,
							is_custom_price: false,
							custom_refill_price: 0, // <- El nuevo campo por defecto
						})
					}
					className="inline-flex items-center gap-2 rounded-lg bg-swapp-verde-oscuro dark:bg-swapp-verde-menta px-3 py-1.5 text-xs font-medium text-swapp-blanco dark:text-swapp-azul-oscuro hover:bg-swapp-verde-pastel dark:hover:bg-swapp-tiza-verdoso transition-colors disabled:opacity-50">
					<Plus className="h-4 w-4" /> Agregar Ítem
				</button>
			</div>

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
							<th className="px-4 py-3 text-xs uppercase tracking-wider text-swapp-azul-petroleo/60 dark:text-swapp-tiza-verdoso/60 w-1/4">
								Precio U. / Total
							</th>
							<th className="px-4 py-3 w-16 text-right"></th>
						</tr>
					</thead>
					<tbody className="">
						{isLoading ? (
							<tr>
								<td colSpan={5} className="px-4 py-12 text-center">
									<Loader2 className="h-8 w-8 animate-spin mx-auto text-swapp-verde-oscuro dark:text-swapp-verde-menta mb-3" />
									<p className="text-swapp-azul-petroleo/60 dark:text-swapp-tiza-verdoso/60 text-xs">
										Cargando catálogo...
									</p>
								</td>
							</tr>
						) : error ? (
							<tr>
								<td colSpan={5} className="px-4 py-10 text-center">
									<AlertCircle className="h-8 w-8 mx-auto text-red-500 mb-2 opacity-50" />
									<p className="text-red-500 font-medium text-sm">{error}</p>
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
