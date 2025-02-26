import * as React from 'react';
import { EquipmentDialog } from './EquipmentDialog';
import { IDropdownItem, IEquipmentData, handleEquipmentSelection } from '../utils/helpers';

interface IEquipmentDialogFormProps {
  open: boolean;
  onClose: () => void;
  formik: any;
  equipmentList: IDropdownItem[];
  quantityList: IDropdownItem[];
  assetList: string[];
  equipmentData: IEquipmentData[];
  buildEquipmentMap: any;
  setEquipmentData: (data: IEquipmentData[]) => void;
  setQuantityList: (list: IDropdownItem[]) => void;
  setAssetList: (list: string[]) => void;
  setNotification: (notification: { show: boolean; message: string; severity: "success" | "error" }) => void;
}

export const EquipmentDialogForm: React.FC<IEquipmentDialogFormProps> = ({
  open,
  onClose,
  formik,
  equipmentList,
  quantityList,
  assetList,
  equipmentData,
  buildEquipmentMap,
  setEquipmentData,
  setQuantityList,
  setAssetList,
  setNotification
}) => {
  const handleSave = (formikInstance: any) => {
    if (!formikInstance) return;
    
    const newData = {
      equipment: formikInstance.values.equipment,
      quantity: formikInstance.values.quantity,
      assetNumber: formikInstance.values.assetNumber,
    };

    const updatedEquipmentData = [...equipmentData];
    if (formikInstance.values.currentRecord > -1) {
      updatedEquipmentData[formikInstance.values.currentRecord] = newData;
    } else {
      updatedEquipmentData.push(newData);
    }

    setEquipmentData(updatedEquipmentData);
    onClose();
    
    if (formikInstance.setFieldValue) {
      formikInstance.setFieldValue("equipment", "");
      formikInstance.setFieldValue("quantity", "");
      formikInstance.setFieldValue("assetNumber", []);
      formikInstance.setFieldValue("currentRecord", -1);
    }
  };

  const handleDelete = (formikInstance: any) => {
    if (!formikInstance) return;
    
    const updatedEquipmentData = equipmentData.filter(
      (_, index) => index !== formikInstance.values.currentRecord
    );
    setEquipmentData(updatedEquipmentData);
    onClose();
    
    if (formikInstance.setFieldValue) {
      formikInstance.setFieldValue("equipment", "");
      formikInstance.setFieldValue("quantity", "");
      formikInstance.setFieldValue("assetNumber", []);
      formikInstance.setFieldValue("currentRecord", -1);
    }
  };

  const handleEquipmentChange = (e: any) => {
    if (!formik || !formik.setFieldValue) return;

    const value = e.target.value;
    const currentSelectedEquipments = equipmentData.map(item => item.equipment);
    const result = handleEquipmentSelection(
      value,
      currentSelectedEquipments,
      formik.values.fromDate,
      formik.values.toDate,
      formik.values.time,
      formik.values.building,
      formik.values.borrowedFrom,
      buildEquipmentMap
    );

    if (!result.isValid) {
      setNotification({
        show: true,
        message: result.message || "An error occurred",
        severity: "error"
      });
      return;
    }

    formik.setFieldValue("equipment", value);
    formik.setFieldValue("quantity", "");
    formik.setFieldValue("assetNumber", []);

    if (result.quantities) {
      setQuantityList(result.quantities);
    }
    if (result.assetNumbers) {
      setAssetList(result.assetNumbers);
      formik.setFieldValue("assetNumber", result.assetNumbers);
    }
  };

  const handleQuantityChange = (e: any) => {
    const value = e.target.value;
    if (formik && formik.setFieldValue) {
      formik.setFieldValue("quantity", value);
      const currentAssetNumbers = formik.values.assetNumber || [];
      const updatedAssetNumbers = currentAssetNumbers.slice(0, parseInt(value));
      setAssetList(updatedAssetNumbers);
      formik.setFieldValue("assetNumber", updatedAssetNumbers);
    }
  };

  return (
    <EquipmentDialog
      open={open}
      onClose={onClose}
      onSave={handleSave}
      onDelete={handleDelete}
      formik={formik}
      equipmentList={equipmentList}
      quantityList={quantityList}
      assetList={assetList}
      equipmentError=""
      handleEquipment={handleEquipmentChange}
      handleQuantity={handleQuantityChange}
    />
  );
};
