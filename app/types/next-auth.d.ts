/* eslint-disable @typescript-eslint/no-unused-vars */
import NextAuth from "next-auth"
import { JWT } from "next-auth/jwt"
/* eslint-enable @typescript-eslint/no-unused-vars */

declare module "next-auth" {
  interface User {
    role?: string
    id: string
    email: string
    name: string
  }

  interface Session {
    user: User & {
      role?: string
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string
  }
}