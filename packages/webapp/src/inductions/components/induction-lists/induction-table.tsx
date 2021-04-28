import React from "react";
import { Heading } from "_app";

export enum DataTypeEnum {
    Action = "action",
}

export type Column = {
    key: string;
    label: string;
    className?: string;
    type?: DataTypeEnum;
};

export type Row = {
    key: string;
    [key: string]: string | JSX.Element;
};

interface InductionTableProps {
    columns: Column[];
    data: Row[];
    className?: string;
    headerClassName?: string;
    rowClassName?: string;
    tableHeader?: string;
}

export const Table = ({
    columns,
    data,
    className = "",
    headerClassName = "",
    rowClassName = "",
    tableHeader,
}: InductionTableProps) => {
    const tableClass = `xs:m-0 sm:-mx-4 md:m-0 bg-white border-t border-b md:border border-gray-200 md:rounded md:shadow-sm text-gray-700 ${className}`;
    return (
        <>
            {tableHeader && (
                <Heading size={3} className="mb-2 md:mb-3 px-4 sm:p-0">
                    {tableHeader}
                </Heading>
            )}
            <div className={tableClass} role="table" aria-label="Invitations">
                <IndTableHeader columns={columns} className={headerClassName} />
                <IndTableRows
                    columns={columns}
                    data={data}
                    className={rowClassName}
                />
            </div>
        </>
    );
};

interface IndTableRowsProps {
    columns: Column[];
    data: Row[];
    className?: string;
}

const IndTableRows = ({ columns, data, className = "" }: IndTableRowsProps) => {
    const tableRowsClass = `divide-y divide-gray-200 ${className}`;
    const tableRowClass =
        "flex items-center pr-2 pl-4 sm:px-4 py-3 space-y-1 md:space-y-0 md:h-16 hover:bg-gray-50";
    return (
        <div className={tableRowsClass}>
            {data.map((row, i) => {
                return (
                    <div
                        key={`${row.key}-row`}
                        className={tableRowClass}
                        role="rowgroup"
                    >
                        {columns.map((h) => {
                            if (h.type === DataTypeEnum.Action) {
                                return (
                                    <div
                                        key={`invitation-row-${row.key}-col-${h.key}`}
                                        className={`flex md:flex-grow-0 w-44 md:w-56 ${
                                            h.className || ""
                                        }`}
                                        role="cell"
                                    >
                                        {row[h.key]}
                                    </div>
                                );
                            }
                            return (
                                <div
                                    key={`invitation-row-${row.key}-col-${h.key}`}
                                    className={`flex-1 font-light ${
                                        h.className || ""
                                    }`}
                                    role="cell"
                                >
                                    {row[h.key]}
                                </div>
                            );
                        })}
                    </div>
                );
            })}
        </div>
    );
};

const IndTableHeader = ({ columns, className = "" }: IndTableHeaderProps) => {
    const tableHeaderClass = `hidden md:flex items-center px-4 py-3 title-font font-medium text-gray-900 text-sm bg-gray-200 ${className}`;

    return (
        <div className={tableHeaderClass} role="rowgroup">
            {columns.map((h) => {
                const headerClass =
                    h.type === DataTypeEnum.Action
                        ? "md:text-center md:w-56"
                        : "md:flex-1";
                return (
                    <div
                        key={h.key}
                        className={`${headerClass} ${h.className || ""}`}
                        role="columnheader"
                    >
                        {h.label}
                    </div>
                );
            })}
        </div>
    );
};

interface IndTableHeaderProps {
    columns: Column[];
    className?: string;
}
