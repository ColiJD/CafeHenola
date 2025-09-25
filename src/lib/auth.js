import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const user = await prisma.users.findUnique({
          where: { userEmail: credentials.email },
          include: { roles: true },
        });

        // Mensaje genérico de error
        const errorMsg = "Usuario o contraseña incorrecta";

        if (!user) throw new Error(errorMsg);

        const isValid = await bcrypt.compare(
          credentials.password,
          user.userPassword
        );

        if (!isValid) throw new Error(errorMsg);

        return {
          id: user.userId,
          email: user.userEmail,
          name: user.userName,
          role: user.roles.roleName,
        };
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 60 * 20,
  },
  jwt: {
    maxAge: 60 * 20,
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
  },
};
