import{ withAuth } from 'next-auth/middleware'; 

export default withAuth({
    pages: {
        signIn: '/api/auth/signin'
    },
});

/* export default withAuth({
    callbacks: {
        authorized: ({token}) => !!token
    },
}); */

export const config = { 
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'], 
  //matcher: ['/((?!api|_next/static|_next/image|favicon.ico|auth/signin).*)'], 
}; 
 