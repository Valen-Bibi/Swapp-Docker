import { useState, useEffect } from "react";
import { X, Lock, Unlock } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { SwappInput } from "@/components/ui/SwappInput";
import { SwappSelect } from "@/components/ui/SwappSelect";
import { SwappTextarea } from "@/components/ui/SwappTextarea";
import { SwappToggle } from "@/components/ui/SwappToggle";
import { Product } from "@/types/product";

interface StockMovementModalProps {
	isOpen: boolean;
	onClose: () => void;
	product: Product | null;
	movementType: "ingreso" | "egreso";
	onSuccess: () => void;
}

export default function StockMovementModal({
	isOpen,
	onClose,
	product,
	movementType,
	onSuccess,
}: StockMovementModalProps) {
	const [quantity, setQuantity] = useState<number>(0);
	const [reason, setReason] = useState("");
	const [notes, setNotes] = useState("");
	const [unitCost, setUnitCost] = useState<number | "">("");
	const [isSaving, setIsSaving] = useState(false);
	const [isCostEditable, setIsCostEditable] = useState(false);

	// Reiniciamos el formulario y cargamos el costo histórico al abrir
	useEffect(() => {
		if (isOpen && product) {
			setQuantity(0);
			setReason(
				movementType === "ingreso" ? "Compra a proveedor" : "Rotura o Descarte",
			);
			setNotes("");
			// Autocompletamos con el último valor registrado en el catálogo
			setUnitCost(product.cost_price || 0);
			// Por defecto la edición del costo está bloqueada
			setIsCostEditable(false);
		}
	}, [isOpen, movementType, product]);

	if (!isOpen || !product) return null;

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
			await api.post(`/api/products/admin/${product.product_uuid}/movements`, {
				movement_type: isPurchase ? "purchase" : getMovementType(reason),
				quantity: finalQuantity,
				// Si es compra, mandamos el costo nuevo. Si es ajuste o descarte, mandamos 0
				unit_cost: isPurchase ? Number(unitCost) || 0 : 0,
				reason: reason,
				notes: notes,
			});
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
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-swapp-negro-azulado/50 dark:bg-swapp-negro/70 backdrop-blur-sm p-4">
			<div
				className={`w-full max-w-md max-h-[90vh] overflow-y-auto custom-scrollbar rounded-xl bg-swapp-blanco dark:bg-swapp-negro-azulado p-6 shadow-2xl border-t-4 transition-colors ${
					movementType === "ingreso"
						? "border-swapp-turquesa-oscuro dark:border-swapp-menta"
						: "border-red-500 dark:border-red-500"
				}`}>
				<div className="mb-2 flex items-center justify-between">
					<h2 className="text-xl font-bold text-swapp-negro-azulado dark:text-swapp-blanco">
						{movementType === "ingreso"
							? "Registrar Ingreso de Stock"
							: "Registrar Descarte / Egreso"}
					</h2>
					<button
						onClick={onClose}
						className="text-swapp-azul-petroleo/50 dark:text-swapp-tiza/50 hover:text-swapp-negro-azulado dark:hover:text-swapp-blanco transition-colors">
						<X className="h-5 w-5" />
					</button>
				</div>
				<p className="text-sm text-swapp-azul-petroleo/70 dark:text-swapp-tiza/70 mb-6 transition-colors">
					{product.name}
				</p>

				<form onSubmit={handleSaveMovement} className="space-y-4">
					<SwappInput
						label="Cantidad de unidades"
						type="text"
						formatThousands
						min="1"
						placeholder="Ej: 50"
						required
						value={quantity || ""}
						onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
					/>

					<SwappSelect
						label="Motivo del ajuste"
						required
						value={reason}
						onChange={(e) => setReason(e.target.value)}
						options={reasonOptions}
					/>

					{/* Bloque Condicional para Actualizar Costo */}
					{reason === "Compra a proveedor" && (
						<div className="bg-swapp-tiza/30 dark:bg-swapp-azul-petroleo/20 p-4 rounded-lg border border-swapp-tiza dark:border-swapp-azul-petroleo/50 animate-in fade-in slide-in-from-top-2">
							<div className="flex items-center justify-between mb-4">
								<div className="flex items-center gap-2">
									{isCostEditable ? (
										<Unlock className="h-4 w-4 text-swapp-turquesa-oscuro dark:text-swapp-menta" />
									) : (
										<Lock className="h-4 w-4 text-swapp-azul-petroleo/50 dark:text-swapp-tiza/50" />
									)}
									<p className="text-sm font-semibold text-swapp-azul-petroleo dark:text-swapp-tiza">
										Actualizar costo de producto
									</p>
								</div>

								{/* Nuevo componente SwappToggle */}
								<SwappToggle
									checked={isCostEditable}
									onChange={setIsCostEditable}
								/>
							</div>

							<div
								className={`transition-all duration-200 ${
									!isCostEditable
										? "opacity-60 grayscale pointer-events-none"
										: ""
								}`}>
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

					<div className="mt-6 flex justify-end gap-3 border-t border-swapp-tiza dark:border-swapp-azul-petroleo pt-4 transition-colors">
						<button
							type="button"
							onClick={onClose}
							className="rounded-lg px-4 py-2 text-sm font-medium text-swapp-azul-petroleo dark:text-swapp-tiza hover:bg-swapp-tiza dark:hover:bg-swapp-azul-petroleo transition-colors">
							Cancelar
						</button>
						<button
							type="submit"
							disabled={isSaving || quantity <= 0}
							className={`rounded-lg px-4 py-2 text-sm font-medium text-swapp-blanco dark:text-swapp-negro-azulado transition-colors disabled:opacity-50 ${
								movementType === "ingreso"
									? "bg-swapp-turquesa-oscuro dark:bg-swapp-menta hover:bg-swapp-azul-oceano dark:hover:bg-swapp-verde-agua"
									: "bg-red-600 dark:bg-red-500 dark:text-swapp-blanco hover:bg-red-700 dark:hover:bg-red-600"
							}`}>
							{isSaving ? "Registrando..." : "Confirmar Ajuste"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
