(globalThis.TURBOPACK = globalThis.TURBOPACK || []).push(["chunks/[root-of-the-server]__de110ef0._.js", {

"[externals]/node:buffer [external] (node:buffer, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("node:buffer", () => require("node:buffer"));

module.exports = mod;
}}),
"[externals]/node:async_hooks [external] (node:async_hooks, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("node:async_hooks", () => require("node:async_hooks"));

module.exports = mod;
}}),
"[project]/middleware.ts [middleware-edge] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "config": (()=>config),
    "middleware": (()=>middleware)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$api$2f$server$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/node_modules/next/dist/esm/api/server.js [middleware-edge] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$spec$2d$extension$2f$response$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/esm/server/web/spec-extension/response.js [middleware-edge] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$jwt$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next-auth/jwt/index.js [middleware-edge] (ecmascript)");
;
;
// Maximum inactivity time (in seconds) - 1 hour
const MAX_INACTIVITY_TIME = 60 * 60;
// Protected routes
const protectedRoutes = [
    '/dashboard',
    '/quiz',
    '/class',
    '/admin'
];
const roleSelectPath = '/auth/select-role';
const authRoutes = [
    '/auth/signin',
    '/auth/signup',
    '/auth/error',
    roleSelectPath
];
// Session related API endpoints
const SESSION_API_ENDPOINTS = [
    '/api/auth/session',
    '/api/auth/signin',
    '/api/auth/signout',
    '/api/auth/callback',
    '/api/auth/csrf'
];
// Prevent infinite redirects with a request counter
const MAX_REDIRECTS = 2;
// Cache check results to avoid repeated checks
const cacheMap = new Map();
async function middleware(req) {
    const { pathname } = req.nextUrl;
    // PREVENT LOOPS - Immediately check protection cookies
    // NextRequest.cookies is a synchronous API, different from next/headers cookies()
    const redirectProtection = req.cookies.get('redirect-protection')?.value;
    const roleSelected = req.cookies.get('role-selected')?.value;
    // Allow access to all API endpoints with minimal middleware processing
    if (pathname.startsWith('/api/')) {
        // Specific handling for auth API endpoints
        if (SESSION_API_ENDPOINTS.some((endpoint)=>pathname.startsWith(endpoint))) {
            // Skip all checks for auth endpoints
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$spec$2d$extension$2f$response$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].next();
        }
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$spec$2d$extension$2f$response$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].next();
    }
    // Skip middleware for static files and images
    if (pathname.startsWith('/_next/') || pathname.includes('.')) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$spec$2d$extension$2f$response$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].next();
    }
    // SPECIAL RULE: If role-selected cookie exists, allow dashboard access even without a role
    if (roleSelected && pathname.startsWith('/dashboard')) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$spec$2d$extension$2f$response$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].next();
    }
    // SPECIAL RULE: Allow access to select-role, no token check needed
    if (pathname === roleSelectPath) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$spec$2d$extension$2f$response$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].next();
    }
    // Check protection cookie - if it exists, temporarily let the request through
    if (redirectProtection && pathname !== '/api/auth/session') {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$spec$2d$extension$2f$response$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].next();
    }
    try {
        // Get token from NextAuth
        const token = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$jwt$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["getToken"])({
            req,
            secret: process.env.NEXTAUTH_SECRET
        });
        // If not logged in and accessing protected route: redirect to login
        if (!token && protectedRoutes.some((route)=>pathname.startsWith(route))) {
            const url = new URL('/auth/signin', req.url);
            url.searchParams.set('callbackUrl', pathname);
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$spec$2d$extension$2f$response$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].redirect(url);
        }
        // If logged in without role, redirect to select-role
        // But only when there's no protection cookie
        if (token && token.role === null && !roleSelected) {
            // Only redirect if not already on the select-role page
            if (pathname !== roleSelectPath) {
                // Create protection token to prevent loops
                const response = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$spec$2d$extension$2f$response$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].redirect(new URL(roleSelectPath, req.url));
                // NextResponse.cookies.set is a synchronous API
                response.cookies.set('redirect-protection', 'true', {
                    httpOnly: true,
                    maxAge: 10,
                    path: '/'
                });
                return response;
            }
        }
        // If logged in with role, redirect away from auth pages
        if (token && token.role && authRoutes.includes(pathname)) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$spec$2d$extension$2f$response$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].redirect(new URL('/dashboard', req.url));
        }
    } catch (error) {
        console.error("[Middleware Error]", error);
        // Fail open - allow request to continue even if session check fails
        // This prevents site from being unusable if session API has issues
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$spec$2d$extension$2f$response$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].next();
    }
    // Nếu là API route liên quan đến quizzes, thêm log
    if (pathname.startsWith('/api/users/me/quizzes')) {
        console.log(`[API Request] ${req.method} ${pathname}${req.nextUrl.search}`);
    }
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$spec$2d$extension$2f$response$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].next();
}
const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'
    ]
};
}}),
}]);

//# sourceMappingURL=%5Broot-of-the-server%5D__de110ef0._.js.map