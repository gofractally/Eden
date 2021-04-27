import React from "react";

export enum DataTypeEnum {
    Action = "action",
}

export type Header = {
    key: string;
    label: string;
    type?: DataTypeEnum;
};

export type Row = {
    key: string;
    [key: string]: string | JSX.Element;
};

interface InductionTableProps {
    headers: Header[];
    data: Row[];
    className?: string;
    headerClassName?: string;
    rowClassName?: string;
}

export const Table = ({
    headers,
    data,
    className = "",
    headerClassName = "",
    rowClassName = "",
}: InductionTableProps) => {
    const tableClass = `md:border md:shadow-sm border-gray-200 rounded text-gray-700 ${className}`;
    return (
        <div className={tableClass} role="table" aria-label="Invitations">
            <IndTableHeader headers={headers} className={headerClassName} />
            <IndTableRows
                headers={headers}
                data={data}
                className={rowClassName}
            />
        </div>
    );
};

interface IndTableRowsProps {
    headers: Header[];
    data: Row[];
    className?: string;
}

const IndTableRows = ({ headers, data, className = "" }: IndTableRowsProps) => {
    const tableRowsClass = `space-y-5 md:space-y-0 md:divide-y md:divide-gray-200 ${className}`;
    const tableRowClass =
        "md:flex items-center border border-gray-200 shadow-sm md:shadow-none md:border-0 space-y-1 md:space-y-0 rounded md:rounded-none md:h-16 hover:bg-gray-50";
    return (
        <div className={tableRowsClass}>
            {data.map((row, i) => {
                return (
                    <div
                        key={`${row.key}-row`}
                        className={`${tableRowClass} px-4 py-3`}
                        role="rowgroup"
                    >
                        {headers.map((h) => {
                            if (h.type === DataTypeEnum.Action) {
                                return (
                                    <div
                                        key={`invitation-row-${row.key}-col-${h.key}`}
                                        className="md:text-center w-64 pt-4 pb-2 md:py-0"
                                        role="cell"
                                    >
                                        {row[h.key]}
                                    </div>
                                );
                            }
                            return (
                                <div
                                    key={`invitation-row-${row.key}-col-${h.key}`}
                                    className="md:flex-1 font-light"
                                    role="cell"
                                >
                                    <span className="md:hidden font-semibold">
                                        {h.label}:
                                    </span>
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

const IndTableHeader = ({ headers, className = "" }: IndTableHeaderProps) => {
    const tableHeaderClass = `hidden md:flex items-center px-4 py-3 title-font font-medium text-gray-900 text-sm bg-gray-200 ${className}`;

    return (
        <div className={tableHeaderClass} role="rowgroup">
            {headers.map((h) => {
                const headerClass =
                    h.type === DataTypeEnum.Action
                        ? "md:text-center w-64"
                        : "md:flex-1";
                return (
                    <div
                        key={h.key}
                        className={headerClass}
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
    headers: Header[];
    className?: string;
}
