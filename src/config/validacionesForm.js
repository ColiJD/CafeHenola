// Capitaliza la primera letra de cada palabra
export function capitalizarNombre(text) {
  if (!text) return "";
  return text
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

// Valida Cédula con formato 0703-2001-00798
export function validarCedula(value) {
  const regex = /^\d{4}-\d{4}-\d{5}$/;
  return regex.test(value);
}

// Valida RTN con formato 0703-2001-0079812 (2 números extra)
export function validarRTN(value) {
  const regex = /^\d{4}-\d{4}-\d{7}$/;
  return regex.test(value);
}
// Valida Teléfono (solo números)
export function validarTelefono(value) {
  const regex = /^\d+$/;
  return regex.test(value);
}

// 🔹 Función utilitaria para formatear números
export const formatNumber = (value) => {
  const num = parseFloat(value);
  return isNaN(num) ? "0" : num.toString();
};
