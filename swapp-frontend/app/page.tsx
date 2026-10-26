"use client";

import React, { useEffect, useState } from "react";
import { CatalogService } from "@/services/product.service";
import { PublicProduct } from "@/types/product";
import { Loader2 } from "lucide-react";
import ProductCard from "@/components/catalog/ProductCard";

export default function Home() {
  const [products, setProducts] = useState<PublicProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCatalog = async () => {
      try {
        const data = await CatalogService.getProducts();
        setProducts(data);
      } catch (error) {
        console.error("Error cargando el catálogo público:", error);
      } finally {
        setLoading(false);
      }
    };
    loadCatalog();
  }, []);

  return (
    <div className="container mx-auto px-4 py-16 max-w-6xl flex flex-col gap-20">
      {/* Sección Hero */}
      <section className="text-center max-w-3xl mx-auto flex flex-col gap-6">
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-swapp-azul-oscuro dark:text-swapp-tiza-verdoso">
          Economía circular en{" "}
          <span className="text-swapp-verde-pastel dark:text-swapp-verde-menta">
            cada burbuja.
          </span>
        </h1>
        <p className="text-lg md:text-xl opacity-80 leading-relaxed">
          Somos tu plataforma de logística inversa. Ofrecemos máquinas
          gasificadoras, cilindros de CO2 nuevos y un sistema de recambio a
          domicilio simple y sustentable. Entregá tu envase vacío, recibí uno
          lleno y cuidemos juntos el planeta.
        </p>
      </section>

      {/* Catálogo */}
      <section className="flex flex-col gap-8">
        <div className="flex items-center justify-between border-b border-swapp-tiza-verdoso/20 pb-4">
          <h2 className="text-2xl font-bold text-swapp-azul-oscuro dark:text-swapp-blanco">
            Nuestro Catálogo
          </h2>
          <span className="text-sm opacity-60">
            {products.length} {products.length === 1 ? "producto disponible" : "productos disponibles"}
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 gap-3 text-swapp-azul-petroleo dark:text-swapp-verde-menta">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="text-sm font-medium">Cargando catálogo...</span>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16 rounded-2xl border border-swapp-azul-petroleo/10 bg-swapp-tiza-verdoso/20 dark:bg-swapp-azul-oscuro/20">
            <p className="opacity-70">No hay productos publicados en este momento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((p) => (
              <ProductCard key={p.product_uuid} product={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}