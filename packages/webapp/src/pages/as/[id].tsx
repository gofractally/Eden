import { useRouter } from "next/router";
import { useContext } from "react";
import { GetServerSideProps } from "next";
import { UALContext } from "ual-reactjs-renderer";
import { SideNavLayout, LoadingContainer } from "_app";
import { ROUTES } from "_app/routes";
import {
    SignTransactionConfig,
    SignTransactionResponse,
    User,
} from "universal-authenticator-library";
import { chainConfig } from "config";

class UnloggedinUser extends User {
    constructor(private accountName: string) {
        super();
    }

    public async signTransaction(
        transaction: any,
        config?: SignTransactionConfig
    ): Promise<SignTransactionResponse> {
        throw new Error(
            "UnloggedinUser does not currently support signTransaction"
        );
    }

    public async signArbitrary(
        _: string,
        data: string,
        helpText: string
    ): Promise<string> {
        throw new Error(
            "UnloggedinUser does not currently support signArbitrary"
        );
    }

    public async verifyKeyOwnership(_: string): Promise<boolean> {
        throw new Error(
            "UnloggedinUser does not currently support verifyKeyOwnership"
        );
    }

    public async getAccountName(): Promise<string> {
        return this.accountName;
    }

    public async getChainId(): Promise<string> {
        return chainConfig.chainId;
    }

    public async getKeys(): Promise<string[]> {
        throw new Error("UnloggedinUser does not currently support getKeys");
    }
} // UnloggedinUser

interface Props {
    account: string;
}

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
    const account = params!.id as string;
    return { props: { account } };
};

export const AsForwardPage = ({ account }: Props) => {
    const ualContext = useContext<any>(UALContext);
    if (ualContext) {
        ualContext.activeUser = new UnloggedinUser(account);
        useRouter().push(ROUTES.ELECTION.href);
    }

    return (
        <SideNavLayout title="Loading...">
            <LoadingContainer />
        </SideNavLayout>
    );
};

export default AsForwardPage;
