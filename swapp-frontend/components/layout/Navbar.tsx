"use client";

import Link from "next/link";
import { useCart } from "@/contexts/CartContext";

export default function Navbar() {
  const { itemCount, openCart } = useCart();
  
  return (
    <header className="sticky top-0 z-40 w-full border-b border-swapp-tiza-verdoso/20 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-6xl">
        <Link href="/" className="text-2xl font-bold tracking-tighter text-swapp-azul-petroleo dark:text-swapp-verde-menta">
          Swapp.
        </Link>
        <nav className="flex items-center gap-6">
          <Link href="/" className="text-sm font-medium hover:text-swapp-verde-pastel transition-colors">
            Catálogo
          </Link>
          <button 
            onClick={openCart}
            className="text-sm font-medium px-5 py-2.5 bg-swapp-azul-oscuro text-swapp-blanco rounded-full hover:bg-swapp-azul-petroleo transition-colors dark:bg-swapp-verde-pastel dark:text-swapp-negro flex items-center gap-2"
          >
            Carrito 
            <span className="bg-swapp-blanco text-swapp-azul-oscuro dark:bg-swapp-azul-oscuro dark:text-swapp-blanco px-2 py-0.5 rounded-full text-xs">
              {itemCount}
            </span>
          </button>
        </nav>
      </div>
    </header>
  );
}