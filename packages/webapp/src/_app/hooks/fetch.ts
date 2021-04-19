import { useEffect, useState } from "react";

export const useFetchedData = <T>(
    fetchFn: any,
    ...params: any
): [T | undefined, boolean, any] => {
    const [data, setData] = useState<T | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<any>(undefined);

    useEffect(() => {
        const fetchData = async () => {
            if (params.length === 1 && params[0] === undefined) {
                return;
            }

            setError(undefined);
            setIsLoading(true);

            try {
                console.info("fetching params", params);
                const result = await fetchFn(...params);
                setData(result);
            } catch (error) {
                setError(error);
            }

            setIsLoading(false);
        };

        fetchData();
    }, params);

    return [data, isLoading, error];
};
