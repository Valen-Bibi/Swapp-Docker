"use client";

import React, { useState } from "react";
import { X } from "lucide-react";
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

			// Limpiamos y cerramos
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
		<div className="fixed inset-0 z-[100] flex items-center justify-center bg-swapp-negro/50 dark:bg-swapp-negro/70 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95">
			<div className="w-full max-w-sm rounded-xl bg-swapp-blanco dark:bg-swapp-azul-oscuro p-5 shadow-2xl border-t-4 border-swapp-verde-oscuro dark:border-swapp-verde-menta">
				<div className="mb-4 flex items-center justify-between">
					<h3 className="text-lg font-bold text-swapp-azul-oscuro dark:text-swapp-blanco">
						Nuevo valor para "{attributeName}"
					</h3>
					<button
						onClick={onClose}
						className="text-swapp-azul-petroleo/50 hover:text-swapp-azul-oscuro transition-colors">
						<X className="h-4 w-4" />
					</button>
				</div>
				<form onSubmit={handleSubmit} className="space-y-4">
					<SwappInput
						label="Valor Normalizado"
						required
						autoFocus
						placeholder="Ej: Extra Large"
						value={newValueString}
						onChange={(e) => setNewValueString(e.target.value)}
					/>
					<button
						type="submit"
						disabled={isSaving}
						className="w-full bg-swapp-verde-oscuro text-swapp-blanco hover:bg-swapp-azul-oceano py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
						{isSaving ? "Guardando..." : "Añadir al Diccionario"}
					</button>
				</form>
			</div>
		</div>
	);
}
