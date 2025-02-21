import * as React from "react";
import { Grid, Button } from "@material-ui/core";
import { FormikProps, Formik } from "formik";
import { ModalPopup } from "./ModalPopup";
import { Dropdown } from "./FormComponents";
import { IFormValues } from "../interfaces/IFormValues";
import styles from "../ViewNewEquipmentRequest.module.scss";

interface IEquipmentDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (formik: FormikProps<IFormValues>) => void;
  onDelete: (formik: FormikProps<IFormValues>) => void;
  formik: FormikProps<IFormValues>;
  equipmentList: Array<{ id: string | number; value: string }>;
  quantityList: Array<{ id: string | number; value: string }>;
  assetList: string[];
  handleEquipment: (e: any) => void;
  handleQuantity: (e: any) => void;
  equipmentError: string;
}

export const EquipmentDialog: React.FC<IEquipmentDialogProps> = ({
  open,
  onClose,
  onSave,
  onDelete,
  formik,
  equipmentList,
  quantityList,
  assetList,
  handleEquipment,
  handleQuantity,
  equipmentError,
}) => {
  const assetItems = React.useMemo(() => 
    assetList.map((item, index) => ({
      id: index,
      value: item,
    })), [assetList]
  );

  return (
    <ModalPopup
      title="Add Equipment"
      hideCloseIcon={false}
      open={open}
      onClose={onClose}
    >
      <Formik
        initialValues={formik.values}
        onSubmit={() => {}}
        enableReinitialize
        innerRef={(instance) => {
          if (instance) {
            Object.assign(instance, formik);
          }
        }}
      >
        <form>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <div className={styles.width}>
                <div className={styles.label}>Equipment</div>
                <div className={styles.data}>
                  <Dropdown
                    items={equipmentList}
                    name="equipment"
                    handleChange={handleEquipment}
                    multiple={false}
                  />
                </div>
              </div>
            </Grid>
            <Grid item xs={6}>
              <div className={styles.width}>
                <div className={styles.label}>Quantity</div>
                <div className={styles.data}>
                  <Dropdown
                    items={quantityList}
                    name="quantity"
                    handleChange={handleQuantity}
                    multiple={false}
                  />
                </div>
              </div>
            </Grid>
            <Grid item xs={6}>
              <div className={styles.width}>
                <div className={styles.label}>Asset Number</div>
                <div className={styles.data}>
                  <Dropdown
                    items={assetItems}
                    name="assetNumber"
                    disabled
                    multiple={true}
                  />
                </div>
              </div>
            </Grid>
            {equipmentError && (
              <Grid item xs={12}>
                <span className={styles.error}>{equipmentError}</span>
              </Grid>
            )}
            <Grid item xs={12}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "end",
                  alignItems: "center",
                }}
              >
                <Button
                  color="secondary"
                  variant="contained"
                  onClick={onClose}
                >
                  Cancel
                </Button>
                {formik.values.currentRecord >= 0 && (
                  <Button
                    color="secondary"
                    variant="contained"
                    style={{
                      marginLeft: "20px",
                    }}
                    onClick={() => onDelete(formik)}
                  >
                    Delete
                  </Button>
                )}
                <Button
                  color="primary"
                  variant="contained"
                  style={{
                    marginLeft: "20px",
                  }}
                  disabled={!formik.values.equipment || !formik.values.quantity}
                  onClick={() => onSave(formik)}
                >
                  Save
                </Button>
              </div>
            </Grid>
          </Grid>
        </form>
      </Formik>
    </ModalPopup>
  );
};
