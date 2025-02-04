import { STATUS } from '../../utils/helpers';

export interface IEquipmentData {
  equipment: string;
  quantity: string | number; // Allow both string and number
  assetNumber: string[];
}

export interface IApproverFormValues {
  ID: number;
  referenceNumber: string;
  status: typeof STATUS[keyof typeof STATUS];
  requestedBy: string;
  department: string;
  contactNumber?: string;
  building?: string;
  borrowedFrom?: string;
  time?: string;
  fromDate: Date | string | null;
  toDate: Date | string | null;
  equipmentData?: IEquipmentData[]; // Make equipmentData optional
  remarks?: string;
  [key: string]: any; // Allow for additional properties that might come from SharePoint
}

// Helper function to convert string dates to Date objects
export const convertDates = (values: any): IApproverFormValues => {
  return {
    ...values,
    fromDate: values.fromDate ? new Date(values.fromDate) : null,
    toDate: values.toDate ? new Date(values.toDate) : null,
    equipmentData: (
      values.equipmentData &&
      values.equipmentData.map((item: any) => ({
        ...item,
        quantity: typeof item.quantity === 'string' ? parseInt(item.quantity, 10) : item.quantity
      }))
    ) || []
  };
};