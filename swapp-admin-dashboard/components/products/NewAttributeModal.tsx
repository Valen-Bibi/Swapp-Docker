"use client";

import React, { useState, useEffect } from "react";
import { X, Layers, FileText, Save } from "lucide-react";
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
			`Estás a punto de crear el atributo "${newAttrName.trim()}" con el comportamiento: ${behaviorText}.\n\n¿Es el comportamiento asignado el correcto? (Este comportamiento define dónde se guardarán los datos).`,
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
		<div className="fixed inset-0 z-[100] flex items-center justify-center bg-swapp-azul-petroleo/20 dark:bg-swapp-negro/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95">
			{/* CONTENEDOR DEL MODAL SIN BORDES EXTERNOS, SOLO BORDER-T */}
			<div className="w-full max-w-lg rounded-xl bg-swapp-blanco/50 dark:bg-swapp-azul-oscuro/40 backdrop-blur-md shadow-2xl border-t-4 border-t-swapp-verde-oscuro dark:border-t-swapp-verde-menta overflow-hidden transition-colors">
				{/* HEADER CON DIVISOR AZUL PETRÓLEO */}
				<div className="p-6 border-b border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo flex items-center justify-between shrink-0 transition-colors">
					<div>
						<h2 className="text-xl font-bold text-swapp-azul-oscuro dark:text-swapp-blanco flex items-center gap-2">
							<Layers className="h-5 w-5 text-swapp-verde-oscuro dark:text-swapp-verde-menta" />
							Crear Nuevo Atributo
						</h2>
						<p className="text-sm text-swapp-azul-petroleo/70 dark:text-swapp-tiza-verdoso/70 mt-1">
							Definí la el atributo y su comportamiento en el catálogo.
						</p>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="p-1 rounded-md text-swapp-azul-petroleo/50 dark:text-swapp-tiza-verdoso/50 hover:bg-red-500/10 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400 transition-colors">
						<X className="h-5 w-5" />
					</button>
				</div>

				<div className="p-6">
					{/* HEREDAMOS TRANSPARENCIA A LOS INPUTS */}
					<form
						onSubmit={handleSubmit}
						className="space-y-6 [&_input]:!bg-transparent">
						<SwappInput
							label="Nombre del Atributo (Ej: Color, Voltaje, Talle)"
							required
							autoFocus
							value={newAttrName}
							onChange={(e) => setNewAttrName(e.target.value)}
						/>

						{/* --- SISTEMA DE TARJETAS (RADIO CARDS) ESTANDARIZADO --- */}
						<div className="space-y-2">
							<label className="block text-sm font-medium text-swapp-azul-petroleo dark:text-swapp-tiza-verdoso mb-2">
								Comportamiento del Atributo
							</label>
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								{/* Tarjeta: Ficha Técnica */}
								<button
									type="button"
									onClick={() => setNewAttrIsVariant(false)}
									className={`relative flex flex-col items-start p-4 rounded-xl border transition-all duration-200 ${
										!newAttrIsVariant
											? "border-swapp-verde-oscuro/40 bg-swapp-verde-oscuro/10 dark:border-swapp-verde-menta/40 dark:bg-swapp-verde-menta/10 shadow-sm"
											: "border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo bg-transparent hover:bg-swapp-blanco/60 dark:hover:bg-swapp-azul-petroleo/20"
									}`}>
									<div className="flex items-center gap-2 mb-2">
										<FileText
											className={`h-5 w-5 ${!newAttrIsVariant ? "text-swapp-verde-oscuro dark:text-swapp-verde-menta" : "text-swapp-azul-petroleo/50 dark:text-swapp-tiza-verdoso/50"}`}
										/>
										<span
											className={`font-semibold text-sm ${!newAttrIsVariant ? "text-swapp-verde-oscuro dark:text-swapp-verde-menta" : "text-swapp-azul-oscuro dark:text-swapp-blanco"}`}>
											Producto Base
										</span>
									</div>
									<p
										className={`text-[11px] leading-relaxed text-left ${!newAttrIsVariant ? "text-swapp-verde-oscuro/80 dark:text-swapp-verde-menta/80" : "text-swapp-azul-petroleo/70 dark:text-swapp-tiza-verdoso/70"}`}>
										Información estructural compartida por toda la carcasa base
										(Ej: Material, Tensión, Wi-Fi).
									</p>
								</button>

								{/* Tarjeta: Atributo Variante */}
								<button
									type="button"
									onClick={() => setNewAttrIsVariant(true)}
									className={`relative flex flex-col items-start p-4 rounded-xl border transition-all duration-200 ${
										newAttrIsVariant
											? "border-swapp-verde-oscuro/40 bg-swapp-verde-oscuro/10 dark:border-swapp-verde-menta/40 dark:bg-swapp-verde-menta/10 shadow-sm"
											: "border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo bg-transparent hover:bg-swapp-blanco/60 dark:hover:bg-swapp-azul-petroleo/20"
									}`}>
									<div className="flex items-center gap-2 mb-2">
										<Layers
											className={`h-5 w-5 ${newAttrIsVariant ? "text-swapp-verde-oscuro dark:text-swapp-verde-menta" : "text-swapp-azul-petroleo/50 dark:text-swapp-tiza-verdoso/50"}`}
										/>
										<span
											className={`font-semibold text-sm ${newAttrIsVariant ? "text-swapp-verde-oscuro dark:text-swapp-verde-menta" : "text-swapp-azul-oscuro dark:text-swapp-blanco"}`}>
											Variante
										</span>
									</div>
									<p
										className={`text-[11px] leading-relaxed text-left ${newAttrIsVariant ? "text-swapp-verde-oscuro/80 dark:text-swapp-verde-menta/80" : "text-swapp-azul-petroleo/70 dark:text-swapp-tiza-verdoso/70"}`}>
										Crea variantes físicas del producto (Ej: Color, Talle,
										Sabor).
									</p>
								</button>
							</div>
						</div>

						<div className="space-y-2 border-t border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo pt-5 transition-colors">
							<label className="block text-sm font-medium text-swapp-azul-petroleo dark:text-swapp-tiza-verdoso">
								Valores Iniciales (Opcional)
							</label>
							<div className="flex gap-2">
								<input
									type="text"
									className="w-full rounded-md border border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo bg-transparent px-3 py-2 text-sm text-swapp-azul-oscuro dark:text-swapp-blanco outline-none focus:border-swapp-verde-oscuro dark:focus:border-swapp-verde-menta focus:ring-1 focus:ring-swapp-verde-oscuro dark:focus:ring-swapp-verde-menta placeholder:text-swapp-azul-petroleo/40 dark:placeholder:text-swapp-tiza-verdoso/40 transition-colors"
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
											className="flex items-center gap-1.5 rounded-md bg-swapp-verde-oscuro/10 dark:bg-swapp-verde-menta/10 px-2.5 py-1.5 text-xs font-medium text-swapp-verde-oscuro dark:text-swapp-verde-menta border border-swapp-verde-oscuro/20 dark:border-swapp-verde-menta/20 animate-in zoom-in-95">
											{val}
											<button
												type="button"
												onClick={() => removeTempValue(val)}
												className="text-swapp-verde-oscuro/60 hover:text-red-500 transition-colors ml-1">
												<X className="h-3.5 w-3.5" />
											</button>
										</div>
									))}
								</div>
							)}
						</div>

						{/* FOOTER CON BOTONES ESTANDARIZADOS Y NUEVO COLOR DE BOTÓN */}
						<div className="flex justify-end gap-3 pt-4 border-t border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo mt-6 transition-colors">
							<button
								type="button"
								onClick={onClose}
								className="rounded-lg px-4 py-2 text-sm font-medium text-swapp-azul-petroleo hover:bg-red-500/10 hover:text-red-600 dark:text-swapp-tiza-verdoso dark:hover:bg-red-500/10 dark:hover:text-red-400 transition-colors">
								Cancelar
							</button>
							<button
								type="submit"
								disabled={isSaving}
								className="flex items-center gap-2 rounded-lg bg-swapp-verde-pastel dark:bg-swapp-verde-menta px-6 py-2 text-sm font-medium text-swapp-blanco dark:text-swapp-azul-oscuro transition-colors hover:bg-swapp-verde-oscuro dark:hover:bg-swapp-verde-pastel disabled:opacity-50">
								<Save className="h-4 w-4" />
								{isSaving ? "Guardando..." : "Crear Atributo"}
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
}
