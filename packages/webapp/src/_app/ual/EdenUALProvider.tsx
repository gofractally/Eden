import { UALProvider } from "ual-reactjs-renderer";

import { appName, chainConfig } from "config";
import { anchor } from "nfts";

export const EdenUALProvider: React.FC = ({ children }) => {
    return (
        <UALProvider
            chains={[chainConfig]}
            authenticators={[anchor]}
            appName={appName}
        >
            {children}
        </UALProvider>
    );
};

export default EdenUALProvider;
