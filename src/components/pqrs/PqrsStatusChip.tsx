"use client";

import { Chip, ChipProps } from "@mui/material";
import { PqrsStatus } from "@/lib/api/pqrs";
import {
  AccessTime as PendingIcon,
  AssignmentInd as AssignedIcon,
  Loop as InProgressIcon,
  CheckCircle as ResolvedIcon,
  Lock as ClosedIcon,
  Cancel as RejectedIcon,
} from "@mui/icons-material";

interface PqrsStatusChipProps extends Omit<ChipProps, "color"> {
  status: PqrsStatus;
}

export const STATUS_CONFIG: Record<
  PqrsStatus,
  { label: string; color: ChipProps["color"]; icon: React.ReactElement }
> = {
  [PqrsStatus.OPEN]: {
    label: "Abierto",
    color: "warning",
    icon: <PendingIcon fontSize="small" />,
  },
  [PqrsStatus.ASSIGNED]: {
    label: "Asignado",
    color: "info",
    icon: <AssignedIcon fontSize="small" />,
  },
  [PqrsStatus.IN_PROGRESS]: {
    label: "En Progreso",
    color: "primary",
    icon: <InProgressIcon fontSize="small" />,
  },
  [PqrsStatus.RESOLVED]: {
    label: "Resuelto",
    color: "success",
    icon: <ResolvedIcon fontSize="small" />,
  },
  [PqrsStatus.CLOSED]: {
    label: "Cerrado",
    color: "default",
    icon: <ClosedIcon fontSize="small" />,
  },
  [PqrsStatus.REJECTED]: {
    label: "Rechazado",
    color: "error",
    icon: <RejectedIcon fontSize="small" />,
  },
};

export default function PqrsStatusChip({
  status,
  size = "small",
  variant = "filled",
  sx,
  ...props
}: PqrsStatusChipProps) {
  const config = STATUS_CONFIG[status] || {
    label: status,
    color: "default",
    icon: undefined,
  };

  return (
    <Chip
      size={size}
      variant={variant}
      color={config.color}
      icon={config.icon}
      label={config.label}
      sx={{
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.5px",
        fontSize: "0.75rem",
        ...sx,
      }}
      {...props}
    />
  );
}
