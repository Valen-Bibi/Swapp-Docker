"use client";

import { useState, useEffect } from "react";
import { X, Lock, Unlock, PackagePlus, PackageMinus, Save } from "lucide-react";
import { ProductService } from "@/services/product.service";
import { toast } from "sonner";
import { SwappInput } from "@/components/ui/SwappInput";
import { SwappSelect } from "@/components/ui/SwappSelect";
import { SwappTextarea } from "@/components/ui/SwappTextarea";
import { SwappToggle } from "@/components/ui/SwappToggle";
import { Product, ProductVariant } from "@/types/product";

interface StockMovementModalProps {
	isOpen: boolean;
	onClose: () => void;
	product: Product | null;
	variant: ProductVariant | null;
	movementType: "ingreso" | "egreso";
	onSuccess: () => void;
}

export default function StockMovementModal({
	isOpen,
	onClose,
	product,
	variant,
	movementType,
	onSuccess,
}: StockMovementModalProps) {
	const [quantity, setQuantity] = useState<number>(0);
	const [reason, setReason] = useState("");
	const [notes, setNotes] = useState("");
	const [unitCost, setUnitCost] = useState<number | "">("");
	const [isSaving, setIsSaving] = useState(false);
	const [isCostEditable, setIsCostEditable] = useState(false);

	// --- CERRAR CON ESCAPE ---
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape" && isOpen) {
				onClose();
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [isOpen, onClose]);

	useEffect(() => {
		if (isOpen && product && variant) {
			setQuantity(0);
			setReason(
				movementType === "ingreso" ? "Compra a proveedor" : "Rotura o Descarte",
			);
			setNotes("");
			// Autocompletamos con el costo específico de LA VARIANTE
			setUnitCost(variant.cost_price || 0);
			setIsCostEditable(false);
		}
	}, [isOpen, movementType, product, variant]);

	if (!isOpen || !product || !variant) return null;

	const getMovementType = (selectedReason: string) => {
		switch (selectedReason) {
			case "Compra a proveedor":
				return "purchase";
			case "Devolución de cliente":
				return "return";
			case "Rotura o Descarte":
				return "damaged";
			case "Robo o Pérdida":
				return "lost";
			default:
				return "adjustment";
		}
	};

	const handleSaveMovement = async (e: React.FormEvent) => {
		e.preventDefault();
		if (quantity <= 0) return;

		setIsSaving(true);
		const toastId = toast.loading("Registrando movimiento...");

		const finalQuantity = movementType === "ingreso" ? quantity : quantity * -1;
		const isPurchase = getMovementType(reason) === "purchase";

		try {
			await ProductService.addMovement(
				product.product_uuid,
				variant.variant_uuid!,
				{
					movement_type: isPurchase ? "purchase" : getMovementType(reason),
					quantity: finalQuantity,
					unit_cost: isPurchase ? Number(unitCost) || 0 : 0,
					reason: reason,
					notes: notes,
				},
			);
			toast.success("Movimiento registrado", { id: toastId });
			onSuccess();
			onClose();
		} catch (error: any) {
			toast.error("Error al registrar movimiento.", { id: toastId });
		} finally {
			setIsSaving(false);
		}
	};

	const reasonOptions =
		movementType === "ingreso"
			? [
					{ value: "Compra a proveedor", label: "Compra a proveedor" },
					{ value: "Devolución de cliente", label: "Devolución de cliente" },
					{
						value: "Ajuste de inventario (+)",
						label: "Ajuste de inventario (+)",
					},
				]
			: [
					{ value: "Rotura o Descarte", label: "Rotura o Descarte" },
					{ value: "Robo o Pérdida", label: "Robo o Pérdida" },
					{ value: "Vencimiento", label: "Vencimiento / Desuso" },
					{
						value: "Ajuste de inventario (-)",
						label: "Ajuste de inventario (-)",
					},
				];

	return (
		<div className="fixed inset-0 z-[100] flex items-center justify-center bg-swapp-azul-petroleo/5 dark:bg-swapp-negro/30 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95">
			{/* CONTENEDOR DEL MODAL SIN BORDES EXTERNOS, SOLO BORDER-T DINÁMICO */}
			<div
				className={`w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden rounded-xl bg-swapp-blanco/50 dark:bg-swapp-azul-oscuro/40 backdrop-blur-md shadow-2xl border-t-4 transition-colors ${
					movementType === "ingreso"
						? "border-t-swapp-verde-oscuro dark:border-t-swapp-verde-menta"
						: "border-t-red-500 dark:border-t-red-500"
				}`}>
				{/* HEADER ESTANDARIZADO */}
				<div className="p-6 border-b border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo flex items-start justify-between shrink-0 transition-colors">
					<div>
						<h2 className="text-xl font-bold text-swapp-azul-oscuro dark:text-swapp-blanco flex items-center gap-2">
							{movementType === "ingreso" ? (
								<PackagePlus className="h-5 w-5 text-swapp-verde-oscuro dark:text-swapp-verde-menta" />
							) : (
								<PackageMinus className="h-5 w-5 text-red-500 dark:text-red-400" />
							)}
							{movementType === "ingreso"
								? "Ingreso de Stock"
								: "Descarte / Egreso"}
						</h2>
						<p className="text-sm text-swapp-azul-petroleo/70 dark:text-swapp-tiza-verdoso/70 mt-1.5 font-medium transition-colors">
							{product.name}
						</p>
						<p className="text-[11px] font-mono font-bold tracking-wider text-swapp-verde-oscuro dark:text-swapp-verde-menta mt-2 bg-swapp-verde-oscuro/10 dark:bg-swapp-verde-menta/10 inline-block px-2 py-0.5 rounded border border-swapp-verde-oscuro/20 dark:border-swapp-verde-menta/20">
							SKU: {variant.sku}
						</p>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="p-1 rounded-md text-swapp-azul-petroleo/50 dark:text-swapp-tiza-verdoso/50 hover:bg-red-500/10 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400 transition-colors mt-0.5">
						<X className="h-5 w-5" />
					</button>
				</div>

				<div className="p-6 overflow-y-auto custom-scrollbar flex-1">
					{/* HEREDAMOS TRANSPARENCIA A LOS INPUTS */}
					<form
						onSubmit={handleSaveMovement}
						className="space-y-5 [&_input]:!bg-transparent [&_select]:!bg-transparent [&_textarea]:!bg-transparent">
						<SwappInput
							label="Cantidad de unidades"
							type="text"
							formatThousands
							min="1"
							placeholder="Ej: 50"
							required
							autoFocus
							value={quantity || ""}
							onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
						/>

						<SwappSelect
							label="Motivo del ajuste"
							options={reasonOptions}
							value={reason}
							onChange={(e) => setReason(e.target.value)}
						/>

						{reason === "Compra a proveedor" && (
							<div className="bg-swapp-azul-petroleo/5 dark:bg-swapp-azul-petroleo/20 p-4 rounded-xl border border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo animate-in fade-in slide-in-from-top-2 transition-colors">
								<div className="flex items-center justify-between mb-4">
									<div className="flex items-center gap-2">
										{isCostEditable ? (
											<Unlock className="h-4 w-4 text-swapp-verde-oscuro dark:text-swapp-verde-menta" />
										) : (
											<Lock className="h-4 w-4 text-swapp-azul-petroleo/50 dark:text-swapp-tiza-verdoso/50" />
										)}
										<p className="text-sm font-semibold text-swapp-azul-petroleo dark:text-swapp-tiza-verdoso">
											Actualizar costo de variante
										</p>
									</div>
									<SwappToggle
										checked={isCostEditable}
										onChange={setIsCostEditable}
										id="cost_editable_toggle"
									/>
								</div>
								<div
									className={`transition-all duration-300 ${!isCostEditable ? "opacity-50 grayscale pointer-events-none" : ""}`}>
									<SwappInput
										label="Costo Unitario Pagado ($)"
										type="text"
										formatThousands
										required={reason === "Compra a proveedor" && isCostEditable}
										disabled={!isCostEditable}
										value={unitCost}
										onChange={(e) =>
											setUnitCost(
												e.target.value === "" ? "" : parseFloat(e.target.value),
											)
										}
										helpText={
											isCostEditable
												? "Modificalo si el proveedor cambió el precio."
												: "Habilitá la edición desde el switch para actualizar el costo."
										}
									/>
								</div>
							</div>
						)}

						<SwappTextarea
							label="Notas / Comentarios adicionales"
							placeholder="Escribí detalles que sirvan para auditorías futuras..."
							rows={3}
							value={notes}
							onChange={(e) => setNotes(e.target.value)}
						/>

						{/* FOOTER CON BOTONES ESTANDARIZADOS */}
						<div className="mt-2 flex justify-end gap-3 border-t border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo pt-5 transition-colors">
							<button
								type="button"
								onClick={onClose}
								className="rounded-lg px-4 py-2 text-sm font-medium text-swapp-azul-petroleo dark:text-swapp-tiza-verdoso hover:bg-red-500/10 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400 transition-colors">
								Cancelar
							</button>
							<button
								type="submit"
								disabled={isSaving || quantity <= 0}
								className={`flex items-center gap-2 rounded-lg px-6 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
									movementType === "ingreso"
										? "bg-swapp-verde-pastel dark:bg-swapp-verde-menta text-swapp-blanco dark:text-swapp-azul-oscuro hover:bg-swapp-verde-oscuro dark:hover:bg-swapp-verde-pastel"
										: "bg-red-500 dark:bg-red-600 text-white dark:text-swapp-blanco hover:bg-red-600 dark:hover:bg-red-500"
								}`}>
								<Save className="h-4 w-4" />
								{isSaving ? "Registrando..." : "Confirmar Ajuste"}
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
}
