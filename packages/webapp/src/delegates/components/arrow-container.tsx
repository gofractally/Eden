import React from "react";
import { CgArrowDown } from "react-icons/cg";

import { Container } from "_app";

export const MyDelegationArrow = () => (
    <Container className="py-1.5 bg-gray-100">
        <CgArrowDown size={28} className="ml-3.5 text-gray-400" />
    </Container>
);
