
import type { NextAuthConfig } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { z } from "zod"
import { SignJWT } from "jose"
import { getBaseUrl } from "@/lib/env";

// Helper to mint a token for the Express Request
// this minting happens on Next.js server side.
interface User {
    id?: string;
    _id?: string;
    email?: string | null;
    role?: string;
    name?: string | null;
}

// Helper to mint a token for the Express Request
// this minting happens on Next.js server side.
async function mintBackendToken(user: User) {
    const secret = new TextEncoder().encode(process.env.AUTH_SECRET)
    const alg = 'HS256'

    const jwt = await new SignJWT({
        userId: user._id || user.id,
        role: user.role,
        email: user.email
    })
        .setProtectedHeader({ alg })
        .setIssuedAt()
        .setExpirationTime('2d')
        .sign(secret)

    return jwt
}

export const authConfig = {
    secret: process.env.AUTH_SECRET,
    logger: {
        error(error: any) {
            if (error?.name === 'CredentialsSignin') return;
            console.error(error);
        }
    },
    pages: {
        signIn: '/auth/login',
    },
    callbacks: {
        authorized({ auth, request }: { auth: any; request: any }) {
            const nextUrl = request?.nextUrl;
            if (!nextUrl) return true;

            const isLoggedIn = !!auth?.user
            const userRole = (auth?.user as any)?.role;

            const isAdminPage = nextUrl.pathname.startsWith('/admin');
            const isUserPage = ['/attempt', '/join', '/test'].some(path => nextUrl.pathname.startsWith(path));

            if (isAdminPage) {
                if (isLoggedIn && userRole === 'admin') return true;
                return false; // Redirect to login
            }

            if (isUserPage) {
                if (isLoggedIn) return true;
                return false; // Redirect to login
            }

            return true;
        },
        async jwt({ token, user }: { token: any; user?: any }) {
            if (user) {
                const u = user as User;
                token.role = u.role
                token.id = u.id || u._id

                // Mint a fresh backend token
                const backendToken = await mintBackendToken(u);
                token.backendToken = backendToken;
            }
            return token
        },
        async session({ session, token }: { session: any; token: any }) {
            if (token && session.user) {
                session.user.role = token.role as string
                session.user.id = token.id as string
                session.backendToken = token.backendToken as string
            }
            return session
        },
    },
    providers: [
        Credentials({
            async authorize(credentials) {
                const parsedCredentials = z
                    .object({ email: z.string().email(), password: z.string().min(6) })
                    .safeParse(credentials);

                if (parsedCredentials.success) {
                    const { email, password } = parsedCredentials.data;

                    try {
                        const res = await fetch(`${getBaseUrl()}/api/auth/login`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ email, password })
                        });

                        const data = await res.json();

                        if (res.ok && data.success && data.user) {
                            return data.user;
                        }


                        return null;
                    } catch (error) {
                        console.error('Auth API error:', error);
                        return null;
                    }
                }


                return null;
            },
        }),
    ],
} satisfies NextAuthConfig
