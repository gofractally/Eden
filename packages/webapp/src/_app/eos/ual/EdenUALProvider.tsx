import { useEffect, useState } from "react";

import { appName, chainConfig } from "config";
import { anchor, scatter, ledger } from "./config";

export const EdenUALProvider: React.FC = ({ children }) => {
    const [hasMounted, setHasMounted] = useState(false);

    useEffect(() => {
        setHasMounted(true);
    }, []);

    if (!hasMounted) {
        return <>{children}</>;
    } else {
        const UALProvider = require("ual-reactjs-renderer").UALProvider;
        return (
            <UALProvider
                chains={[chainConfig]}
                authenticators={[anchor, scatter, ledger]}
                appName={appName}
            >
                {children}
            </UALProvider>
        );
    }
};

export default EdenUALProvider;
