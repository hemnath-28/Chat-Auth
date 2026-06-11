import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
function OAuthSuccess() {
    const navigate = useNavigate();

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
            navigate("/Profile", { replace: true });
        }
        else {
            navigate("/", { replace: true });
        }

    }, [navigate]);

    return <h1>Logging in...</h1>;
}

export default OAuthSuccess
