import { useEffect } from "react";

export function useEscapeKey(onClose: () => void, isOpen: boolean) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    // Función de limpieza para no dejar "basura" en la memoria
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);
}