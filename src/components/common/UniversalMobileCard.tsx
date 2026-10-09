"use client";

import React, { isValidElement } from "react";
import {
  Paper,
  Box,
  Stack,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Avatar,
} from "@mui/material";
import {
  GridColDef,
  GridActionsCellItemProps,
  GridRenderCellParams,
  GridRowId,
} from "@mui/x-data-grid";
import {
  BusinessOutlined as BusinessOutlinedIcon,
  EmailOutlined as EmailOutlinedIcon,
  PhoneOutlined as PhoneOutlinedIcon,
  LocationOnOutlined as LocationOnOutlinedIcon,
  PersonOutlineOutlined as PersonOutlineOutlinedIcon,
  AccessTimeOutlined as AccessTimeOutlinedIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  RemoveCircle as RemoveCircleIcon,
} from "@mui/icons-material";
import { formatDateTime, formatDate, formatTime } from "@/lib/formatters";

export interface UniversalMobileCardProps<T = any> {
  row: T;
  columns: GridColDef[];
  onView?: (row: T) => void;
  onEdit?: (id: string, row: T) => void;
  onDelete?: (id: string, row?: T) => void | Promise<void>;
  customActions?: (row: T) => React.ReactElement<GridActionsCellItemProps>[];
  deleteIcon?: React.ReactElement;
  deleteActionLabel?: string;
  onDeleteClick?: (id: GridRowId, row: T) => void;
}

const getColumnValue = (col: GridColDef, row: any): any => {
  if (typeof col.valueGetter === "function") {
    try {
      return (col.valueGetter as any)(row[col.field], row, col, {});
    } catch {
      return row[col.field];
    }
  }
  return row[col.field];
};

const renderActionIcon = (icon: any): React.ReactNode => {
  if (isValidElement(icon)) return icon;
  if (typeof icon === "function") {
    const IconComponent = icon;
    return <IconComponent fontSize="small" />;
  }
  return null;
};

export default function UniversalMobileCard<T extends Record<string, any>>({
  row,
  columns,
  onView,
  onEdit,
  onDelete,
  customActions,
  deleteIcon,
  deleteActionLabel,
  onDeleteClick,
}: UniversalMobileCardProps<T>) {
  // 1. EXTRAER INFORMACIÓN DE CABECERA (Nombre, Documento/Código, Avatar)
  const NAME_FIELDS = [
    "fullname",
    "name",
    "nombre",
    "subject",
    "asunto",
    "visitorfullname",
    "recipientresidentname",
    "recipientemployeename",
    "residentname",
    "title",
    "titulo",
  ];

  const nameCol = columns.find((c) =>
    NAME_FIELDS.includes(c.field.toLowerCase()),
  );

  let primaryName = "";
  if (nameCol) {
    const rawName = getColumnValue(nameCol, row);
    if (rawName && typeof rawName === "string") {
      primaryName = rawName;
    }
  }
  if (!primaryName) {
    primaryName =
      row.fullName ||
      row.name ||
      row.visitorFullName ||
      row.subject ||
      row.title ||
      (row.plate ? `Placa: ${row.plate}` : "Registro");
  }

  // Documento o Código identificador
  let documentOrCode = "";
  if (row.document) {
    const docType = row.documentType || row.visitorIdType || "CC";
    documentOrCode = `${docType}: ${row.document}`;
  } else if (row.visitorIdNumber) {
    const docType = row.visitorIdType || "CC";
    documentOrCode = `${docType}: ${row.visitorIdNumber}`;
  } else if (row.nit) {
    documentOrCode = `NIT: ${row.nit}`;
  } else if (row.internalCode) {
    documentOrCode = String(row.internalCode);
  } else if (row.code) {
    documentOrCode = String(row.code);
  } else if (row.ticketNumber) {
    documentOrCode = String(row.ticketNumber);
  } else if (row.parkingNumber) {
    documentOrCode = `Parqueadero: ${row.parkingNumber}`;
  } else if (row.id && typeof row.id === "string" && row.id.length <= 14) {
    documentOrCode = `ID: ${row.id}`;
  }

  // Avatar (Foto o Iniciales)
  const avatarSrc =
    row.avatarUrl ||
    (Array.isArray(row.mediaAttachments) && row.mediaAttachments[0]?.url) ||
    undefined;

  const initials = primaryName
    ? primaryName
        .trim()
        .split(/\s+/)
        .map((n: string) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "NO";

  // 2. EXTRAER DATOS DE CONTACTO E INFO (Para el Cuerpo con Íconos Outlined - SIN CHIPS)
  // Cliente / Conjunto
  let clientText = "";
  const clientCol = columns.find((c) =>
    ["clientname", "client", "company"].includes(c.field.toLowerCase()),
  );
  if (clientCol) {
    const rawClient = getColumnValue(clientCol, row);
    if (rawClient) {
      clientText = typeof rawClient === "object" ? rawClient.name || "" : String(rawClient);
    }
  }
  if (!clientText && row.client?.name) {
    clientText = row.client.name;
  }
  if (!clientText && row.clientName) {
    clientText = row.clientName;
  }
  // Si es un cliente mismo, no repetir su nombre como su propio cliente
  if (clientText && clientText === primaryName) {
    clientText = "";
  }

  // Email
  let emailText = "";
  const emailCol = columns.find((c) =>
    ["email", "correo"].includes(c.field.toLowerCase()),
  );
  if (emailCol) {
    const rawEmail = getColumnValue(emailCol, row);
    if (rawEmail) emailText = String(rawEmail);
  } else if (row.email) {
    emailText = String(row.email);
  }

  // Teléfono
  let phoneText = "";
  const phoneCol = columns.find((c) =>
    ["phone", "telefono", "phonenumber", "celular"].includes(c.field.toLowerCase()),
  );
  if (phoneCol) {
    const rawPhone = getColumnValue(phoneCol, row);
    if (rawPhone) phoneText = String(rawPhone);
  } else if (row.phone || row.phoneNumber) {
    phoneText = String(row.phone || row.phoneNumber);
  }

  // Ubicación / Dirección / Ciudad (útil para clientes o prospectos)
  let locationText = "";
  if (!emailText && !phoneText) {
    if (row.city || row.sector) {
      locationText = [row.city, row.sector].filter(Boolean).join(" — ");
    } else if (row.address) {
      locationText = String(row.address);
    } else if (row.guardPost) {
      locationText = `Puesto: ${row.guardPost}`;
    }
  }

  // Anfitrión / Destino (útil para minutas y visitas)
  let hostOrUnitText = "";
  if (row.employeeName || row.hostName || row.authorizedByFullName) {
    hostOrUnitText = `Anfitrión: ${row.employeeName || row.hostName || row.authorizedByFullName}`;
  } else if (row.unitName || row.destination) {
    hostOrUnitText = `Destino: ${row.unitName || row.destination}`;
  }

  // Fecha / Hora (para operaciones)
  let dateOrTimeText = "";
  if (row.date && (row.time || row.entryTime || row.receivedTime)) {
    const formattedD = formatDate(row.date);
    const formattedT = formatTime(row.time || row.entryTime || row.receivedTime);
    dateOrTimeText = `${formattedD} — ${formattedT}`;
  } else if (row.createdAt && !emailText && !phoneText) {
    dateOrTimeText = formatDateTime(row.createdAt);
  }

  // 3. EXTRAER CHIPS PERMITIDOS PARA EL PIE (Estado, Departamento, Cargo / Rol)
  // Estado
  let statusChipElement: React.ReactNode = null;
  if (row.isActive !== undefined || row.isRetired !== undefined) {
    const isActive = row.isActive !== false && row.isRetired !== true;
    statusChipElement = (
      <Chip
        size="small"
        variant="outlined"
        label={isActive ? "Activo" : "Inactivo"}
        color={isActive ? "success" : "error"}
        sx={{ fontWeight: 600, fontSize: "0.72rem", height: 24 }}
      />
    );
  } else if (row.clientStatus) {
    const isClientActive = row.clientStatus === "ACTIVE";
    statusChipElement = (
      <Chip
        size="small"
        variant="outlined"
        label={row.clientStatus}
        color={isClientActive ? "success" : "default"}
        sx={{ fontWeight: 600, fontSize: "0.72rem", height: 24 }}
      />
    );
  } else if (row.status) {
    statusChipElement = (
      <Chip
        size="small"
        variant="outlined"
        label={String(row.status)}
        color="primary"
        sx={{ fontWeight: 600, fontSize: "0.72rem", height: 24 }}
      />
    );
  }

  // Departamento
  let departmentText = "";
  const deptCol = columns.find((c) =>
    ["departmentname", "department", "departamento"].includes(c.field.toLowerCase()),
  );
  if (deptCol) {
    const rawDept = getColumnValue(deptCol, row);
    if (rawDept && rawDept !== "N/A" && rawDept !== "Sin asignar") {
      departmentText = typeof rawDept === "object" ? rawDept.name || "" : String(rawDept);
    }
  } else if (row.departmentName || row.department) {
    departmentText = String(row.departmentName || row.department);
  }

  // Cargo / Posición / Rol
  let positionText = "";
  const posCol = columns.find((c) =>
    ["positionname", "position", "cargo", "roles", "role"].includes(c.field.toLowerCase()),
  );
  if (posCol) {
    const rawPos = getColumnValue(posCol, row);
    if (rawPos && rawPos !== "N/A" && rawPos !== "Sin asignar" && rawPos !== "Sin Rol") {
      positionText = typeof rawPos === "object" ? rawPos.name || "" : String(rawPos);
    }
  } else if (row.positionName || row.position) {
    positionText = String(row.positionName || row.position);
  }

  // Categoría complementaria si no hay depto ni cargo (ej. Sector en Clientes/Prospectos o Tipo en Correspondencia)
  let otherCategoryChip: React.ReactNode = null;
  if (!departmentText && !positionText) {
    if (row.sector) {
      otherCategoryChip = (
        <Chip
          size="small"
          variant="outlined"
          label={String(row.sector)}
          sx={{ fontWeight: 600, fontSize: "0.72rem", height: 24, borderColor: "divider" }}
        />
      );
    } else if (row.correspondenceType) {
      otherCategoryChip = (
        <Chip
          size="small"
          variant="outlined"
          label={String(row.correspondenceType)}
          sx={{ fontWeight: 600, fontSize: "0.72rem", height: 24, borderColor: "divider" }}
        />
      );
    } else if (row.contractNumber) {
      otherCategoryChip = (
        <Chip
          size="small"
          variant="outlined"
          label={`Contrato: ${row.contractNumber}`}
          sx={{ fontWeight: 600, fontSize: "0.72rem", height: 24, borderColor: "divider" }}
        />
      );
    }
  }

  // 4. ACCIONES (Editar, Ver, Inhabilitar)
  const actionItems: React.ReactNode[] = [];
  if (customActions) {
    const rawCustom = customActions(row) || [];
    rawCustom.forEach((item, index) => {
      if (isValidElement(item)) {
        const itemProps = item.props as GridActionsCellItemProps;
        const iconNode = renderActionIcon(itemProps.icon);
        if (iconNode) {
          actionItems.push(
            <Tooltip
              key={item.key || `custom-card-action-${index}`}
              title={itemProps.label || ""}
            >
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  itemProps.onClick?.(e as any);
                }}
                sx={{ p: 0.5 }}
              >
                {iconNode}
              </IconButton>
            </Tooltip>,
          );
        }
      }
    });
  }

  if (onView) {
    actionItems.push(
      <Tooltip key="view" title="Ver Detalle">
        <IconButton
          size="small"
          color="default"
          onClick={(e) => {
            e.stopPropagation();
            onView(row);
          }}
          sx={{ p: 0.5 }}
        >
          <VisibilityIcon fontSize="small" />
        </IconButton>
      </Tooltip>,
    );
  }

  if (onEdit) {
    actionItems.push(
      <Tooltip key="edit" title="Editar">
        <IconButton
          size="small"
          color="primary"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(String(row.id), row);
          }}
          sx={{ p: 0.5 }}
        >
          <EditIcon fontSize="small" />
        </IconButton>
      </Tooltip>,
    );
  }

  const isRowInactive = row.isActive === false || row.isRetired === true;
  if (onDelete && !isRowInactive && row.slug !== "system" && row.id !== "system") {
    actionItems.push(
      <Tooltip key="delete" title={deleteActionLabel || "Inhabilitar"}>
        <IconButton
          size="small"
          color="error"
          onClick={(e) => {
            e.stopPropagation();
            if (onDeleteClick) {
              onDeleteClick(row.id, row);
            } else {
              onDelete(String(row.id), row);
            }
          }}
          sx={{ p: 0.5 }}
        >
          {deleteIcon || <RemoveCircleIcon fontSize="small" />}
        </IconButton>
      </Tooltip>,
    );
  }

  const handleCardClick = () => {
    if (onView) {
      onView(row);
    } else if (onEdit) {
      onEdit(String(row.id), row);
    }
  };

  const isInteractive = Boolean(onView || onEdit);

  return (
    <Paper
      variant="outlined"
      onClick={isInteractive ? handleCardClick : undefined}
      sx={{
        p: 2,
        borderRadius: 2.5,
        bgcolor: "background.paper",
        cursor: isInteractive ? "pointer" : "default",
        transition: "all 0.15s ease-in-out",
        "&:hover": {
          borderColor: "primary.main",
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        },
      }}
    >
      {/* CABECERA (HEADER): Avatar a la izquierda, Nombre (subtitle1) y Documento (body2) a la derecha */}
      <Box display="flex" alignItems="center" gap={2} mb={1.5}>
        <Avatar
          src={avatarSrc}
          sx={{
            width: 44,
            height: 44,
            bgcolor: avatarSrc ? "transparent" : "primary.main",
            color: "primary.contrastText",
            fontSize: "0.95rem",
            fontWeight: 700,
            border: "1px solid",
            borderColor: "divider",
            flexShrink: 0,
          }}
        >
          {initials}
        </Avatar>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 700,
              lineHeight: 1.25,
              color: "text.primary",
            }}
            noWrap
          >
            {primaryName}
          </Typography>
          {documentOrCode && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 0.25 }}
              noWrap
            >
              {documentOrCode}
            </Typography>
          )}
        </Box>
      </Box>

      {/* CUERPO (DATOS DE CONTACTO E INFO - SIN CHIPS, CON ÍCONOS OUTLINED) */}
      <Stack spacing={0.75} mb={2}>
        {clientText && (
          <Box display="flex" alignItems="center" gap={1}>
            <BusinessOutlinedIcon
              sx={{ fontSize: 18, color: "text.secondary", flexShrink: 0 }}
            />
            <Typography variant="body2" color="text.primary" noWrap>
              {clientText}
            </Typography>
          </Box>
        )}

        {emailText && (
          <Box display="flex" alignItems="center" gap={1}>
            <EmailOutlinedIcon
              sx={{ fontSize: 18, color: "text.secondary", flexShrink: 0 }}
            />
            <Typography variant="body2" color="text.primary" noWrap>
              {emailText}
            </Typography>
          </Box>
        )}

        {phoneText && (
          <Box display="flex" alignItems="center" gap={1}>
            <PhoneOutlinedIcon
              sx={{ fontSize: 18, color: "text.secondary", flexShrink: 0 }}
            />
            <Typography variant="body2" color="text.primary" noWrap>
              {phoneText}
            </Typography>
          </Box>
        )}

        {locationText && (
          <Box display="flex" alignItems="center" gap={1}>
            <LocationOnOutlinedIcon
              sx={{ fontSize: 18, color: "text.secondary", flexShrink: 0 }}
            />
            <Typography variant="body2" color="text.primary" noWrap>
              {locationText}
            </Typography>
          </Box>
        )}

        {hostOrUnitText && (
          <Box display="flex" alignItems="center" gap={1}>
            <PersonOutlineOutlinedIcon
              sx={{ fontSize: 18, color: "text.secondary", flexShrink: 0 }}
            />
            <Typography variant="body2" color="text.primary" noWrap>
              {hostOrUnitText}
            </Typography>
          </Box>
        )}

        {dateOrTimeText && (
          <Box display="flex" alignItems="center" gap={1}>
            <AccessTimeOutlinedIcon
              sx={{ fontSize: 18, color: "text.secondary", flexShrink: 0 }}
            />
            <Typography variant="body2" color="text.secondary" noWrap>
              {dateOrTimeText}
            </Typography>
          </Box>
        )}
      </Stack>

      {/* PIE DE TARJETA (CHIPS REALES Y ACCIONES) */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="flex-end"
        pt={1.5}
        borderTop="1px solid"
        borderColor="divider"
      >
        {/* A la izquierda: Chips permitidos (Estado, Departamento, Cargo) */}
        <Box display="flex" flexWrap="wrap" gap={1} alignItems="center">
          {statusChipElement}

          {departmentText && (
            <Chip
              size="small"
              variant="outlined"
              label={departmentText.toUpperCase()}
              sx={{
                fontWeight: 600,
                fontSize: "0.72rem",
                height: 24,
                borderColor: "divider",
              }}
            />
          )}

          {positionText && (
            <Chip
              size="small"
              variant="outlined"
              label={positionText}
              sx={{
                fontWeight: 600,
                fontSize: "0.72rem",
                height: 24,
                borderColor: "divider",
              }}
            />
          )}

          {otherCategoryChip}
        </Box>

        {/* A la derecha: Botones de Acción */}
        <Box display="flex" alignItems="center" gap={0.5}>
          {actionItems}
        </Box>
      </Box>
    </Paper>
  );
}
