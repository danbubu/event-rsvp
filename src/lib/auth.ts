/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { NextRequest } from "next/server"
import { executeQuery } from "./database"

function getJwtSecret(): string {
  const fromEnv = process.env.JWT_SECRET
  if (fromEnv && fromEnv.length > 0) {
    return fromEnv
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "JWT_SECRET is not set. Add it in Vercel (or your host) environment variables before using auth.",
    )
  }
  return "dev-only-jwt-secret-not-for-production"
}

export interface User {
  id: number
  name: string
  email: string
  role: "user" | "admin"
  avatar_url?: string
  created_at: string
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export function generateToken(user: User): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    getJwtSecret(),
    { expiresIn: "7d" },
  )
}

export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, getJwtSecret())
  } catch (error) {
    return null
  }
}

export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const results = (await executeQuery(
      "SELECT id, name, email, role, avatar_url, created_at FROM users WHERE email = ?",
      [email],
    )) as any[]

    return results.length > 0 ? results[0] : null
  } catch (error) {
    console.error("Error fetching user:", error)
    return null
  }
}

export async function getUserById(id: number): Promise<User | null> {
  try {
    const results = (await executeQuery(
      "SELECT id, name, email, role, avatar_url, created_at FROM users WHERE id = ?",
      [id],
    )) as any[]

    return results.length > 0 ? results[0] : null
  } catch (error) {
    console.error("Error fetching user:", error)
    return null
  }
}

export async function createUser(name: string, email: string, password: string): Promise<User | null> {
  try {
    const hashedPassword = await hashPassword(password)
    const result = (await executeQuery("INSERT INTO users (name, email, password) VALUES (?, ?, ?)", [
      name,
      email,
      hashedPassword,
    ])) as any

    if (result.insertId) {
      return getUserById(result.insertId)
    }
    return null
  } catch (error) {
    console.error("Error creating user:", error)
    return null
  }
}

export async function verifyAuth(request: NextRequest): Promise<User | null> {
  try {
    const token =
      request.headers.get("authorization")?.replace("Bearer ", "") ||
      request.cookies.get("auth-token")?.value

    if (!token) {
      return null
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return null
    }

    const user = await getUserById(decoded.id)
    return user
  } catch (error) {
    console.error("Error verifying auth:", error)
    return null
  }
}
