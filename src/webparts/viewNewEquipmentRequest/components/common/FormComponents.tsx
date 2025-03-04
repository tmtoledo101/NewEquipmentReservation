import * as React from 'react';
import { TextField, MenuItem, FormControl } from '@material-ui/core';
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
  multiple?: boolean;
  value?: string | string[];
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
    <FormControl fullWidth>
      <TextField
        {...field}
        {...props}
        label={label}
        disabled={disabled}
        multiline={multiline}
        rows={rows}
        error={hasError}
        helperText={hasError ? meta.error : ''}
        variant="standard"
        fullWidth
      />
    </FormControl>
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
    <FormControl fullWidth>
      <DatePicker
        {...field}
        label={label}
        clearable
        autoOk
        disablePast
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
          readOnly: true,
          style: { width: '100%' }
        }}
        invalidDateMessage="Invalid date format"
        maxDateMessage="Date exceeds allowable range"
        minDateMessage="Date is too early"
      />
    </FormControl>
  );
};

export const Dropdown: React.FC<IDropdownProps> = ({
  name,
  label,
  items,
  handleChange,
  disabled = false,
  multiple = false,
  value: propValue,
  ...props
}) => {
  let formikField = null;
  let formikMeta = null;
  let formikHelpers = null;

  try {
    const [field, meta, helpers] = useField(name);
    formikField = field;
    formikMeta = meta;
    formikHelpers = helpers;
  } catch (e) {
    // Not in Formik context
  }

  const handleDropdownChange = (e: React.ChangeEvent<any>) => {
    const value = e.target.value;
    
    // If we have Formik context, use it
    if (formikHelpers) {
      formikHelpers.setValue(value);
    }
    
    // Always call handleChange if provided
    if (handleChange) {
      handleChange(e);
    }
  };

  // Determine the current value
  const value = propValue !== undefined ? propValue : 
                formikField ? formikField.value : 
                multiple ? [] : '';

  // Determine error state
  const error = formikMeta && formikMeta.touched && formikMeta.error;

  return (
    <FormControl fullWidth>
      <TextField
        select
        label={label}
        error={error ? true : false}
        helperText={error || ''}
        disabled={disabled}
        value={value}
        onChange={handleDropdownChange}
        variant="standard"
        fullWidth
        SelectProps={{
          multiple,
          renderValue: multiple ? 
            (selected: any) => (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {(selected as string[]).map((value) => (
                  <div key={value} style={{ 
                    background: '#e0e0e0',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '0.875rem'
                  }}>
                    {value}
                  </div>
                ))}
              </div>
            ) : undefined
        }}
        {...props}
      >
        {!multiple && (
          <MenuItem value="">
            <em>Select...</em>
          </MenuItem>
        )}
        {items.map((item) => (
          <MenuItem key={item.id} value={item.value}>
            {item.value}
          </MenuItem>
        ))}
      </TextField>
    </FormControl>
  );
};
