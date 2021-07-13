import React from "react";
import { GetServerSideProps } from "next";
import { QueryClient } from "react-query";
import { dehydrate } from "react-query/hydration";

import { RawLayout } from "_app";

export const getServerSideProps: GetServerSideProps = async ({ query }) => {
    const queryClient = new QueryClient();

    return {
        props: {
            dehydratedState: dehydrate(queryClient),
        },
    };
};

interface Props {
    delegatesPage: number;
}

export const DelegatesPage = (props: Props) => {
    return <RawLayout title="Election">Election stuff</RawLayout>;
};

export default DelegatesPage;
