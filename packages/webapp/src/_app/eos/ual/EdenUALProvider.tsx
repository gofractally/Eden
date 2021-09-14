import { useEffect, useState } from "react";

import { appName, availableWallets, chainConfig } from "config";
import { anchor, scatter, ledger } from "./config";
import { useUALSoftkeyLogin } from "_app/hooks/softkey-ual";
import { SoftkeyAuthenticator } from "_app/utils/softkey-ual-authenticator";

export const EdenUALProvider: React.FC = ({ children }) => {
    const [hasMounted, setHasMounted] = useState(false);
    const [authenticators, setAuthenticators] = useState<any[]>([]);
    const ualSoftKey = useUALSoftkeyLogin();

    useEffect(() => {
        const newAuthenticators = [];
        if (availableWallets.includes("ANCHOR")) {
            newAuthenticators.push(anchor);
        }
        if (availableWallets.includes("SCATTER")) {
            newAuthenticators.push(scatter);
        }
        if (availableWallets.includes("LEDGER")) {
            newAuthenticators.push(ledger);
        }
        if (availableWallets.includes("SOFTKEY")) {
            const softkey = new SoftkeyAuthenticator([chainConfig], ualSoftKey);
            newAuthenticators.push(softkey);
        }
        setAuthenticators(newAuthenticators);
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
