import { IDropdownItem } from '../interfaces/INewEquipmentReservation';
import * as moment from 'moment';

export const FSS = "FSS";

export const mapArrayToObject = (obj: { [key: string]: any }): IDropdownItem[] =>
  Object.keys(obj).map((item) => ({
    id: item,
    value: item
  }));

export const arrayToDropDownValues = (array: any[]): IDropdownItem[] =>
  array.map((item) => ({
    id: item,
    value: item
  }));

export const isFirstNotIncluded = (firstArray: string[], secondArray: string[]): boolean => {
  const data = firstArray.filter(item => secondArray.includes(item));
  return data.length === 0;
};

export const getCount = (count: number, padlen: number = 2): string => {
  const newCount = `${count + 1}`;
  return newCount.padStart(padlen, '0');
};

export const formatDate = (date: Date | string): string => {
  return moment(date).format('YYYY/MM/DD');
};

export const getDaysDifference = (startDate: Date | string, endDate: Date | string): number => {
  const from = moment(formatDate(startDate));
  const to = moment(formatDate(endDate));
  return to.diff(from, 'days', true);
};

export const generateBlockedDates = (startDate: Date | string, days: number): string[] => {
  const blockedDates: string[] = [];
  const start = moment(startDate);
  
  for (let i = 0; i <= days; i++) {
    blockedDates.push(moment(start).add(i, 'days').format('YYYY/MM/DD'));
  }
  
  return blockedDates;
};
