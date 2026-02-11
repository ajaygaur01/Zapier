// Backend API – set NEXT_PUBLIC_BACKEND_URL in .env.local if your backend is on another port (e.g. 3001)
export const BACKEND_URL =
  typeof process.env.NEXT_PUBLIC_BACKEND_URL === "string" && process.env.NEXT_PUBLIC_BACKEND_URL.trim()
    ? process.env.NEXT_PUBLIC_BACKEND_URL.replace(/\/$/, "")
    : "http://localhost:3001";

export const HOOKS_URL =
  typeof process.env.NEXT_PUBLIC_HOOKS_URL === "string" && process.env.NEXT_PUBLIC_HOOKS_URL.trim()
    ? process.env.NEXT_PUBLIC_HOOKS_URL.replace(/\/$/, "")
    : "http://localhost:3002";