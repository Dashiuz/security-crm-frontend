"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  Tooltip as MuiTooltip,
  TooltipProps,
  Stack,
  Chip,
  Divider,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from "@mui/material";

// High z-index Tooltip to float above the fullscreen canvas container (zIndex: 9999)
const Tooltip = (props: TooltipProps) => (
  <MuiTooltip
    {...props}
    PopperProps={{
      ...props.PopperProps,
      sx: {
        zIndex: 100000,
        ...((props.PopperProps?.sx as object) || {}),
      },
    }}
    slotProps={{
      ...props.slotProps,
      popper: {
        ...props.slotProps?.popper,
        sx: {
          zIndex: 100000,
          ...((props.slotProps?.popper as any)?.sx || {}),
        },
      },
    }}
  />
);
import {
  PanTool as PanToolIcon,
  Timeline as TimelineIcon,
  FlashOn as FlashOnIcon,
  Fence as FenceIcon,
  LinearScale as LinearScaleIcon,
  Videocam as VideocamIcon,
  Sensors as SensorsIcon,
  MeetingRoom as MeetingRoomIcon,
  DirectionsCar as DirectionsCarIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  RestartAlt as RestartAltIcon,
  CloudDone as CloudDoneIcon,
  CloudQueue as CloudQueueIcon,
  CheckCircle as CheckCircleIcon,
  FileDownload as FileDownloadIcon,
  Done as DoneIcon,
  AttachFile as AttachFileIcon,
  Delete as DeleteIcon,
  DeleteOutline as DeleteOutlineIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import {
  Stage,
  Layer,
  Image as KonvaImage,
  Line,
  Circle,
  Group,
  Text,
  Rect,
  Path,
} from "react-konva";
import { HttpClient } from "@/lib/api/client";
import { useNotification } from "@/providers/NotificationProvider";
import { MapboxMath, BoundingBox } from "@/lib/mapbox-math";
import { tokenStore } from "@/lib/api/token-store";

// Full HD Canvas Resolution
const CANVAS_WIDTH = 1920;
const CANVAS_HEIGHT = 1080;

function useBlobImage(
  studyId?: string,
  clientId?: string,
  directUrl?: string,
) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isCancelled = false;
    let objectUrl: string | null = null;

    async function load() {
      setLoading(true);
      try {
        const apiBase =
          process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000/api";
        const proxyUrl = studyId
          ? `${apiBase}/administrative/security-studies/${studyId}/image-file`
          : clientId
          ? `${apiBase}/administrative/security-studies/client/${clientId}/image-file`
          : null;

        if (proxyUrl) {
          const token = tokenStore.getToken();
          const headers: Record<string, string> = {};
          if (token) {
            headers["Authorization"] = `Bearer ${token}`;
          }

          let res = await fetch(proxyUrl, {
            headers,
            credentials: "include",
          });
          if (!res.ok && directUrl) {
            res = await fetch(directUrl);
          }

          if (res.ok) {
            const blob = await res.blob();
            objectUrl = URL.createObjectURL(blob);
            const img = new window.Image();
            img.onload = () => {
              if (!isCancelled) {
                setImage(img);
                setLoading(false);
              }
            };
            img.onerror = () => {
              if (!isCancelled) setLoading(false);
            };
            img.src = objectUrl;
            return;
          }
        }
      } catch (err) {
        console.warn("Could not fetch image as blob, trying direct img src:", err);
      }

      if (directUrl) {
        const img = new window.Image();
        img.onload = () => {
          if (!isCancelled) {
            setImage(img);
            setLoading(false);
          }
        };
        img.onerror = () => {
          if (!isCancelled) setLoading(false);
        };
        img.src = directUrl;
      } else {
        setLoading(false);
      }
    }

    load();

    return () => {
      isCancelled = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [studyId, clientId, directUrl]);

  return [image, loading] as const;
}

function parseGeofenceToPoints(
  geofence: any,
  bbox: BoundingBox,
): { x: number; y: number; lat: number; lng: number }[] {
  if (!geofence) return [];
  if (Array.isArray(geofence.points) && geofence.points.length > 0) {
    return geofence.points;
  }
  if (geofence.coordinates && Array.isArray(geofence.coordinates[0])) {
    const rawCoords = geofence.coordinates[0];
    const coords =
      rawCoords.length > 3 &&
      rawCoords[0][0] === rawCoords[rawCoords.length - 1][0] &&
      rawCoords[0][1] === rawCoords[rawCoords.length - 1][1]
        ? rawCoords.slice(0, -1)
        : rawCoords;

    return coords.map(([lng, lat]: [number, number]) => {
      const pt = MapboxMath.latLngToPixel(lat, lng, bbox, CANVAS_WIDTH, CANVAS_HEIGHT);
      return { x: Math.round(pt.x), y: Math.round(pt.y), lat, lng };
    });
  }
  return [];
}

export type DeviceStatus = "EXISTING" | "DAMAGED" | "PLANNED";

export interface CanvasDevice {
  id: string;
  type:
    | "camera_ptz"
    | "camera_bullet"
    | "camera_dome"
    | "sensor_motion"
    | "gatehouse"
    | "vehicle_barrier";
  name: string;
  status?: DeviceStatus;
  x: number;
  y: number;
  lat: number;
  lng: number;
}

export interface CanvasFacilityLine {
  id: string;
  type: "electric_fence" | "perimeter_wall" | "motion_barrier";
  status?: DeviceStatus;
  points: number[];
}

export interface CanvasState {
  version: string;
  geofencePolygon: {
    points: { x: number; y: number; lat: number; lng: number }[];
    isClosed: boolean;
  };
  facilities: CanvasFacilityLine[];
  devices: CanvasDevice[];
}

export interface SecurityCanvasEditorProps {
  studyId?: string;
  clientId?: string;
  mode?: "geofence" | "study";
  baseImageUrl: string;
  bbox: BoundingBox;
  initialCanvasState?: any;
  clientGeofence?: any;
  isReadOnly?: boolean;
  clientName: string;
  onPerimeterApproved?: () => void;
  onClose?: () => void;
}

export default function SecurityCanvasEditor({
  studyId,
  clientId,
  mode = studyId ? "study" : "geofence",
  baseImageUrl,
  bbox,
  initialCanvasState,
  clientGeofence,
  isReadOnly = false,
  clientName,
  onPerimeterApproved,
  onClose,
}: SecurityCanvasEditorProps) {
  const [image, imageLoading] = useBlobImage(studyId, clientId, baseImageUrl);
  const stageRef = useRef<any>(null);

  // Active Tool
  const [activeTool, setActiveTool] = useState<string>(
    mode === "geofence" ? "perimeter" : "select",
  );
  const [deviceTypeToAdd, setDeviceTypeToAdd] =
    useState<CanvasDevice["type"]>("camera_bullet");
  const [deviceStatusToAdd, setDeviceStatusToAdd] =
    useState<DeviceStatus>("EXISTING");
  const [hoveredDeviceId, setHoveredDeviceId] = useState<string | null>(null);
  const [facilityTypeToAdd, setFacilityTypeToAdd] = useState<
    "electric_fence" | "perimeter_wall" | "motion_barrier"
  >("electric_fence");

  // State of elements
  const [canvasData, setCanvasData] = useState<CanvasState>(() => {
    let initialPoints: { x: number; y: number; lat: number; lng: number }[] = [];
    let isClosed = false;

    if (initialCanvasState?.geofencePolygon?.points?.length) {
      initialPoints = initialCanvasState.geofencePolygon.points;
      isClosed = Boolean(initialCanvasState.geofencePolygon.isClosed);
    } else if (clientGeofence) {
      initialPoints = parseGeofenceToPoints(clientGeofence, bbox);
      isClosed = initialPoints.length >= 3;
    } else if (initialCanvasState?.geofencePolygon?.coordinates) {
      initialPoints = parseGeofenceToPoints(initialCanvasState.geofencePolygon, bbox);
      isClosed = initialPoints.length >= 3;
    }

    return {
      version: "1.0",
      geofencePolygon: {
        points: initialPoints,
        isClosed,
      },
      facilities: (initialCanvasState?.facilities || []).map((f: any) => ({
        ...f,
        status: f.status || "EXISTING",
      })),
      devices: (initialCanvasState?.devices || []).map((d: any) => ({
        ...d,
        status: d.status || "EXISTING",
      })),
    };
  });

  // Selected element for inspection and deletion
  const [selectedElement, setSelectedElement] = useState<{
    type: "device" | "facility" | "vertex";
    id: string;
    index?: number;
  } | null>(null);

  // Active in-progress drawing points
  const [drawingPoints, setDrawingPoints] = useState<{ x: number; y: number }[]>([]);

  // Stage Pan & Zoom
  const [stageScale, setStageScale] = useState(0.75); // initial fit for 1080p
  const [stagePos, setStagePos] = useState({ x: 40, y: 20 });

  // Autosaver state
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("saved");
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Approval modal
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [approving, setApproving] = useState(false);

  const { showError, showSuccess } = useNotification();

  // 1. Debounce Autosaver
  const triggerAutosave = useCallback(
    (newState: CanvasState) => {
      if (isReadOnly) return;
      setSaveStatus("saving");

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(async () => {
        try {
          if (mode === "geofence" && clientId) {
            if (newState.geofencePolygon?.points?.length >= 3) {
              const coords = newState.geofencePolygon.points.map((p) => [p.lng, p.lat]);
              coords.push([coords[0][0], coords[0][1]]);
              await HttpClient.patch(
                `/administrative/security-studies/client/${clientId}/geofence`,
                {
                  geofence: { type: "Polygon", coordinates: [coords] },
                },
              );
            }
          } else if (studyId) {
            await HttpClient.patch(
              `/administrative/security-studies/${studyId}/canvas`,
              {
                canvasState: newState,
              },
            );
          }
          setSaveStatus("saved");
        } catch (err: any) {
          setSaveStatus("idle");
          showError("Error al autoguardar el canva: " + (err.message || ""));
        }
      }, 1500);
    },
    [studyId, clientId, mode, isReadOnly, showError],
  );

  const updateCanvasState = (updater: (prev: CanvasState) => CanvasState) => {
    setCanvasData((prev) => {
      const next = updater(prev);
      triggerAutosave(next);
      return next;
    });
  };

  // 2. Wheel Zoom on Pointer
  const handleWheel = (e: any) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const scaleBy = 1.1;
    const direction = e.evt.deltaY < 0 ? 1 : -1;
    let newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;
    newScale = Math.max(0.3, Math.min(newScale, 4));

    setStageScale(newScale);
    setStagePos({
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    });
  };

  // 3. Stage Click / Tap for Drawing or Placing Devices
  const handleStageClick = (e: any) => {
    if (isReadOnly) return;

    const stage = stageRef.current;
    if (!stage) return;

    // Get pointer from stage or fallback to touch event coordinates
    const pointer =
      stage.getPointerPosition() ||
      (() => {
        const touch = e.evt?.changedTouches?.[0] || e.evt?.touches?.[0];
        const rect = stage.container()?.getBoundingClientRect();
        return touch && rect
          ? { x: touch.clientX - rect.left, y: touch.clientY - rect.top }
          : null;
      })();

    if (!pointer) return;

    const x = Math.round((pointer.x - stage.x()) / stage.scaleX());
    const y = Math.round((pointer.y - stage.y()) / stage.scaleY());

    if (x < 0 || x > CANVAS_WIDTH || y < 0 || y > CANVAS_HEIGHT) return;

    if (activeTool === "select") {
      setSelectedElement(null);
      return;
    }

    const gps = MapboxMath.pixelToLatLng(x, y, bbox, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Geofencing Perimeter Tool
    if (activeTool === "perimeter") {
      if (mode === "study") {
        showError("El perímetro geofence está centralizado en el Cliente y es de solo lectura en el estudio.");
        return;
      }
      if (canvasData.geofencePolygon.isClosed) return;

      const newPoint = { x, y, lat: gps.lat, lng: gps.lng };
      updateCanvasState((prev) => ({
        ...prev,
        geofencePolygon: {
          ...prev.geofencePolygon,
          points: [...prev.geofencePolygon.points, newPoint],
        },
      }));
    }

    // Facility Tool (Electric fence or wall)
    else if (activeTool === "facility") {
      setDrawingPoints((prev) => [...prev, { x, y }]);
    }

    // Security Device Tool
    else if (activeTool === "device") {
      const newDevice: CanvasDevice = {
        id: "dev_" + Date.now(),
        type: deviceTypeToAdd,
        status: deviceStatusToAdd,
        name: getDeviceDefaultName(deviceTypeToAdd),
        x,
        y,
        lat: gps.lat,
        lng: gps.lng,
      };

      updateCanvasState((prev) => ({
        ...prev,
        devices: [...prev.devices, newDevice],
      }));
    }
  };

  const finishPerimeter = () => {
    if (canvasData.geofencePolygon.points.length < 3) {
      showError("El perímetro requiere al menos 3 vértices para cerrarse.");
      return;
    }
    updateCanvasState((prev) => ({
      ...prev,
      geofencePolygon: {
        ...prev.geofencePolygon,
        isClosed: true,
      },
    }));
    setActiveTool("select");
    showSuccess("Polígono perimetral cerrado exitosamente.");
  };

  const resetPerimeter = () => {
    updateCanvasState((prev) => ({
      ...prev,
      geofencePolygon: {
        points: [],
        isClosed: false,
      },
    }));
  };

  const finishFacilityLine = () => {
    if (drawingPoints.length < 2) {
      setDrawingPoints([]);
      return;
    }
    const flatPoints: number[] = [];
    drawingPoints.forEach((p) => flatPoints.push(p.x, p.y));

    const newFacility: CanvasFacilityLine = {
      id: "fac_" + Date.now(),
      type: facilityTypeToAdd,
      status: deviceStatusToAdd,
      points: flatPoints,
    };

    updateCanvasState((prev) => ({
      ...prev,
      facilities: [...prev.facilities, newFacility],
    }));
    setDrawingPoints([]);
    setActiveTool("select");
  };

  // Device Drag End (update position and recalculate Lat/Lng)
  const handleDeviceDragEnd = (devId: string, e: any) => {
    if (isReadOnly) return;
    const x = Math.round(e.target.x());
    const y = Math.round(e.target.y());
    const gps = MapboxMath.pixelToLatLng(x, y, bbox, CANVAS_WIDTH, CANVAS_HEIGHT);

    updateCanvasState((prev) => ({
      ...prev,
      devices: prev.devices.map((d) =>
        d.id === devId ? { ...d, x, y, lat: gps.lat, lng: gps.lng } : d,
      ),
    }));
  };

  const removeDevice = (devId: string) => {
    if (isReadOnly) return;
    updateCanvasState((prev) => ({
      ...prev,
      devices: prev.devices.filter((d) => d.id !== devId),
    }));
    setSelectedElement((curr) => (curr?.id === devId ? null : curr));
    showSuccess("Dispositivo eliminado del plano.");
  };

  const handleChangeDeviceStatus = (devId: string, newStatus: DeviceStatus) => {
    if (isReadOnly) return;
    updateCanvasState((prev) => ({
      ...prev,
      devices: prev.devices.map((d) =>
        d.id === devId ? { ...d, status: newStatus } : d,
      ),
    }));
  };

  const handleChangeFacilityStatus = (facId: string, newStatus: DeviceStatus) => {
    if (isReadOnly) return;
    updateCanvasState((prev) => ({
      ...prev,
      facilities: prev.facilities.map((f) =>
        f.id === facId ? { ...f, status: newStatus } : f,
      ),
    }));
  };

  const removeFacility = (facId: string) => {
    if (isReadOnly) return;
    updateCanvasState((prev) => ({
      ...prev,
      facilities: prev.facilities.filter((f) => f.id !== facId),
    }));
    setSelectedElement((curr) => (curr?.id === facId ? null : curr));
    showSuccess("Cerramiento/Línea eliminada del plano.");
  };

  const removeVertex = (vertexIndex: number) => {
    if (isReadOnly) return;
    updateCanvasState((prev) => {
      const nextPoints = prev.geofencePolygon.points.filter((_, idx) => idx !== vertexIndex);
      return {
        ...prev,
        geofencePolygon: {
          ...prev.geofencePolygon,
          points: nextPoints,
          isClosed: nextPoints.length >= 3 ? prev.geofencePolygon.isClosed : false,
        },
      };
    });
    setSelectedElement((curr) =>
      curr?.type === "vertex" && curr.index === vertexIndex ? null : curr,
    );
    showSuccess("Vértice perimetral eliminado.");
  };

  const handleDeleteSelected = () => {
    if (!selectedElement || isReadOnly) return;
    if (selectedElement.type === "device") {
      removeDevice(selectedElement.id);
    } else if (selectedElement.type === "facility") {
      removeFacility(selectedElement.id);
    } else if (
      selectedElement.type === "vertex" &&
      typeof selectedElement.index === "number"
    ) {
      removeVertex(selectedElement.index);
    }
  };

  const getSelectedElementName = (): string => {
    if (!selectedElement) return "";
    if (selectedElement.type === "device") {
      const dev = canvasData.devices.find((d) => d.id === selectedElement.id);
      return dev ? `${dev.name} (${getDeviceStatusLabel(dev.status)})` : "Dispositivo";
    }
    if (selectedElement.type === "facility") {
      const fac = canvasData.facilities.find((f) => f.id === selectedElement.id);
      const name =
        fac?.type === "electric_fence"
          ? "Cercado Eléctrico"
          : fac?.type === "perimeter_wall"
          ? "Muro Perimetral"
          : "Sensor de Movimiento (Trazos)";
      return fac ? `${name} (${getDeviceStatusLabel(fac.status)})` : "Cerramiento";
    }
    if (selectedElement.type === "vertex") {
      return `Vértice #${(selectedElement.index ?? 0) + 1} de Geofencing`;
    }
    return "";
  };

  const canvasStats = React.useMemo(() => {
    const allItems = [
      ...canvasData.devices.map((d) => d.status || "EXISTING"),
      ...canvasData.facilities.map((f) => f.status || "EXISTING"),
    ];
    const existing = allItems.filter((st) => st === "EXISTING").length;
    const planned = allItems.filter((st) => st === "PLANNED").length;
    const damaged = allItems.filter((st) => st === "DAMAGED").length;
    return {
      existing,
      planned,
      damaged,
      total: allItems.length,
      devicesCount: canvasData.devices.length,
      facilitiesCount: canvasData.facilities.length,
    };
  }, [canvasData.devices, canvasData.facilities]);

  // Keyboard shortcut listener (Delete/Backspace to delete selected, Escape to deselect)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedElement && !isReadOnly) {
          e.preventDefault();
          handleDeleteSelected();
        }
      } else if (e.key === "Escape") {
        setSelectedElement(null);
        setActiveTool("select");
        setDrawingPoints([]);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedElement, isReadOnly, canvasData]);

  // Perimeter Vertex Drag End
  const handleVertexDragEnd = (index: number, e: any) => {
    if (isReadOnly) return;
    const x = Math.round(e.target.x());
    const y = Math.round(e.target.y());
    const gps = MapboxMath.pixelToLatLng(x, y, bbox, CANVAS_WIDTH, CANVAS_HEIGHT);

    updateCanvasState((prev) => {
      const nextPoints = [...prev.geofencePolygon.points];
      nextPoints[index] = { x, y, lat: gps.lat, lng: gps.lng };
      return {
        ...prev,
        geofencePolygon: {
          ...prev.geofencePolygon,
          points: nextPoints,
        },
      };
    });
  };

  // 4. Perimeter Approval (SSOT Geofencing in PostGIS / Client)
  const handleConfirmApprovePerimeter = async () => {
    if (canvasData.geofencePolygon.points.length < 3) {
      showError("Debe haber un perímetro de al menos 3 vértices para aprobar.");
      return;
    }

    setApproving(true);
    try {
      const coords = canvasData.geofencePolygon.points.map((p) => [p.lng, p.lat]);
      coords.push([coords[0][0], coords[0][1]]);

      const geoJson = {
        type: "Polygon",
        coordinates: [coords],
      };

      if (mode === "geofence" && clientId) {
        await HttpClient.patch(
          `/administrative/security-studies/client/${clientId}/geofence`,
          {
            geofence: geoJson,
          },
        );
        showSuccess("¡Geofence perimetral aprobado y guardado en el Cliente!");
      } else if (studyId) {
        await HttpClient.post(
          `/administrative/security-studies/${studyId}/approve-perimeter`,
          {
            perimeterGeoJson: geoJson,
          },
        );
        showSuccess("¡Perímetro aprobado y sincronizado con el Cliente (SSOT)!");
      }

      setApprovalDialogOpen(false);
      if (onPerimeterApproved) onPerimeterApproved();
    } catch (err: any) {
      showError(err.message || "Error al aprobar perímetro.");
    } finally {
      setApproving(false);
    }
  };

  // 5. Download Snapshot
  const handleDownloadSnapshot = () => {
    const stage = stageRef.current;
    if (!stage) return;
    const dataUrl = stage.toDataURL({ pixelRatio: 2 });
    const link = document.createElement("a");
    link.download = `Estudio_Seguridad_${clientName.replace(/\s+/g, "_")}.png`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const perimeterPointsFlat: number[] = [];
  canvasData.geofencePolygon.points.forEach((p) => {
    perimeterPointsFlat.push(p.x, p.y);
  });

  return (
    <Box sx={{ width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Top Header Bar */}
      <Paper
        elevation={2}
        sx={{
          px: { xs: 1, sm: 2 },
          py: { xs: 0.75, sm: 1.2 },
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "nowrap",
          gap: { xs: 1, sm: 1.5 },
          borderRadius: 0,
          borderBottom: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
          minHeight: { xs: 48, sm: 54 },
          overflow: "hidden",
        }}
      >
        <Stack direction="row" alignItems="center" spacing={{ xs: 1, sm: 1.5 }} sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            variant="subtitle1"
            fontWeight={700}
            noWrap
            title={clientName}
            sx={{
              fontSize: { xs: "0.85rem", sm: "0.95rem", md: "1.05rem" },
              maxWidth: { xs: 130, sm: 240, md: 450 },
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {mode === "geofence"
              ? `Geofence: ${clientName}`
              : `Canva: ${clientName}`}
          </Typography>

          {/* Status Chip */}
          {mode === "geofence" ? (
            <Chip
              label="SSOT"
              color="secondary"
              size="small"
              sx={{
                fontWeight: 700,
                height: 24,
                display: { xs: "none", sm: "inline-flex" },
              }}
            />
          ) : isReadOnly ? (
            <Chip
              label="LECTURA"
              color="default"
              size="small"
              sx={{
                fontWeight: 600,
                height: 24,
                display: { xs: "none", sm: "inline-flex" },
              }}
            />
          ) : (
            <Chip
              label="ACTIVO"
              color="success"
              size="small"
              sx={{
                fontWeight: 600,
                height: 24,
                display: { xs: "none", sm: "inline-flex" },
              }}
            />
          )}

          {/* Cloud save indicator */}
          {!isReadOnly && (
            <Tooltip
              title={
                saveStatus === "saving"
                  ? "Guardando cambios en la nube..."
                  : saveStatus === "saved"
                  ? "Todos los cambios están guardados en la nube"
                  : "Hay cambios locales pendientes de guardar"
              }
            >
              <Chip
                icon={
                  saveStatus === "saving" ? (
                    <CircularProgress size={12} color="inherit" />
                  ) : saveStatus === "saved" ? (
                    <CloudDoneIcon />
                  ) : (
                    <CloudQueueIcon />
                  )
                }
                label={
                  saveStatus === "saving"
                    ? "Guardando..."
                    : saveStatus === "saved"
                    ? "Guardado"
                    : "Pendiente"
                }
                size="small"
                color={saveStatus === "saved" ? "primary" : "default"}
                variant="outlined"
                sx={{
                  height: 24,
                  "& .MuiChip-label": {
                    display: { xs: "none", md: "block" },
                    px: 1,
                    fontSize: "0.75rem",
                  },
                  "& .MuiChip-icon": {
                    ml: { xs: "6px", md: "8px" },
                    mr: { xs: "-4px", md: "4px" },
                  },
                }}
              />
            </Tooltip>
          )}
        </Stack>

        <Stack
          direction="row"
          alignItems="center"
          spacing={{ xs: 0.5, sm: 1 }}
          sx={{ flexShrink: 0 }}
        >
          {/* Zoom Controls */}
          <Stack direction="row" alignItems="center" spacing={0.2}>
            <Tooltip title="Acercar Vista">
              <IconButton
                size="small"
                onClick={() => setStageScale((s) => Math.min(s * 1.2, 4))}
                sx={{ p: { xs: 0.5, sm: 0.8 } }}
              >
                <ZoomInIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Alejar Vista">
              <IconButton
                size="small"
                onClick={() => setStageScale((s) => Math.max(s / 1.2, 0.3))}
                sx={{ p: { xs: 0.5, sm: 0.8 } }}
              >
                <ZoomOutIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Restablecer Vista y Centrar">
              <IconButton
                size="small"
                onClick={() => {
                  setStageScale(0.75);
                  setStagePos({ x: 40, y: 20 });
                }}
                sx={{ p: { xs: 0.5, sm: 0.8 } }}
              >
                <RestartAltIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>

          <Divider orientation="vertical" flexItem sx={{ mx: 0.5, display: { xs: "none", sm: "block" } }} />

          {/* Export Plan button: Desktop button vs Mobile IconButton */}
          <Tooltip title="Exportar Plano (PNG)">
            <Box>
              <Button
                size="small"
                variant="outlined"
                startIcon={<FileDownloadIcon />}
                onClick={handleDownloadSnapshot}
                sx={{
                  textTransform: "none",
                  whiteSpace: "nowrap",
                  display: { xs: "none", sm: "inline-flex" },
                  height: 30,
                  fontSize: "0.8rem",
                }}
              >
                Exportar Plano (PNG)
              </Button>
              <IconButton
                size="small"
                color="primary"
                onClick={handleDownloadSnapshot}
                sx={{
                  display: { xs: "inline-flex", sm: "none" },
                  p: 0.5,
                  border: "1px solid",
                  borderColor: "primary.light",
                }}
              >
                <FileDownloadIcon fontSize="small" />
              </IconButton>
            </Box>
          </Tooltip>

          {/* Approve Perimeter button (Only in Geofence mode) */}
          {!isReadOnly && mode === "geofence" && (
            <Button
              size="small"
              variant="contained"
              color="secondary"
              startIcon={<CheckCircleIcon />}
              onClick={() => setApprovalDialogOpen(true)}
              disabled={canvasData.geofencePolygon.points.length < 3}
              sx={{
                textTransform: "none",
                fontWeight: 700,
                height: 30,
                fontSize: "0.8rem",
                whiteSpace: "nowrap",
                px: { xs: 1, sm: 1.5 },
              }}
            >
              Aprobar
            </Button>
          )}

          {/* Close button: Desktop button vs Mobile IconButton */}
          {onClose && (
            <Tooltip title="Cerrar">
              <Box>
                <Button
                  size="small"
                  onClick={onClose}
                  sx={{
                    textTransform: "none",
                    display: { xs: "none", sm: "inline-flex" },
                    height: 30,
                    fontSize: "0.8rem",
                  }}
                >
                  Cerrar
                </Button>
                <IconButton
                  size="small"
                  onClick={onClose}
                  sx={{
                    display: { xs: "inline-flex", sm: "none" },
                    p: 0.5,
                  }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
            </Tooltip>
          )}
        </Stack>
      </Paper>

      {/* Main Workspace Area */}
      <Box sx={{ display: "flex", flex: 1, position: "relative", overflow: "hidden" }}>
        {/* Left Toolbar (CAD Controls with Rich Tooltips) */}
        {!isReadOnly && (
          <Paper
            elevation={2}
            sx={{
              width: 76,
              p: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 1.2,
              borderRadius: 0,
              borderRight: "1px solid",
              borderColor: "divider",
              zIndex: 10,
              bgcolor: "background.paper",
            }}
          >
            {/* Tool 1: Pan / Select */}
            <Tooltip
              arrow
              placement="right"
              title={
                <Box sx={{ p: 0.5, maxWidth: 220 }}>
                  <Typography variant="subtitle2" fontWeight={700} color="warning.light">
                    Mover / Paneo (Pan)
                  </Typography>
                  <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
                    Arrastra el lienzo CAD para desplazarte. Rueda del mouse para acercar/alejar.
                  </Typography>
                </Box>
              }
            >
              <IconButton
                color={activeTool === "select" ? "primary" : "default"}
                onClick={() => setActiveTool("select")}
                sx={{
                  bgcolor: activeTool === "select" ? "action.selected" : "transparent",
                  border: activeTool === "select" ? "1px solid" : "none",
                  borderColor: "primary.main",
                }}
              >
                <PanToolIcon />
              </IconButton>
            </Tooltip>

            <Divider sx={{ width: "100%" }} />

            {/* Tool 2: Perimeter (Only in geofence mode) */}
            {mode === "geofence" && (
              <Tooltip
                arrow
                placement="right"
                title={
                  <Box sx={{ p: 0.5, maxWidth: 220 }}>
                    <Typography variant="subtitle2" fontWeight={700} color="warning.light">
                      Polígono Perimetral (Geofence)
                    </Typography>
                    <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
                      Haz clic para marcar los vértices exteriores del conjunto. Base matemática para el control de rondas GPS.
                    </Typography>
                  </Box>
                }
              >
                <IconButton
                  color={activeTool === "perimeter" ? "secondary" : "default"}
                  onClick={() => setActiveTool("perimeter")}
                  sx={{
                    bgcolor: activeTool === "perimeter" ? "action.selected" : "transparent",
                    border: activeTool === "perimeter" ? "1px solid" : "none",
                    borderColor: "secondary.main",
                  }}
                >
                  <TimelineIcon />
                </IconButton>
              </Tooltip>
            )}

            {/* Tools: Facilities and Devices (Only in study mode) */}
            {mode === "study" && (
              <>
                <Tooltip
                  arrow
                  placement="right"
                  title={
                    <Box sx={{ p: 0.5, maxWidth: 220 }}>
                      <Typography variant="subtitle2" fontWeight={700} color="warning.light">
                        Cercado Eléctrico
                      </Typography>
                      <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
                        Traza líneas punteadas de cerramientos electrificados perimetrales.
                      </Typography>
                    </Box>
                  }
                >
                  <IconButton
                    color={
                      activeTool === "facility" && facilityTypeToAdd === "electric_fence"
                        ? "warning"
                        : "default"
                    }
                    onClick={() => {
                      setActiveTool("facility");
                      setFacilityTypeToAdd("electric_fence");
                    }}
                    sx={{
                      bgcolor:
                        activeTool === "facility" && facilityTypeToAdd === "electric_fence"
                          ? "action.selected"
                          : "transparent",
                    }}
                  >
                    <FlashOnIcon />
                  </IconButton>
                </Tooltip>

                {/* Tool: Perimeter Wall */}
                <Tooltip
                  arrow
                  placement="right"
                  title={
                    <Box sx={{ p: 0.5, maxWidth: 220 }}>
                      <Typography variant="subtitle2" fontWeight={700} color="warning.light">
                        Muro / Cerramiento Físico
                      </Typography>
                      <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
                        Traza muros continuos sólidos, rejas o concertinas de seguridad.
                      </Typography>
                    </Box>
                  }
                >
                  <IconButton
                    color={
                      activeTool === "facility" && facilityTypeToAdd === "perimeter_wall"
                        ? "warning"
                        : "default"
                    }
                    onClick={() => {
                      setActiveTool("facility");
                      setFacilityTypeToAdd("perimeter_wall");
                    }}
                    sx={{
                      bgcolor:
                        activeTool === "facility" && facilityTypeToAdd === "perimeter_wall"
                          ? "action.selected"
                          : "transparent",
                    }}
                  >
                    <FenceIcon />
                  </IconButton>
                </Tooltip>

                {/* Tool: Motion Sensor Barrier (Trazos) */}
                <Tooltip
                  arrow
                  placement="right"
                  title={
                    <Box sx={{ p: 0.5, maxWidth: 220 }}>
                      <Typography variant="subtitle2" fontWeight={700} color="warning.light">
                        Sensor de Movimiento (Trazos)
                      </Typography>
                      <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
                        Traza líneas de puntitos de barreras fotoeléctricas o sensores infrarrojos por tramos.
                      </Typography>
                    </Box>
                  }
                >
                  <IconButton
                    color={
                      activeTool === "facility" && facilityTypeToAdd === "motion_barrier"
                        ? "warning"
                        : "default"
                    }
                    onClick={() => {
                      setActiveTool("facility");
                      setFacilityTypeToAdd("motion_barrier");
                    }}
                    sx={{
                      bgcolor:
                        activeTool === "facility" && facilityTypeToAdd === "motion_barrier"
                          ? "action.selected"
                          : "transparent",
                    }}
                  >
                    <LinearScaleIcon />
                  </IconButton>
                </Tooltip>

                <Divider sx={{ width: "100%" }} />

                {/* Device Tools */}
                <Tooltip
                  arrow
                  placement="right"
                  title={
                    <Box sx={{ p: 0.5, maxWidth: 220 }}>
                      <Typography variant="subtitle2" fontWeight={700} color="warning.light">
                        Cámara Bullet (Fija Exterior)
                      </Typography>
                      <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
                        Cámara exterior fija para vigilancia continua de perímetros y accesos.
                      </Typography>
                    </Box>
                  }
                >
                  <IconButton
                    color={
                      activeTool === "device" && deviceTypeToAdd === "camera_bullet"
                        ? "primary"
                        : "default"
                    }
                    onClick={() => {
                      setActiveTool("device");
                      setDeviceTypeToAdd("camera_bullet");
                    }}
                    sx={{
                      bgcolor:
                        activeTool === "device" && deviceTypeToAdd === "camera_bullet"
                          ? "action.selected"
                          : "transparent",
                    }}
                  >
                    <VideocamIcon />
                  </IconButton>
                </Tooltip>

                <Tooltip
                  arrow
                  placement="right"
                  title={
                    <Box sx={{ p: 0.5, maxWidth: 220 }}>
                      <Typography variant="subtitle2" fontWeight={700} color="warning.light">
                        Cámara PTZ (Motorizada 360°)
                      </Typography>
                      <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
                        Cámara motorizada con zoom de largo alcance para grandes áreas abiertas.
                      </Typography>
                    </Box>
                  }
                >
                  <IconButton
                    color={
                      activeTool === "device" && deviceTypeToAdd === "camera_ptz"
                        ? "primary"
                        : "default"
                    }
                    onClick={() => {
                      setActiveTool("device");
                      setDeviceTypeToAdd("camera_ptz");
                    }}
                    sx={{
                      bgcolor:
                        activeTool === "device" && deviceTypeToAdd === "camera_ptz"
                          ? "action.selected"
                          : "transparent",
                    }}
                  >
                    <VideocamIcon sx={{ transform: "rotate(45deg)" }} />
                  </IconButton>
                </Tooltip>

                <Tooltip
                  arrow
                  placement="right"
                  title={
                    <Box sx={{ p: 0.5, maxWidth: 220 }}>
                      <Typography variant="subtitle2" fontWeight={700} color="warning.light">
                        Sensor de Movimiento / Intrusión
                      </Typography>
                      <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
                        Sensor volumétrico infrarrojo o detector puntual de paso.
                      </Typography>
                    </Box>
                  }
                >
                  <IconButton
                    color={
                      activeTool === "device" && deviceTypeToAdd === "sensor_motion"
                        ? "warning"
                        : "default"
                    }
                    onClick={() => {
                      setActiveTool("device");
                      setDeviceTypeToAdd("sensor_motion");
                    }}
                    sx={{
                      bgcolor:
                        activeTool === "device" && deviceTypeToAdd === "sensor_motion"
                          ? "action.selected"
                          : "transparent",
                    }}
                  >
                    <SensorsIcon />
                  </IconButton>
                </Tooltip>

                <Tooltip
                  arrow
                  placement="right"
                  title={
                    <Box sx={{ p: 0.5, maxWidth: 220 }}>
                      <Typography variant="subtitle2" fontWeight={700} color="warning.light">
                        Portería / Puesto de Control
                      </Typography>
                      <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
                        Garita física, recepción o punto fijo de guardas de seguridad.
                      </Typography>
                    </Box>
                  }
                >
                  <IconButton
                    color={
                      activeTool === "device" && deviceTypeToAdd === "gatehouse"
                        ? "success"
                        : "default"
                    }
                    onClick={() => {
                      setActiveTool("device");
                      setDeviceTypeToAdd("gatehouse");
                    }}
                    sx={{
                      bgcolor:
                        activeTool === "device" && deviceTypeToAdd === "gatehouse"
                          ? "action.selected"
                          : "transparent",
                    }}
                  >
                    <MeetingRoomIcon />
                  </IconButton>
                </Tooltip>

                <Tooltip
                  arrow
                  placement="right"
                  title={
                    <Box sx={{ p: 0.5, maxWidth: 220 }}>
                      <Typography variant="subtitle2" fontWeight={700} color="warning.light">
                        Talanquera / Barrera Vehicular
                      </Typography>
                      <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
                        Punto de control de entrada y salida de vehículos con barrera automática.
                      </Typography>
                    </Box>
                  }
                >
                  <IconButton
                    color={
                      activeTool === "device" && deviceTypeToAdd === "vehicle_barrier"
                        ? "secondary"
                        : "default"
                    }
                    onClick={() => {
                      setActiveTool("device");
                      setDeviceTypeToAdd("vehicle_barrier");
                    }}
                    sx={{
                      bgcolor:
                        activeTool === "device" && deviceTypeToAdd === "vehicle_barrier"
                          ? "action.selected"
                          : "transparent",
                    }}
                  >
                    <DirectionsCarIcon />
                  </IconButton>
                </Tooltip>

                {/* Status Picker for New Devices */}
                <Divider sx={{ width: "100%", my: 0.5 }} />
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: "0.6rem",
                    fontWeight: 800,
                    color: "text.secondary",
                    textAlign: "center",
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  Estado
                </Typography>

                <Tooltip
                  arrow
                  placement="right"
                  title={
                    <Box sx={{ p: 0.5 }}>
                      <Typography variant="subtitle2" fontWeight={700} sx={{ color: "#10B981" }}>
                        Existente (Verde)
                      </Typography>
                      <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
                        Equipo ya instalado y operativo en el cliente.
                      </Typography>
                    </Box>
                  }
                >
                  <IconButton
                    size="small"
                    onClick={() => {
                      setDeviceStatusToAdd("EXISTING");
                    }}
                    sx={{
                      width: 32,
                      height: 32,
                      bgcolor:
                        deviceStatusToAdd === "EXISTING"
                          ? "rgba(16, 185, 129, 0.25)"
                          : "transparent",
                      border: "2px solid",
                      borderColor:
                        deviceStatusToAdd === "EXISTING"
                          ? "#10B981"
                          : "rgba(16, 185, 129, 0.4)",
                      "&:hover": {
                        bgcolor: "rgba(16, 185, 129, 0.15)",
                        borderColor: "#10B981",
                      },
                    }}
                  >
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: "50%",
                        bgcolor: "#10B981",
                        boxShadow:
                          deviceStatusToAdd === "EXISTING"
                            ? "0 0 6px #10B981"
                            : "none",
                      }}
                    />
                  </IconButton>
                </Tooltip>

                <Tooltip
                  arrow
                  placement="right"
                  title={
                    <Box sx={{ p: 0.5 }}>
                      <Typography variant="subtitle2" fontWeight={700} sx={{ color: "#3B82F6" }}>
                        A Implementar / Nuevo (Azul)
                      </Typography>
                      <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
                        Propuesta de nuevo equipo a instalar (nuevo negocio).
                      </Typography>
                    </Box>
                  }
                >
                  <IconButton
                    size="small"
                    onClick={() => {
                      setDeviceStatusToAdd("PLANNED");
                    }}
                    sx={{
                      width: 32,
                      height: 32,
                      bgcolor:
                        deviceStatusToAdd === "PLANNED"
                          ? "rgba(59, 130, 246, 0.25)"
                          : "transparent",
                      border: "2px solid",
                      borderColor:
                        deviceStatusToAdd === "PLANNED"
                          ? "#3B82F6"
                          : "rgba(59, 130, 246, 0.4)",
                      "&:hover": {
                        bgcolor: "rgba(59, 130, 246, 0.15)",
                        borderColor: "#3B82F6",
                      },
                    }}
                  >
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: "50%",
                        bgcolor: "#3B82F6",
                        boxShadow:
                          deviceStatusToAdd === "PLANNED"
                            ? "0 0 6px #3B82F6"
                            : "none",
                      }}
                    />
                  </IconButton>
                </Tooltip>

                <Tooltip
                  arrow
                  placement="right"
                  title={
                    <Box sx={{ p: 0.5 }}>
                      <Typography variant="subtitle2" fontWeight={700} sx={{ color: "#EF4444" }}>
                        Dañada / Inoperativa (Rojo)
                      </Typography>
                      <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
                        Equipo averiado, quemado o que requiere mantenimiento.
                      </Typography>
                    </Box>
                  }
                >
                  <IconButton
                    size="small"
                    onClick={() => {
                      setDeviceStatusToAdd("DAMAGED");
                    }}
                    sx={{
                      width: 32,
                      height: 32,
                      bgcolor:
                        deviceStatusToAdd === "DAMAGED"
                          ? "rgba(239, 68, 68, 0.25)"
                          : "transparent",
                      border: "2px solid",
                      borderColor:
                        deviceStatusToAdd === "DAMAGED"
                          ? "#EF4444"
                          : "rgba(239, 68, 68, 0.4)",
                      "&:hover": {
                        bgcolor: "rgba(239, 68, 68, 0.15)",
                        borderColor: "#EF4444",
                      },
                    }}
                  >
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: "50%",
                        bgcolor: "#EF4444",
                        boxShadow:
                          deviceStatusToAdd === "DAMAGED"
                            ? "0 0 6px #EF4444"
                            : "none",
                      }}
                    />
                  </IconButton>
                </Tooltip>
              </>
            )}

            <Divider sx={{ width: "100%" }} />

            {/* Tool: Eraser */}
            <Tooltip
              arrow
              placement="right"
              title={
                <Box sx={{ p: 0.5, maxWidth: 220 }}>
                  <Typography variant="subtitle2" fontWeight={700} color="warning.light">
                    Goma de Borrar / Eliminar
                  </Typography>
                  <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
                    Haz clic directo sobre cualquier cámara, sensor, muro, cercado o vértice para eliminarlo inmediatamente del plano.
                  </Typography>
                </Box>
              }
            >
              <IconButton
                color={activeTool === "eraser" ? "error" : "default"}
                onClick={() => {
                  setActiveTool("eraser");
                  setSelectedElement(null);
                }}
                sx={{
                  bgcolor: activeTool === "eraser" ? "action.selected" : "transparent",
                  border: activeTool === "eraser" ? "1px solid" : "none",
                  borderColor: "error.main",
                }}
              >
                <DeleteOutlineIcon />
              </IconButton>
            </Tooltip>
          </Paper>
        )}

        {/* Floating Contextual Instruction Bar */}
        <Box
          sx={{
            position: "absolute",
            top: 12,
            left: !isReadOnly ? 96 : 16,
            zIndex: 10,
            bgcolor: "rgba(0,0,0,0.85)",
            backdropFilter: "blur(6px)",
            color: "white",
            px: 2,
            py: 0.8,
            borderRadius: 2,
            display: "flex",
            alignItems: "center",
            gap: 2,
            border: "1px solid rgba(255,255,255,0.15)",
            pointerEvents:
              selectedElement ||
              activeTool === "perimeter" ||
              activeTool === "facility"
                ? "auto"
                : "none",
          }}
        >
          {imageLoading && (
            <Stack direction="row" alignItems="center" spacing={1}>
              <CircularProgress size={16} color="inherit" />
              <Typography variant="caption">Cargando fotografía satelital Full HD...</Typography>
            </Stack>
          )}

          {/* Selected Element Action Bar */}
          {selectedElement && !isReadOnly && (
            <Stack
              direction="row"
              alignItems="center"
              spacing={1.5}
              sx={{
                bgcolor: "rgba(20, 25, 40, 0.95)",
                px: 1.5,
                py: 0.5,
                borderRadius: 1.5,
                border: "1px solid rgba(255, 255, 255, 0.2)",
              }}
            >
              <Typography variant="body2" sx={{ fontSize: "0.85rem", fontWeight: 700, color: "#fff" }}>
                Seleccionado: {getSelectedElementName()}
              </Typography>

              {(selectedElement.type === "device" || selectedElement.type === "facility") && (
                <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mx: 0.5 }}>
                  <Typography
                    variant="caption"
                    sx={{ color: "rgba(255, 255, 255, 0.6)", fontSize: "0.72rem", mr: 0.5 }}
                  >
                    Estado:
                  </Typography>
                  {(["EXISTING", "PLANNED", "DAMAGED"] as DeviceStatus[]).map((st) => {
                    let isCurrent = false;
                    if (selectedElement.type === "device") {
                      const selDev = canvasData.devices.find((d) => d.id === selectedElement.id);
                      isCurrent = (selDev?.status || "EXISTING") === st;
                    } else if (selectedElement.type === "facility") {
                      const selFac = canvasData.facilities.find((f) => f.id === selectedElement.id);
                      isCurrent = (selFac?.status || "EXISTING") === st;
                    }
                    const color = getDeviceStatusColor(st);
                    return (
                      <Chip
                        key={st}
                        size="small"
                        label={getDeviceStatusLabel(st)}
                        onClick={() => {
                          if (selectedElement.type === "device") {
                            handleChangeDeviceStatus(selectedElement.id, st);
                          } else if (selectedElement.type === "facility") {
                            handleChangeFacilityStatus(selectedElement.id, st);
                          }
                        }}
                        sx={{
                          height: 22,
                          fontSize: "0.72rem",
                          fontWeight: isCurrent ? 700 : 500,
                          color: isCurrent ? "#fff" : "rgba(255, 255, 255, 0.7)",
                          bgcolor: isCurrent ? color : "rgba(255, 255, 255, 0.08)",
                          border: `1px solid ${isCurrent ? color : "rgba(255, 255, 255, 0.2)"}`,
                          cursor: "pointer",
                          "&:hover": {
                            bgcolor: isCurrent ? color : "rgba(255, 255, 255, 0.15)",
                          },
                        }}
                      />
                    );
                  })}
                </Stack>
              )}

              <Button
                size="small"
                variant="contained"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={handleDeleteSelected}
                sx={{ py: 0.2, textTransform: "none", fontSize: "0.75rem", fontWeight: 700 }}
              >
                Eliminar (Supr)
              </Button>
              <Button
                size="small"
                variant="outlined"
                color="inherit"
                onClick={() => setSelectedElement(null)}
                sx={{ py: 0.2, textTransform: "none", fontSize: "0.75rem" }}
              >
                Cerrar (Esc)
              </Button>
            </Stack>
          )}

          {!imageLoading && !selectedElement && activeTool === "eraser" && (
            <Typography variant="body2" sx={{ fontSize: "0.85rem", color: "#ff8a80", fontWeight: 700 }}>
              🧹 <strong>Modo Borrador Activo:</strong> Haz clic sobre cualquier elemento en el mapa para eliminarlo.
            </Typography>
          )}

          {!imageLoading && !selectedElement && activeTool === "select" && (
            <Typography variant="body2" sx={{ fontSize: "0.85rem" }}>
              🖱️ <strong>Selección:</strong> Clic en un elemento para ver su nombre, cambiar estado o eliminarlo.
            </Typography>
          )}

          {!imageLoading && activeTool === "perimeter" && (
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Typography variant="body2" sx={{ fontSize: "0.85rem" }}>
                Haz clic en el mapa para marcar vértices del perímetro (
                {canvasData.geofencePolygon.points.length} puntos)
              </Typography>
              {!canvasData.geofencePolygon.isClosed && (
                <Button
                  size="small"
                  variant="contained"
                  color="success"
                  startIcon={<DoneIcon />}
                  onClick={finishPerimeter}
                  disabled={canvasData.geofencePolygon.points.length < 3}
                  sx={{ py: 0.2, textTransform: "none", fontSize: "0.75rem", fontWeight: 700 }}
                >
                  Cerrar Polígono
                </Button>
              )}
              {canvasData.geofencePolygon.points.length > 0 && (
                <Button
                  size="small"
                  color="error"
                  onClick={resetPerimeter}
                  sx={{ py: 0.2, textTransform: "none", fontSize: "0.75rem" }}
                >
                  Reiniciar
                </Button>
              )}
            </Stack>
          )}

          {!imageLoading && activeTool === "facility" && (
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Typography variant="body2" sx={{ fontSize: "0.85rem" }}>
                Haz clic para trazar tramo de{" "}
                <strong>
                  {facilityTypeToAdd === "electric_fence"
                    ? "Cercado Eléctrico"
                    : facilityTypeToAdd === "perimeter_wall"
                    ? "Muro Perimetral"
                    : "Sensor de Movimiento (Trazos)"}
                </strong>{" "}
                <span
                  style={{
                    color: getDeviceStatusColor(deviceStatusToAdd),
                    fontWeight: 700,
                    marginLeft: 4,
                  }}
                >
                  ● {getDeviceStatusLabel(deviceStatusToAdd)}
                </span>{" "}
                ({drawingPoints.length} puntos)
              </Typography>
              <Button
                size="small"
                variant="contained"
                color="warning"
                onClick={finishFacilityLine}
                disabled={drawingPoints.length < 2}
                sx={{ py: 0.2, textTransform: "none", fontSize: "0.75rem", fontWeight: 700 }}
              >
                Terminar Tramo
              </Button>
            </Stack>
          )}

          {!imageLoading && activeTool === "device" && (
            <Typography variant="body2" sx={{ fontSize: "0.85rem" }}>
              Haz clic en el mapa para posicionar:{" "}
              <strong>{getDeviceDefaultName(deviceTypeToAdd)}</strong>{" "}
              <span
                style={{
                  color: getDeviceStatusColor(deviceStatusToAdd),
                  fontWeight: 700,
                  marginLeft: 4,
                }}
              >
                ● {getDeviceStatusLabel(deviceStatusToAdd)}
              </span>
            </Typography>
          )}
        </Box>

        {/* Konva Stage Canvas Container */}
        <Box
          sx={{
            flex: 1,
            bgcolor: "#0d0d0d",
            overflow: "hidden",
            position: "relative",
            touchAction: "none",
            cursor:
              activeTool === "select"
                ? "grab"
                : activeTool === "perimeter"
                ? "crosshair"
                : "cell",
          }}
        >
          <Stage
            ref={stageRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            draggable={activeTool === "select" && !isReadOnly}
            scaleX={stageScale}
            scaleY={stageScale}
            x={stagePos.x}
            y={stagePos.y}
            onWheel={handleWheel}
            onClick={handleStageClick}
            onTap={handleStageClick}
            onDragEnd={(e) => {
              if (e.target === stageRef.current) {
                setStagePos({ x: e.target.x(), y: e.target.y() });
              }
            }}
          >
            {/* 1. Base Layer (Mapbox Satellite Image) */}
            <Layer>
              {image ? (
                <KonvaImage
                  image={image}
                  width={CANVAS_WIDTH}
                  height={CANVAS_HEIGHT}
                />
              ) : (
                <Rect
                  width={CANVAS_WIDTH}
                  height={CANVAS_HEIGHT}
                  fill="#1a1a1a"
                />
              )}
            </Layer>

            {/* 2. Layer Geofencing (Perimeter Polygon) */}
            <Layer>
              {perimeterPointsFlat.length >= 4 && (
                <Line
                  points={perimeterPointsFlat}
                  stroke="#00E676"
                  strokeWidth={4}
                  closed={canvasData.geofencePolygon.isClosed}
                  fill={
                    canvasData.geofencePolygon.isClosed
                      ? "rgba(0, 230, 118, 0.22)"
                      : undefined
                  }
                  dash={canvasData.geofencePolygon.isClosed ? [] : [12, 6]}
                />
              )}

              {/* Editable vertex handles */}
              {/* Editable vertex handles */}
              {!isReadOnly &&
                canvasData.geofencePolygon.points.map((pt, idx) => {
                  const isVertexSelected =
                    selectedElement?.type === "vertex" &&
                    selectedElement.index === idx;
                  return (
                    <Circle
                      key={`vertex-${idx}`}
                      x={pt.x}
                      y={pt.y}
                      radius={isVertexSelected ? 11 : 8}
                      fill={isVertexSelected ? "#FF1744" : "#FFFFFF"}
                      stroke={isVertexSelected ? "#FFFFFF" : "#00E676"}
                      strokeWidth={isVertexSelected ? 3.5 : 3}
                      draggable={!isReadOnly && activeTool === "select"}
                      onDragEnd={(e) => handleVertexDragEnd(idx, e)}
                      onClick={(e) => {
                        e.cancelBubble = true;
                        if (activeTool === "eraser") {
                          removeVertex(idx);
                        } else {
                          setSelectedElement({
                            type: "vertex",
                            id: `vertex-${idx}`,
                            index: idx,
                          });
                        }
                      }}
                      onTap={(e) => {
                        e.cancelBubble = true;
                        if (activeTool === "eraser") {
                          removeVertex(idx);
                        } else {
                          setSelectedElement({
                            type: "vertex",
                            id: `vertex-${idx}`,
                            index: idx,
                          });
                        }
                      }}
                      onDblClick={(e) => {
                        e.cancelBubble = true;
                        removeVertex(idx);
                      }}
                    />
                  );
                })}
            </Layer>

            {/* 3. Layer Facilities (Electric Fences / Walls / Motion Barrier Lines) */}
            <Layer>
              {canvasData.facilities.map((fac) => {
                const isFacSelected =
                  selectedElement?.type === "facility" &&
                  selectedElement.id === fac.id;
                const facColor = getDeviceStatusColor(fac.status || "EXISTING");

                // Line dash pattern: solid for wall, dashed for electric fence, dotted for motion barrier
                const dashPattern =
                  fac.type === "perimeter_wall"
                    ? []
                    : fac.type === "electric_fence"
                    ? [14, 7]
                    : [4, 8];

                return (
                  <Group key={fac.id}>
                    {/* High-visibility white outline underlay when selected */}
                    {isFacSelected && (
                      <Line
                        points={fac.points}
                        stroke="#FFFFFF"
                        strokeWidth={8}
                        lineCap="round"
                        lineJoin="round"
                        opacity={0.8}
                      />
                    )}
                    <Line
                      points={fac.points}
                      stroke={facColor}
                      strokeWidth={isFacSelected ? 5 : 4}
                      dash={dashPattern}
                      lineCap="round"
                      lineJoin="round"
                      hitStrokeWidth={20}
                      onClick={(e) => {
                        e.cancelBubble = true;
                        if (activeTool === "eraser") {
                          removeFacility(fac.id);
                        } else {
                          setSelectedElement({ type: "facility", id: fac.id });
                        }
                      }}
                      onTap={(e) => {
                        e.cancelBubble = true;
                        if (activeTool === "eraser") {
                          removeFacility(fac.id);
                        } else {
                          setSelectedElement({ type: "facility", id: fac.id });
                        }
                      }}
                      onDblClick={(e) => {
                        e.cancelBubble = true;
                        removeFacility(fac.id);
                      }}
                    />
                  </Group>
                );
              })}

              {/* In-progress drawing line */}
              {drawingPoints.length >= 2 && (
                <Line
                  points={drawingPoints.flatMap((p) => [p.x, p.y])}
                  stroke={getDeviceStatusColor(deviceStatusToAdd)}
                  strokeWidth={3.5}
                  dash={
                    facilityTypeToAdd === "perimeter_wall"
                      ? [6, 6]
                      : facilityTypeToAdd === "electric_fence"
                      ? [14, 7]
                      : [4, 8]
                  }
                  lineCap="round"
                  lineJoin="round"
                />
              )}
            </Layer>

            {/* 4. Layer Devices (Cameras, Sensors, Checkpoints) */}
            <Layer>
              {canvasData.devices.map((dev) => {
                const isSelected =
                  selectedElement?.type === "device" &&
                  selectedElement.id === dev.id;
                const isHovered = hoveredDeviceId === dev.id;
                const showLabel = isSelected || isHovered;
                const devStatus: DeviceStatus = dev.status || "EXISTING";
                const statusColor = getDeviceStatusColor(devStatus);

                return (
                  <Group
                    key={dev.id}
                    x={dev.x}
                    y={dev.y}
                    draggable={!isReadOnly && activeTool === "select"}
                    onDragEnd={(e) => handleDeviceDragEnd(dev.id, e)}
                    onMouseEnter={(e) => {
                      const container = e.target.getStage()?.container();
                      if (container) container.style.cursor = "pointer";
                      setHoveredDeviceId(dev.id);
                    }}
                    onMouseLeave={(e) => {
                      const container = e.target.getStage()?.container();
                      if (container) {
                        container.style.cursor =
                          activeTool === "select" ? "grab" : "default";
                      }
                      setHoveredDeviceId((prev) => (prev === dev.id ? null : prev));
                    }}
                    onClick={(e) => {
                      e.cancelBubble = true;
                      if (activeTool === "eraser") {
                        removeDevice(dev.id);
                      } else {
                        setSelectedElement({ type: "device", id: dev.id });
                      }
                    }}
                    onTap={(e) => {
                      e.cancelBubble = true;
                      if (activeTool === "eraser") {
                        removeDevice(dev.id);
                      } else {
                        setSelectedElement({ type: "device", id: dev.id });
                      }
                    }}
                    onDblClick={(e) => {
                      e.cancelBubble = true;
                      removeDevice(dev.id);
                    }}
                  >
                    {/* Selection Halo */}
                    {isSelected && (
                      <Circle
                        radius={26}
                        stroke="#FF1744"
                        strokeWidth={3}
                        dash={[6, 4]}
                        shadowColor="#FF1744"
                        shadowBlur={10}
                      />
                    )}

                    {/* Base Pin Circle - Uniformly colored by STATUS */}
                    <Circle
                      radius={18}
                      fill={statusColor}
                      stroke={isSelected ? "#FF1744" : "#FFFFFF"}
                      strokeWidth={isSelected ? 3 : 2}
                      shadowBlur={8}
                      shadowColor="rgba(0,0,0,0.6)"
                    />

                    {/* Real SVG Vector Icon */}
                    <Path
                      data={getDeviceSvgPath(dev.type)}
                      fill="#FFFFFF"
                      scale={{ x: 0.85, y: 0.85 }}
                      offsetX={12}
                      offsetY={12}
                    />

                    {/* High-Contrast Pill Badge for Device Label - Only visible on hover or selection */}
                    {showLabel && (
                      <>
                        <Rect
                          x={-Math.round((dev.name.length * 7.2 + 20) / 2)}
                          y={22}
                          width={Math.round(dev.name.length * 7.2 + 20)}
                          height={22}
                          fill="rgba(15, 23, 42, 0.94)"
                          cornerRadius={6}
                          stroke={statusColor}
                          strokeWidth={1.5}
                          shadowColor="black"
                          shadowBlur={6}
                          shadowOpacity={0.6}
                          shadowOffset={{ x: 0, y: 2 }}
                        />
                        <Text
                          x={-Math.round((dev.name.length * 7.2 + 20) / 2)}
                          y={26}
                          width={Math.round(dev.name.length * 7.2 + 20)}
                          text={dev.name}
                          fontSize={11}
                          fontFamily="Inter, system-ui, -apple-system, sans-serif"
                          fontStyle="bold"
                          fill="#FFFFFF"
                          align="center"
                        />
                      </>
                    )}

                    {/* Red Delete Badge on Selected Device */}
                    {isSelected && !isReadOnly && (
                      <Group
                        x={15}
                        y={-15}
                        onClick={(e) => {
                          e.cancelBubble = true;
                          removeDevice(dev.id);
                        }}
                        onTap={(e) => {
                          e.cancelBubble = true;
                          removeDevice(dev.id);
                        }}
                      >
                        <Circle
                          radius={9}
                          fill="#D32F2F"
                          stroke="#FFFFFF"
                          strokeWidth={1.5}
                        />
                        <Text
                          text="✕"
                          fontSize={11}
                          fontStyle="bold"
                          fill="#FFFFFF"
                          offsetX={4}
                          offsetY={6}
                        />
                      </Group>
                    )}
                  </Group>
                );
              })}
            </Layer>
          </Stage>

          {/* Floating Legend / Device Summary in Study Mode */}
          {mode === "study" && (
            <Paper
              elevation={3}
              sx={{
                position: "absolute",
                bottom: 16,
                right: 16,
                zIndex: 10,
                bgcolor: "rgba(15, 23, 42, 0.88)",
                backdropFilter: "blur(8px)",
                color: "white",
                px: 2,
                py: 1,
                borderRadius: 2,
                border: "1px solid rgba(255, 255, 255, 0.15)",
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
                maxWidth: { xs: "90%", sm: "auto" },
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.8 }}>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 800,
                    letterSpacing: 0.5,
                    color: "rgba(255, 255, 255, 0.6)",
                    textTransform: "uppercase",
                    fontSize: "0.68rem",
                  }}
                >
                  Elementos del Estudio ({canvasStats.total})
                </Typography>
              </Stack>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={{ xs: 1, sm: 2 }}
                alignItems={{ xs: "flex-start", sm: "center" }}
              >
                <Stack direction="row" spacing={0.8} alignItems="center">
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      bgcolor: "#10B981",
                      boxShadow: "0 0 6px #10B981",
                    }}
                  />
                  <Typography variant="caption" sx={{ fontWeight: 600, color: "#fff", fontSize: "0.75rem" }}>
                    Existente: <strong>{canvasStats.existing}</strong>
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={0.8} alignItems="center">
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      bgcolor: "#3B82F6",
                      boxShadow: "0 0 6px #3B82F6",
                    }}
                  />
                  <Typography variant="caption" sx={{ fontWeight: 600, color: "#fff", fontSize: "0.75rem" }}>
                    A Implementar: <strong>{canvasStats.planned}</strong>
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={0.8} alignItems="center">
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      bgcolor: "#EF4444",
                      boxShadow: "0 0 6px #EF4444",
                    }}
                  />
                  <Typography variant="caption" sx={{ fontWeight: 600, color: "#fff", fontSize: "0.75rem" }}>
                    Dañada: <strong>{canvasStats.damaged}</strong>
                  </Typography>
                </Stack>
              </Stack>
            </Paper>
          )}
        </Box>
      </Box>

      {/* Confirmation Modal to Approve Geofencing */}
      <Dialog
        open={approvalDialogOpen}
        onClose={() => setApprovalDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        sx={{ zIndex: 14000 }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          Aprobar Perímetro y Sincronizar Geofencing
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Esta acción establecerá el polígono perimetral dibujado como la{" "}
            <strong>Fuente Única de Verdad (SSOT)</strong> para el cliente{" "}
            <strong>{clientName}</strong> en la base de datos geoespacial (PostGIS).
          </Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            El módulo de Control de Rondas validará las marcaciones del personal
            de seguridad contrastando su GPS contra este polígono perimetral.
          </Alert>
          <Typography variant="caption" color="text.secondary">
            Vértices calculados: {canvasData.geofencePolygon.points.length} puntos GPS
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setApprovalDialogOpen(false)} disabled={approving}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="success"
            startIcon={
              approving ? (
                <CircularProgress size={18} color="inherit" />
              ) : (
                <CheckCircleIcon />
              )
            }
            onClick={handleConfirmApprovePerimeter}
            disabled={approving}
          >
            {approving ? "Sincronizando..." : "Confirmar y Aprobar"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function getDeviceDefaultName(type: CanvasDevice["type"]): string {
  switch (type) {
    case "camera_bullet":
      return "Cámara Bullet (Fija)";
    case "camera_dome":
      return "Cámara Domo";
    case "camera_ptz":
      return "Cámara PTZ (360°)";
    case "sensor_motion":
      return "Sensor de Movimiento";
    case "gatehouse":
      return "Portería Principal";
    case "vehicle_barrier":
      return "Talanquera Vehicular";
    default:
      return "Dispositivo";
  }
}

export function getDeviceStatusColor(status?: DeviceStatus): string {
  switch (status) {
    case "EXISTING":
      return "#10B981"; // Verde (Existente)
    case "DAMAGED":
      return "#EF4444"; // Rojo (Dañada)
    case "PLANNED":
      return "#3B82F6"; // Azul (A implementar)
    default:
      return "#10B981";
  }
}

export function getDeviceStatusLabel(status?: DeviceStatus): string {
  switch (status) {
    case "EXISTING":
      return "Existente";
    case "DAMAGED":
      return "Dañada";
    case "PLANNED":
      return "A Implementar";
    default:
      return "Existente";
  }
}

function getDeviceColor(type: CanvasDevice["type"]): string {
  switch (type) {
    case "camera_bullet":
    case "camera_dome":
    case "camera_ptz":
      return "#1976D2";
    case "sensor_motion":
      return "#ED6C02";
    case "gatehouse":
      return "#2E7D32";
    case "vehicle_barrier":
      return "#9C27B0";
    default:
      return "#757575";
  }
}

function getDeviceSvgPath(type: CanvasDevice["type"]): string {
  switch (type) {
    case "camera_bullet":
      return "M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z";
    case "camera_dome":
      return "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-12.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9z";
    case "camera_ptz":
      return "M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46A7.93 7.93 0 0 0 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74A7.93 7.93 0 0 0 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z";
    case "sensor_motion":
      return "M12 15c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zm0-8c3.87 0 7 3.13 7 7h2c0-4.97-4.03-9-9-9s-9 4.03-9 9h2c0-3.87 3.13-7 7-7z";
    case "gatehouse":
      return "M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm-7 2h2v4h-2V6zm-5 0h3v4H7V6zm12 14H5V12h14v8z";
    case "vehicle_barrier":
      return "M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z";
    default:
      return "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z";
  }
}

function getDeviceIconLetter(type: CanvasDevice["type"]): string {
  switch (type) {
    case "camera_bullet":
      return "B";
    case "camera_dome":
      return "D";
    case "camera_ptz":
      return "P";
    case "sensor_motion":
      return "S";
    case "gatehouse":
      return "G";
    case "vehicle_barrier":
      return "V";
    default:
      return "•";
  }
}
