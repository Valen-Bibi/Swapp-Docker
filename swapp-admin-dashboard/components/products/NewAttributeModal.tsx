"use client";

import React, { useState } from "react";
import { X, Layers, FileText } from "lucide-react";
import { toast } from "sonner";
import { SwappInput } from "@/components/ui/SwappInput";
import { ProductService } from "@/services/product.service";

interface Props {
	isOpen: boolean;
	onClose: () => void;
	onSuccess: () => void;
}

export default function NewAttributeModal({
	isOpen,
	onClose,
	onSuccess,
}: Props) {
	const [newAttrName, setNewAttrName] = useState("");
	const [newAttrIsVariant, setNewAttrIsVariant] = useState(false);
	const [newAttrValues, setNewAttrValues] = useState<string[]>([]);
	const [tempValueInput, setTempValueInput] = useState("");
	const [isSaving, setIsSaving] = useState(false);

	if (!isOpen) return null;

	const handleAddTempNewValue = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter" && tempValueInput.trim() !== "") {
			e.preventDefault();
			if (newAttrValues.includes(tempValueInput.trim())) {
				toast.error("Ese valor ya está en la lista.");
				return;
			}
			setNewAttrValues([...newAttrValues, tempValueInput.trim()]);
			setTempValueInput("");
		}
	};

	const removeTempValue = (val: string) => {
		setNewAttrValues(newAttrValues.filter((v) => v !== val));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!newAttrName.trim()) return toast.error("El nombre es obligatorio.");

		// --- NUEVA BARRERA DE CONFIRMACIÓN ---
		const behaviorText = newAttrIsVariant
			? "Variante Física (Divisor de Stock)"
			: "Ficha Técnica (Estructural Base)";
		const confirmed = window.confirm(
			`Estás a punto de crear el atributo "${newAttrName.trim()}" con el comportamiento: ${behaviorText}.\n\n¿Es el comportamiento asignado el correcto? (Este comportamiento define dónde se guardán los datos).`,
		);

		if (!confirmed) return;

		setIsSaving(true);
		const toastId = toast.loading("Creando atributo...");

		try {
			await ProductService.createAttribute({
				name: newAttrName.trim(),
				is_variant: newAttrIsVariant,
				values: newAttrValues,
			});

			toast.success("Atributo creado exitosamente", { id: toastId });

			// Limpiamos los estados
			setNewAttrName("");
			setNewAttrIsVariant(false); // Reiniciamos a Ficha Técnica por defecto
			setNewAttrValues([]);
			setTempValueInput("");

			onSuccess(); // Refrescamos la tabla
			onClose(); // Cerramos el modal
		} catch (error: any) {
			toast.error(error.response?.data?.detail || "Error al crear atributo", {
				id: toastId,
			});
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-swapp-negro/50 dark:bg-swapp-negro/70 backdrop-blur-sm p-4 animate-in fade-in">
			<div className="w-full max-w-lg rounded-xl bg-swapp-blanco dark:bg-swapp-azul-oscuro p-6 shadow-2xl border-t-4 border-swapp-verde-oscuro dark:border-swapp-menta">
				<div className="mb-6 flex items-center justify-between">
					<div>
						<h2 className="text-xl font-bold text-swapp-azul-oscuro dark:text-swapp-blanco">
							Crear Nuevo Atributo
						</h2>
						<p className="text-sm text-swapp-azul-petroleo/70 dark:text-swapp-blanco mt-1">
							Definí la entidad y su comportamiento en el catálogo.
						</p>
					</div>
					<button
						onClick={onClose}
						className="text-swapp-azul-petroleo/50 hover:text-swapp-azul-oscuro dark:text-swapp-tiza/50 dark:hover:text-swapp-blanco transition-colors">
						<X className="h-5 w-5" />
					</button>
				</div>

				<form onSubmit={handleSubmit} className="space-y-6">
					<div className="space-y-6">
						<SwappInput
							label="Nombre del Atributo (Ej: Color, Voltaje, Talle)"
							required
							autoFocus
							value={newAttrName}
							onChange={(e) => setNewAttrName(e.target.value)}
						/>

						{/* --- SISTEMA DE TARJETAS (RADIO CARDS) --- */}
						<div className="space-y-2">
							<label className="block text-sm font-medium text-swapp-azul-petroleo dark:text-swapp-blanco">
								Comportamiento del Atributo
							</label>
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								{/* Tarjeta: Ficha Técnica */}
								<button
									type="button"
									onClick={() => setNewAttrIsVariant(false)}
									className={`relative flex flex-col items-start p-4 rounded-xl border-2 text-left transition-all duration-200 ${
										!newAttrIsVariant
											? "border-swapp-verde-oscuro bg-swapp-verde-oscuro/5 dark:border-swapp-menta dark:bg-swapp-menta/10 shadow-sm"
											: "border-swapp-tiza dark:border-swapp-azul-petroleo bg-swapp-blanco dark:bg-swapp-azul-oscuro hover:border-swapp-verde-oscuro/40 dark:hover:border-swapp-menta/40"
									}`}>
									<div className="flex items-center gap-2 mb-2">
										<FileText
											className={`h-5 w-5 ${!newAttrIsVariant ? "text-swapp-verde-oscuro dark:text-swapp-menta" : "text-swapp-azul-petroleo/50 dark:text-swapp-blanco"}`}
										/>
										<span
											className={`font-semibold ${!newAttrIsVariant ? "text-swapp-verde-oscuro dark:text-swapp-menta" : "text-swapp-azul-oscuro dark:text-swapp-blanco"}`}>
											Ficha Técnica
										</span>
									</div>
									<p className="text-xs text-swapp-azul-petroleo/70 dark:text-swapp-blanco leading-relaxed">
										Información estructural compartida por toda la carcasa base
										(Ej: Material, Tensión, Wi-Fi).
									</p>
								</button>

								{/* Tarjeta: Atributo Variante */}
								<button
									type="button"
									onClick={() => setNewAttrIsVariant(true)}
									className={`relative flex flex-col items-start p-4 rounded-xl border-2 text-left transition-all duration-200 ${
										newAttrIsVariant
											? "border-swapp-verde-oscuro bg-swapp-verde-oscuro/5 dark:border-swapp-menta dark:bg-swapp-menta/10 shadow-sm"
											: "border-swapp-tiza dark:border-swapp-azul-petroleo bg-swapp-blanco dark:bg-swapp-azul-oscuro hover:border-swapp-verde-oscuro/40 dark:hover:border-swapp-menta/40"
									}`}>
									<div className="flex items-center gap-2 mb-2">
										<Layers
											className={`h-5 w-5 ${newAttrIsVariant ? "text-swapp-verde-oscuro dark:text-swapp-menta" : "text-swapp-azul-blanco dark:text-swapp-tiza/50"}`}
										/>
										<span
											className={`font-semibold ${newAttrIsVariant ? "text-swapp-verde-oscuro dark:text-swapp-menta" : "text-swapp-azul-oscuro dark:text-swapp-blanco"}`}>
											Divisor de Stock
										</span>
									</div>
									<p className="text-xs text-swapp-azul-petroleo/70 dark:text-swapp-blanco leading-relaxed">
										Exige crear inventario físico separado para cada opción de
										compra (Ej: Color, Talle, Sabor).
									</p>
								</button>
							</div>
						</div>

						<div className="space-y-2 border-t border-swapp-tiza dark:border-swapp-azul-petroleo pt-4">
							<label className="block text-sm font-medium text-swapp-azul-petroleo dark:text-swapp-blanco">
								Valores Iniciales del Diccionario (Opcional)
							</label>
							<div className="flex gap-2">
								<input
									type="text"
									className="w-full rounded-md border border-swapp-tiza dark:border-swapp-azul-petroleo bg-transparent px-3 py-2 text-sm outline-none focus:border-swapp-verde-oscuro dark:focus:border-swapp-menta focus:ring-1 focus:ring-swapp-verde-oscuro dark:focus:ring-swapp-menta"
									placeholder="Escribí un valor y presioná Enter..."
									value={tempValueInput}
									onChange={(e) => setTempValueInput(e.target.value)}
									onKeyDown={handleAddTempNewValue}
								/>
							</div>
							{newAttrValues.length > 0 && (
								<div className="flex flex-wrap gap-2 pt-3">
									{newAttrValues.map((val, idx) => (
										<div
											key={idx}
											className="flex items-center gap-1.5 rounded-md bg-swapp-verde-oscuro/10 dark:bg-swapp-menta/10 px-2.5 py-1 text-xs font-medium text-swapp-verde-oscuro dark:text-swapp-menta border border-swapp-verde-oscuro/20 dark:border-swapp-menta/20 animate-in zoom-in-95">
											{val}
											<button
												type="button"
												onClick={() => removeTempValue(val)}
												className="text-swapp-verde-oscuro/60 hover:text-red-500 transition-colors">
												<X className="h-3 w-3" />
											</button>
										</div>
									))}
								</div>
							)}
						</div>
					</div>

					<div className="flex justify-end gap-3 pt-4 border-t border-swapp-tiza dark:border-swapp-azul-petroleo">
						<button
							type="button"
							onClick={onClose}
							className="px-4 py-2 text-sm font-medium text-swapp-azul-petroleo hover:bg-swapp-tiza dark:text-swapp-blanco dark:hover:bg-swapp-azul-petroleo rounded-lg transition-colors">
							Cancelar
						</button>
						<button
							type="submit"
							disabled={isSaving}
							className="bg-swapp-verde-oscuro text-swapp-blanco dark:bg-swapp-menta dark:text-swapp-azul-oscuro hover:bg-swapp-azul-oceano dark:hover:bg-swapp-verde-pastel px-6 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
							{isSaving ? "Guardando..." : "Crear Atributo"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
