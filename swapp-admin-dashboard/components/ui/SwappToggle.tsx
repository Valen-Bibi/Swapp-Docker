import React from "react";

interface SwappToggleProps {
	checked: boolean;
	onChange: (checked: boolean) => void;
	label?: string;
	disabled?: boolean;
	id?: string;
}

export function SwappToggle({
	checked,
	onChange,
	label,
	disabled = false,
	id,
}: SwappToggleProps) {
	return (
		<div className="flex items-center gap-3">
			<button
				type="button"
				id={id}
				role="switch"
				aria-checked={checked}
				disabled={disabled}
				onClick={() => !disabled && onChange(!checked)}
				className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-swapp-turquesa-oscuro ${
					checked
						? "bg-swapp-turquesa-oscuro dark:bg-swapp-menta"
						: "bg-swapp-azul-petroleo/30 dark:bg-swapp-tiza/30"
				} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}>
				<span
					className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-swapp-blanco shadow ring-0 transition duration-200 ease-in-out ${
						checked ? "translate-x-4" : "translate-x-0.5"
					}`}
				/>
			</button>
			{label && (
				<label
					htmlFor={id}
					className="text-sm font-medium text-swapp-azul-petroleo dark:text-swapp-tiza cursor-pointer select-none transition-colors"
					onClick={() => !disabled && onChange(!checked)}>
					{label}
				</label>
			)}
		</div>
	);
}
