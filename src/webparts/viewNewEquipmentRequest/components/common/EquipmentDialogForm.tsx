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
    console.log("EquipmentDialogForm - handleEquipmentChange called");
    console.log("Event value:", e.target.value);
    
    if (!formik || !formik.setFieldValue) {
      console.log("Formik or setFieldValue is undefined");
      return;
    }

    const value = e.target.value;
    console.log("Current formik values:", formik.values);
    console.log("Current equipmentData:", equipmentData);
    
    const currentSelectedEquipments = equipmentData.map(item => item.equipment);
    console.log("Current selected equipments:", currentSelectedEquipments);
    
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
    
    console.log("handleEquipmentSelection result:", result);

    if (!result.isValid) {
      console.log("Equipment selection is not valid:", result.message);
      setNotification({
        show: true,
        message: result.message || "An error occurred",
        severity: "error"
      });
      return;
    }

    console.log("Setting equipment value:", value);
    formik.setFieldValue("equipment", value);
    formik.setFieldValue("quantity", "");
    formik.setFieldValue("assetNumber", []);

    if (result.quantities) {
      console.log("Setting quantity list:", result.quantities);
      setQuantityList(result.quantities);
    }
    if (result.assetNumbers) {
      console.log("Setting asset numbers:", result.assetNumbers);
      setAssetList(result.assetNumbers);
      formik.setFieldValue("assetNumber", result.assetNumbers);
    }
    
    // Force update to ensure UI reflects the changes
    setTimeout(() => {
      console.log("After timeout - formik values:", formik.values);
    }, 0);
  };

  const handleQuantityChange = (e: any) => {
    console.log("EquipmentDialogForm - handleQuantityChange called");
    console.log("Event value:", e.target.value);
    
    const value = e.target.value;
    if (formik && formik.setFieldValue) {
      console.log("Setting quantity value:", value);
      formik.setFieldValue("quantity", value);
      
      const currentAssetNumbers = formik.values.assetNumber || [];
      console.log("Current asset numbers:", currentAssetNumbers);
      
      const updatedAssetNumbers = currentAssetNumbers.slice(0, parseInt(value));
      console.log("Updated asset numbers:", updatedAssetNumbers);
      
      setAssetList(updatedAssetNumbers);
      formik.setFieldValue("assetNumber", updatedAssetNumbers);
      
      // Force update to ensure UI reflects the changes
      setTimeout(() => {
        console.log("After timeout - formik values:", formik.values);
      }, 0);
    } else {
      console.log("Formik or setFieldValue is undefined");
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
