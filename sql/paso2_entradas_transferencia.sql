-- Paso 2: crea la "Entrada por Transferencia" que falta en el producto destino
-- de cada transferencia antigua (el código viejo solo guardaba la salida del origen).
--
-- NO cambia inventariocliente (el saldo guardado ya es correcto); solo agrega historial.
-- Es idempotente: no duplica una entrada si ya existe (misma fecha, destino y origen).
-- Ejecutar primero SOLO en DesarrolloCafeHenola2026.

-- 1) Vista previa (solo lectura): filas que se insertarían
SELECT m.movimientoID AS transferenciaID, dest.inventarioClienteID AS invDestino,
       m.fecha, m.cantidadQQ
FROM movimientoinventario m
JOIN inventariocliente orig ON orig.inventarioClienteID = m.inventarioClienteID
JOIN inventariocliente dest ON dest.productoID = m.referenciaID
WHERE m.tipoMovimiento = 'Transferencia'
  AND NOT EXISTS (
    SELECT 1 FROM movimientoinventario e
    WHERE e.tipoMovimiento = 'Entrada por Transferencia'
      AND e.inventarioClienteID = dest.inventarioClienteID
      AND e.referenciaID = orig.productoID
      AND e.fecha = m.fecha
  );

-- 2) Inserción
INSERT INTO movimientoinventario
  (inventarioClienteID, fecha, tipoMovimiento, referenciaTipo, referenciaID, cantidadQQ, cantidadSacos, nota)
SELECT dest.inventarioClienteID, m.fecha, 'Entrada por Transferencia',
       CONCAT('Transferencia desde producto ', orig.productoID),
       orig.productoID, m.cantidadQQ, 0,
       CONCAT('Entrada por transferencia desde producto #', orig.productoID)
FROM movimientoinventario m
JOIN inventariocliente orig ON orig.inventarioClienteID = m.inventarioClienteID
JOIN inventariocliente dest ON dest.productoID = m.referenciaID
WHERE m.tipoMovimiento = 'Transferencia'
  AND NOT EXISTS (
    SELECT 1 FROM movimientoinventario e
    WHERE e.tipoMovimiento = 'Entrada por Transferencia'
      AND e.inventarioClienteID = dest.inventarioClienteID
      AND e.referenciaID = orig.productoID
      AND e.fecha = m.fecha
  );

-- 3) Verificación: para cada producto, "calculado" debe ser igual a "guardado"
--    (Entradas + Entrada por Transferencia + Ajuste - Salidas - Transferencias; Anulado no cuenta)
SELECT ic.productoID, ic.cantidadQQ AS guardado,
       SUM(CASE WHEN mi.tipoMovimiento IN ('Entrada','Entrada por Transferencia','Ajuste') THEN mi.cantidadQQ
                WHEN mi.tipoMovimiento IN ('Salida','Transferencia') THEN -mi.cantidadQQ
                ELSE 0 END) AS calculado
FROM inventariocliente ic
LEFT JOIN movimientoinventario mi ON mi.inventarioClienteID = ic.inventarioClienteID
GROUP BY ic.productoID, ic.cantidadQQ;
