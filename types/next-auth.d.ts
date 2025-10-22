import { DefaultSession, DefaultUser } from "next-auth";
import { JWT, DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "MANAGER_TRAFFIC" | "MANAGER_OPERATIONAL" | "PETUGAS_LAPANGAN";
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    role: "MANAGER_TRAFFIC" | "MANAGER_OPERATIONAL" | "PETUGAS_LAPANGAN";
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    role: "MANAGER_TRAFFIC" | "MANAGER_OPERATIONAL" | "PETUGAS_LAPANGAN";
    id: string;
  }
}
