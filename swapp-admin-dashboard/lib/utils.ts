export const formatCurrency = (value: number) => {
  // Al usar style: "currency", ya te incluye el signo $ automáticamente
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};