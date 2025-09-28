import prisma from "../src/lib/prisma"
import bcrypt from "bcryptjs"

async function main() {
  // Crear roles si no existen
  const adminRole = await prisma.role.upsert({
    where: { roleName: "ADMIN" },
    update: {},
    create: { roleName: "ADMIN" },
  })

  const userRole = await prisma.role.upsert({
    where: { roleName: "USER" },
    update: {},
    create: { roleName: "USER" },
  })

  // Crear usuario ADMIN
  const hashedPassword = await bcrypt.hash("Admin123", 10)

  const adminUser = await prisma.user.upsert({
    where: { userEmail: "colindresj9gmail.com.com" },
    update: {},
    create: {
      userEmail: "colindresj9@gmail.com.com",
      userPassword: hashedPassword,
      userName: "Administrador",
      roleId: adminRole.roleId
    }
  })

  console.log("Usuario ADMIN creado:", adminUser.userEmail)
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect()
  })
