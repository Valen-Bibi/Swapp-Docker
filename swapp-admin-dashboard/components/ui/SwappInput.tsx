import React, { useState, useEffect, ChangeEvent } from "react";

interface SwappInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
	label: string;
	helpText?: string;
	formatThousands?: boolean;
}

export function SwappInput({
	label,
	helpText,
	className = "",
	formatThousands = false,
	value,
	onChange,
	type,
	...props
}: SwappInputProps) {
	const [displayValue, setDisplayValue] = useState("");

	// Extraemos las clases a una constante para no repetir código
	const inputClasses =
		"w-full rounded-md border border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo bg-swapp-blanco dark:bg-swapp-negro-azulado p-2.5 text-swapp-negro-azulado dark:text-swapp-blanco placeholder:text-swapp-azul-petroleo/40 dark:placeholder:text-swapp-tiza/40 focus:outline-none focus:ring-1 focus:ring-swapp-turquesa-oscuro dark:focus:ring-swapp-menta transition-colors disabled:bg-swapp-tiza/50 dark:disabled:bg-swapp-azul-petroleo/50 disabled:text-swapp-azul-petroleo/50 dark:disabled:text-swapp-tiza/50";

	// Sincronizar el valor que viene de afuera (padre) con nuestro estado interno formateado
	useEffect(() => {
		if (formatThousands && value !== undefined && value !== null) {
			const stringValue = String(value);

			// Limpieza en caso de reset o valores inválidos
			if (stringValue === "" || stringValue === "NaN") {
				setDisplayValue("");
				return;
			}

			// Calculamos el equivalente numérico para evitar que React sobreescriba
			// el estado mientras el usuario tipea ceros decimales o la coma.
			const rawCurrent = displayValue.replace(/\./g, "").replace(/,/g, ".");
			const currentNumericValue = parseFloat(rawCurrent);
			const newNumericValue = parseFloat(stringValue);

			if (
				!isNaN(currentNumericValue) &&
				!isNaN(newNumericValue) &&
				currentNumericValue === newNumericValue
			) {
				return;
			}

			const parts = stringValue.split(".");
			const integerPart = parts[0];
			const formattedInteger = integerPart.replace(
				/\B(?=(\d{3})+(?!\d))/g,
				".",
			);

			let formatted = formattedInteger;
			if (parts.length > 1) {
				formatted += "," + parts[1];
			}
			setDisplayValue(formatted);
		}
	}, [value, formatThousands, displayValue]);

	const handleFormattedChange = (e: ChangeEvent<HTMLInputElement>) => {
		let rawValue = e.target.value;

		const sanitized = rawValue.replace(/(?!^-)[^\d.,]/g, "");

		let jsValue = sanitized.replace(/\./g, "").replace(/,/g, ".");

		const dotIndex = jsValue.indexOf(".");
		if (dotIndex !== -1) {
			jsValue =
				jsValue.slice(0, dotIndex + 1) +
				jsValue.slice(dotIndex + 1).replace(/\./g, "");
		}

		let formatted = "";
		if (jsValue === "-" || jsValue === "") {
			formatted = jsValue;
		} else {
			const parts = jsValue.split(".");
			const integerPart = parts[0];
			const formattedInteger = integerPart.replace(
				/\B(?=(\d{3})+(?!\d))/g,
				".",
			);

			formatted = formattedInteger;
			if (parts.length > 1) {
				formatted += "," + parts[1];
			} else if (sanitized.endsWith(",")) {
				formatted += ",";
			}
		}

		setDisplayValue(formatted);

		if (onChange) {
			const syntheticEvent = {
				...e,
				target: {
					...e.target,
					value: jsValue,
				},
			};
			onChange(syntheticEvent as ChangeEvent<HTMLInputElement>);
		}
	};

	if (!formatThousands) {
		return (
			<div className={className}>
				<label className="block text-sm font-medium text-swapp-azul-petroleo dark:text-swapp-tiza mb-1 transition-colors">
					{label}
				</label>
				<input
					{...props}
					type={type}
					value={value ?? ""} /* <-- SOLUCIÓN: Agregamos ?? "" */
					onChange={onChange}
					className={inputClasses}
				/>
				{helpText && (
					<p className="mt-1 text-xs text-swapp-azul-petroleo/60 dark:text-swapp-tiza/60 transition-colors">
						{helpText}
					</p>
				)}
			</div>
		);
	}

	return (
		<div className={className}>
			<label className="block text-sm font-medium text-swapp-azul-petroleo dark:text-swapp-tiza mb-1 transition-colors">
				{label}
			</label>
			<input
				{...props}
				type="text" // Forzamos texto porque type="number" estricto rompe con los separadores
				value={displayValue}
				onChange={handleFormattedChange}
				className={inputClasses}
			/>
			{helpText && (
				<p className="mt-1 text-xs text-swapp-azul-petroleo/60 dark:text-swapp-tiza/60 transition-colors">
					{helpText}
				</p>
			)}
		</div>
	);
}
