import {
  useForm,
  DefaultValues,
  FieldValues,
  Path,
  Controller,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  MenuItem,
  Box,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import dayjs from "dayjs";
import { useEffect, useRef, useState } from "react";
import { useNotification } from "@/providers/NotificationProvider";

export interface FormField<T extends FieldValues> {
  name: Path<T>;
  label: string;
  type?: "text" | "number" | "date" | "time" | "select" | "password" | "multiselect" | "checkbox" | "textarea" | "file";
  options?: { value: string; label: string }[];
  required?: boolean;
  placeholder?: string;
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
  hidden?: boolean | ((watchValues: T) => boolean);
}

interface FormDialogProps<T extends FieldValues> {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: T) => Promise<void>;
  onSubmitOverride?: (data: T) => void;
  title: string;
  schema: z.ZodType<T>;
  fields: FormField<T>[];
  defaultValues?: DefaultValues<T>;
  loading?: boolean;
  children?: React.ReactNode;
  topContent?: React.ReactNode;
}

export default function FormDialog<T extends FieldValues>({
  open,
  onClose,
  onSubmit,
  onSubmitOverride,
  title,
  schema,
  fields,
  defaultValues,
  loading,
  children,
  topContent,
}: FormDialogProps<T>) {
  const {
    handleSubmit,
    control,
    watch,
    formState: { errors },
    reset,
  } = useForm<T>({
    resolver: zodResolver(schema as any),
    defaultValues: defaultValues || ({} as DefaultValues<T>),
  });

  const watchValues = watch();

  const { showError, showSuccess } = useNotification();
  const [internalSubmitting, setInternalSubmitting] = useState(false);
  const isPending = loading || internalSubmitting;

  const lastResetValues = useRef<string>("");

  // Re-sync default values when dialog opens or defaultValues change
  useEffect(() => {
    if (open) {
      if (defaultValues) {
        const currentValuesStr = JSON.stringify(defaultValues);
        if (currentValuesStr !== lastResetValues.current) {
          reset(defaultValues);
          lastResetValues.current = currentValuesStr;
        }
      } else {
        // Mode: Creation - Reset to empty state
        reset({} as DefaultValues<T>);
        lastResetValues.current = "";
      }
    }
  }, [open, defaultValues, reset]);

  const handleFormSubmit = async (data: T) => {
    setInternalSubmitting(true);
    try {
      if (onSubmitOverride) {
        onSubmitOverride(data);
      } else {
        await onSubmit(data);
      }
      showSuccess("Operación realizada con éxito");
      if (open) {
        reset();
        onClose();
      }
    } catch (error: any) {
      console.error("Form submission error:", error);
      const errorMessage =
        error.message ||
        (typeof error === "object" ? JSON.stringify(error) : String(error));
      showError(
        errorMessage || "Ha ocurrido un error al procesar el formulario.",
      );
    } finally {
      setInternalSubmitting(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{ sx: { borderRadius: { xs: 2, sm: 2.5 }, m: { xs: 1.5, sm: 3 } } }}
    >
      <DialogTitle sx={{ pb: 1, fontWeight: 700, fontSize: { xs: "1.1rem", sm: "1.25rem" } }}>
        {title}
      </DialogTitle>
      <Box component="form" onSubmit={handleSubmit(handleFormSubmit as any)}>
        <DialogContent dividers sx={{ pt: 2, px: { xs: 2, sm: 3 } }}>
          {topContent}
          <Stack spacing={2.5}>
            {fields.map((field) => {
              const isHidden =
                typeof field.hidden === "function"
                  ? field.hidden(watchValues)
                  : field.hidden;
              if (isHidden) return null;
              return (
                <Controller
                  key={field.name.toString()}
                  name={field.name}
                  control={control}
                  render={({
                    field: { onChange, value, ...rest },
                    fieldState: { error },
                  }) => {
                    if (field.type === "date") {
                      return (
                        <DatePicker
                          {...rest}
                          label={field.label}
                          value={value ? dayjs(value) : null}
                          onChange={(date) =>
                            onChange(date ? date.format("YYYY-MM-DD") : "")
                          }
                          slotProps={{
                            textField: {
                              fullWidth: true,
                              size: "small",
                              error: !!error,
                              helperText: error?.message,
                              required: field.required,
                              InputLabelProps: { shrink: true }
                            },
                          }}
                          disabled={isPending}
                        />
                      );
                    }

                    if (field.type === "time") {
                      return (
                        <TimePicker
                          {...rest}
                          label={field.label}
                          value={value ? dayjs(`2000-01-01T${value}`) : null}
                          onChange={(time) =>
                            onChange(time ? time.format("HH:mm:ss") : "")
                          }
                          slotProps={{
                            textField: {
                              fullWidth: true,
                              size: "small",
                              error: !!error,
                              helperText: error?.message,
                              required: field.required,
                              InputLabelProps: { shrink: true }
                            },
                          }}
                          disabled={isPending}
                          ampm={false}
                        />
                      );
                    }

                    if (field.type === "file") {
                      return (
                        <Button
                          variant="outlined"
                          component="label"
                          fullWidth
                          disabled={isPending}
                          sx={{ justifyContent: "flex-start", py: 1.5, textTransform: "none" }}
                        >
                          {value ? (typeof value === "string" ? value : (value as File).name) : `Cargar ${field.label}`}
                          <input
                            type="file"
                            hidden
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              onChange(file || null);
                            }}
                          />
                        </Button>
                      );
                    }

                    return (
                      <TextField
                        {...rest}
                        size="small"
                        value={
                          field.type === "select"
                            ? value !== undefined && value !== null
                              ? String(value)
                              : ""
                            : value ?? ""
                        }
                        onChange={(e) => {
                          const val = e.target.value;
                          if (field.type === "multiselect") {
                            onChange(typeof val === 'string' ? val.split(',') : val);
                            return;
                          }
                          if (field.type === "number") {
                            const parsedVal = val === "" ? 0 : Number(val);
                            onChange(isNaN(parsedVal) ? val : parsedVal);
                            return;
                          }
                          if (val === "true") onChange(true);
                          else if (val === "false") onChange(false);
                          else onChange(val);
                        }}
                        label={field.label}
                        placeholder={field.placeholder}
                        type={
                          field.type === "number"
                            ? "number"
                            : field.type === "password"
                              ? "password"
                              : "text"
                        }
                        multiline={field.type === "textarea"}
                        rows={field.type === "textarea" ? 3 : 1}
                        select={field.type === "select" || field.type === "multiselect"}
                        SelectProps={
                          field.type === "multiselect"
                            ? {
                                multiple: true,
                                renderValue: (selected: any) => {
                                  const selectedValues = selected as string[];
                                  return selectedValues
                                    .map(
                                      (val) =>
                                        field.options?.find((opt) => opt.value === val)
                                          ?.label || val
                                    )
                                    .join(", ");
                                },
                              }
                            : undefined
                        }
                        fullWidth
                        error={!!error}
                        helperText={error?.message}
                        inputProps={field.inputProps}
                        disabled={isPending}
                        required={field.required}
                      >
                        {field.options?.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </TextField>
                    );
                  }}
                />
              );
            })}
          </Stack>
          {children}
        </DialogContent>
        <DialogActions sx={{ px: { xs: 2, sm: 3 }, py: 2, flexDirection: { xs: "column-reverse", sm: "row" }, gap: { xs: 1, sm: 0 } }}>
          <Button onClick={onClose} disabled={isPending} color="inherit" sx={{ width: { xs: "100%", sm: "auto" } }}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained" disabled={isPending} sx={{ fontWeight: 600, width: { xs: "100%", sm: "auto" } }}>
            {isPending ? "Guardando..." : "Guardar"}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
