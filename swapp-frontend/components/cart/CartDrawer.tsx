"use client";

import React from "react";
import { useCart } from "@/contexts/CartContext";
import { X, Trash2, Minus, Plus, MessageCircle } from "lucide-react";
import { Image as ImageIcon } from "lucide-react";
import { SwappToggle } from "@/components/ui/SwappToggle";

export default function CartDrawer() {
	const {
		isCartOpen,
		closeCart,
		items,
		updateQuantity,
		removeItem,
		addItem,
		total,
	} = useCart();

	const WHATSAPP_NUMBER = "5491124822821";

	const esRetornable = (nombre: string) => {
		return (
			nombre.toLowerCase().includes("cilindro") ||
			nombre.toLowerCase().includes("recambio")
		);
	};

	// Función mágica que maneja el cambio entre Nuevo y Recambio
	const handleToggleType = (item: any, isRecambio: boolean) => {
		// Protección por si el usuario tiene items viejos guardados en memoria antes de esta actualización
		if (!item.standard_price || !item.exchange_price) {
			alert(
				"Por favor, elimina este producto y vuelve a agregarlo para aplicar el cambio.",
			);
			return;
		}

		const newType = isRecambio ? "recambio" : "nuevo";
		const newPrice = isRecambio ? item.exchange_price : item.standard_price;

		// 1. Restamos 1 unidad del item actual (o lo eliminamos si solo quedaba 1)
		if (item.quantity === 1) {
			removeItem(item.id);
		} else {
			updateQuantity(item.id, -1);
		}

		// 2. Agregamos 1 unidad del nuevo tipo.
		// El CartContext se encargará de agruparlo si ya existe otro igual.
		addItem({
			product_uuid: item.product_uuid,
			name: item.name,
			price: newPrice,
			quantity: 1,
			type: newType,
			image_url: item.image_url,
			standard_price: item.standard_price,
			exchange_price: item.exchange_price,
		});
	};

	const handleCheckout = () => {
		if (items.length === 0) return;

		let message = `¡Hola Swapp!\nQuiero iniciar un pedido:\n\n`;

		items.forEach((item) => {
			message += `• ${item.quantity}x ${item.name}`;

			if (esRetornable(item.name)) {
				const tipoText = item.type === "recambio" ? "Recambio" : "Nuevo";
				message += ` (${tipoText})`;
			}

			message += `\n`;
		});

		message += `\nPor favor, indíquenme cómo coordinar el pago y el envío.`;

		const encodedMessage = encodeURIComponent(message);
		const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;

		window.open(whatsappUrl, "_blank");
	};

	return (
		<>
			{/* Fondo oscuro desenfocado */}
			{isCartOpen && (
				<div
					className="fixed inset-0 z-40 bg-swapp-azul-petroleo/5 backdrop-blur-sm transition-opacity"
					onClick={closeCart}
				/>
			)}

			{/* Drawer con Glassmorphism */}
			<div
				className={`fixed inset-y-0 right-0 z-50 w-full max-w-md bg-swapp-blanco/50 backdrop-blur-md shadow-2xl border-l-4 border-l-swapp-verde-oscuro overflow-hidden transform transition-transform duration-300 ease-in-out flex flex-col ${
					isCartOpen ? "translate-x-0" : "translate-x-full"
				}`}>
				<div className="flex items-center justify-between p-6 border-b border-swapp-azul-petroleo/20 shrink-0 transition-colors">
					<h2 className="text-xl font-bold text-swapp-azul-oscuro flex items-center gap-2">
						Tu Pedido
					</h2>
					<button
						onClick={closeCart}
						className="p-1 rounded-md text-swapp-azul-petroleo/50 hover:bg-red-500/10 hover:text-red-600 transition-colors">
						<X className="h-5 w-5" />
					</button>
				</div>

				<div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
					{items.length === 0 ? (
						<div className="h-full flex flex-col items-center justify-center opacity-50 text-center gap-4">
							<span className="text-4xl">🛒</span>
							<p className="text-swapp-azul-oscuro font-medium">
								Tu carrito está vacío.
							</p>
						</div>
					) : (
						<div className="flex flex-col gap-6">
							{items.map((item) => (
								<div key={item.id} className="flex gap-4 items-start">
									<div className="h-16 w-16 rounded-xl bg-transparent border border-swapp-azul-petroleo/20 flex shrink-0 items-center justify-center overflow-hidden transition-colors mt-1">
										{item.image_url ? (
											<img
												src={item.image_url}
												alt={item.name}
												className="h-full w-full object-cover"
											/>
										) : (
											<ImageIcon className="h-6 w-6 opacity-30 text-swapp-azul-petroleo" />
										)}
									</div>

									<div className="flex-1 flex flex-col items-start pt-1">
										<span className="font-bold text-sm leading-tight text-swapp-azul-oscuro">
											{item.name}
										</span>

										{/* Renderizado del Toggle interactivo o etiqueta normal */}
										{esRetornable(item.name) && (
											<div className="mt-2 flex items-center gap-2">
												<SwappToggle
													id={`toggle-${item.id}`}
													checked={item.type === "recambio"}
													onChange={(checked) =>
														handleToggleType(item, checked)
													}
												/>
												<span className="text-[10px] uppercase tracking-wider text-swapp-verde-oscuro font-bold">
													{item.type === "recambio" ? "Recambio" : "Nuevo"}
												</span>
											</div>
										)}

										<span className="text-sm font-black mt-2 opacity-70 text-swapp-azul-oscuro">
											${item.price.toLocaleString("es-AR")}
										</span>
									</div>

									<div className="flex flex-col items-end gap-3 pt-1">
										<button
											onClick={() => removeItem(item.id)}
											className="text-red-500 hover:text-red-700 opacity-60 hover:opacity-100 transition-opacity">
											<Trash2 className="h-4 w-4" />
										</button>
										<div className="flex items-center gap-2 bg-transparent border border-swapp-azul-petroleo/20 rounded-lg p-1 transition-colors">
											<button
												onClick={() => updateQuantity(item.id, -1)}
												className="p-1 text-swapp-azul-petroleo hover:bg-swapp-azul-petroleo/10 rounded-md transition-colors">
												<Minus className="h-3 w-3" />
											</button>
											<span className="text-xs font-bold w-4 text-center text-swapp-azul-oscuro">
												{item.quantity}
											</span>
											<button
												onClick={() => updateQuantity(item.id, 1)}
												className="p-1 text-swapp-azul-petroleo hover:bg-swapp-azul-petroleo/10 rounded-md transition-colors">
												<Plus className="h-3 w-3" />
											</button>
										</div>
									</div>
								</div>
							))}
						</div>
					)}
				</div>

				<div className="flex flex-col justify-end gap-4 p-6 border-t border-swapp-azul-petroleo/20 transition-colors">
					<div className="flex items-center justify-between">
						<span className="text-sm font-medium text-swapp-azul-oscuro">
							Total estimado
						</span>
						<span className="text-2xl font-black text-swapp-azul-oscuro">
							${total.toLocaleString("es-AR")}
						</span>
					</div>

					<button
						onClick={handleCheckout}
						disabled={items.length === 0}
						className="w-full flex items-center justify-center gap-2 rounded-lg bg-swapp-verde-pastel px-6 py-4 text-sm font-bold text-swapp-blanco transition-colors hover:bg-swapp-verde-oscuro disabled:opacity-50 disabled:cursor-not-allowed shadow-lg">
						<MessageCircle className="h-5 w-5" />
						Coordinar por WhatsApp
					</button>
					<p className="text-xs text-center text-swapp-azul-petroleo opacity-70">
						Serás redirigido a WhatsApp para coordinar envío y métodos de pago
						con nuestro equipo.
					</p>
				</div>
			</div>
		</>
	);
}
