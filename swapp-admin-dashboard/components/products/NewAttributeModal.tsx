"use client";

import React, { useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { SwappInput } from "@/components/ui/SwappInput";
import { SwappToggle } from "@/components/ui/SwappToggle";
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
			setNewAttrIsVariant(false);
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
			<div className="w-full max-w-lg rounded-xl bg-swapp-blanco dark:bg-swapp-negro-azulado p-6 shadow-2xl border-t-4 border-swapp-turquesa-oscuro dark:border-swapp-menta">
				<div className="mb-6 flex items-center justify-between">
					<div>
						<h2 className="text-xl font-bold text-swapp-negro-azulado dark:text-swapp-blanco">
							Crear Nuevo Atributo
						</h2>
						<p className="text-sm text-swapp-azul-petroleo/70 dark:text-swapp-tiza/70 mt-1">
							Definí la entidad y sus valores permitidos.
						</p>
					</div>
					<button
						onClick={onClose}
						className="text-swapp-azul-petroleo/50 hover:text-swapp-negro-azulado dark:text-swapp-tiza/50 dark:hover:text-swapp-blanco transition-colors">
						<X className="h-5 w-5" />
					</button>
				</div>

				<form onSubmit={handleSubmit} className="space-y-6">
					<div className="space-y-6">
						<SwappInput
							label="Nombre del Atributo (Ej: Color, Voltaje, Talle)"
							required
							value={newAttrName}
							onChange={(e) => setNewAttrName(e.target.value)}
						/>

						<div className="flex items-start justify-between rounded-lg border border-swapp-tiza dark:border-swapp-azul-petroleo p-4 bg-swapp-tiza/10 dark:bg-swapp-azul-petroleo/10">
							<div className="space-y-1">
								<p className="text-sm font-semibold text-swapp-negro-azulado dark:text-swapp-blanco">
									¿Es un Atributo Variante?
								</p>
								<p className="text-xs text-swapp-azul-petroleo/70 dark:text-swapp-tiza/70 max-w-[280px]">
									Si activás esto, este atributo exigirá crear una variante
									física de inventario (Ej: Color, Talle). Si queda inactivo,
									será un dato de ficha técnica (Ej: Material, Bluetooth).
								</p>
							</div>
							<div className="pt-1">
								<SwappToggle
									checked={newAttrIsVariant}
									onChange={setNewAttrIsVariant}
									id="is_variant_toggle"
								/>
							</div>
						</div>

						<div className="space-y-2 border-t border-swapp-tiza dark:border-swapp-azul-petroleo pt-4">
							<label className="block text-sm font-medium text-swapp-azul-petroleo dark:text-swapp-tiza">
								Valores Iniciales (Opcional)
							</label>
							<div className="flex gap-2">
								<input
									type="text"
									className="w-full rounded-md border border-swapp-tiza dark:border-swapp-azul-petroleo bg-transparent px-3 py-2 text-sm outline-none focus:border-swapp-turquesa-oscuro dark:focus:border-swapp-menta"
									placeholder="Ej: Rojo (y presioná Enter)"
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
											className="flex items-center gap-1.5 rounded-full bg-swapp-turquesa-oscuro/10 dark:bg-swapp-menta/10 px-3 py-1 text-sm font-medium text-swapp-turquesa-oscuro dark:text-swapp-menta border border-swapp-turquesa-oscuro/20 dark:border-swapp-menta/20">
											{val}
											<button
												type="button"
												onClick={() => removeTempValue(val)}
												className="text-swapp-turquesa-oscuro/60 hover:text-red-500 transition-colors">
												<X className="h-3.5 w-3.5" />
											</button>
										</div>
									))}
								</div>
							)}
						</div>
					</div>

					<div className="flex justify-end gap-3 pt-4">
						<button
							type="button"
							onClick={onClose}
							className="px-4 py-2 text-sm font-medium text-swapp-azul-petroleo hover:bg-swapp-tiza rounded-lg transition-colors">
							Cancelar
						</button>
						<button
							type="submit"
							disabled={isSaving}
							className="bg-swapp-turquesa-oscuro text-swapp-blanco hover:bg-swapp-azul-oceano px-6 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
							{isSaving ? "Guardando..." : "Crear Atributo"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
