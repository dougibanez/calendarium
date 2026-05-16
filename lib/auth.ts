import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "./prisma"

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      name: "Demo",
      credentials: {
        name: { label: "Tu nombre", type: "text" },
      },
      async authorize(credentials) {
        const name = credentials?.name?.trim()
        if (!name || name.length < 2) return null

        const slug = name.toLowerCase().replace(/[^a-z0-9]/g, "")
        const email = `${slug}@demo.calendarium.local`

        const user = await prisma.user.upsert({
          where: { email },
          update: {},
          create: { name, email },
        })

        return { id: user.id, name: user.name, email: user.email }
      },
    }),
  ],
  callbacks: {
    session: ({ session, token }) => ({
      ...session,
      user: {
        ...session.user,
        id: token.sub!,
      },
    }),
  },
  pages: { signIn: "/" },
}
