import React from "react";

interface ActionBtnProps {
	label: string;
	icon: React.ReactNode;
	active?: boolean;
	onClick?: () => void; // ¡Agregamos esto para darle funcionalidad luego!
}

export default function ActionBtn({
	label,
	icon,
	active = false,
	onClick,
}: ActionBtnProps) {
	return (
		<div
			onClick={onClick}
			className={`flex flex-col items-center gap-2 cursor-pointer ${active ? "-mt-10" : ""}`}>
			<button
				className={`
          rounded-full flex items-center justify-center border-2 transition hover:scale-105 shadow-md
          ${
						active
							? "w-20 h-20 bg-transparent border-swapp-teal text-swapp-teal"
							: "w-14 h-14 bg-transparent border-swapp-dark/30 text-swapp-teal"
					}
      `}>
				<svg
					className="w-7 h-7"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24">
					{icon}
				</svg>
			</button>
			<span className="text-xs font-medium text-swapp-dark">{label}</span>
		</div>
	);
}
