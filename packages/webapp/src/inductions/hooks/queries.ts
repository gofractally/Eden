import { useQuery } from "react-query";
import { getInductionWithEndorsements } from "inductions/api";

export const useGetInductionWithEndorsements = (inductionId: string) =>
    useQuery(["induction", inductionId], getInductionWithEndorsements, {
        // gets rid of bugs cause by refetching right after anchor/scatter signing
        refetchOnWindowFocus: false,
    });
