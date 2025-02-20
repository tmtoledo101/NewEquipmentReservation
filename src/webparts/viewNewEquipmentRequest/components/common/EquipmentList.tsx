import * as React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  IconButton,
} from '@material-ui/core';
import AddIcon from '@material-ui/icons/Add';
import VisibilityIcon from '@material-ui/icons/Visibility';
import { Fab } from "@material-ui/core";

interface IEquipmentData {
  equipment: string;
  quantity: string;
  assetNumber: string[];
}

interface IEquipmentListProps {
  equipmentData: IEquipmentData[];
  onAdd: () => void;
  onView: (index: number) => void;
}

export const EquipmentList: React.FC<IEquipmentListProps> = ({
  equipmentData,
  onAdd,
  onView,
}) => {
  return (
    <div>
        <h3 style={{ margin: 0 }}>Equipment List</h3>
        <div>
        <Fab
          color="primary"
          aria-label="add"
          size="small"
          onClick={onAdd}
        >
          <AddIcon />
        </Fab>
        </div>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Action</TableCell>
              <TableCell>Equipment</TableCell>
              <TableCell>Quantity</TableCell>
              <TableCell>Asset Number</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {equipmentData.map((row, index) => (
              <TableRow key={index}>
                <TableCell>
                  <IconButton
                    color="primary"
                    onClick={() => {
                      if (equipmentData && equipmentData.length > 0 && index >= 0 && index < equipmentData.length) {
                        onView(index);
                      }
                    }}
                    size="small"
                  >
                    <VisibilityIcon />
                  </IconButton>
                </TableCell>
                <TableCell>{row.equipment}</TableCell>
                <TableCell>{row.quantity}</TableCell>
                <TableCell>
                  {row.assetNumber.map((asset, i) => (
                    <div key={i}>{asset}</div>
                  ))}
                </TableCell>
              </TableRow>
            ))}
            {equipmentData.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  No equipment added
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
};
