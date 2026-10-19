'use client'

import { useEffect } from "react"
import {signIn } from 'next-auth/react';

export default function SignInPage() {
    useEffect(() => {
        signIn('keycloak', {
            callbackUrl: '/',
            redirect: true
        });
    },[]);

return (
    <div className="d-flex justify-content-center align-items-center" style={{minHeight: '50vh'}}>
        <div className="text-center">
        <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading.....</span>
        </div>
        <p className="mt-3">Redirecting to authentication...</p>
        </div>
    </div>
);
}