import * as React from 'react';
import MaterialTable from "material-table";
import VisibilityIcon from "@material-ui/icons/Visibility";
import { formatDate, formatEquipmentData } from '../utils/helpers';
import { IEquipmentRequest } from '../interfaces/IEquipmentRequest';

interface IEquipmentTableProps {
  title: string;
  data: IEquipmentRequest[];
  tabValue: number;
  onViewClick: (event: any, rowData: any) => void;
}

export const EquipmentTable: React.FC<IEquipmentTableProps> = ({ 
  title, 
  data, 
  tabValue, 
  onViewClick 
}) => {
  const getColumns = () => {
    const baseColumns = [
      {
        title: "Date of use - From",
        field: "fromDate",
        cellStyle: {
          minWidth: 150,
        },
        render: (rowData) => formatDate(rowData.fromDate),
      },
      {
        title: "Date of use - To",
        field: "toDate",
        cellStyle: {
          minWidth: 150,
        },
        render: (rowData) => formatDate(rowData.toDate),
      },
      {
        title: "Time",
        field: "time",
      },
      {
        title: "Reference No.",
        field: "referenceNumber",
      },
      {
        title: "Requested By",
        field: "requestedBy",
      },
      {
        title: "Department",
        field: "department",
      },
      {
        title: "Building",
        field: "building",
      },
      {
        title: "Contact No.",
        field: "contactNumber",
      },
      {
        title: "Status",
        field: "status",
      },
      {
        title: "Equipment",
        field: "equipment",
        render: (rowData) => formatEquipmentData(rowData.equipment),
      },
    ];

    if (tabValue === 2) {
      return [
        ...baseColumns,
        {
          title: "Borrowed From",
          field: "borrowedFrom"
        },
        {
          title: "Released To",
          field: "releasedTo",
        },
        {
          title: "Released By",
          field: "releasedBy",
        },
        {
          title: "Released Date",
          field: "releasedDate",
        },
      ];
    }

    if (tabValue === 3) {
      return [
        ...baseColumns,
        {
          title: "Borrowed From",
          field: "borrowedFrom"
        },
        {
          title: "Returned By",
          field: "returnedBy",
        },
        {
          title: "Returned To",
          field: "returnedTo",
        },
        {
          title: "Returned Remarks",
          field: "returnedDate",
        },
      ];
    }

    return baseColumns;
  };

  return (
    <MaterialTable
      title={title}
      columns={getColumns()}
      data={data}
      options={{
        filtering: true,
        pageSize: 5,
        pageSizeOptions: [5, 10, data.length],
        search: false,
        grouping: true,
        selection: false,
        columnsButton: false,
        exportButton: true,
      }}
      actions={[
        {
          icon: () => <VisibilityIcon />,
          tooltip: "View Record",
          onClick: onViewClick,
        },
      ]}
    />
  );
};
