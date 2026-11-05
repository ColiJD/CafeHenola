-- Paso 3: vw_inventario_actual debe contar transferencias y ajustes.
-- Mismas columnas que la vista anterior (no rompe consumidores).
--   totalEntradasQQ = Entrada + Entrada por Transferencia
--   totalSalidasQQ  = Salida + Transferencia (salida del producto origen)
--   saldoQQ         = entradas - salidas + Ajuste (el ajuste ya viene con signo; Anulado no cuenta)
-- Aplicar primero SOLO en DesarrolloCafeHenola2026. Requiere antes el paso 2 (entradas del destino).

CREATE OR REPLACE
  ALGORITHM = UNDEFINED
  SQL SECURITY DEFINER
VIEW vw_inventario_actual AS
SELECT
  ic.productoID AS productoID,
  p.productName AS tipoCafe,
  SUM(CASE WHEN mi.tipoMovimiento IN ('Entrada','Entrada por Transferencia') THEN mi.cantidadQQ ELSE 0 END) AS totalEntradasQQ,
  SUM(CASE WHEN mi.tipoMovimiento IN ('Salida','Transferencia') THEN mi.cantidadQQ ELSE 0 END) AS totalSalidasQQ,
  SUM(CASE WHEN mi.tipoMovimiento IN ('Entrada','Entrada por Transferencia','Ajuste') THEN mi.cantidadQQ
           WHEN mi.tipoMovimiento IN ('Salida','Transferencia') THEN -mi.cantidadQQ
           ELSE 0 END) AS saldoQQ
FROM movimientoinventario mi
JOIN inventariocliente ic ON mi.inventarioClienteID = ic.inventarioClienteID
JOIN producto p ON ic.productoID = p.productID
GROUP BY ic.productoID, p.productName;

-- Para volver atrás (definición original):
-- CREATE OR REPLACE VIEW vw_inventario_actual AS
-- SELECT ic.productoID, p.productName AS tipoCafe,
--   SUM(CASE WHEN mi.tipoMovimiento='Entrada' THEN mi.cantidadQQ ELSE 0 END) AS totalEntradasQQ,
--   SUM(CASE WHEN mi.tipoMovimiento='Salida' THEN mi.cantidadQQ ELSE 0 END) AS totalSalidasQQ,
--   SUM(CASE WHEN mi.tipoMovimiento='Entrada' THEN mi.cantidadQQ WHEN mi.tipoMovimiento='Salida' THEN -mi.cantidadQQ ELSE 0 END) AS saldoQQ
-- FROM movimientoinventario mi
-- JOIN inventariocliente ic ON mi.inventarioClienteID = ic.inventarioClienteID
-- JOIN producto p ON ic.productoID = p.productID
-- GROUP BY ic.productoID, p.productName;
