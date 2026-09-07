import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

// ═══════════════════════════════════════════════════════════════
// NEXT AUTH ROUTE HANDLER
// ═══════════════════════════════════════════════════════════════
// Handles all NextAuth.js authentication flows:
//   - GET  /api/auth/session    → current session
//   - POST /api/auth/signin     → credentials / OAuth sign-in
//   - POST /api/auth/signout    → sign out
//   - GET  /api/auth/csrf       → CSRF token
//   - GET  /api/auth/providers  → configured providers
//   - GET  /api/auth/callback/* → OAuth callbacks
// ═══════════════════════════════════════════════════════════════

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
