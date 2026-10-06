"use client";

import { Chip, ChipProps } from "@mui/material";
import { PqrsType } from "@/lib/api/pqrs";
import {
  ContactSupport as PeticionIcon,
  ReportProblem as QuejaIcon,
  Warning as ReclamoIcon,
  Lightbulb as SugerenciaIcon,
  EmojiEvents as FelicitacionIcon,
} from "@mui/icons-material";

interface PqrsTypeChipProps extends Omit<ChipProps, "color"> {
  type: PqrsType;
}

export const TYPE_CONFIG: Record<
  PqrsType,
  { label: string; color: ChipProps["color"]; icon: React.ReactElement }
> = {
  [PqrsType.PETICION]: {
    label: "Petición",
    color: "info",
    icon: <PeticionIcon fontSize="small" />,
  },
  [PqrsType.QUEJA]: {
    label: "Queja",
    color: "warning",
    icon: <QuejaIcon fontSize="small" />,
  },
  [PqrsType.RECLAMO]: {
    label: "Reclamo",
    color: "error",
    icon: <ReclamoIcon fontSize="small" />,
  },
  [PqrsType.SUGERENCIA]: {
    label: "Sugerencia",
    color: "primary",
    icon: <SugerenciaIcon fontSize="small" />,
  },
  [PqrsType.FELICITACION]: {
    label: "Felicitación",
    color: "success",
    icon: <FelicitacionIcon fontSize="small" />,
  },
};

export default function PqrsTypeChip({
  type,
  size = "small",
  variant = "outlined",
  sx,
  ...props
}: PqrsTypeChipProps) {
  const config = TYPE_CONFIG[type] || {
    label: type,
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
        ...sx,
      }}
      {...props}
    />
  );
}
