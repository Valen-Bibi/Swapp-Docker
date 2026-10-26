"use client";

import React from "react";
import { useCart } from "@/contexts/CartContext";
import { X, Trash2, Minus, Plus, MessageCircle } from "lucide-react";
import { Image as ImageIcon } from "lucide-react";

export default function CartDrawer() {
  const { isCartOpen, closeCart, items, updateQuantity, removeItem, total } = useCart();

  const WHATSAPP_NUMBER = "5491124822821"; 

  const esRetornable = (nombre: string) => {
    return nombre.toLowerCase().includes("cilindro") || nombre.toLowerCase().includes("recambio");
  };

  const handleCheckout = () => {
    if (items.length === 0) return;

    let message = `¡Hola Swapp!\nQuiero iniciar un pedido:\n\n`;
    
    items.forEach((item) => {
      message += `• ${item.quantity}x ${item.name}`;
      
      // Solo añade el tag si el producto es retornable (ej: Cilindros)
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
      {/* Fondo oscuro para cerrar */}
      {isCartOpen && (
        <div
          className="fixed inset-0 z-40 bg-swapp-negro/40 backdrop-blur-sm transition-opacity"
          onClick={closeCart}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-md bg-background/95 backdrop-blur-xl border-l border-swapp-azul-petroleo/10 dark:border-swapp-tiza-verdoso/10 shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${
          isCartOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-6 border-b border-swapp-azul-petroleo/10">
          <h2 className="text-xl font-bold text-swapp-azul-oscuro dark:text-swapp-blanco">
            Tu Pedido
          </h2>
          <button
            onClick={closeCart}
            className="p-2 rounded-full hover:bg-swapp-tiza-verdoso dark:hover:bg-swapp-azul-oscuro transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-50 text-center gap-4">
              <p>Tu carrito está vacío.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {items.map((item) => (
                <div key={item.id} className="flex gap-4 items-center">
                  <div className="h-16 w-16 rounded-xl bg-swapp-tiza-verdoso/50 flex shrink-0 items-center justify-center border border-swapp-azul-petroleo/10 overflow-hidden">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
                    ) : (
                      <ImageIcon className="h-6 w-6 opacity-30" />
                    )}
                  </div>
                  
                  <div className="flex-1 flex flex-col">
                    <span className="font-bold text-sm leading-tight text-swapp-azul-oscuro dark:text-swapp-blanco">
                      {item.name}
                    </span>
                    {/* Renderizado condicional de la etiqueta visual */}
                    {esRetornable(item.name) && (
                      <span className="text-xs uppercase tracking-wider text-swapp-verde-pastel dark:text-swapp-verde-menta font-semibold mt-0.5">
                        {item.type}
                      </span>
                    )}
                    <span className="text-sm font-bold mt-1 opacity-70">
                      ${item.price.toLocaleString("es-AR")}
                    </span>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <button onClick={() => removeItem(item.id)} className="text-red-500 hover:text-red-700 opacity-60 hover:opacity-100 transition-opacity">
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <div className="flex items-center gap-2 bg-swapp-tiza-verdoso dark:bg-swapp-azul-oscuro rounded-lg p-1">
                      <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:bg-swapp-blanco dark:hover:bg-swapp-azul-petroleo rounded-md transition-colors">
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:bg-swapp-blanco dark:hover:bg-swapp-azul-petroleo rounded-md transition-colors">
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-swapp-azul-petroleo/10 bg-swapp-tiza-verdoso/30 dark:bg-swapp-azul-oscuro/20 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-sm opacity-70 font-semibold">Total estimado</span>
            <span className="text-2xl font-black text-swapp-azul-oscuro dark:text-swapp-blanco">
              ${total.toLocaleString("es-AR")}
            </span>
          </div>
          
          <button
            onClick={handleCheckout}
            disabled={items.length === 0}
            className="w-full flex items-center justify-center gap-2 bg-[#25D366] text-white py-4 rounded-xl font-bold hover:bg-[#20bd5a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            <MessageCircle className="h-5 w-5" />
            Coordinar por WhatsApp
          </button>
          <p className="text-xs text-center opacity-60">
            Serás redirigido a WhatsApp para coordinar envío y métodos de pago con nuestro equipo.
          </p>
        </div>
      </div>
    </>
  );
}