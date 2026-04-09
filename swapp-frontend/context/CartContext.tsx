"use client";

import React, {
	createContext,
	useContext,
	useState,
	useMemo,
	useEffect,
} from "react";

// 1. INTERFAZ ACTUALIZADA SEGÚN TU NUEVO SCHEMA
export interface Product {
	product_uuid: string;
	name: string;
	base_price: number;
	sale_price: number | null;
	stock_quantity: number;
	category_id: number | null;
	main_image_url: string | null;
	is_featured: boolean;
	sold_count: number;
	description: string | null;
	short_description: string | null;
}

export type NormalCartItem = {
	type: "normal";
	product: Product;
	quantity: number;
};

export type CylinderCartItem = {
	type: "cylinder";
	product: Product;
	returnQty: number;
	receiveQty: number;
};

export type CartItem = NormalCartItem | CylinderCartItem;

interface CartContextType {
	items: CartItem[];
	addToCart: (item: CartItem) => void;
	removeFromCart: (product_uuid: string) => void;
	clearCart: () => void;
	totalAmount: number;
	totalItems: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
	const [items, setItems] = useState<CartItem[]>([]);

	useEffect(() => {
		const savedCart = localStorage.getItem("swapp_cart");
		if (savedCart) {
			try {
				setItems(JSON.parse(savedCart));
			} catch (error) {
				console.error("Error parsing cart from local storage", error);
			}
		}
	}, []);

	useEffect(() => {
		localStorage.setItem("swapp_cart", JSON.stringify(items));
	}, [items]);

	const addToCart = (newItem: CartItem) => {
		setItems((prevItems) => {
			const existingItemIndex = prevItems.findIndex(
				(item) => item.product.product_uuid === newItem.product.product_uuid,
			);

			if (existingItemIndex > -1) {
				const updatedItems = [...prevItems];
				const existing = updatedItems[existingItemIndex];

				if (existing.type === "normal" && newItem.type === "normal") {
					updatedItems[existingItemIndex] = {
						...existing,
						quantity: existing.quantity + newItem.quantity,
					};
				} else if (
					existing.type === "cylinder" &&
					newItem.type === "cylinder"
				) {
					updatedItems[existingItemIndex] = {
						...existing,
						returnQty: existing.returnQty + newItem.returnQty,
						receiveQty: existing.receiveQty + newItem.receiveQty,
					};
				}
				return updatedItems;
			}
			return [...prevItems, newItem];
		});
	};

	const removeFromCart = (product_uuid: string) => {
		setItems((prev) =>
			prev.filter((item) => item.product.product_uuid !== product_uuid),
		);
	};

	const clearCart = () => setItems([]);

	// 4. CÁLCULO ACTUALIZADO CONSIDERANDO EL SALE_PRICE
	const totalAmount = useMemo(() => {
		return items.reduce((total, item) => {
			// Definimos el precio real a usar (oferta o base)
			const priceToUse = item.product.sale_price ?? item.product.base_price;

			if (item.type === "normal") {
				return total + item.quantity * priceToUse;
			} else {
				const refills = Math.min(item.returnQty, item.receiveQty);
				const extras = Math.max(0, item.receiveQty - item.returnQty);

				// Los extras valen el doble del precio real a usar
				return total + refills * priceToUse + extras * priceToUse * 2;
			}
		}, 0);
	}, [items]);

	const totalItems = useMemo(() => {
		return items.reduce((total, item) => {
			if (item.type === "normal") return total + item.quantity;
			return total + item.receiveQty;
		}, 0);
	}, [items]);

	return (
		<CartContext.Provider
			value={{
				items,
				addToCart,
				removeFromCart,
				clearCart,
				totalAmount,
				totalItems,
			}}>
			{children}
		</CartContext.Provider>
	);
};

export const useCart = () => {
	const context = useContext(CartContext);
	if (context === undefined) {
		throw new Error("useCart debe ser usado dentro de un CartProvider");
	}
	return context;
};
