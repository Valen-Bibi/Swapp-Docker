import React from "react";
import { Plus, Trash2 } from "lucide-react";

export interface AttributePair {
	key: string;
	value: string;
}

interface SwappAttributeBuilderProps {
	label?: string;
	attributes: AttributePair[];
	onChange: (attributes: AttributePair[]) => void;
	className?: string;
}

// Lista de sugerencias (estándar para e-commerce local)
const COMMON_ATTRIBUTES = [
	"Color",
	"Talle",
	"Material",
	"Capacidad",
	"Sabor",
	"Estilo",
	"Voltaje",
	"Peso Neto",
	"Dimensiones Adicionales",
];

export function SwappAttributeBuilder({
	label = "Atributos y Especificaciones",
	attributes,
	onChange,
	className = "",
}: SwappAttributeBuilderProps) {
	const handleAdd = () => {
		onChange([...attributes, { key: "", value: "" }]);
	};

	const handleRemove = (indexToRemove: number) => {
		onChange(attributes.filter((_, index) => index !== indexToRemove));
	};

	const handleChange = (
		index: number,
		field: "key" | "value",
		newValue: string,
	) => {
		const newAttributes = [...attributes];
		newAttributes[index][field] = newValue;
		onChange(newAttributes);
	};

	return (
		<div className={className}>
			{label && (
				<label className="block text-sm font-medium text-swapp-azul-petroleo dark:text-swapp-tiza mb-2 transition-colors">
					{label}
				</label>
			)}

			<div className="space-y-3">
				{attributes.length === 0 ? (
					<div className="text-sm text-swapp-azul-petroleo/50 dark:text-swapp-tiza/50 italic py-2 border border-dashed border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo rounded-md text-center bg-swapp-tiza/10 dark:bg-swapp-negro-azulado/50">
						No hay atributos definidos.
					</div>
				) : (
					attributes.map((attr, index) => (
						<div
							key={index}
							className="flex items-start gap-3 animate-in fade-in zoom-in-95 duration-200">
							<div className="flex-1">
								<input
									list="common-attributes"
									value={attr.key}
									onChange={(e) => handleChange(index, "key", e.target.value)}
									placeholder="Atributo (Ej: Color)"
									className="w-full rounded-md border border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo bg-swapp-blanco dark:bg-swapp-negro-azulado p-2.5 text-sm text-swapp-negro-azulado dark:text-swapp-blanco placeholder:text-swapp-azul-petroleo/40 dark:placeholder:text-swapp-tiza/40 focus:outline-none focus:ring-1 focus:ring-swapp-turquesa-oscuro dark:focus:ring-swapp-menta transition-colors"
								/>
								<datalist id="common-attributes">
									{COMMON_ATTRIBUTES.map((a) => (
										<option key={a} value={a} />
									))}
								</datalist>
							</div>

							<div className="flex-1">
								<input
									value={attr.value}
									onChange={(e) => handleChange(index, "value", e.target.value)}
									placeholder="Valor (Ej: Rojo)"
									className="w-full rounded-md border border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo bg-swapp-blanco dark:bg-swapp-negro-azulado p-2.5 text-sm text-swapp-negro-azulado dark:text-swapp-blanco placeholder:text-swapp-azul-petroleo/40 dark:placeholder:text-swapp-tiza/40 focus:outline-none focus:ring-1 focus:ring-swapp-turquesa-oscuro dark:focus:ring-swapp-menta transition-colors"
								/>
							</div>

							<button
								type="button"
								onClick={() => handleRemove(index)}
								className="mt-1 p-2 text-swapp-azul-petroleo/50 dark:text-swapp-tiza/50 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md transition-colors"
								title="Eliminar atributo">
								<Trash2 className="w-4 h-4" />
							</button>
						</div>
					))
				)}

				<button
					type="button"
					onClick={handleAdd}
					className="inline-flex items-center gap-1.5 text-sm font-medium text-swapp-turquesa-oscuro dark:text-swapp-menta hover:text-swapp-azul-oceano dark:hover:text-swapp-verde-agua transition-colors mt-2">
					<Plus className="w-4 h-4" /> Agregar atributo
				</button>
			</div>
		</div>
	);
}
