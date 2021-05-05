import { UALProvider } from "ual-reactjs-renderer";

import { appName, chainConfig } from "config";
import { anchor, scatter, ledger } from "./config";

export const EdenUALProvider: React.FC = ({ children }) => {
    return (
        <UALProvider
            chains={[chainConfig]}
            authenticators={[anchor, scatter, ledger]}
            appName={appName}
        >
            {children}
        </UALProvider>
    );
};

export default EdenUALProvider;
