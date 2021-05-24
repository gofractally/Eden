import { useEffect, useState } from "react";

import { appName, availableWallets, chainConfig } from "config";
import { anchor, scatter, ledger } from "./config";

const authenticators: any[] = [];
if (availableWallets.indexOf("ANCHOR") >= 0) {
    authenticators.push(anchor);
}
if (availableWallets.indexOf("SCATTER") >= 0) {
    authenticators.push(scatter);
}
if (availableWallets.indexOf("LEDGER") >= 0) {
    authenticators.push(ledger);
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
