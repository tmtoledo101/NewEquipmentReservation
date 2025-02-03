export interface IEquipmentRequest {
  building: string;
  fromDate: string;
  toDate: string;
  referenceNumber: string;
  requestedBy: string;
  department: string;
  contactNumber: string;
  status: string;
  time: string;
  equipment: string;
  ID: number;
  returnedBy?: string;
  returnedTo?: string;
  returnedDate?: string;
  releasedTo?: string;
  releasedBy?: string;
  releasedDate?: string;
  borrowedFrom?: string;
  remarks?: string;
  equipmentData?: Array<{
    equipment: string;
    quantity: string;
    assetNumber: string[];
  }>;
}
