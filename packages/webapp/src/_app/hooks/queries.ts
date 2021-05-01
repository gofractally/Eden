import { useQuery } from "react-query";
import { useUALAccount } from "../eos";
import { getEdenMember } from "members";

export const useMemberByAccountName = (accountName: string) =>
    useQuery(
        ["member", accountName],
        async () => await getEdenMember(accountName),
        {
            staleTime: Infinity,
            enabled: !!accountName,
        }
    );

export const useCurrentMember = () => {
    const [ualAccount] = useUALAccount();
    return useMemberByAccountName(ualAccount?.accountName);
};
