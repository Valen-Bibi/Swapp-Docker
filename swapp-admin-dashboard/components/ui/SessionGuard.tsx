import React from "react";

export default function SessionGuard({
	children,
}: {
	children: React.ReactNode;
}) {
	// TODO: Acá podés agregar la lógica de validación de cookies o tokens a futuro.

	// Por ahora, funciona como un "espejo" transparente que simplemente
	// renderiza lo que le pongas adentro sin romper TypeScript.
	return <>{children}</>;
}
