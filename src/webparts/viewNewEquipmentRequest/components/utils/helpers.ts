import * as React from 'react';
import * as moment from "moment";

export const dateConverter = (date: Date, type: number): string => {
  if (type === 1) {
    return moment(date).subtract(1, 'day').toISOString();
  } else if (type === 2) {
    return moment(date).add(1, 'day').toISOString();
  }
  return moment(date).toISOString();
};

export const validateDateTime = (startDateTime: Date, endDateTime: Date): boolean => {
  return startDateTime &&
    moment(startDateTime).isValid() &&
    endDateTime && 
    moment(endDateTime).isValid() &&
    moment(endDateTime).isSameOrAfter(startDateTime);
};

export const formatDate = (date: Date): string => {
  return date ? moment(date).format("MM/DD/YYYY") : null;
};

interface EquipmentItem {
  equipment: string;
  quantity: number;
  assetNumber: string[];
}

export const formatEquipmentData = (equipmentData: string): React.ReactNode => {
  try {
    const data: EquipmentItem[] = JSON.parse(equipmentData || '[]');
    return data.map((item, index) => 
      React.createElement('pre', 
        { 
          key: index, 
          style: { whiteSpace: 'break-spaces' } 
        },
        `${item.equipment} ${item.quantity} ${item.assetNumber.join(', ')}`
      )
    );
  } catch (error) {
    console.error('Error parsing equipment data:', error);
    return null;
  }
};

export const headerObj = {
  "0": "By Reference No",
  "1": "Past Request",
  "2": "Release Request",
  "3": "Return Request",
};

export const STATUS = {
  APPROVED: "Completed",
  CLOSED: "Cancelled",
  RETURN: "For Return",
  RELEASE: "For Release"
};

export const arrayToDropDownValues = (array: string[]): { id: string; value: string }[] => {
  return array.map(item => ({
    id: item,
    value: item
  }));
};
