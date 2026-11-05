-- Paso 4: liquidar un depósito como compra NO saca el café del almacén.
-- El código ya no descuenta inventario ni crea "Salida" al liquidar un depósito;
-- este script corrige los datos históricos. Aplicar primero SOLO en DesarrolloCafeHenola2026.
-- Idempotente: tras correrlo no quedan movimientos "Salida" de liquidación de depósito.

-- 1) Devolver al inventario lo que esas liquidaciones restaron
UPDATE inventariocliente ic
JOIN (
  SELECT inventarioClienteID, SUM(cantidadQQ) AS qq
  FROM movimientoinventario
  WHERE tipoMovimiento = 'Salida' AND referenciaTipo LIKE 'Liquidación Depósito #%'
  GROUP BY inventarioClienteID
) x ON x.inventarioClienteID = ic.inventarioClienteID
SET ic.cantidadQQ = ic.cantidadQQ + x.qq;

-- 2) Pasar esos movimientos a un tipo neutro (se conserva el historial; las sumas lo ignoran)
UPDATE movimientoinventario
SET tipoMovimiento = 'Liquidación Depósito'
WHERE tipoMovimiento = 'Salida' AND referenciaTipo LIKE 'Liquidación Depósito #%';

-- Verificación: guardado y calculado deben coincidir; total esperado 301.51
SELECT ic.productoID, ic.cantidadQQ AS guardado,
       SUM(CASE WHEN mi.tipoMovimiento IN ('Entrada','Entrada por Transferencia','Ajuste') THEN mi.cantidadQQ
                WHEN mi.tipoMovimiento IN ('Salida','Transferencia') THEN -mi.cantidadQQ ELSE 0 END) AS calculado
FROM inventariocliente ic
LEFT JOIN movimientoinventario mi ON mi.inventarioClienteID = ic.inventarioClienteID
GROUP BY ic.productoID, ic.cantidadQQ;
