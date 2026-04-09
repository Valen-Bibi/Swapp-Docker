"use client";

import { useRouter } from "next/navigation";

interface BackButtonProps {
	className?: string;
	onClick?: () => void; // <-- NUEVO: Permitimos pasar una función personalizada
}

export default function BackButton({
	className = "absolute top-6 left-6",
	onClick,
}: BackButtonProps) {
	const router = useRouter();

	// Si nos pasan un onClick, lo usamos. Si no, usamos el router.back() por defecto.
	const handleClick = () => {
		if (onClick) {
			onClick();
		} else {
			router.back();
		}
	};

	return (
		<button
			onClick={handleClick}
			aria-label="Volver"
			className={`z-[80] flex items-center justify-center w-11 h-11 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white hover:bg-black/60 hover:scale-105 active:scale-95 transition-all shadow-lg ${className}`}>
			<svg
				className="w-6 h-6 ml-[-2px]"
				viewBox="0 0 24 24"
				stroke="currentColor"
				strokeWidth={2.5}>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					d="M15 19l-7-7 7-7"
				/>
			</svg>
		</button>
	);
}
