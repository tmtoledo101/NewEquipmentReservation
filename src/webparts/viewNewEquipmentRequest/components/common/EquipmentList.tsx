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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ margin: 0 }}>Equipment List</h3>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={onAdd}
        >
          Add Equipment
        </Button>
      </div>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Equipment</TableCell>
              <TableCell>Quantity</TableCell>
              <TableCell>Asset Number</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {equipmentData.map((row, index) => (
              <TableRow key={index}>
                <TableCell>{row.equipment}</TableCell>
                <TableCell>{row.quantity}</TableCell>
                <TableCell>
                  {row.assetNumber.map((asset, i) => (
                    <div key={i}>{asset}</div>
                  ))}
                </TableCell>
                <TableCell>
                  <IconButton
                    color="primary"
                    onClick={() => onView(index)}
                    size="small"
                  >
                    <VisibilityIcon />
                  </IconButton>
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
