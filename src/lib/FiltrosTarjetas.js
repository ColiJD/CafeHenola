// utils/filtrarDepositos.js
import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

/**
 * Filtra los depósitos según nombre, tipo de café y rango de fechas
 * @param {Array} data - Array de datos originales
 * @param {string} nombreFiltro - Filtrar por nombre de cliente
 * @param {string} tipoCafeFiltro - Filtrar por tipo de café
 * @param {Array} rangoFecha - Array [fechaInicio, fechaFin] de dayjs
 * @returns {Array} - Datos filtrados
 */
export function FiltrosTarjetas(data, nombreFiltro, tipoCafeFiltro, rangoFecha) {
  let filtrados = [...data];

  // Filtro por nombre
  if (nombreFiltro) {
    filtrados = filtrados.filter((item) =>
      item.clienteNombre.toLowerCase().includes(nombreFiltro.toLowerCase())
    );
  }

  // Filtro por tipo de café
  if (tipoCafeFiltro) {
    filtrados = filtrados.filter((item) => item.tipoCafeNombre === tipoCafeFiltro);
  }

  // Filtro por rango de fechas
  if (
    rangoFecha &&
    Array.isArray(rangoFecha) &&
    rangoFecha.length === 2 &&
    rangoFecha[0] &&
    rangoFecha[1]
  ) {
    filtrados = filtrados
      .map((item) => {
        const detallesFiltrados = item.detalles.filter((d) => {
          const fechaDep = dayjs(d.depositoFecha);
          if (!fechaDep.isValid()) return false;
          return (
            fechaDep.isSameOrAfter(rangoFecha[0], "day") &&
            fechaDep.isSameOrBefore(rangoFecha[1], "day")
          );
        });
        return { ...item, detalles: detallesFiltrados };
      })
      .filter((item) => item.detalles.length > 0);
  }

  return filtrados;
}
