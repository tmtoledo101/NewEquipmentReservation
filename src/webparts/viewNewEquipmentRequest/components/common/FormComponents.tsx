import * as React from 'react';
import { TextField, MenuItem, Select, FormControl, Chip, Checkbox, Box } from '@material-ui/core';
import { KeyboardDatePicker, DatePicker } from '@material-ui/pickers';
import { Field, FieldProps } from 'formik';
import styles from "../ViewNewEquipmentRequest.module.scss";

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
  multiple: boolean;
}

export const CustomInput: React.FC<ICustomInputProps> = ({
  name,
  label,
  disabled = false,
  multiline = false,
  rows = 1,
  ...props
}) => (
  <Field name={name}>
    {({ field, meta }: FieldProps) => {
      const hasError = meta.touched && meta.error;
      return (
        <FormControl fullWidth>
          <TextField
            {...field}
            {...props}
            label={label}
            disabled={disabled}
            multiline={multiline}
            rows={rows}
            error={Boolean(hasError)}
            helperText={hasError ? meta.error : ''}
            variant="standard"
            fullWidth
          />
        </FormControl>
      );
    }}
  </Field>
);

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
}) => (
  <Field name={name}>
    {({ field, meta, form }: FieldProps) => {
      const hasError = meta.touched && meta.error;
      return (
        <FormControl fullWidth>
          <DatePicker
            {...field}
            label={label}
            clearable
            autoOk
            disablePast
            format="MM/dd/yyyy"
            error={Boolean(hasError)}
            helperText={hasError ? meta.error : ''}
            onChange={(date) => {
              form.setFieldValue(name, date);
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
    }}
  </Field>
);

export const Dropdown: React.FC<IDropdownProps> = ({
  name,
  label,
  items,
  multiple,
  handleChange,
  disabled = false,
  ...props
}) => (
  <Field name={name}>
    {({ field, meta, form }: FieldProps) => {
      const { error, touched } = meta;
      const fieldValue = field.value || (multiple ? [] : '');
      return (
        <FormControl fullWidth>
          <Select
            {...field}
            multiple={multiple}
            onChange={(e) => {
              field.onChange(e);
              if (handleChange) {
                handleChange(e);
              }
            }}
            onBlur={(e) => {
              form.setFieldTouched(name, true, false);
              field.onBlur(e);
            }}
            value={fieldValue}
            variant="standard"
            disabled={disabled}
            style={{
              border: form.errors[field.name] ? "1px solid red" : "none",
            }}
            renderValue={(selected: any) => {
              if (multiple && selected) {
                return (
                  <Box sx={{ display: "flex", flexWrap: "wrap" }}>
                    {selected.map((selectedValue: string) => (
                      <Chip
                        key={selectedValue}
                        label={selectedValue}
                        style={{ margin: "3px", height: "20px" }}
                      />
                    ))}
                  </Box>
                );
              }
              return selected;
            }}
            {...props}
          >
            <MenuItem value="">
              <em>None</em>
            </MenuItem>
            {items.map((item) => (
              <MenuItem key={item.id} value={item.value}>
                {multiple && (
                  <Checkbox checked={field.value && field.value.indexOf(item.value) > -1} />
                )}
                {item.value}
              </MenuItem>
            ))}
          </Select>
          {error && touched ? (
            <span className={styles.error}>{error}</span>
          ) : null}
        </FormControl>
      );
    }}
  </Field>
);