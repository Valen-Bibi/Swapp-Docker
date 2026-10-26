import "./globals.css";
import { CartProvider } from "@/contexts/CartContext";
import CartDrawer from "@/components/cart/CartDrawer";
import Navbar from "@/components/layout/Navbar";
import { Toaster } from "sonner";

export const metadata = {
  title: "Swapp | Economía Circular en cada burbuja",
  description: "Logística inversa y recambio de cilindros CO2 en Pilar, Buenos Aires.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="antialiased flex flex-col min-h-screen" suppressHydrationWarning>
        <CartProvider>
          <Toaster position="top-center" richColors />
          <Navbar />
          <main className="flex-grow">{children}</main>
          <CartDrawer />
        </CartProvider>

        <footer className="border-t border-swapp-tiza-verdoso/20 py-8 mt-16 text-center">
          <p className="text-sm opacity-60">
            © {new Date().getFullYear()} Swapp. Economía circular en Pilar, Buenos Aires.
          </p>
        </footer>
      </body>
    </html>
  );
}