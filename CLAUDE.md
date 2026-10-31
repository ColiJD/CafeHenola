# Instrucciones para Claude

## Bases de datos: prohibido modificarlas

- NO elimines ninguna base de datos (`DROP DATABASE`, `DROP SCHEMA`, borrar archivos de BD, ni comandos equivalentes de Prisma como `migrate reset`).
- NO modifiques datos ni registros de ninguna base de datos. Esto incluye `INSERT`, `UPDATE`, `DELETE`, `TRUNCATE`, `upsert`, `updateMany`, `deleteMany` y cualquier script que escriba o borre filas.
- NO apliques cambios de esquema (`prisma migrate deploy`, `prisma db push`, `DROP TABLE`, `ALTER TABLE`) sin confirmación explícita del usuario.
- Las consultas de solo lectura (`SELECT`, `findMany`, `findUnique`, `count`) sí están permitidas.

Si una tarea requiere cualquiera de las acciones prohibidas, detente, explica qué cambio se haría y pide confirmación antes de ejecutar nada.

Aplica a cualquier base de datos del proyecto, incluida la que apunta `DATABASE_URL` en `.env`, y también a bases remotas o de producción.
