"use client";

import { Chip, ChipProps } from "@mui/material";
import { PqrsPriority } from "@/lib/api/pqrs";

interface PqrsPriorityChipProps extends Omit<ChipProps, "color"> {
  priority: PqrsPriority;
}

export const PRIORITY_CONFIG: Record<
  PqrsPriority,
  { label: string; color: ChipProps["color"] }
> = {
  [PqrsPriority.LOW]: {
    label: "Baja",
    color: "default",
  },
  [PqrsPriority.MEDIUM]: {
    label: "Media",
    color: "info",
  },
  [PqrsPriority.HIGH]: {
    label: "Alta",
    color: "warning",
  },
  [PqrsPriority.CRITICAL]: {
    label: "Crítica",
    color: "error",
  },
};

export default function PqrsPriorityChip({
  priority,
  size = "small",
  variant = "outlined",
  sx,
  ...props
}: PqrsPriorityChipProps) {
  const config = PRIORITY_CONFIG[priority] || {
    label: priority,
    color: "default",
  };

  return (
    <Chip
      size={size}
      variant={variant}
      color={config.color}
      label={config.label}
      sx={{
        fontWeight: 600,
        fontSize: "0.75rem",
        borderRadius: "6px",
        ...sx,
      }}
      {...props}
    />
  );
}
