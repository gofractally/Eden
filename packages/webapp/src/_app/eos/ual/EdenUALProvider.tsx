import { useEffect, useState } from "react";

import { appName, availableWallets, chainConfig } from "config";
import { anchor, scatter, ledger, wombat } from "./config";

const authenticators: any[] = [];
if (availableWallets.includes("ANCHOR")) {
    authenticators.push(anchor);
}
if (availableWallets.includes("SCATTER")) {
    authenticators.push(scatter);
}
if (availableWallets.includes("LEDGER")) {
    authenticators.push(ledger);
}
if (availableWallets.includes("WOMBAT")) {
    authenticators.push(wombat);
}

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
                authenticators={authenticators}
                appName={appName}
            >
                {children}
            </UALProvider>
        );
    }
};

export default EdenUALProvider;
