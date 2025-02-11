import * as React from 'react';
import { TextField, MenuItem } from '@material-ui/core';
import { KeyboardDatePicker, DatePicker } from '@material-ui/pickers';
import { useField, useFormikContext } from 'formik';

interface ICustomInputProps {
  name: string;
  label?: string;
  disabled?: boolean;
  multiline?: boolean;
  rows?: number;
}

interface IDropdownProps {
  name: string;
  label?: string;
  items: Array<{ id: string | number; value: string }>;
  handleChange?: (event: React.ChangeEvent<any>) => void;
  disabled?: boolean;
}

export const CustomInput: React.FC<ICustomInputProps> = ({
  name,
  label,
  disabled = false,
  multiline = false,
  rows = 1,
  ...props
}) => {
  const [field, meta] = useField(name);
  const hasError = meta.touched && !!meta.error;

  return (
    <TextField
      {...field}
      {...props}
      fullWidth
      variant="outlined"
      label={label}
      disabled={disabled}
      multiline={multiline}
      rows={rows}
      error={hasError}
      helperText={hasError ? meta.error : ''}
    />
  );
};

export interface ICustomDateTimePickerProps {
  name: string;
  label?: string;
  disabled?: boolean;
  handleChange?: (date: any) => void;
}

export const CustomDateTimePicker: React.FC<ICustomDateTimePickerProps> = ({
  name,
  label,
  disabled = false,
  handleChange
}) => {
  const [field, meta, helpers] = useField(name);
  const hasError = meta.touched && !!meta.error;

  return (
    <DatePicker
      {...field}
      label={label}
      variant="inline"
      inputVariant="standard"
      fullWidth
      format="MM/dd/yyyy"
      error={hasError}
      helperText={hasError ? meta.error : ''}
      onChange={(date) => {
        helpers.setValue(date);
        if (handleChange) {
          handleChange(date);
        }
      }}
      disabled={disabled}
      InputProps={{
        readOnly: true
      }}
      invalidDateMessage="Invalid date format"
      maxDateMessage="Date exceeds allowable range"
      minDateMessage="Date is too early"
    />
  );
};

export const Dropdown: React.FC<IDropdownProps> = ({
  name,
  label,
  items,
  handleChange,
  disabled = false,
  ...props
}) => {
  const [field, meta] = useField(name);
  const { setFieldValue } = useFormikContext();
  const hasError = meta.touched && !!meta.error;

  const handleDropdownChange = (e: React.ChangeEvent<any>) => {
    const value = e.target.value;
    setFieldValue(name, value);
    if (handleChange) {
      handleChange(e);
    }
  };

  return (
    <TextField
      select
      fullWidth
      variant="outlined"
      label={label}
      error={hasError}
      helperText={hasError ? meta.error : ''}
      disabled={disabled}
      value={field.value || ''}
      onChange={handleDropdownChange}
      {...props}
    >
      <MenuItem value="">
        <em>Select...</em>
      </MenuItem>
      {items.map((item) => (
        <MenuItem key={item.id} value={item.value}>
          {item.value}
        </MenuItem>
      ))}
    </TextField>
  );
};
