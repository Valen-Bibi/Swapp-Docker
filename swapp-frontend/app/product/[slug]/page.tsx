"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CatalogService } from "@/services/product.service";
import { PublicProduct } from "@/types/product";
import { useCart } from "@/contexts/CartContext";
import { Image as ImageIcon, Recycle, ArrowLeft, Loader2, ShoppingCart } from "lucide-react";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { addItem } = useCart();
  
  const [product, setProduct] = useState<PublicProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState<string | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const data = await CatalogService.getProductBySlug(slug);
        setProduct(data);
        const mainMedia = data.media?.find(m => m.media_subtype === "main");
        if (mainMedia) setActiveImage(mainMedia.file_url);
      } catch (error) {
        console.error("Error al cargar producto:", error);
      } finally {
        setLoading(false);
      }
    };
    if (slug) fetchProduct();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center gap-3 text-swapp-azul-petroleo dark:text-swapp-verde-menta">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="text-lg font-medium">Cargando producto...</span>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-20 text-center max-w-2xl">
        <h2 className="text-2xl font-bold text-swapp-azul-oscuro dark:text-swapp-blanco mb-4">Producto no encontrado</h2>
        <button onClick={() => router.push("/")} className="text-swapp-verde-pastel hover:underline">Volver al catálogo</button>
      </div>
    );
  }

  const fullName = `${product.name}${product.model ? ` - ${product.model}` : ""}`;
  const standardPrice = product.variants?.[0]?.price || 0;
  const gallery = product.media?.filter(m => m.media_type === "image") || [];

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <button 
        onClick={() => router.push("/")}
        className="flex items-center gap-2 text-sm font-medium text-swapp-azul-petroleo/70 hover:text-swapp-verde-oscuro dark:text-swapp-tiza-verdoso/70 dark:hover:text-swapp-verde-menta mb-8 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Volver al catálogo
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Columna Izquierda: Galería OBS */}
        <div className="flex flex-col gap-4">
          <div className="relative aspect-square w-full rounded-2xl bg-swapp-tiza-verdoso/40 dark:bg-swapp-azul-oscuro/40 border border-swapp-azul-petroleo/10 overflow-hidden flex items-center justify-center p-8 backdrop-blur-sm shadow-sm">
            {product.is_returnable && (
              <span className="absolute top-4 left-4 z-10 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-swapp-verde-pastel text-swapp-blanco dark:bg-swapp-verde-menta dark:text-swapp-azul-oscuro shadow-sm">
                <Recycle className="h-4 w-4" /> Retornable
              </span>
            )}
            {activeImage ? (
              <img src={activeImage} alt={fullName} className="h-full w-full object-contain" />
            ) : (
              <ImageIcon className="h-16 w-16 text-swapp-azul-petroleo/20 dark:text-swapp-tiza-verdoso/20" />
            )}
          </div>
          
          {/* Miniaturas de la Galería */}
          {gallery.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
              {gallery.map(m => (
                <button 
                  key={m.media_uuid}
                  onClick={() => setActiveImage(m.file_url)}
                  className={`relative h-20 w-20 shrink-0 rounded-xl border-2 overflow-hidden bg-swapp-tiza-verdoso/20 flex items-center justify-center transition-all ${activeImage === m.file_url ? 'border-swapp-verde-oscuro dark:border-swapp-verde-menta shadow-sm' : 'border-transparent hover:border-swapp-azul-petroleo/30'}`}
                >
                  <img src={m.file_url} alt="Miniatura" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Columna Derecha: Información y Compra */}
        <div className="flex flex-col gap-6 pt-2">
          <div>
            {product.brand?.name && (
              <span className="text-sm font-bold uppercase tracking-widest text-swapp-verde-pastel dark:text-swapp-verde-menta">
                {product.brand.name}
              </span>
            )}
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-swapp-azul-oscuro dark:text-swapp-blanco mt-1">
              {fullName}
            </h1>
          </div>

          {/* Bloque de Precios y Call to Actions */}
          <div className="flex flex-col gap-4 bg-swapp-blanco/60 dark:bg-swapp-azul-petroleo/10 rounded-2xl p-6 border border-swapp-azul-petroleo/15 backdrop-blur-md shadow-sm">
            {product.exchange_option ? (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-semibold text-swapp-verde-oscuro dark:text-swapp-verde-menta flex items-center gap-1.5">
                    <Recycle className="h-4 w-4" /> Precio de Recambio (Entregando vacío)
                  </span>
                  <div className="flex items-end gap-4 justify-between">
                    <span className="text-4xl font-black text-swapp-verde-oscuro dark:text-swapp-verde-menta">
                      ${Number(product.exchange_option.price).toLocaleString("es-AR")}
                    </span>
                    <button 
                      onClick={() => addItem({
                        product_uuid: product.product_uuid,
                        name: fullName,
                        price: product.exchange_option!.price,
                        quantity: 1,
                        type: "recambio",
                        image_url: activeImage || undefined
                      })}
                      className="bg-swapp-verde-oscuro dark:bg-swapp-verde-menta text-swapp-blanco dark:text-swapp-azul-oscuro px-6 py-3 rounded-full font-bold hover:opacity-90 transition-opacity shadow-md flex items-center gap-2"
                    >
                      <ShoppingCart className="h-5 w-5" /> Agregar Recambio
                    </button>
                  </div>
                </div>
                
                <hr className="border-swapp-azul-petroleo/10 dark:border-swapp-tiza-verdoso/10" />
                
                <div className="flex items-center justify-between opacity-80">
                  <span className="text-sm font-medium">Llevar cilindro nuevo</span>
                  <div className="flex items-center gap-4">
                    <span className="text-xl font-bold">${Number(standardPrice).toLocaleString("es-AR")}</span>
                    <button 
                      onClick={() => addItem({
                        product_uuid: product.product_uuid,
                        name: fullName,
                        price: standardPrice,
                        quantity: 1,
                        type: "nuevo",
                        image_url: activeImage || undefined
                      })}
                      className="text-sm font-semibold bg-swapp-azul-petroleo/10 text-swapp-azul-oscuro dark:text-swapp-blanco px-4 py-2 rounded-full hover:bg-swapp-azul-petroleo/20 transition-colors"
                    >
                      Agregar Nuevo
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-4xl font-black text-swapp-azul-oscuro dark:text-swapp-blanco">
                  ${Number(standardPrice).toLocaleString("es-AR")}
                </span>
                <button 
                  onClick={() => addItem({
                    product_uuid: product.product_uuid,
                    name: fullName,
                    price: standardPrice,
                    quantity: 1,
                    type: "nuevo",
                    image_url: activeImage || undefined
                  })}
                  className="bg-swapp-azul-oscuro dark:bg-swapp-verde-pastel text-swapp-blanco px-8 py-3 rounded-full font-bold hover:opacity-90 transition-opacity shadow-md flex items-center gap-2"
                >
                  <ShoppingCart className="h-5 w-5" /> Agregar al Carrito
                </button>
              </div>
            )}
          </div>

          {/* Descripciones (Corta y Larga) */}
          <div className="flex flex-col gap-6 mt-4">
            {product.short_description && (
              <div className="text-lg font-medium text-swapp-azul-petroleo dark:text-swapp-tiza-verdoso/90 leading-relaxed border-l-4 border-swapp-verde-pastel pl-4">
                {product.short_description}
              </div>
            )}
            
            {product.description && (
              <div className="prose prose-sm dark:prose-invert max-w-none text-swapp-azul-petroleo/80 dark:text-swapp-tiza-verdoso/70">
                <h3 className="text-lg font-bold text-swapp-azul-oscuro dark:text-swapp-blanco mb-2">Acerca de este producto</h3>
                <p className="leading-relaxed whitespace-pre-wrap">{product.description}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}