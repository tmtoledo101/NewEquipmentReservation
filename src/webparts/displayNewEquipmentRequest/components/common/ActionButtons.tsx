import * as React from "react";
import { Button, Fab, Tooltip } from "@material-ui/core";
import { FormikProps } from "formik";
import EditIcon from "@material-ui/icons/Edit";
import SaveIcon from "@material-ui/icons/Save";
import CloseIcon from "@material-ui/icons/Close";
import { IFormValues } from "../interfaces/IFormValues";
import { RETURN, RELEASE } from "../utils/helpers";
import styles from "../DisplayNewEquipmentRequest.module.scss";

interface IActionButtonsProps {
  formik: FormikProps<IFormValues>;
  requestStatus: string;
  currentUser: string;
  equipmentOwner: string[];
  requestor: string;
  isEdit: boolean;
  saveStart: boolean;
  onEdit: () => void;
  onClose: () => void;
  setNewStatus: (status: string) => void;
}

export const ActionButtons: React.FC<IActionButtonsProps> = ({
  formik,
  requestStatus,
  currentUser,
  equipmentOwner,
  requestor,
  isEdit,
  saveStart,
  onEdit,
  onClose,
  setNewStatus,
}) => {
  return (
    <div className={styles.formHandle}>
      {!isEdit && requestStatus === RELEASE && equipmentOwner.length > 0 && equipmentOwner.indexOf(currentUser) > -1 && (
        <Tooltip title="Edit">
          <Fab
            id="editFab"
            size="medium"
            color="primary"
            onClick={onEdit}
          >
            <EditIcon />
          </Fab>
        </Tooltip>
      )}

      {requestStatus === RELEASE &&
        equipmentOwner.length > 0 &&
        equipmentOwner.indexOf(currentUser) > -1 &&
        isEdit && (
          <Button
            type="submit"
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={saveStart}
            color="primary"
            onClick={() => setNewStatus(RETURN)}
          >
            Release
          </Button>
        )}

      {requestStatus === RETURN &&
        equipmentOwner.length > 0 &&
        equipmentOwner.indexOf(currentUser) > -1 &&
        isEdit && (
          <Button
            type="submit"
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={saveStart}
            color="primary"
            onClick={() => setNewStatus("Completed")}
          >
            Return
          </Button>
        )}

      {(currentUser === requestor || equipmentOwner.indexOf(currentUser) > -1) &&
        requestStatus === RELEASE && (
          <Button
            type="submit"
            variant="contained"
            startIcon={<CloseIcon />}
            style={{
              color: "lightgrey",
              background: "grey",
            }}
            disabled={saveStart}
            onClick={() => setNewStatus("Cancelled")}
          >
            Cancel
          </Button>
        )}

      <Button
        type="button"
        variant="outlined"
        style={{
          color: "black",
        }}
        onClick={onClose}
      >
        Close
      </Button>
    </div>
  );
};
