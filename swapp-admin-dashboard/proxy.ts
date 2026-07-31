import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
    const url = request.nextUrl;
    const path = url.pathname;

    if (path.startsWith('/_next') || path.startsWith('/favicon.ico')) {
        return NextResponse.next();
    }

    const basicAuth = request.headers.get('authorization');
    if (!basicAuth) {
        return new NextResponse('Acceso Restringido', {
            status: 401,
            headers: { 'WWW-Authenticate': 'Basic realm="Panel Privado Swapp"' }
        });
    }

    const authValue = basicAuth.split(' ')[1];
    const [user, pwd] = atob(authValue).split(':');
    
    const validUser = process.env.BASIC_AUTH_USER || 'equipo';
    const validPass = process.env.BASIC_AUTH_PASSWORD || 'secreto_swapp';

    if (user !== validUser || pwd !== validPass) {
        return new NextResponse('Credenciales inválidas', {
            status: 401,
            headers: { 'WWW-Authenticate': 'Basic realm="Panel Privado Swapp"' }
        });
    }

    const isLoginPage = path === '/login';
    const token = request.cookies.get('admin_token')?.value;
    let isValidToken = false;

    if (token) {
        try {
            const payloadBase64 = token.split('.')[1];
            const decodedJson = atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'));
            const decoded = JSON.parse(decodedJson);

            if (decoded.user_type === "staff") {
                isValidToken = true;
            }
        } catch (error) {
            isValidToken = false;
        }
    }

    if (!isValidToken) {
        if (!isLoginPage) {
            const response = NextResponse.redirect(new URL('/login', request.url));
            if (token) response.cookies.delete('admin_token');
            return response;
        }
    } else {
        if (isLoginPage) {
            return NextResponse.redirect(new URL('/dashboard', request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/:path*'],
};