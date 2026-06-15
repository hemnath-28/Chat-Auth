import React, { useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from './User';

function OAuthSuccess() {
    const navigate = useNavigate();
    const { restoreSession } = useContext(UserContext);

    useEffect(() => {
        const params =
            new URLSearchParams(window.location.search);

        const token =
            params.get("token");

        const handleOAuth = () => {
            if (token) {
                localStorage.setItem(
                    "token",
                    token
                );
                window.location.href = "/Profile";
            }
            else {
                navigate("/", { replace: true });
            }
        };

        handleOAuth();

    }, [navigate]);

    return <h1>Logging in...</h1>;
}

export default OAuthSuccess
