"use client";

import React, { useState, useEffect } from "react";
import { X, Save, ListPlus } from "lucide-react";
import { toast } from "sonner";
import { SwappInput } from "@/components/ui/SwappInput";
import { ProductService } from "@/services/product.service";

interface Props {
	isOpen: boolean;
	onClose: () => void;
	onSuccess: () => void;
	attributeId: number | null;
	attributeName: string;
}

export default function NewAttributeValueModal({
	isOpen,
	onClose,
	onSuccess,
	attributeId,
	attributeName,
}: Props) {
	const [newValueString, setNewValueString] = useState("");
	const [isSaving, setIsSaving] = useState(false);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape" && isOpen) {
				onClose();
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [isOpen, onClose]);

	if (!isOpen || !attributeId) return null;

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!newValueString.trim()) return;

		setIsSaving(true);
		const toastId = toast.loading("Agregando valor al diccionario...");

		try {
			await ProductService.addAttributeValue(attributeId, {
				value: newValueString.trim(),
				display_order: 0,
			});

			toast.success("Valor agregado", { id: toastId });

			setNewValueString("");
			onSuccess();
			onClose();
		} catch (error: any) {
			toast.error(error.response?.data?.detail || "Error al agregar valor", {
				id: toastId,
			});
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<div className="fixed inset-0 z-[100] flex items-center justify-center bg-swapp-azul-petroleo/5 dark:bg-swapp-negro/30 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95">
			{/* CONTENEDOR DEL MODAL SIN BORDES EXTERNOS, SOLO BORDER-T */}
			<div className="w-full max-w-sm rounded-xl bg-swapp-blanco/50 dark:bg-swapp-azul-oscuro/40 backdrop-blur-md shadow-2xl border-t-4 border-t-swapp-verde-oscuro dark:border-t-swapp-verde-menta overflow-hidden transition-colors">
				{/* HEADER CON DIVISOR AZUL PETRÓLEO */}
				<div className="p-5 border-b border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo flex items-center justify-between shrink-0 transition-colors">
					<h3 className="text-lg font-bold text-swapp-azul-oscuro dark:text-swapp-blanco flex items-center gap-2">
						<ListPlus className="h-5 w-5 text-swapp-verde-oscuro dark:text-swapp-verde-menta" />
						Nuevo valor para "{attributeName}"
					</h3>
					<button
						type="button"
						onClick={onClose}
						className="p-1 rounded-md text-swapp-azul-petroleo/50 dark:text-swapp-tiza-verdoso/50 hover:bg-red-500/10 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400 transition-colors">
						<X className="h-5 w-5" />
					</button>
				</div>

				<div className="p-5">
					{/* Agregamos [&_input]:!bg-transparent para heredar el glassmorphism */}
					<form
						onSubmit={handleSubmit}
						className="space-y-5 [&_input]:!bg-transparent">
						<SwappInput
							label="Valor"
							required
							autoFocus
							placeholder="Ej: Extra Large"
							value={newValueString}
							onChange={(e) => setNewValueString(e.target.value)}
						/>

						{/* FOOTER CON BOTONES ESTANDARIZADOS */}
						<div className="flex justify-end gap-3 pt-4 border-t border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo mt-2 transition-colors">
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
								{isSaving ? "Guardando..." : "Guardar"}
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
}
