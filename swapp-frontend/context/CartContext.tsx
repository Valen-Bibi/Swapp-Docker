"use client";

import React, {
	createContext,
	useContext,
	useState,
	useMemo,
	useEffect,
} from "react";

// --- INTERFACES ---
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
	is_returnable: boolean;
}

export type NormalCartItem = {
	type: "normal";
	product: Product;
	quantity: number;
};

export type ReturnableCartItem = {
	type: "returnable";
	product: Product;
	returnQty: number;
	receiveQty: number;
};

export type CartItem = NormalCartItem | ReturnableCartItem;

interface CartContextType {
	items: CartItem[];
	addToCart: (item: CartItem) => void;
	removeFromCart: (product_uuid: string) => void;
	clearCart: () => void;
	updateQuantity: (product_uuid: string, quantity: number) => void;
	updateReturnableQty: (
		product_uuid: string,
		returnQty: number,
		receiveQty: number,
	) => void;
	totalAmount: number;
	totalItems: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
	const [items, setItems] = useState<CartItem[]>([]);
	const [isLoaded, setIsLoaded] = useState(false);

	useEffect(() => {
		const savedCart = localStorage.getItem("swapp_cart");
		if (savedCart) {
			try {
				setItems(JSON.parse(savedCart));
			} catch (error) {
				console.error("Error parsing cart from local storage", error);
			}
		}
		setIsLoaded(true);
	}, []);

	useEffect(() => {
		if (isLoaded) {
			localStorage.setItem("swapp_cart", JSON.stringify(items));
		}
	}, [items, isLoaded]);

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
					existing.type === "returnable" &&
					newItem.type === "returnable"
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

	const updateQuantity = (product_uuid: string, quantity: number) => {
		setItems((prev) =>
			prev.map((item) =>
				item.product.product_uuid === product_uuid && item.type === "normal"
					? { ...item, quantity: Math.max(1, quantity) }
					: item,
			),
		);
	};

	const updateReturnableQty = (
		product_uuid: string,
		returnQty: number,
		receiveQty: number,
	) => {
		setItems((prev) =>
			prev.map((item) =>
				item.product.product_uuid === product_uuid && item.type === "returnable"
					? {
							...item,
							returnQty: Math.max(0, returnQty),
							receiveQty: Math.max(1, receiveQty),
						}
					: item,
			),
		);
	};

	const removeFromCart = (product_uuid: string) => {
		setItems((prev) =>
			prev.filter((item) => item.product.product_uuid !== product_uuid),
		);
	};

	const clearCart = () => setItems([]);

	// Cálculos protegidos ante valores nulos
	const totalAmount = useMemo(() => {
		if (!items || items.length === 0) return 0;
		return items.reduce((total, item) => {
			const product = item?.product;
			if (!product) return total;

			const priceToUse = product.sale_price ?? product.base_price ?? 0;

			if (item.type === "normal") {
				return total + (item.quantity || 0) * priceToUse;
			} else {
				const refills = Math.min(item.returnQty || 0, item.receiveQty || 1);
				const extras = Math.max(
					0,
					(item.receiveQty || 1) - (item.returnQty || 0),
				);
				return total + refills * priceToUse + extras * priceToUse * 2;
			}
		}, 0);
	}, [items]);

	const totalItems = useMemo(() => {
		if (!items || items.length === 0) return 0;
		return items.reduce((total, item) => {
			if (item.type === "normal") return total + (item.quantity || 0);
			return total + (item.receiveQty || 0);
		}, 0);
	}, [items]);

	return (
		<CartContext.Provider
			value={{
				items,
				addToCart,
				removeFromCart,
				clearCart,
				updateQuantity,
				updateReturnableQty,
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
