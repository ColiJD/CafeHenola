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
          include: { role: true }, // Traer el rol
        });

        if (!user) return null;

        const isValid = await bcrypt.compare(
          credentials.password,
          user.userPassword
        );
        if (!isValid) return null;

        return {
          id: user.userId,
          email: user.userEmail,
          name: user.userName,
          role: user.role.roleName,
        };
      },
    }),
  ],
  callbacks: {
    async session({ session, token, user }) {
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
  session: { strategy: "jwt" },
};
