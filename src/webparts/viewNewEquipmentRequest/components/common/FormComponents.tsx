import * as React from 'react';
import { TextField, MenuItem } from '@material-ui/core';
import { KeyboardDatePicker } from '@material-ui/pickers';
import { useField } from 'formik';

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
    <KeyboardDatePicker
      {...field}
      label={label}
      variant="inline"
      inputVariant="outlined"
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
      KeyboardButtonProps={{
        'aria-label': 'change date',
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
  const hasError = meta.touched && !!meta.error;

  return (
    <TextField
      {...field}
      {...props}
      select
      fullWidth
      variant="outlined"
      label={label}
      error={hasError}
      helperText={hasError ? meta.error : ''}
      disabled={disabled}
      onChange={(e) => {
        field.onChange(e);
        if (handleChange) {
          handleChange(e);
        }
      }}
    >
      {items.map((item) => (
        <MenuItem key={item.id} value={item.value}>
          {item.value}
        </MenuItem>
      ))}
    </TextField>
  );
};
