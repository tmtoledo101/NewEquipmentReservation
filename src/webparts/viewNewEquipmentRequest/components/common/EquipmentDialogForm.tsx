import * as React from 'react';
import { EquipmentDialog } from './EquipmentDialog';
import { IDropdownItem, IEquipmentData, IEquipmentItem, handleEquipmentSelection, getAvailableEquipment } from '../utils/helpers';

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
    
    console.log("[SAVE] Received formik instance:", formikInstance.values);
    
    // Get the values directly from the formik instance
    const equipment = formikInstance.values.equipment;
    const quantity = formikInstance.values.quantity;
    const assetNumber = formikInstance.values.assetNumber;
    
    console.log("[SAVE] Extracted values:", { equipment, quantity, assetNumber });
    
    // If no equipment or quantity is selected, show an error
    if (!equipment || !quantity) {
      console.log("[SAVE] Missing equipment or quantity");
      setNotification({
        show: true,
        message: "Please select equipment and quantity",
        severity: "error"
      });
      return;
    }
    
    // Create new data object
    const newData = {
      equipment,
      quantity,
      assetNumber,
    };
    
    console.log("[SAVE] New data:", newData);

    // Update equipment data
    const updatedEquipmentData = [...equipmentData];
    if (formikInstance.values.currentRecord > -1) {
      updatedEquipmentData[formikInstance.values.currentRecord] = newData;
    } else {
      updatedEquipmentData.push(newData);
    }

    console.log("[SAVE] Updated equipment data:", updatedEquipmentData);
    setEquipmentData(updatedEquipmentData);
    onClose();
    
    // Reset formik values
    if (formik && formik.setFieldValue) {
      formik.setFieldValue("equipment", "");
      formik.setFieldValue("quantity", "");
      formik.setFieldValue("assetNumber", []);
      formik.setFieldValue("currentRecord", -1);
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

  // Completely rewritten equipment change handler based on NewEquimentReservation.tsx
  const handleEquipmentChange = (e: any) => {
    console.log("[LOG 3] EquipmentDialogForm - handleEquipmentChange called");
    console.log("[LOG 4] Event value:", e.target.value);
    console.log("[LOG 5] Current formik values BEFORE update:", {
      equipment: formik.values.equipment,
      quantity: formik.values.quantity,
      assetNumber: formik.values.assetNumber
    });
    
    if (!formik || !formik.setFieldValue) {
      console.log("[ERROR] Formik or setFieldValue is undefined");
      return;
    }

    const value = e.target.value;
    
    // If empty value, just clear the fields
    if (!value) {
      console.log("[LOG 6] Empty value, clearing fields");
      formik.setFieldValue("equipment", "");
      formik.setFieldValue("quantity", "");
      formik.setFieldValue("assetNumber", []);
      return;
    }
    
    // Check if the selected equipment is already in the list
    const currentSelectedEquipments = equipmentData.map(item => item.equipment);
    console.log("[LOG 7] Current selected equipments:", currentSelectedEquipments);
    
    if (currentSelectedEquipments.includes(value) && formik.values.currentRecord === -1) {
      console.log("[LOG 8] Equipment already selected:", value);
      setNotification({
        show: true,
        message: "This equipment is already selected, you cannot re-select again.",
        severity: "error"
      });
      return;
    }

    // Validate date and time
    const fromDate = formik.values.fromDate;
    const toDate = formik.values.toDate;
    const timeslot = formik.values.time;
    console.log("[LOG 9] Date and time values:", { fromDate, toDate, timeslot });

    if (!fromDate || !toDate || !timeslot) {
      console.log("[LOG 10] Missing date or time");
      setNotification({
        show: true,
        message: "Please select date and time first",
        severity: "error"
      });
      return;
    }

    // Get equipment data for the selected building and borrowedFrom
    const key = `${formik.values.building}-${formik.values.borrowedFrom}`;
    console.log("[LOG 11] Building-BorrowedFrom key:", key);
    const equipmentMap = buildEquipmentMap[key];
    
    if (!equipmentMap) {
      console.log("[LOG 12] Equipment map not found for key:", key);
      setNotification({
        show: true,
        message: "Failed to load equipment options",
        severity: "error"
      });
      return;
    }
    
    // Get equipment items
    const equipment = Object.values(equipmentMap)
      .filter((item: any) => item.equipment === value)
      .map((item: any) => ({
        equipment: item.equipment,
        borrowed: item.borrowed,
        assetNumber: item.assetNumber,
        blockedDateAM: item.blockedDateAM,
        blockedDatePM: item.blockedDatePM,
        blockedDateWholeDay: item.blockedDateWholeDay
      }));
    
    console.log("[LOG 13] Filtered equipment items:", equipment.length);
    
    if (equipment.length === 0) {
      console.log("[LOG 14] No equipment found with name:", value);
      setNotification({
        show: true,
        message: "No equipment found with this name",
        severity: "error"
      });
      return;
    }
    
    // Get available equipment
    const availableEquipment = getAvailableEquipment(
      equipment,
      fromDate,
      toDate,
      timeslot
    );
    
    console.log("[LOG 15] Available equipment:", availableEquipment.length);
    console.log("[LOG 15.1] Available equipment details:", availableEquipment);
    
    if (availableEquipment.length === 0) {
      console.log("[LOG 16] No available equipment");
      setNotification({
        show: true,
        message: `This equipment is not available as ${equipment.length} out of ${equipment.length} in inventory is in use on the date and time selected.`,
        severity: "error"
      });
      return;
    }
    
    // Create quantity options
    const quantities = Array.from(
      { length: availableEquipment.length },
      (_, i) => ({ id: (i + 1).toString(), value: (i + 1).toString() })
    );
    
    // Get asset numbers and update lists
    const assetNumbers = availableEquipment.map(item => item.assetNumber);
    
    console.log("[LOG 17] Setting quantity list:", quantities.map(q => q.value));
    console.log("[LOG 18] Setting asset list:", assetNumbers);
    console.log("[LOG 18.1] Available equipment details:", availableEquipment);
    
    // Update state first
    setQuantityList(quantities);
    setAssetList(assetNumbers);
    
    console.log("[LOG 18.2] State updated with new lists");

    // For new records, also update formik's assetNumber field based on current quantity
    if (formik.values.currentRecord === -1 && formik.values.quantity) {
      const currentQuantity = parseInt(formik.values.quantity);
      console.log("[LOG 18.3] Updating asset numbers for existing quantity:", {
        currentQuantity,
        assetNumbers
      });
      if (!isNaN(currentQuantity)) {
        const selectedAssets = assetNumbers.slice(0, currentQuantity);
        console.log("[LOG 18.4] Selected assets:", selectedAssets);
        formik.setFieldValue("assetNumber", selectedAssets);
      }
    }
    
    // If viewing an existing record, preserve the quantity and asset numbers
    if (formik.values.currentRecord > -1) {
      console.log("[LOG 18.5] Preserving existing record values");
      formik.setFieldValue("equipment", value);
      return;
    }

    // For new records, clear quantity and asset numbers
    console.log("[LOG 18.6] Clearing quantity and asset numbers for new record");
    formik.setFieldValue("equipment", value);
    formik.setFieldValue("quantity", "");
    formik.setFieldValue("assetNumber", []);
  };

  // Enhanced quantity change handler with immediate asset number updates
  const handleQuantityChange = async (e: any) => {
    console.log("[LOG 21] EquipmentDialogForm - handleQuantityChange called", {
      event: e,
      currentFormikValues: formik.values,
      assetList
    });
    
    const value = e.target.value;
    
    if (!formik || !formik.setFieldValue) {
      console.error("[ERROR] Formik or setFieldValue is undefined");
      return;
    }

    try {
      const parsedValue = parseInt(value);
      console.log("[LOG 22] Processing asset numbers:", {
        parsedQuantity: parsedValue,
        availableAssets: assetList,
        isExistingRecord: formik.values.currentRecord > -1
      });

      // Set quantity without validation
      await formik.setFieldValue("quantity", value, false);
      
      // Immediately calculate and set asset numbers
      if (!isNaN(parsedValue) && assetList.length > 0) {
        // Get the slice of asset numbers based on quantity
        const selectedAssets = assetList.slice(0, parsedValue);
        console.log("[LOG 23] Selected assets:", selectedAssets);
        
        // Set the asset numbers without validation
        await formik.setFieldValue("assetNumber", selectedAssets, false);
        
        console.log("[LOG 24] Updated formik values:", {
          quantity: value,
          assetNumber: selectedAssets,
          currentFormikValues: formik.values
        });
      } else {
        console.log("[LOG 25] Invalid quantity or no assets available");
        await formik.setFieldValue("assetNumber", [], false);
      }
      
      // Force a re-render to update the UI
      formik.setFieldTouched("quantity", true, false);
      formik.setFieldTouched("assetNumber", true, false);
      
      console.log("[LOG 26] Final formik state:", {
        values: formik.values,
        touched: formik.touched
      });
    } catch (error) {
      console.error("[ERROR] Failed to update quantity and asset numbers:", error);
      setNotification({
        show: true,
        message: "Failed to update quantity and asset numbers",
        severity: "error"
      });
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
