import * as React from 'react';
import { Field } from "formik";
import { FormControl, TextField, Select, MenuItem, Chip, Box, Checkbox } from "@material-ui/core";
import { DatePicker, MuiPickersUtilsProvider } from "@material-ui/pickers";
import DateFnsUtils from "@date-io/date-fns";
import styles from '../ViewNewEquipmentRequest.module.scss';
import { IDropdownItem } from '../interfaces/IDropdownItem';

interface IDropdownProps {
  items: IDropdownItem[];
  name: string;
  handleChange?: (e: any) => void;
  multiple?: boolean;
  disabled?: boolean;
}

export const Dropdown: React.FC<IDropdownProps> = (props) => {
  const { items, handleChange, name, multiple, disabled } = props;
  return (
    <Field name={name}>
      {({ field, meta, form }) => {
        const { error, touched } = meta;
        return (
          <FormControl fullWidth>
            <Select
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
              value={field.value}
              className={styles.width}
              variant="standard"
              disabled={disabled}
              renderValue={(selected: any) => {
                if (multiple) {
                  return (
                    <Box sx={{ display: "flex", flexWrap: "wrap" }}>
                      {selected && selected.map((value) => (
                        <Chip
                          key={value}
                          label={value}
                          style={{ margin: "3px", height: "20px" }}
                        />
                      ))}
                    </Box>
                  );
                } else {
                  return selected;
                }
              }}
              {...props}
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {items.map((item) => (
                <MenuItem key={item.id} value={item.value}>
                  {multiple && <Checkbox checked={field.value.indexOf(item.value) > -1} />}
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
};

interface ICustomInputProps {
  name: string;
  disabled?: boolean;
}

export const CustomInput: React.FC<ICustomInputProps> = (props) => {
  const { name, disabled = false } = props;
  return (
    <Field name={name}>
      {({ field, meta, form }) => {
        const { error, touched } = meta;
        return (
          <FormControl fullWidth>
            <TextField
              value={field.value}
              variant="standard"
              onChange={(e) => {
                field.onChange(e);
              }}
              onBlur={(e) => {
                form.setFieldTouched(name, true, false);
                field.onBlur(e);
              }}
              name={name}
              disabled={disabled}
              className={styles.width}
            />
            {error && touched ? (
              <span className={styles.error}>{error}</span>
            ) : null}
          </FormControl>
        );
      }}
    </Field>
  );
};

interface ICustomDateTimePickerProps {
  name: string;
  handleChange?: (date: Date | null, name: string) => void;
}

export const CustomDateTimePicker: React.FC<ICustomDateTimePickerProps> = (props) => {
  const { name, handleChange } = props;
  return (
    <Field name={name}>
      {({ field, meta, form }) => {
        const { error, touched } = meta;
        return (
          <FormControl fullWidth>
            <MuiPickersUtilsProvider utils={DateFnsUtils}>
              <DatePicker
                clearable
                autoOk
                format="MM/dd/yyyy"
                value={field.value ? new Date(field.value) : null}
                onChange={(e) => {
                  form.setFieldValue(name, e);
                  if (handleChange) {
                    handleChange(e, name);
                  }
                }}
                onBlur={(e) => {
                  form.setFieldTouched(name, true, false);
                  field.onBlur(e);
                }}
                className={styles.width}
              />
            </MuiPickersUtilsProvider>
            {error && touched ? (
              <span className={styles.error}>{error}</span>
            ) : null}
          </FormControl>
        );
      }}
    </Field>
  );
};
