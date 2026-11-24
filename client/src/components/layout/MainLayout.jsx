import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

import Navbar from "./Navbar";
import LoginModal from "../auth/LoginModal";
import RegisterModal from "../auth/RegisterModal";

const MainLayout = () => {
    const [authMode, setAuthMode] = useState(null);

    const location = useLocation();
    const navigate = useNavigate();

    // Open login popup when a protected page redirects here
    useEffect(() => {
        if (location.state?.from) {
            setAuthMode("login");
            navigate(location.pathname, { replace: true, state: null });
        }
    }, [location, navigate]);

    return (
        <>
            <Navbar onAuthClick={setAuthMode} />

            <Outlet context={{ onAuthClick: setAuthMode }} />

            {authMode === "login" && (
                <LoginModal
                    onClose={() => setAuthMode(null)}
                    onSwitch={setAuthMode}
                />
            )}

            {authMode === "register" && (
                <RegisterModal
                    onClose={() => setAuthMode(null)}
                    onSwitch={setAuthMode}
                />
            )}
        </>
    );
};

export default MainLayout;