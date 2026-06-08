import React from 'react'
import { useEffect } from 'react';
function OAuthSuccess() {

    useEffect(() => {

        const params =
            new URLSearchParams(window.location.search);

        const token =
            params.get("token");

        if (token) {

            localStorage.setItem(
                "token",
                token
            );

            
        }

    }, []);
    window.location.href = "http://localhost:5173/Profile";
    return <h1>Logging in...</h1>;
}

export default OAuthSuccess