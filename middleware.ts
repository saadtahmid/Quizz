import NextAuth from 'next-auth'
import { authConfig } from '@/lib/auth.config'

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isOnAuthPage = req.nextUrl.pathname.startsWith('/auth')
  const isInstructorRoute = req.nextUrl.pathname.startsWith('/instructor')
  const isStudentRoute = req.nextUrl.pathname.startsWith('/student')
  const isAdminRoute = req.nextUrl.pathname.startsWith('/admin')
  const isHome = req.nextUrl.pathname === '/'
  
  if (isOnAuthPage) {
    if (isLoggedIn) {
      const role = req.auth?.user?.role;
      if (role === 'ADMIN') return Response.redirect(new URL('/admin', req.nextUrl));
      return Response.redirect(new URL(role === 'INSTRUCTOR' ? '/instructor' : '/student', req.nextUrl));
    }
    return; // Allow access to auth pages
  }

  if (!isLoggedIn) {
    // Protect both instructor and student routes
    if (isInstructorRoute || isStudentRoute || isAdminRoute) {
      return Response.redirect(new URL('/auth/signin', req.nextUrl))
    }
  } else {
    // Redirect based on role
    const role = req.auth?.user?.role;
    
    if (isHome) {
      if (role === 'ADMIN') return Response.redirect(new URL('/admin', req.nextUrl));
      return Response.redirect(new URL(role === 'INSTRUCTOR' ? '/instructor' : '/student', req.nextUrl))
    }

    if (isAdminRoute && role !== 'ADMIN') {
      return Response.redirect(new URL(role === 'INSTRUCTOR' ? '/instructor' : '/student', req.nextUrl))
    }

    if (isInstructorRoute && role !== 'INSTRUCTOR' && role !== 'ADMIN') {
      return Response.redirect(new URL(role === 'ADMIN' ? '/admin' : '/student', req.nextUrl))
    }
    
    if (isStudentRoute && role !== 'STUDENT' && role !== 'ADMIN') {
      return Response.redirect(new URL(role === 'ADMIN' ? '/admin' : '/instructor', req.nextUrl))
    }
  }

  return;
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
