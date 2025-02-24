import * as React from 'react';
import { SharePointService } from '../services/SharePointService';
import { IDropdownItem, IEquipmentData, INotification, IBuildEquipmentMap } from '../utils/helpers';
import { IEquipmentRequest } from '../interfaces/IEquipmentRequest';
import { useEffect } from "react";

export const useEquipmentReservation = (
  isOpen: boolean,
  selectedRequest: IEquipmentRequest | null,
  formikRef: React.RefObject<any>
) => {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showEquipmentDialog, setShowEquipmentDialog] = React.useState(false);
  const [showConfirmation, setShowConfirmation] = React.useState(false);
  const [pendingValues, setPendingValues] = React.useState<any>(null);
  const [departmentList, setDepartmentList] = React.useState<IDropdownItem[]>([]);
  const [departmentSectorMap, setDepartmentSectorMap] = React.useState<{ [key: string]: string }>({});
  const [buildingList, setBuildingList] = React.useState<IDropdownItem[]>([]);
  const [borrowedFromList, setBorrowedFromList] = React.useState<IDropdownItem[]>([]);
  const [timeList, setTimeList] = React.useState<IDropdownItem[]>([]);
  const [equipmentList, setEquipmentList] = React.useState<IDropdownItem[]>([]);
  const [quantityList, setQuantityList] = React.useState<IDropdownItem[]>([]);
  const [equipmentData, setEquipmentData] = React.useState<IEquipmentData[]>([]);
  const [assetList, setAssetList] = React.useState<string[]>([]);
  const [buildBorrowedMap, setBuildBorrowedMap] = React.useState<any>({});
  const [buildEquipmentMap, setBuildEquipmentMap] = React.useState<IBuildEquipmentMap>({});
  const [isFssManaged, setIsFssManaged] = React.useState<boolean>(false);
  const [files, setFiles] = React.useState<File[]>([]);
  const [notification, setNotification] = React.useState<INotification>({
    show: false,
    message: "",
    severity: "success"
  });

  const updateEquipmentList = React.useCallback((building: string, borrowedFrom: string) => {
    const key = `${building}-${borrowedFrom}`;
    const availableEquipment = buildEquipmentMap[key];
    
    if (availableEquipment) {
      const uniqueEquipment = [...new Set(
        Object.values(availableEquipment)
          .filter(item => item.equipment)
          .map(item => item.equipment)
      )];
      
      const equipmentItems = uniqueEquipment.map(item => ({
        id: item,
        value: item
      }));
      setEquipmentList(equipmentItems);
    }
  }, [buildEquipmentMap, setEquipmentList]);

  // Memoize initial form values
  const initialFormValues = React.useMemo(() => {
    if (!selectedRequest) return null;
    
    return {
      requestedBy: selectedRequest.requestedBy || "",
      department: selectedRequest.department || "",
      contactNumber: selectedRequest.contactNumber || "",
      time: selectedRequest.time || "",
      fromDate: selectedRequest.fromDate ? new Date(selectedRequest.fromDate) : null,
      toDate: selectedRequest.toDate ? new Date(selectedRequest.toDate) : null,
      remarks: selectedRequest.remarks || "",
      status: selectedRequest.status === "For Release" ? "Release" : selectedRequest.status || "",
      building: selectedRequest.building || "",
      borrowedFrom: selectedRequest.borrowedFrom || "",
      equipment: "",
      quantity: "",
      currentRecord: -1,
      assetNumber: [],
    };
  }, [selectedRequest]);

  // Load initial data when form opens
  React.useEffect(() => {
    let mounted = true;

    const loadInitialData = async () => {
      if (!isOpen || !selectedRequest || !initialFormValues) return;

      try {
        // Get current user first since we need it for departments
        const user = await SharePointService.getCurrentUser();
        if (!mounted) return;

        // Load all remaining data in parallel
        const [
          departmentsResponse,
          equipmentResponse,
          timesResponse
        ] = await Promise.all([
          SharePointService.getDepartments(user.Email),
          SharePointService.getEquipments(),
          SharePointService.getTime()
        ]);

        if (!mounted) return;

        // Update state with fetched data
        setDepartmentList(departmentsResponse.departments);
        setDepartmentSectorMap(departmentsResponse.departmentSectorMap);
        setBuildingList(equipmentResponse.buildingList);
        setBuildBorrowedMap(equipmentResponse.buildBorrowedMap);
        setBuildEquipmentMap(equipmentResponse.buildEquipmentMap);
        setTimeList(timesResponse);

        // Initialize form with selected request data
        const formik = formikRef.current;
        if (formik && mounted) {
          // Reset form to initial state
          formik.resetForm();
          
          // Set form values
          formik.setValues(initialFormValues);

          // Initialize borrowedFromList based on selected building
          if (initialFormValues.building && buildBorrowedMap && buildBorrowedMap[initialFormValues.building]) {
            const filteredItems = Array.from(buildBorrowedMap[initialFormValues.building])
              .filter((item: any) => item.exclusiveTo !== 'FSS')
              .map((item: any) => item.borrowed);
            
            const uniqueBorrowed = [...new Set(filteredItems)];
            const borrowedList = uniqueBorrowed.map(item => ({
              id: item,
              value: item
            }));
            
            setBorrowedFromList(borrowedList);
          }

          // Initialize equipment data if available
          if (selectedRequest.equipment && mounted) {
            try {
              const parsedEquipment = JSON.parse(selectedRequest.equipment);
              if (Array.isArray(parsedEquipment)) {
                setEquipmentData(parsedEquipment.map(item => ({
                  equipment: item.equipment || '',
                  quantity: item.quantity || '',
                  assetNumber: Array.isArray(item.assetNumber) ? item.assetNumber : []
                })));
              }
            } catch (error) {
              console.error('Error parsing equipment data:', error);
            }
          }
        }
      } catch (error) {
        if (mounted) {
          console.error('Error initializing form:', error);
          setNotification({
            show: true,
            message: "Failed to load form data. Please try again.",
            severity: "error"
          });
        }
      }
    };

    loadInitialData();

    // Cleanup function to prevent state updates after unmount
    return () => {
      mounted = false;
    };
  }, [isOpen, selectedRequest, initialFormValues]);

  // Handle borrowedFromList initialization when buildBorrowedMap changes
  React.useEffect(() => {
    if (formikRef.current && buildBorrowedMap) {
      const currentBuilding = formikRef.current.values.building;
      if (currentBuilding && buildBorrowedMap[currentBuilding]) {
        const filteredItems = Array.from(buildBorrowedMap[currentBuilding])
          .filter((item: any) => item.exclusiveTo !== 'FSS')
          .map((item: any) => item.borrowed);
        
        const uniqueBorrowed = [...new Set(filteredItems)];
        const borrowedList = uniqueBorrowed.map(item => ({
          id: item,
          value: item
        }));
        
        setBorrowedFromList(borrowedList);
      }
    }
  }, [buildBorrowedMap]);

  return {
    isSubmitting,
    setIsSubmitting,
    showEquipmentDialog,
    setShowEquipmentDialog,
    showConfirmation,
    setShowConfirmation,
    pendingValues,
    setPendingValues,
    departmentList,
    buildingList,
    borrowedFromList,
    setBorrowedFromList,
    timeList,
    equipmentList,
    setEquipmentList,
    quantityList,
    setQuantityList,
    equipmentData,
    setEquipmentData,
    assetList,
    setAssetList,
    buildBorrowedMap,
    buildEquipmentMap,
    isFssManaged,
    files,
    setFiles,
    notification,
    setNotification,
    updateEquipmentList
  };
};
