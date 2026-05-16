const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const DEFAULT_PRODUCTO_ID = 16; // Café Seco
const roundToTwo = (num) => Math.round((num + Number.EPSILON) * 100) / 100;

async function runMasterMigration() {
  console.log("🚀 INICIANDO MIGRACIÓN MAESTRA Y RECALCULACIÓN...");

  try {
    // === PASO 1: CONSOLIDACIÓN DE INVENTARIO (GLOBAL) ===
    console.log("\n📦 [1/4] Consolidando Inventario Global...");
    await prisma.$transaction(
      async (tx) => {
        const inventarios = await tx.inventariocliente.findMany();
        const agrupados = {};

        for (const inv of inventarios) {
          if (!agrupados[inv.productoID]) {
            agrupados[inv.productoID] = {
              principalID: inv.inventarioClienteID,
              totalQQ: 0,
              totalSacos: 0,
              otrosIDs: [],
            };
          } else {
            agrupados[inv.productoID].otrosIDs.push(inv.inventarioClienteID);
          }
          agrupados[inv.productoID].totalQQ += Number(inv.cantidadQQ || 0);
          agrupados[inv.productoID].totalSacos += Number(
            inv.cantidadSacos || 0,
          );
        }

        for (const productoID in agrupados) {
          const data = agrupados[productoID];

          // Actualizar el registro principal
          await tx.inventariocliente.update({
            where: { inventarioClienteID: data.principalID },
            data: {
              cantidadQQ: roundToTwo(data.totalQQ),
              cantidadSacos: roundToTwo(data.totalSacos),
            },
          });

          // Reasignar movimientos y eliminar duplicados
          if (data.otrosIDs.length > 0) {
            await tx.movimientoinventario.updateMany({
              where: { inventarioClienteID: { in: data.otrosIDs } },
              data: { inventarioClienteID: data.principalID },
            });

            await tx.inventariocliente.deleteMany({
              where: { inventarioClienteID: { in: data.otrosIDs } },
            });
            console.log(
              `   - Producto ${productoID}: Consolidadas ${data.otrosIDs.length + 1} filas.`,
            );
          }
        }
      },
      { timeout: 60000 },
    );

    // === PASO 2: PREPARAR TABLAS DE SALIDAS (PRODUCTO ID) ===
    console.log("\n📄 [2/4] Preparando Tablas de Salidas y Liquidaciones...");
    try {
      // Intentar añadir la columna productoID si no existe (SQL crudo para evitar fallos de Prisma)
      await prisma.$executeRawUnsafe(`
        ALTER TABLE salida 
        ADD COLUMN IF NOT EXISTS productoID INT NOT NULL DEFAULT ${DEFAULT_PRODUCTO_ID};
      `);
      await prisma.$executeRawUnsafe(`
        ALTER TABLE liqsalida 
        ADD COLUMN IF NOT EXISTS productoID INT DEFAULT ${DEFAULT_PRODUCTO_ID};
      `);

      // Asegurarse de que todos los nulos tengan el valor por defecto
      await prisma.$executeRawUnsafe(
        `UPDATE salida SET productoID = ${DEFAULT_PRODUCTO_ID} WHERE productoID IS NULL OR productoID = 0;`,
      );
      await prisma.$executeRawUnsafe(
        `UPDATE liqsalida SET productoID = ${DEFAULT_PRODUCTO_ID} WHERE productoID IS NULL OR productoID = 0;`,
      );

      console.log("   - Columnas productoID preparadas y datos actualizados.");
    } catch (e) {
      console.log(
        "   - Nota: Las columnas podrían ya existir o el motor SQL no soporta IF NOT EXISTS. Continuando...",
      );
    }

    // === PASO 3: RECALCULAR ESTADOS DE PRÉSTAMOS ===
    console.log("\n💰 [3/4] Recalculando Estados de Préstamos...");
    const prestamos = await prisma.prestamos.findMany({
      where: { estado: { notIn: ["ANULADO", "ABSORBIDO"] } },
      include: { movimientos_prestamo: true },
    });

    for (const p of prestamos) {
      const initialMonto = Number(p.monto || 0);
      const charges = p.movimientos_prestamo
        .filter((m) =>
          ["Int-Cargo", "CARGO_INTERES"].includes(m.tipo_movimiento),
        )
        .reduce((sum, m) => sum + Number(m.monto || 0), 0);
      const payments = p.movimientos_prestamo
        .filter((m) =>
          ["ABONO", "PAGO_INTERES", "ABONO_INTERES"].includes(
            m.tipo_movimiento,
          ),
        )
        .reduce((sum, m) => sum + Number(m.monto || 0), 0);

      const balance = roundToTwo(initialMonto + charges - payments);
      const newStatus = balance <= 0 ? "COMPLETADO" : "ACTIVO";

      if (p.estado !== newStatus) {
        await prisma.prestamos.update({
          where: { prestamoId: p.prestamoId },
          data: { estado: newStatus },
        });
        console.log(
          `   - Préstamo ${p.prestamoId}: ${p.estado} -> ${newStatus}`,
        );
      }
    }

    // === PASO 4: RECALCULAR ESTADOS DE ANTICIPOS ===
    console.log("\n💸 [4/4] Recalculando Estados de Anticipos...");
    const anticipos = await prisma.anticipo.findMany({
      where: { estado: { not: "ANULADO" } },
      include: { movimientos_anticipos: true },
    });

    for (const a of anticipos) {
      const initialMonto = Number(a.monto || 0);
      const charges = a.movimientos_anticipos
        .filter((m) => ["CARGO_ANTICIPO"].includes(m.tipo_movimiento))
        .reduce((sum, m) => sum + Number(m.monto || 0), 0);
      const payments = a.movimientos_anticipos
        .filter((m) =>
          ["ABONO_ANTICIPO", "INTERES_ANTICIPO"].includes(m.tipo_movimiento),
        )
        .reduce((sum, m) => sum + Number(m.monto || 0), 0);

      const balance = roundToTwo(initialMonto + charges - payments);
      const newStatus = balance <= 0 ? "COMPLETADO" : "ACTIVO";

      if (a.estado !== newStatus) {
        await prisma.anticipo.update({
          where: { anticipoId: a.anticipoId },
          data: { estado: newStatus },
        });
        console.log(
          `   - Anticipo ${a.anticipoId}: ${a.estado} -> ${newStatus}`,
        );
      }
    }

    console.log("\n✅ MIGRACIÓN MAESTRA COMPLETADA CON ÉXITO.");
  } catch (error) {
    console.error("\n❌ ERROR CRÍTICO EN LA MIGRACIÓN:", error);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

runMasterMigration();
