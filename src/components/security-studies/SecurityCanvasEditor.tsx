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
  Popover,
  Drawer,
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
  Brush as BrushIcon,
  Highlight as HighlightIcon,
  TrendingFlat as ArrowRightAltIcon,
  CropSquare as CropSquareIcon,
  CropLandscape as CropLandscapeIcon,
  RadioButtonUnchecked as CircleIcon,
  ChangeHistory as DiamondIcon,
  Palette as PaletteIcon,
  LineWeight as LineWeightIcon,
  Create as CreateIcon,
  CameraIndoor as CameraDomeIcon,
  SmartDisplay as AnalyticsIcon,
  Thermostat as ThermalIcon,
  Storage as DvrIcon,
  NotificationsActive as IntrusionAlarmIcon,
  ReportProblem as EmergencyAlarmIcon,
  Face as FacialRecognitionIcon,
  Lightbulb as PostLightIcon,
  WbIncandescent as FloodlightIcon,
  ElectricalServices as ElectricCabinetIcon,
  BatteryChargingFull as UpsIcon,
  Router as NetworkSwitchIcon,
  SettingsSuggest as GeneratorIcon,
} from "@mui/icons-material";
import {
  Stage,
  Layer,
  Image as KonvaImage,
  Line,
  Circle,
  Ellipse,
  Arrow,
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

const PALETTE_COLORS = [
  "#EF4444", // Rojo
  "#3B82F6", // Azul
  "#10B981", // Verde
  "#F59E0B", // Ámbar / Amarillo
  "#8B5CF6", // Púrpura
  "#EC4899", // Rosa
  "#FFFFFF", // Blanco
  "#000000", // Negro
];

const STROKE_WIDTHS = [2, 4, 8, 16, 24];

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
        const proxyUrl = directUrl
          ? directUrl
          : studyId
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
  bbox?: BoundingBox,
): { x: number; y: number; lat: number; lng: number }[] {
  if (!geofence || !bbox) return [];
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
    | "cam_analytics"
    | "cam_thermal"
    | "dvr_nvr"
    | "sensor_motion"
    | "alarm_intrusion"
    | "alarm_emergency"
    | "gatehouse"
    | "vehicle_barrier"
    | "facial_panel"
    | "led_post_light"
    | "led_floodlight"
    | "electric_cabinet"
    | "ups_backup"
    | "network_switch"
    | "power_generator";
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

export interface CanvasDrawingStroke {
  id: string;
  tool: "pencil" | "marker" | "highlighter";
  color: string;
  strokeWidth: number;
  opacity: number;
  points: number[];
}

export interface CanvasShape {
  id: string;
  type: "rectangle" | "square" | "circle" | "ellipse" | "rhombus" | "arrow";
  x: number;
  y: number;
  width?: number;
  height?: number;
  radiusX?: number;
  radiusY?: number;
  points?: number[];
  stroke: string;
  strokeWidth: number;
  fill?: string;
  opacity?: number;
}

export interface CanvasState {
  version: string;
  geofencePolygon: {
    points: { x: number; y: number; lat: number; lng: number }[];
    isClosed: boolean;
  };
  facilities: CanvasFacilityLine[];
  devices: CanvasDevice[];
  strokes?: CanvasDrawingStroke[];
  shapes?: CanvasShape[];
}

export interface SecurityCanvasEditorProps {
  studyId?: string;
  fileId?: string;
  clientId?: string;
  mode?: "geofence" | "study" | "attachment_photo";
  baseImageUrl?: string;
  bbox?: BoundingBox;
  initialCanvasState?: any;
  clientGeofence?: any;
  isReadOnly?: boolean;
  clientName: string;
  onPerimeterApproved?: () => void;
  onClose?: () => void;
  onSaveCanvas?: (canvasState: any) => Promise<void>;
}

export interface ToolSubItem {
  id: string;
  name: string;
  desc: string;
  icon: React.ReactNode;
  toolType: "device" | "facility" | "pencil" | "marker" | "highlighter" | "shape";
  deviceType?: CanvasDevice["type"];
  facilityType?: CanvasFacilityLine["type"];
  shapeType?: CanvasShape["type"];
}

export interface ToolCategory {
  id: string;
  name: string;
  shortName: string;
  icon: React.ReactNode;
  isDirect?: boolean;
  activeToolName?: string;
  subItems?: ToolSubItem[];
  hasStatusPicker?: boolean;
  hasColorPicker?: boolean;
  showInModes: ("geofence" | "study" | "attachment_photo")[];
}

export const STATUS_OPTIONS: { id: DeviceStatus; label: string; color: string }[] = [
  { id: "EXISTING", label: "Existente", color: "#10B981" },
  { id: "PLANNED", label: "A Instalar", color: "#3B82F6" },
  { id: "DAMAGED", label: "Dañado", color: "#EF4444" },
];

const TOOL_CATEGORIES: ToolCategory[] = [
  {
    id: "select",
    name: "Mover / Paneo (Pan)",
    shortName: "Mover",
    icon: <PanToolIcon fontSize="small" />,
    isDirect: true,
    activeToolName: "select",
    showInModes: ["geofence", "study", "attachment_photo"],
  },
  {
    id: "eraser",
    name: "Goma de Borrar / Eliminar",
    shortName: "Borrar",
    icon: <DeleteOutlineIcon fontSize="small" />,
    isDirect: true,
    activeToolName: "eraser",
    showInModes: ["geofence", "study", "attachment_photo"],
  },
  {
    id: "perimeter",
    name: "Polígono Perimetral (Geofence)",
    shortName: "Geocerca",
    icon: <TimelineIcon fontSize="small" />,
    isDirect: true,
    activeToolName: "perimeter",
    showInModes: ["geofence"],
  },
  {
    id: "drawing",
    name: "Trazo y Dibujo",
    shortName: "Dibujo",
    icon: <BrushIcon fontSize="small" />,
    hasColorPicker: true,
    showInModes: ["study", "attachment_photo"],
    subItems: [
      { id: "pencil", name: "Lápiz", desc: "Trazo fino libre continuo", icon: <CreateIcon fontSize="small" />, toolType: "pencil" },
      { id: "marker", name: "Marcador", desc: "Pincel de trazo visible", icon: <BrushIcon fontSize="small" />, toolType: "marker" },
      { id: "highlighter", name: "Resaltador", desc: "Trazo ancho translúcido al 35%", icon: <HighlightIcon fontSize="small" />, toolType: "highlighter" },
    ],
  },
  {
    id: "shapes",
    name: "Formas y Flechas",
    shortName: "Figuras",
    icon: <CropSquareIcon fontSize="small" />,
    hasColorPicker: true,
    showInModes: ["study", "attachment_photo"],
    subItems: [
      { id: "arrow", name: "Flecha", desc: "Señalización direccional", icon: <ArrowRightAltIcon fontSize="small" />, toolType: "shape", shapeType: "arrow" },
      { id: "rectangle", name: "Rectángulo", desc: "Caja delimitadora", icon: <CropLandscapeIcon fontSize="small" />, toolType: "shape", shapeType: "rectangle" },
      { id: "square", name: "Cuadrado", desc: "Cuadrado regular", icon: <CropSquareIcon fontSize="small" />, toolType: "shape", shapeType: "square" },
      { id: "circle", name: "Círculo / Elipse", desc: "Zona circular delimitadora", icon: <CircleIcon fontSize="small" />, toolType: "shape", shapeType: "circle" },
      { id: "rhombus", name: "Rombo", desc: "Señal de precaución", icon: <DiamondIcon fontSize="small" />, toolType: "shape", shapeType: "rhombus" },
    ],
  },
  {
    id: "facilities",
    name: "Líneas Perimetrales",
    shortName: "Líneas",
    icon: <FenceIcon fontSize="small" />,
    hasStatusPicker: true,
    showInModes: ["study", "attachment_photo"],
    subItems: [
      { id: "electric_fence", name: "Cercado Eléctrico", desc: "Cerramiento electrificado", icon: <FlashOnIcon fontSize="small" />, toolType: "facility", facilityType: "electric_fence" },
      { id: "perimeter_wall", name: "Muro Perimetral", desc: "Muro o cerramiento físico", icon: <FenceIcon fontSize="small" />, toolType: "facility", facilityType: "perimeter_wall" },
      { id: "motion_barrier", name: "Barrera Infrarroja", desc: "Sensor perimetral de paso", icon: <LinearScaleIcon fontSize="small" />, toolType: "facility", facilityType: "motion_barrier" },
    ],
  },
  {
    id: "cameras",
    name: "Cámaras de Seguridad",
    shortName: "Cámaras",
    icon: <VideocamIcon fontSize="small" />,
    hasStatusPicker: true,
    showInModes: ["study", "attachment_photo"],
    subItems: [
      { id: "camera_bullet", name: "Cámara Bullet", desc: "Enfoque perimetral fijo", icon: <VideocamIcon fontSize="small" />, toolType: "device", deviceType: "camera_bullet" },
      { id: "camera_dome", name: "Cámara Domo", desc: "Interiores y domos 360", icon: <CameraDomeIcon fontSize="small" />, toolType: "device", deviceType: "camera_dome" },
      { id: "camera_ptz", name: "Cámara PTZ", desc: "Zoom y rotación motorizada", icon: <VideocamIcon fontSize="small" />, toolType: "device", deviceType: "camera_ptz" },
      { id: "cam_analytics", name: "Cámara con IA", desc: "LPR, analítica y cruce de línea", icon: <AnalyticsIcon fontSize="small" />, toolType: "device", deviceType: "cam_analytics" },
      { id: "cam_thermal", name: "Cámara Térmica", desc: "Detección calórica y niebla", icon: <ThermalIcon fontSize="small" />, toolType: "device", deviceType: "cam_thermal" },
      { id: "dvr_nvr", name: "Servidor / NVR", desc: "Grabador de video central", icon: <DvrIcon fontSize="small" />, toolType: "device", deviceType: "dvr_nvr" },
    ],
  },
  {
    id: "alarms",
    name: "Sensores y Alarmas",
    shortName: "Alarmas",
    icon: <IntrusionAlarmIcon fontSize="small" />,
    hasStatusPicker: true,
    showInModes: ["study", "attachment_photo"],
    subItems: [
      { id: "sensor_motion", name: "Sensor Movimiento", desc: "Detector PIR / presencia", icon: <SensorsIcon fontSize="small" />, toolType: "device", deviceType: "sensor_motion" },
      { id: "alarm_intrusion", name: "Sirena / Alarma", desc: "Sirena y estrobo disuasivo", icon: <IntrusionAlarmIcon fontSize="small" />, toolType: "device", deviceType: "alarm_intrusion" },
      { id: "alarm_emergency", name: "Botón de Pánico", desc: "Pulsador de auxilio / SOS", icon: <EmergencyAlarmIcon fontSize="small" />, toolType: "device", deviceType: "alarm_emergency" },
    ],
  },
  {
    id: "access",
    name: "Control de Acceso",
    shortName: "Acceso",
    icon: <MeetingRoomIcon fontSize="small" />,
    hasStatusPicker: true,
    showInModes: ["study", "attachment_photo"],
    subItems: [
      { id: "gatehouse", name: "Portería / Caseta", desc: "Puesto de control de guardia", icon: <MeetingRoomIcon fontSize="small" />, toolType: "device", deviceType: "gatehouse" },
      { id: "vehicle_barrier", name: "Talanquera", desc: "Barrera vehicular automática", icon: <DirectionsCarIcon fontSize="small" />, toolType: "device", deviceType: "vehicle_barrier" },
      { id: "facial_panel", name: "Panel Facial", desc: "Control peatonal biométrico", icon: <FacialRecognitionIcon fontSize="small" />, toolType: "device", deviceType: "facial_panel" },
    ],
  },
  {
    id: "lighting_network",
    name: "Iluminación y Red",
    shortName: "Luz / Red",
    icon: <FloodlightIcon fontSize="small" />,
    hasStatusPicker: true,
    showInModes: ["study", "attachment_photo"],
    subItems: [
      { id: "led_floodlight", name: "Reflector LED", desc: "Iluminación disuasiva de área", icon: <FloodlightIcon fontSize="small" />, toolType: "device", deviceType: "led_floodlight" },
      { id: "led_post_light", name: "Luminaria Poste", desc: "Poste de alumbrado perimetral", icon: <PostLightIcon fontSize="small" />, toolType: "device", deviceType: "led_post_light" },
      { id: "network_switch", name: "Switch PoE / Red", desc: "Gabinete de datos e interconexión", icon: <NetworkSwitchIcon fontSize="small" />, toolType: "device", deviceType: "network_switch" },
    ],
  },
  {
    id: "energy",
    name: "Energía y Respaldo",
    shortName: "Energía",
    icon: <UpsIcon fontSize="small" />,
    hasStatusPicker: true,
    showInModes: ["study", "attachment_photo"],
    subItems: [
      { id: "electric_cabinet", name: "Tablero Eléctrico", desc: "Alimentación principal y breakers", icon: <ElectricCabinetIcon fontSize="small" />, toolType: "device", deviceType: "electric_cabinet" },
      { id: "ups_backup", name: "UPS / Baterías", desc: "Respaldo contra apagones", icon: <UpsIcon fontSize="small" />, toolType: "device", deviceType: "ups_backup" },
      { id: "power_generator", name: "Planta Eléctrica", desc: "Generador diésel/gas de respaldo", icon: <GeneratorIcon fontSize="small" />, toolType: "device", deviceType: "power_generator" },
    ],
  },
];

export default function SecurityCanvasEditor({
  studyId,
  fileId,
  clientId,
  mode = studyId ? "study" : "geofence",
  baseImageUrl = "",
  bbox,
  initialCanvasState,
  clientGeofence,
  isReadOnly = false,
  clientName,
  onPerimeterApproved,
  onClose,
  onSaveCanvas,
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
      strokes: (initialCanvasState?.strokes || []).map((s: any) => ({ ...s })),
      shapes: (initialCanvasState?.shapes || []).map((sh: any) => ({ ...sh })),
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

  // Drawing & Paint Tools State
  const [strokeColor, setStrokeColor] = useState<string>("#EF4444");
  const [strokeWidth, setStrokeWidth] = useState<number>(4);
  const [activeShapeType, setActiveShapeType] = useState<CanvasShape["type"]>("rectangle");
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<number[]>([]);
  const [shapeStart, setShapeStart] = useState<{ x: number; y: number } | null>(null);
  const [shapeCurrent, setShapeCurrent] = useState<{ x: number; y: number } | null>(null);

  // Canvas Resolution & Dynamic Viewport
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasWidth =
    mode === "attachment_photo" && image?.naturalWidth
      ? image.naturalWidth
      : CANVAS_WIDTH;
  const canvasHeight =
    mode === "attachment_photo" && image?.naturalHeight
      ? image.naturalHeight
      : CANVAS_HEIGHT;
  const scaleFactor = Math.max(1, Math.max(canvasWidth, canvasHeight) / 1920);

  // Stage Pan & Zoom
  const [stageScale, setStageScale] = useState(0.75);
  const [stagePos, setStagePos] = useState({ x: 40, y: 20 });

  const fitAndCenterStage = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const contW = container.clientWidth || (typeof window !== "undefined" ? window.innerWidth : 1920);
    const contH = container.clientHeight || (typeof window !== "undefined" ? window.innerHeight - 80 : 1080);

    const pad = 48;
    const availW = Math.max(contW - pad, 100);
    const availH = Math.max(contH - pad, 100);

    const curW =
      mode === "attachment_photo" && image?.naturalWidth
        ? image.naturalWidth
        : CANVAS_WIDTH;
    const curH =
      mode === "attachment_photo" && image?.naturalHeight
        ? image.naturalHeight
        : CANVAS_HEIGHT;

    const fitScale = Math.min(availW / curW, availH / curH, 1.5);
    const fitX = Math.round((contW - curW * fitScale) / 2);
    const fitY = Math.round((contH - curH * fitScale) / 2);

    setStageScale(fitScale);
    setStagePos({ x: fitX, y: fitY });
  }, [mode, image]);

  useEffect(() => {
    if (image) {
      const timer1 = setTimeout(fitAndCenterStage, 50);
      const timer2 = setTimeout(fitAndCenterStage, 250);
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [image, fitAndCenterStage]);

  // Autosaver state
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("saved");
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Approval modal
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [approving, setApproving] = useState(false);

  const { showError, showSuccess } = useNotification();

  // Desktop Flyout and Mobile Bottom Sheet UI state
  const [flyoutCategory, setFlyoutCategory] = useState<string | null>(null);
  const [flyoutAnchorEl, setFlyoutAnchorEl] = useState<HTMLElement | null>(null);
  const [mobileSheetCategory, setMobileSheetCategory] = useState<string | null>(null);

  const handleSelectSubItem = (item: ToolSubItem) => {
    if (item.toolType === "pencil" || item.toolType === "marker" || item.toolType === "highlighter") {
      setActiveTool(item.toolType);
    } else if (item.toolType === "shape" && item.shapeType) {
      setActiveTool("shape");
      setActiveShapeType(item.shapeType);
    } else if (item.toolType === "facility" && item.facilityType) {
      setActiveTool("facility");
      setFacilityTypeToAdd(item.facilityType);
    } else if (item.toolType === "device" && item.deviceType) {
      setActiveTool("device");
      setDeviceTypeToAdd(item.deviceType);
    }
    setFlyoutCategory(null);
    setFlyoutAnchorEl(null);
    setMobileSheetCategory(null);
  };

  const isSubItemSelected = (item: ToolSubItem) => {
    if (item.toolType === "pencil" || item.toolType === "marker" || item.toolType === "highlighter") {
      return activeTool === item.toolType;
    }
    if (item.toolType === "shape") {
      return activeTool === "shape" && activeShapeType === item.shapeType;
    }
    if (item.toolType === "facility") {
      return activeTool === "facility" && facilityTypeToAdd === item.facilityType;
    }
    if (item.toolType === "device") {
      return activeTool === "device" && deviceTypeToAdd === item.deviceType;
    }
    return false;
  };

  const isCategoryActive = (catId: string) => {
    if (catId === "select") return activeTool === "select";
    if (catId === "perimeter") return activeTool === "perimeter";
    if (catId === "eraser") return activeTool === "eraser";
    if (catId === "drawing") return ["pencil", "marker", "highlighter"].includes(activeTool);
    if (catId === "shapes") return activeTool === "shape";
    if (catId === "facilities") return activeTool === "facility";
    if (catId === "cameras")
      return activeTool === "device" && ["camera_bullet", "camera_dome", "camera_ptz", "cam_analytics", "cam_thermal", "dvr_nvr"].includes(deviceTypeToAdd);
    if (catId === "alarms")
      return activeTool === "device" && ["sensor_motion", "alarm_intrusion", "alarm_emergency"].includes(deviceTypeToAdd);
    if (catId === "access")
      return activeTool === "device" && ["gatehouse", "vehicle_barrier", "facial_panel"].includes(deviceTypeToAdd);
    if (catId === "lighting_network")
      return activeTool === "device" && ["led_post_light", "led_floodlight", "network_switch"].includes(deviceTypeToAdd);
    if (catId === "energy")
      return activeTool === "device" && ["electric_cabinet", "ups_backup", "power_generator"].includes(deviceTypeToAdd);
    return false;
  };

  const visibleCategories = TOOL_CATEGORIES.filter((c) => c.showInModes.includes(mode));
  const activeFlyoutCategoryObj = TOOL_CATEGORIES.find((c) => c.id === flyoutCategory);
  const activeMobileCategoryObj = TOOL_CATEGORIES.find((c) => c.id === mobileSheetCategory);

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
          if (mode === "attachment_photo") {
            if (onSaveCanvas) {
              await onSaveCanvas(newState);
            } else if (studyId && fileId) {
              await HttpClient.patch(
                `/administrative/security-studies/${studyId}/files/${fileId}/canvas`,
                { canvasState: newState },
              );
            }
          } else if (mode === "geofence" && clientId) {
            if (newState.geofencePolygon.points.length >= 3) {
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
    [studyId, fileId, clientId, mode, isReadOnly, onSaveCanvas, showError],
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
    newScale = Math.max(0.05, Math.min(newScale, 6));

    setStageScale(newScale);
    setStagePos({
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    });
  };

  const getStagePointerCoords = () => {
    const stage = stageRef.current;
    if (!stage) return null;
    const pointer = stage.getPointerPosition();
    if (!pointer) return null;
    const x = Math.round((pointer.x - stage.x()) / stage.scaleX());
    const y = Math.round((pointer.y - stage.y()) / stage.scaleY());
    return { x, y };
  };

  const handleStageMouseDown = () => {
    if (isReadOnly) return;
    const isFreehand = ["pencil", "marker", "highlighter"].includes(activeTool);
    const isShape = activeTool === "shape";
    if (!isFreehand && !isShape) return;

    const coords = getStagePointerCoords();
    if (!coords) return;
    if (coords.x < 0 || coords.x > canvasWidth || coords.y < 0 || coords.y > canvasHeight) return;

    setIsDrawing(true);
    if (isFreehand) {
      setCurrentStroke([coords.x, coords.y]);
    } else if (isShape) {
      setShapeStart(coords);
      setShapeCurrent(coords);
    }
  };

  const handleStageMouseMove = () => {
    if (!isDrawing) return;
    const coords = getStagePointerCoords();
    if (!coords) return;

    if (["pencil", "marker", "highlighter"].includes(activeTool)) {
      setCurrentStroke((prev) => [...prev, coords.x, coords.y]);
    } else if (activeTool === "shape") {
      setShapeCurrent(coords);
    }
  };

  const handleStageMouseUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    if (["pencil", "marker", "highlighter"].includes(activeTool)) {
      if (currentStroke.length >= 2) {
        const isHighlighter = activeTool === "highlighter";
        const points =
          currentStroke.length === 2
            ? [currentStroke[0], currentStroke[1], currentStroke[0] + 1, currentStroke[1] + 1]
            : currentStroke;

        const newStroke: CanvasDrawingStroke = {
          id: "stroke_" + Date.now(),
          tool: activeTool as "pencil" | "marker" | "highlighter",
          color: strokeColor,
          strokeWidth: isHighlighter ? Math.max(strokeWidth, 16) : strokeWidth,
          opacity: isHighlighter ? 0.35 : 1,
          points,
        };
        updateCanvasState((prev) => ({
          ...prev,
          strokes: [...(prev.strokes || []), newStroke],
        }));
      }
      setCurrentStroke([]);
    } else if (activeTool === "shape" && shapeStart && shapeCurrent) {
      const dx = shapeCurrent.x - shapeStart.x;
      const dy = shapeCurrent.y - shapeStart.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 5) {
        let newShape: CanvasShape | null = null;
        const id = "shape_" + Date.now();

        if (activeShapeType === "arrow") {
          newShape = {
            id,
            type: "arrow",
            x: shapeStart.x,
            y: shapeStart.y,
            points: [shapeStart.x, shapeStart.y, shapeCurrent.x, shapeCurrent.y],
            stroke: strokeColor,
            strokeWidth,
          };
        } else if (activeShapeType === "rectangle") {
          newShape = {
            id,
            type: "rectangle",
            x: Math.min(shapeStart.x, shapeCurrent.x),
            y: Math.min(shapeStart.y, shapeCurrent.y),
            width: Math.abs(dx),
            height: Math.abs(dy),
            stroke: strokeColor,
            strokeWidth,
          };
        } else if (activeShapeType === "square") {
          const side = Math.max(Math.abs(dx), Math.abs(dy));
          newShape = {
            id,
            type: "square",
            x: dx >= 0 ? shapeStart.x : shapeStart.x - side,
            y: dy >= 0 ? shapeStart.y : shapeStart.y - side,
            width: side,
            height: side,
            stroke: strokeColor,
            strokeWidth,
          };
        } else if (activeShapeType === "circle") {
          const radius = Math.round(dist / 2);
          newShape = {
            id,
            type: "circle",
            x: Math.round((shapeStart.x + shapeCurrent.x) / 2),
            y: Math.round((shapeStart.y + shapeCurrent.y) / 2),
            radiusX: radius,
            radiusY: radius,
            stroke: strokeColor,
            strokeWidth,
          };
        } else if (activeShapeType === "ellipse") {
          newShape = {
            id,
            type: "ellipse",
            x: Math.round((shapeStart.x + shapeCurrent.x) / 2),
            y: Math.round((shapeStart.y + shapeCurrent.y) / 2),
            radiusX: Math.round(Math.abs(dx) / 2),
            radiusY: Math.round(Math.abs(dy) / 2),
            stroke: strokeColor,
            strokeWidth,
          };
        } else if (activeShapeType === "rhombus") {
          const cx = Math.round((shapeStart.x + shapeCurrent.x) / 2);
          const cy = Math.round((shapeStart.y + shapeCurrent.y) / 2);
          const rx = Math.round(Math.abs(dx) / 2);
          const ry = Math.round(Math.abs(dy) / 2);
          newShape = {
            id,
            type: "rhombus",
            x: cx,
            y: cy,
            points: [
              cx, cy - ry,
              cx + rx, cy,
              cx, cy + ry,
              cx - rx, cy,
            ],
            stroke: strokeColor,
            strokeWidth,
          };
        }

        if (newShape) {
          updateCanvasState((prev) => ({
            ...prev,
            shapes: [...(prev.shapes || []), newShape!],
          }));
        }
      }
      setShapeStart(null);
      setShapeCurrent(null);
    }
  };

  // 3. Stage Click / Tap for Drawing or Placing Devices
  const handleStageClick = (e: any) => {
    if (isReadOnly) return;
    if (["pencil", "marker", "highlighter", "shape"].includes(activeTool)) {
      return;
    }

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

    if (x < 0 || x > canvasWidth || y < 0 || y > canvasHeight) return;

    if (activeTool === "select") {
      setSelectedElement(null);
      return;
    }

    const gps = bbox
      ? MapboxMath.pixelToLatLng(x, y, bbox, CANVAS_WIDTH, CANVAS_HEIGHT)
      : { lat: 0, lng: 0 };

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
    const gps = bbox
      ? MapboxMath.pixelToLatLng(x, y, bbox, CANVAS_WIDTH, CANVAS_HEIGHT)
      : { lat: 0, lng: 0 };

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

  const removeStroke = (strokeId: string) => {
    if (isReadOnly) return;
    updateCanvasState((prev) => ({
      ...prev,
      strokes: (prev.strokes || []).filter((s) => s.id !== strokeId),
    }));
    showSuccess("Trazo eliminado.");
  };

  const removeShape = (shapeId: string) => {
    if (isReadOnly) return;
    updateCanvasState((prev) => ({
      ...prev,
      shapes: (prev.shapes || []).filter((s) => s.id !== shapeId),
    }));
    showSuccess("Figura eliminada.");
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
    const gps = bbox
      ? MapboxMath.pixelToLatLng(x, y, bbox, CANVAS_WIDTH, CANVAS_HEIGHT)
      : { lat: 0, lng: 0 };

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
    const pixelRatio = mode === "attachment_photo" ? 1 : 2;
    const dataUrl = stage.toDataURL({ pixelRatio });
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
              : mode === "attachment_photo"
              ? `Edición de Foto: ${clientName}`
              : `Canva Satelital: ${clientName}`}
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
          ) : mode === "attachment_photo" ? (
            <Chip
              label="FOTO"
              color="info"
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
                onClick={() => setStageScale((s) => Math.min(s * 1.2, 6))}
                sx={{ p: { xs: 0.5, sm: 0.8 } }}
              >
                <ZoomInIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Alejar Vista">
              <IconButton
                size="small"
                onClick={() => setStageScale((s) => Math.max(s / 1.2, 0.05))}
                sx={{ p: { xs: 0.5, sm: 0.8 } }}
              >
                <ZoomOutIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Restablecer Vista y Centrar">
              <IconButton
                size="small"
                onClick={fitAndCenterStage}
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
        {/* 1. Desktop Left Sidebar: Compact Parent Categories with Flyouts */}
        {!isReadOnly && (
          <>
            <Paper
              elevation={2}
              sx={{
                width: 72,
                py: 1,
                px: 0.5,
                display: { xs: "none", md: "flex" },
                flexDirection: "column",
                alignItems: "center",
                gap: 0.6,
                borderRadius: 0,
                borderRight: "1px solid",
                borderColor: "divider",
                zIndex: 10,
                bgcolor: "background.paper",
                overflowY: "auto",
                overflowX: "hidden",
                maxHeight: "100%",
                "&::-webkit-scrollbar": { width: "3px" },
                "&::-webkit-scrollbar-thumb": {
                  backgroundColor: "rgba(255,255,255,0.2)",
                  borderRadius: "3px",
                },
              }}
            >
              {visibleCategories.map((cat) => {
                const active = isCategoryActive(cat.id);
                return (
                  <React.Fragment key={cat.id}>
                    <Tooltip arrow placement="right" title={flyoutCategory === cat.id ? "" : cat.name}>
                      <Box
                        onClick={(e) => {
                          if (cat.isDirect) {
                            if (cat.id === "select") setActiveTool("select");
                            if (cat.id === "perimeter") setActiveTool("perimeter");
                            if (cat.id === "eraser") {
                              setActiveTool("eraser");
                              setSelectedElement(null);
                            }
                            setFlyoutCategory(null);
                            setFlyoutAnchorEl(null);
                          } else {
                            if (flyoutCategory === cat.id) {
                              setFlyoutCategory(null);
                              setFlyoutAnchorEl(null);
                            } else {
                              setFlyoutCategory(cat.id);
                              setFlyoutAnchorEl(e.currentTarget);
                            }
                          }
                        }}
                        sx={{
                          width: 58,
                          minHeight: 46,
                          borderRadius: 2,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          bgcolor: active ? "action.selected" : "transparent",
                          border: active ? "1.5px solid" : "1px solid transparent",
                          borderColor: active
                            ? cat.id === "eraser"
                              ? "error.main"
                              : cat.id === "perimeter"
                              ? "secondary.main"
                              : "primary.main"
                            : "transparent",
                          color: active
                            ? cat.id === "eraser"
                              ? "error.light"
                              : cat.id === "perimeter"
                              ? "secondary.light"
                              : "primary.light"
                            : "text.primary",
                          transition: "all 0.15s ease",
                          "&:hover": {
                            bgcolor: "action.hover",
                            borderColor: active ? "primary.main" : "divider",
                          },
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {cat.icon}
                        </Box>
                        <Typography
                          variant="caption"
                          sx={{
                            fontSize: "0.58rem",
                            fontWeight: active ? 800 : 500,
                            lineHeight: 1,
                            mt: 0.3,
                            textAlign: "center",
                            color: "inherit",
                          }}
                        >
                          {cat.shortName}
                        </Typography>
                      </Box>
                    </Tooltip>
                    {/* Visual divider separating direct tools (mover, borrar, etc.) from placement categories */}
                    {((cat.id === "eraser" && mode !== "geofence") || (cat.id === "perimeter" && mode === "geofence")) && (
                      <Divider sx={{ width: "80%", my: 0.4, borderColor: "rgba(255, 255, 255, 0.12)" }} />
                    )}
                  </React.Fragment>
                );
              })}
            </Paper>

            {/* Desktop Flyout Popover */}
            <Popover
              open={Boolean(flyoutAnchorEl && activeFlyoutCategoryObj && activeFlyoutCategoryObj.subItems)}
              anchorEl={flyoutAnchorEl}
              onClose={() => {
                setFlyoutCategory(null);
                setFlyoutAnchorEl(null);
              }}
              anchorOrigin={{ vertical: "top", horizontal: "right" }}
              transformOrigin={{ vertical: "top", horizontal: "left" }}
              disableRestoreFocus
              sx={{
                zIndex: 100000,
              }}
              slotProps={{
                root: {
                  sx: { zIndex: 100000 },
                },
                backdrop: {
                  sx: { zIndex: 100000, bgcolor: "transparent" },
                },
                paper: {
                  sx: {
                    zIndex: 100000,
                    bgcolor: "#0f172a",
                    backgroundImage: "linear-gradient(rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0))",
                    border: "1px solid rgba(255, 255, 255, 0.16)",
                    borderRadius: 2.5,
                    boxShadow: "0 20px 45px rgba(0, 0, 0, 0.75)",
                    p: 2,
                    width: (activeFlyoutCategoryObj?.subItems?.length || 0) > 3 ? 500 : 330,
                    maxWidth: "calc(100vw - 90px)",
                    boxSizing: "border-box",
                    ml: 1,
                  },
                },
              }}
            >
              {activeFlyoutCategoryObj && (
                <Box>
                  {/* Category Header */}
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Box sx={{ color: "primary.light", display: "flex" }}>
                        {activeFlyoutCategoryObj.icon}
                      </Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#FFF", fontSize: "0.9rem" }}>
                        {activeFlyoutCategoryObj.name}
                      </Typography>
                    </Stack>
                    <IconButton
                      size="small"
                      onClick={() => {
                        setFlyoutCategory(null);
                        setFlyoutAnchorEl(null);
                      }}
                      sx={{ color: "rgba(255,255,255,0.6)", p: 0.5 }}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Box>

                  {/* Sub-items Grid */}
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns:
                        activeFlyoutCategoryObj.subItems && activeFlyoutCategoryObj.subItems.length > 3
                          ? "repeat(2, minmax(0, 1fr))"
                          : "1fr",
                      gap: 1,
                    }}
                  >
                    {activeFlyoutCategoryObj.subItems?.map((sub) => {
                      const selected = isSubItemSelected(sub);
                      return (
                        <Box
                          key={sub.id}
                          onClick={() => handleSelectSubItem(sub)}
                          sx={{
                            p: 1,
                            borderRadius: 2,
                            bgcolor: selected ? "rgba(59, 130, 246, 0.2)" : "rgba(255, 255, 255, 0.04)",
                            border: selected ? "1.5px solid #3B82F6" : "1px solid rgba(255, 255, 255, 0.08)",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            minWidth: 0,
                            boxSizing: "border-box",
                            transition: "all 0.15s ease",
                            "&:hover": {
                              bgcolor: "rgba(59, 130, 246, 0.15)",
                              borderColor: "rgba(59, 130, 246, 0.5)",
                              transform: "translateY(-1px)",
                            },
                          }}
                        >
                          <Box
                            sx={{
                              width: 32,
                              height: 32,
                              borderRadius: 1.5,
                              bgcolor: selected ? "primary.main" : "rgba(255, 255, 255, 0.08)",
                              color: "#FFF",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            {sub.icon}
                          </Box>
                          <Box sx={{ minWidth: 0, flex: 1, overflow: "hidden" }}>
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: 700,
                                color: "#FFF",
                                fontSize: "0.8rem",
                                lineHeight: 1.2,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {sub.name}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{
                                color: "rgba(255, 255, 255, 0.6)",
                                fontSize: "0.68rem",
                                display: "block",
                                mt: 0.2,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {sub.desc}
                            </Typography>
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>

                  {/* Device / Facility Status Picker in Flyout */}
                  {activeFlyoutCategoryObj.hasStatusPicker && (
                    <Box sx={{ mt: 1.5, pt: 1.5, borderTop: "1px solid rgba(255, 255, 255, 0.1)" }}>
                      <Typography variant="caption" sx={{ color: "rgba(255, 255, 255, 0.7)", fontWeight: 700, display: "block", mb: 0.8 }}>
                        Estado al posicionar:
                      </Typography>
                      <Stack direction="row" spacing={0.8}>
                        {STATUS_OPTIONS.map((st) => {
                          const isSelected = deviceStatusToAdd === st.id;
                          return (
                            <Box
                              key={st.id}
                              component="button"
                              type="button"
                              onClick={() => setDeviceStatusToAdd(st.id)}
                              sx={{
                                flex: 1,
                                height: 28,
                                borderRadius: "9999px",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 0.6,
                                px: 1,
                                fontSize: "0.72rem",
                                fontWeight: isSelected ? 800 : 600,
                                fontFamily: "inherit",
                                cursor: "pointer",
                                outline: "none",
                                transition: "all 0.18s ease-in-out",
                                bgcolor: isSelected ? st.color : "rgba(255, 255, 255, 0.05)",
                                color: isSelected ? "#FFFFFF" : "rgba(255, 255, 255, 0.85)",
                                border: isSelected ? "1.5px solid #FFFFFF" : "1px solid rgba(255, 255, 255, 0.18)",
                                boxShadow: isSelected ? `0 2px 8px ${st.color}88` : "none",
                                "&:hover": {
                                  bgcolor: st.color,
                                  color: "#FFFFFF",
                                  borderColor: isSelected ? "#FFFFFF" : st.color,
                                  boxShadow: `0 0 10px ${st.color}77`,
                                  "& .status-dot": {
                                    color: "#FFFFFF",
                                  },
                                },
                              }}
                            >
                              <Box
                                component="span"
                                className="status-dot"
                                sx={{
                                  color: isSelected ? "#FFFFFF" : st.color,
                                  fontSize: "0.85rem",
                                  lineHeight: 1,
                                  transition: "color 0.18s ease-in-out",
                                }}
                              >
                                ●
                              </Box>
                              <Box component="span" sx={{ lineHeight: 1 }}>
                                {st.label}
                              </Box>
                            </Box>
                          );
                        })}
                      </Stack>
                    </Box>
                  )}

                  {/* Drawing & Shapes Color/Width Picker in Flyout */}
                  {activeFlyoutCategoryObj.hasColorPicker && (
                    <Box sx={{ mt: 1.5, pt: 1.5, borderTop: "1px solid rgba(255, 255, 255, 0.1)" }}>
                      <Typography variant="caption" sx={{ color: "rgba(255, 255, 255, 0.7)", fontWeight: 700, display: "block", mb: 0.8 }}>
                        Color de trazo / figura:
                      </Typography>
                      <Stack direction="row" spacing={0.8} alignItems="center" sx={{ mb: 1.2, flexWrap: "wrap", gap: 0.6 }}>
                        {PALETTE_COLORS.map((c) => (
                          <Box
                            key={c}
                            onClick={() => setStrokeColor(c)}
                            sx={{
                              width: 20,
                              height: 20,
                              borderRadius: "50%",
                              bgcolor: c,
                              cursor: "pointer",
                              border: strokeColor === c ? "2px solid #FFF" : "1px solid rgba(255,255,255,0.3)",
                              boxShadow: strokeColor === c ? `0 0 8px ${c}` : "none",
                              transform: strokeColor === c ? "scale(1.2)" : "scale(1)",
                              transition: "transform 0.15s ease",
                              "&:hover": { transform: "scale(1.2)" },
                            }}
                          />
                        ))}
                      </Stack>
                      <Typography variant="caption" sx={{ color: "rgba(255, 255, 255, 0.7)", fontWeight: 700, display: "block", mb: 0.8 }}>
                        Grosor:
                      </Typography>
                      <Stack direction="row" spacing={0.6}>
                        {STROKE_WIDTHS.map((w) => (
                          <Chip
                            key={w}
                            label={`${w}px`}
                            size="small"
                            onClick={() => setStrokeWidth(w)}
                            sx={{
                              flex: 1,
                              height: 24,
                              fontSize: "0.72rem",
                              fontWeight: strokeWidth === w ? 700 : 500,
                              bgcolor: strokeWidth === w ? "primary.main" : "rgba(255, 255, 255, 0.1)",
                              color: "#FFF",
                              cursor: "pointer",
                            }}
                          />
                        ))}
                      </Stack>
                    </Box>
                  )}
                </Box>
              )}
            </Popover>

            {/* 2. Mobile Bottom Navigation: Floating Dock */}
            <Paper
              elevation={6}
              sx={{
                position: "absolute",
                bottom: 12,
                left: "50%",
                transform: "translateX(-50%)",
                zIndex: 1100,
                maxWidth: "calc(100% - 24px)",
                bgcolor: "rgba(15, 23, 42, 0.94)",
                backdropFilter: "blur(16px)",
                border: "1px solid rgba(255, 255, 255, 0.16)",
                borderRadius: 4,
                boxShadow: "0 10px 30px rgba(0, 0, 0, 0.7)",
                px: 1,
                py: 0.6,
                display: { xs: "flex", md: "none" },
                alignItems: "center",
                gap: 0.6,
                overflowX: "auto",
                "&::-webkit-scrollbar": { display: "none" },
                scrollbarWidth: "none",
              }}
            >
              {visibleCategories.map((cat) => {
                const active = isCategoryActive(cat.id);
                return (
                  <Box
                    key={cat.id}
                    onClick={() => {
                      if (cat.isDirect) {
                        if (cat.id === "select") setActiveTool("select");
                        if (cat.id === "perimeter") setActiveTool("perimeter");
                        if (cat.id === "eraser") {
                          setActiveTool("eraser");
                          setSelectedElement(null);
                        }
                        setMobileSheetCategory(null);
                      } else {
                        setMobileSheetCategory(cat.id);
                      }
                    }}
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      minWidth: 46,
                      height: 44,
                      borderRadius: 2,
                      cursor: "pointer",
                      bgcolor: active ? "rgba(59, 130, 246, 0.25)" : "transparent",
                      border: active ? "1.5px solid #3B82F6" : "1px solid transparent",
                      color: active ? "primary.light" : "rgba(255, 255, 255, 0.75)",
                      transition: "all 0.15s ease",
                      px: 0.5,
                      "&:active": { transform: "scale(0.95)" },
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {cat.icon}
                    </Box>
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: "0.58rem",
                        fontWeight: active ? 800 : 500,
                        lineHeight: 1,
                        mt: 0.2,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {cat.shortName}
                    </Typography>
                  </Box>
                );
              })}
            </Paper>

            {/* Mobile Bottom Sheet Drawer */}
            <Drawer
              anchor="bottom"
              open={Boolean(mobileSheetCategory && activeMobileCategoryObj && activeMobileCategoryObj.subItems)}
              onClose={() => setMobileSheetCategory(null)}
              sx={{ zIndex: 100000 }}
              slotProps={{
                backdrop: {
                  sx: { zIndex: 100000, bgcolor: "rgba(0, 0, 0, 0.65)" },
                },
              }}
              PaperProps={{
                sx: {
                  zIndex: 100000,
                  bgcolor: "#0f172a",
                  borderTopLeftRadius: 20,
                  borderTopRightRadius: 20,
                  border: "1px solid rgba(255, 255, 255, 0.16)",
                  borderBottom: "none",
                  p: 2,
                  pb: 4,
                  maxHeight: "80vh",
                  overflowY: "auto",
                },
              }}
            >
              {activeMobileCategoryObj && (
                <Box>
                  {/* Drag Handle Bar */}
                  <Box
                    sx={{
                      width: 38,
                      height: 4,
                      borderRadius: 2,
                      bgcolor: "rgba(255, 255, 255, 0.3)",
                      mx: "auto",
                      mb: 2,
                    }}
                  />

                  {/* Drawer Header */}
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Box sx={{ color: "primary.light", display: "flex" }}>
                        {activeMobileCategoryObj.icon}
                      </Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#FFF" }}>
                        {activeMobileCategoryObj.name}
                      </Typography>
                    </Stack>
                    <IconButton size="small" onClick={() => setMobileSheetCategory(null)} sx={{ color: "rgba(255,255,255,0.7)" }}>
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Box>

                  {/* Subitems Grid */}
                  <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
                    {activeMobileCategoryObj.subItems?.map((sub) => {
                      const selected = isSubItemSelected(sub);
                      return (
                        <Box
                          key={sub.id}
                          onClick={() => handleSelectSubItem(sub)}
                          sx={{
                            p: 1.2,
                            borderRadius: 2,
                            bgcolor: selected ? "rgba(59, 130, 246, 0.2)" : "rgba(255, 255, 255, 0.04)",
                            border: selected ? "1.5px solid #3B82F6" : "1px solid rgba(255, 255, 255, 0.08)",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 1.2,
                            transition: "all 0.15s ease",
                            "&:active": { transform: "scale(0.97)" },
                          }}
                        >
                          <Box
                            sx={{
                              width: 34,
                              height: 34,
                              borderRadius: 1.5,
                              bgcolor: selected ? "primary.main" : "rgba(255, 255, 255, 0.08)",
                              color: "#FFF",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            {sub.icon}
                          </Box>
                          <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 700, color: "#FFF", fontSize: "0.82rem", lineHeight: 1.2 }}
                            >
                              {sub.name}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{
                                color: "rgba(255, 255, 255, 0.6)",
                                fontSize: "0.68rem",
                                display: "block",
                                mt: 0.2,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {sub.desc}
                            </Typography>
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>

                  {/* Device / Facility Status Picker in Drawer */}
                  {activeMobileCategoryObj.hasStatusPicker && (
                    <Box sx={{ mt: 2, pt: 1.5, borderTop: "1px solid rgba(255, 255, 255, 0.1)" }}>
                      <Typography variant="caption" sx={{ color: "rgba(255, 255, 255, 0.7)", fontWeight: 700, display: "block", mb: 0.8 }}>
                        Estado al posicionar:
                      </Typography>
                      <Stack direction="row" spacing={1}>
                        {STATUS_OPTIONS.map((st) => {
                          const isSelected = deviceStatusToAdd === st.id;
                          return (
                            <Box
                              key={st.id}
                              component="button"
                              type="button"
                              onClick={() => setDeviceStatusToAdd(st.id)}
                              sx={{
                                flex: 1,
                                height: 28,
                                borderRadius: "9999px",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 0.6,
                                px: 1,
                                fontSize: "0.75rem",
                                fontWeight: isSelected ? 800 : 600,
                                fontFamily: "inherit",
                                cursor: "pointer",
                                outline: "none",
                                transition: "all 0.18s ease-in-out",
                                bgcolor: isSelected ? st.color : "rgba(255, 255, 255, 0.05)",
                                color: isSelected ? "#FFFFFF" : "rgba(255, 255, 255, 0.85)",
                                border: isSelected ? "1.5px solid #FFFFFF" : "1px solid rgba(255, 255, 255, 0.18)",
                                boxShadow: isSelected ? `0 2px 8px ${st.color}88` : "none",
                                "&:hover": {
                                  bgcolor: st.color,
                                  color: "#FFFFFF",
                                  borderColor: isSelected ? "#FFFFFF" : st.color,
                                  boxShadow: `0 0 10px ${st.color}77`,
                                  "& .status-dot": {
                                    color: "#FFFFFF",
                                  },
                                },
                              }}
                            >
                              <Box
                                component="span"
                                className="status-dot"
                                sx={{
                                  color: isSelected ? "#FFFFFF" : st.color,
                                  fontSize: "0.85rem",
                                  lineHeight: 1,
                                  transition: "color 0.18s ease-in-out",
                                }}
                              >
                                ●
                              </Box>
                              <Box component="span" sx={{ lineHeight: 1 }}>
                                {st.label}
                              </Box>
                            </Box>
                          );
                        })}
                      </Stack>
                    </Box>
                  )}

                  {/* Drawing & Shapes Color/Width Picker in Drawer */}
                  {activeMobileCategoryObj.hasColorPicker && (
                    <Box sx={{ mt: 2, pt: 1.5, borderTop: "1px solid rgba(255, 255, 255, 0.1)" }}>
                      <Typography variant="caption" sx={{ color: "rgba(255, 255, 255, 0.7)", fontWeight: 700, display: "block", mb: 0.8 }}>
                        Color de trazo / figura:
                      </Typography>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5, flexWrap: "wrap", gap: 0.8 }}>
                        {PALETTE_COLORS.map((c) => (
                          <Box
                            key={c}
                            onClick={() => setStrokeColor(c)}
                            sx={{
                              width: 24,
                              height: 24,
                              borderRadius: "50%",
                              bgcolor: c,
                              cursor: "pointer",
                              border: strokeColor === c ? "2px solid #FFF" : "1px solid rgba(255,255,255,0.3)",
                              boxShadow: strokeColor === c ? `0 0 8px ${c}` : "none",
                              transform: strokeColor === c ? "scale(1.2)" : "scale(1)",
                              transition: "transform 0.15s ease",
                            }}
                          />
                        ))}
                      </Stack>
                      <Typography variant="caption" sx={{ color: "rgba(255, 255, 255, 0.7)", fontWeight: 700, display: "block", mb: 0.8 }}>
                        Grosor:
                      </Typography>
                      <Stack direction="row" spacing={0.8}>
                        {STROKE_WIDTHS.map((w) => (
                          <Chip
                            key={w}
                            label={`${w}px`}
                            size="small"
                            onClick={() => setStrokeWidth(w)}
                            sx={{
                              flex: 1,
                              height: 26,
                              fontSize: "0.75rem",
                              fontWeight: strokeWidth === w ? 700 : 500,
                              bgcolor: strokeWidth === w ? "primary.main" : "rgba(255, 255, 255, 0.1)",
                              color: "#FFF",
                              cursor: "pointer",
                            }}
                          />
                        ))}
                      </Stack>
                    </Box>
                  )}
                </Box>
              )}
            </Drawer>
          </>
        )}

        {/* Floating Contextual Instruction Bar */}
        <Box
          sx={{
            position: "absolute",
            top: { xs: 8, md: 12 },
            left: !isReadOnly ? { xs: 8, md: 88 } : 16,
            right: { xs: 8, md: "auto" },
            maxWidth: { xs: "calc(100% - 16px)", md: "calc(100% - 110px)" },
            zIndex: 10,
            bgcolor: "rgba(15, 23, 42, 0.94)",
            backdropFilter: "blur(12px)",
            color: "white",
            px: { xs: 1.2, sm: 2 },
            py: { xs: 0.8, sm: 1 },
            borderRadius: 2.5,
            border: "1px solid rgba(255, 255, 255, 0.16)",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5)",
            boxSizing: "border-box",
            pointerEvents:
              selectedElement ||
              activeTool === "perimeter" ||
              activeTool === "facility" ||
              ["pencil", "marker", "highlighter", "shape"].includes(activeTool)
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
            <Box
              sx={{
                width: "100%",
                display: "flex",
                flexDirection: { xs: "column", md: "row" },
                alignItems: { xs: "stretch", md: "center" },
                gap: { xs: 0.8, md: 1.5 },
              }}
            >
              {/* Header: Element Title and Mobile Action Buttons */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 1,
                  minWidth: 0,
                  flex: 1,
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 0, flex: 1 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: { xs: "0.8rem", sm: "0.88rem" },
                      fontWeight: 800,
                      color: "#FFF",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {getSelectedElementName()}
                  </Typography>
                </Stack>

                {/* Mobile action buttons (Delete & Close) in first row */}
                <Box sx={{ display: { xs: "flex", md: "none" }, alignItems: "center", gap: 0.8, flexShrink: 0 }}>
                  <Button
                    size="small"
                    variant="contained"
                    color="error"
                    startIcon={<DeleteIcon sx={{ fontSize: "0.95rem !important" }} />}
                    onClick={handleDeleteSelected}
                    sx={{
                      py: 0.25,
                      px: 1,
                      textTransform: "none",
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      borderRadius: 1.5,
                      minWidth: 0,
                    }}
                  >
                    Eliminar
                  </Button>
                  <IconButton
                    size="small"
                    onClick={() => setSelectedElement(null)}
                    title="Cerrar"
                    sx={{
                      color: "rgba(255, 255, 255, 0.7)",
                      bgcolor: "rgba(255, 255, 255, 0.08)",
                      p: 0.4,
                      borderRadius: 1.5,
                      "&:hover": {
                        bgcolor: "rgba(255, 255, 255, 0.16)",
                        color: "#FFF",
                      },
                    }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>

              {/* Status Picker: Full-width row on mobile, inline on desktop */}
              {(selectedElement.type === "device" || selectedElement.type === "facility") && (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.8,
                    pt: { xs: 0.6, md: 0 },
                    borderTop: { xs: "1px solid rgba(255, 255, 255, 0.08)", md: "none" },
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      color: "rgba(255, 255, 255, 0.65)",
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    Estado:
                  </Typography>
                  <Stack direction="row" spacing={0.8} sx={{ flex: 1 }}>
                    {STATUS_OPTIONS.map((st) => {
                      let isCurrent = false;
                      if (selectedElement.type === "device") {
                        const selDev = canvasData.devices.find((d) => d.id === selectedElement.id);
                        isCurrent = (selDev?.status || "EXISTING") === st.id;
                      } else if (selectedElement.type === "facility") {
                        const selFac = canvasData.facilities.find((f) => f.id === selectedElement.id);
                        isCurrent = (selFac?.status || "EXISTING") === st.id;
                      }
                      return (
                        <Box
                          key={st.id}
                          component="button"
                          type="button"
                          onClick={() => {
                            if (selectedElement.type === "device") {
                              handleChangeDeviceStatus(selectedElement.id, st.id);
                            } else if (selectedElement.type === "facility") {
                              handleChangeFacilityStatus(selectedElement.id, st.id);
                            }
                          }}
                          sx={{
                            flex: 1,
                            height: 25,
                            borderRadius: "9999px",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 0.5,
                            px: 0.8,
                            fontSize: "0.72rem",
                            fontWeight: isCurrent ? 800 : 500,
                            fontFamily: "inherit",
                            cursor: "pointer",
                            outline: "none",
                            transition: "all 0.15s ease",
                            bgcolor: isCurrent ? st.color : "rgba(255, 255, 255, 0.06)",
                            color: isCurrent ? "#FFF" : "rgba(255, 255, 255, 0.75)",
                            border: isCurrent ? "1.5px solid #FFFFFF" : "1px solid rgba(255, 255, 255, 0.15)",
                            boxShadow: isCurrent ? `0 2px 6px ${st.color}88` : "none",
                            "&:hover": {
                              bgcolor: st.color,
                              color: "#FFF",
                              borderColor: "#FFF",
                              "& .status-pill-dot": { color: "#FFF" },
                            },
                          }}
                        >
                          <Box
                            component="span"
                            className="status-pill-dot"
                            sx={{
                              color: isCurrent ? "#FFF" : st.color,
                              fontSize: "0.75rem",
                              lineHeight: 1,
                            }}
                          >
                            ●
                          </Box>
                          <Box component="span" sx={{ lineHeight: 1 }}>
                            {st.label}
                          </Box>
                        </Box>
                      );
                    })}
                  </Stack>
                </Box>
              )}

              {/* Desktop action buttons inline */}
              <Box sx={{ display: { xs: "none", md: "flex" }, alignItems: "center", gap: 1, flexShrink: 0 }}>
                <Button
                  size="small"
                  variant="contained"
                  color="error"
                  startIcon={<DeleteIcon sx={{ fontSize: "0.95rem !important" }} />}
                  onClick={handleDeleteSelected}
                  sx={{
                    py: 0.3,
                    px: 1.5,
                    textTransform: "none",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    borderRadius: 1.5,
                  }}
                >
                  Eliminar (Supr)
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  color="inherit"
                  onClick={() => setSelectedElement(null)}
                  sx={{
                    py: 0.3,
                    px: 1.5,
                    textTransform: "none",
                    fontSize: "0.75rem",
                    borderRadius: 1.5,
                    borderColor: "rgba(255, 255, 255, 0.3)",
                  }}
                >
                  Cerrar (Esc)
                </Button>
              </Box>
            </Box>
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

          {!imageLoading && ["pencil", "marker", "highlighter", "shape"].includes(activeTool) && (
            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ flexWrap: "wrap", gap: 1 }}>
              <Typography variant="body2" sx={{ fontSize: "0.85rem", fontWeight: 700, color: "#fff" }}>
                {activeTool === "pencil"
                  ? "✏️ Lápiz"
                  : activeTool === "marker"
                  ? "🖌️ Marcador"
                  : activeTool === "highlighter"
                  ? "🖍️ Resaltador"
                  : "📐 Figura"}
              </Typography>

              {/* Color Swatches */}
              <Stack direction="row" spacing={0.6} alignItems="center">
                <Typography variant="caption" sx={{ color: "rgba(255, 255, 255, 0.7)", fontSize: "0.72rem", mr: 0.2 }}>
                  Color:
                </Typography>
                {PALETTE_COLORS.map((c) => (
                  <Box
                    key={c}
                    onClick={() => setStrokeColor(c)}
                    sx={{
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      bgcolor: c,
                      cursor: "pointer",
                      border: strokeColor === c ? "2px solid #FFF" : "1px solid rgba(255,255,255,0.3)",
                      boxShadow: strokeColor === c ? "0 0 6px " + c : "none",
                      transform: strokeColor === c ? "scale(1.2)" : "scale(1)",
                      transition: "transform 0.15s ease",
                      "&:hover": { transform: "scale(1.2)" },
                    }}
                  />
                ))}
              </Stack>

              {/* Stroke Width Selector */}
              <Stack direction="row" spacing={0.5} alignItems="center">
                <Typography variant="caption" sx={{ color: "rgba(255, 255, 255, 0.7)", fontSize: "0.72rem", mr: 0.2 }}>
                  Grosor:
                </Typography>
                {STROKE_WIDTHS.map((w) => (
                  <Chip
                    key={w}
                    label={`${w}px`}
                    size="small"
                    onClick={() => setStrokeWidth(w)}
                    sx={{
                      height: 22,
                      fontSize: "0.72rem",
                      fontWeight: strokeWidth === w ? 700 : 500,
                      bgcolor: strokeWidth === w ? "primary.main" : "rgba(255, 255, 255, 0.1)",
                      color: "#FFF",
                      cursor: "pointer",
                      "&:hover": {
                        bgcolor: strokeWidth === w ? "primary.dark" : "rgba(255, 255, 255, 0.2)",
                      },
                    }}
                  />
                ))}
              </Stack>

              {/* Shape Type Selector if shape tool */}
              {activeTool === "shape" && (
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <Typography variant="caption" sx={{ color: "rgba(255, 255, 255, 0.7)", fontSize: "0.72rem", mr: 0.2 }}>
                    Tipo:
                  </Typography>
                  {[
                    { type: "rectangle", label: "Rectángulo" },
                    { type: "square", label: "Cuadrado" },
                    { type: "circle", label: "Círculo" },
                    { type: "ellipse", label: "Elipse" },
                    { type: "rhombus", label: "Rombo" },
                    { type: "arrow", label: "Flecha" },
                  ].map((sh) => (
                    <Chip
                      key={sh.type}
                      label={sh.label}
                      size="small"
                      onClick={() => setActiveShapeType(sh.type as any)}
                      sx={{
                        height: 22,
                        fontSize: "0.72rem",
                        fontWeight: activeShapeType === sh.type ? 700 : 500,
                        bgcolor: activeShapeType === sh.type ? "secondary.main" : "rgba(255, 255, 255, 0.1)",
                        color: "#FFF",
                        cursor: "pointer",
                        "&:hover": {
                          bgcolor: activeShapeType === sh.type ? "secondary.dark" : "rgba(255, 255, 255, 0.2)",
                        },
                      }}
                    />
                  ))}
                </Stack>
              )}
            </Stack>
          )}
        </Box>

        {/* Konva Stage Canvas Container */}
        <Box
          ref={containerRef}
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
                : ["pencil", "marker", "highlighter", "shape"].includes(activeTool)
                ? "crosshair"
                : activeTool === "eraser"
                ? "not-allowed"
                : "cell",
          }}
        >
          <Stage
            ref={stageRef}
            width={canvasWidth}
            height={canvasHeight}
            draggable={activeTool === "select" && !isReadOnly}
            scaleX={stageScale}
            scaleY={stageScale}
            x={stagePos.x}
            y={stagePos.y}
            onWheel={handleWheel}
            onMouseDown={handleStageMouseDown}
            onMouseMove={handleStageMouseMove}
            onMouseUp={handleStageMouseUp}
            onTouchStart={handleStageMouseDown}
            onTouchMove={handleStageMouseMove}
            onTouchEnd={handleStageMouseUp}
            onClick={handleStageClick}
            onTap={handleStageClick}
            onDragEnd={(e) => {
              if (e.target === stageRef.current) {
                setStagePos({ x: e.target.x(), y: e.target.y() });
              }
            }}
          >
            {/* 1. Base Layer (Satellite Image or User Uploaded Photo) */}
            <Layer>
              {image ? (
                <KonvaImage
                  image={image}
                  width={canvasWidth}
                  height={canvasHeight}
                />
              ) : (
                <Rect
                  width={canvasWidth}
                  height={canvasHeight}
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
                    scaleX={scaleFactor}
                    scaleY={scaleFactor}
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

            {/* 5. Layer Geometric Shapes & Arrows */}
            <Layer listening={activeTool === "eraser"}>
              {canvasData.shapes?.map((sh) => {
                const handleEraserClick = (e: any) => {
                  if (activeTool === "eraser") {
                    e.cancelBubble = true;
                    removeShape(sh.id);
                  }
                };

                if (sh.type === "arrow" && sh.points) {
                  return (
                    <Arrow
                      key={sh.id}
                      points={sh.points}
                      stroke={sh.stroke}
                      fill={sh.stroke}
                      strokeWidth={sh.strokeWidth}
                      pointerLength={Math.round(14 * scaleFactor)}
                      pointerWidth={Math.round(14 * scaleFactor)}
                      hitStrokeWidth={20}
                      onClick={handleEraserClick}
                      onTap={handleEraserClick}
                    />
                  );
                }

                if (sh.type === "circle" || sh.type === "ellipse") {
                  return (
                    <Ellipse
                      key={sh.id}
                      x={sh.x}
                      y={sh.y}
                      radiusX={sh.radiusX || 20}
                      radiusY={sh.radiusY || 20}
                      stroke={sh.stroke}
                      strokeWidth={sh.strokeWidth}
                      fill={sh.fill}
                      hitStrokeWidth={16}
                      onClick={handleEraserClick}
                      onTap={handleEraserClick}
                    />
                  );
                }

                if (sh.type === "rhombus" && sh.points) {
                  return (
                    <Line
                      key={sh.id}
                      points={sh.points}
                      closed
                      stroke={sh.stroke}
                      strokeWidth={sh.strokeWidth}
                      fill={sh.fill}
                      hitStrokeWidth={16}
                      onClick={handleEraserClick}
                      onTap={handleEraserClick}
                    />
                  );
                }

                return (
                  <Rect
                    key={sh.id}
                    x={sh.x}
                    y={sh.y}
                    width={sh.width || 40}
                    height={sh.height || 40}
                    stroke={sh.stroke}
                    strokeWidth={sh.strokeWidth}
                    fill={sh.fill}
                    hitStrokeWidth={16}
                    onClick={handleEraserClick}
                    onTap={handleEraserClick}
                  />
                );
              })}
            </Layer>

            {/* 6. Layer Freehand Strokes (Pencil, Marker, Highlighter) */}
            <Layer listening={activeTool === "eraser"}>
              {canvasData.strokes?.map((str) => (
                <Line
                  key={str.id}
                  points={str.points}
                  stroke={str.color}
                  strokeWidth={str.strokeWidth}
                  opacity={str.opacity ?? 1}
                  tension={0.5}
                  lineCap="round"
                  lineJoin="round"
                  hitStrokeWidth={Math.max(str.strokeWidth + 10, 16)}
                  onClick={(e) => {
                    if (activeTool === "eraser") {
                      e.cancelBubble = true;
                      removeStroke(str.id);
                    }
                  }}
                  onTap={(e) => {
                    if (activeTool === "eraser") {
                      e.cancelBubble = true;
                      removeStroke(str.id);
                    }
                  }}
                />
              ))}
            </Layer>

            {/* 7. Layer Active In-Progress Drawing Preview */}
            <Layer listening={false}>
              {isDrawing && currentStroke.length >= 2 && (
                <Line
                  points={currentStroke}
                  stroke={strokeColor}
                  strokeWidth={activeTool === "highlighter" ? Math.max(strokeWidth, 16) : strokeWidth}
                  opacity={activeTool === "highlighter" ? 0.35 : 1}
                  tension={0.5}
                  lineCap="round"
                  lineJoin="round"
                />
              )}

              {isDrawing && shapeStart && shapeCurrent && activeTool === "shape" && (
                <>
                  {activeShapeType === "arrow" && (
                    <Arrow
                      points={[shapeStart.x, shapeStart.y, shapeCurrent.x, shapeCurrent.y]}
                      stroke={strokeColor}
                      fill={strokeColor}
                      strokeWidth={strokeWidth}
                      pointerLength={Math.round(14 * scaleFactor)}
                      pointerWidth={Math.round(14 * scaleFactor)}
                    />
                  )}
                  {activeShapeType === "rectangle" && (
                    <Rect
                      x={Math.min(shapeStart.x, shapeCurrent.x)}
                      y={Math.min(shapeStart.y, shapeCurrent.y)}
                      width={Math.abs(shapeCurrent.x - shapeStart.x)}
                      height={Math.abs(shapeCurrent.y - shapeStart.y)}
                      stroke={strokeColor}
                      strokeWidth={strokeWidth}
                      dash={[6, 4]}
                    />
                  )}
                  {activeShapeType === "square" && (() => {
                    const dx = shapeCurrent.x - shapeStart.x;
                    const dy = shapeCurrent.y - shapeStart.y;
                    const side = Math.max(Math.abs(dx), Math.abs(dy));
                    const sx = dx >= 0 ? shapeStart.x : shapeStart.x - side;
                    const sy = dy >= 0 ? shapeStart.y : shapeStart.y - side;
                    return (
                      <Rect
                        x={sx}
                        y={sy}
                        width={side}
                        height={side}
                        stroke={strokeColor}
                        strokeWidth={strokeWidth}
                        dash={[6, 4]}
                      />
                    );
                  })()}
                  {(activeShapeType === "circle" || activeShapeType === "ellipse") && (() => {
                    const dx = shapeCurrent.x - shapeStart.x;
                    const dy = shapeCurrent.y - shapeStart.y;
                    const rx = activeShapeType === "circle" ? Math.round(Math.hypot(dx, dy) / 2) : Math.round(Math.abs(dx) / 2);
                    const ry = activeShapeType === "circle" ? rx : Math.round(Math.abs(dy) / 2);
                    const cx = Math.round((shapeStart.x + shapeCurrent.x) / 2);
                    const cy = Math.round((shapeStart.y + shapeCurrent.y) / 2);
                    return (
                      <Ellipse
                        x={cx}
                        y={cy}
                        radiusX={rx}
                        radiusY={ry}
                        stroke={strokeColor}
                        strokeWidth={strokeWidth}
                        dash={[6, 4]}
                      />
                    );
                  })()}
                  {activeShapeType === "rhombus" && (() => {
                    const dx = shapeCurrent.x - shapeStart.x;
                    const dy = shapeCurrent.y - shapeStart.y;
                    const rx = Math.round(Math.abs(dx) / 2);
                    const ry = Math.round(Math.abs(dy) / 2);
                    const cx = Math.round((shapeStart.x + shapeCurrent.x) / 2);
                    const cy = Math.round((shapeStart.y + shapeCurrent.y) / 2);
                    const pts = [cx, cy - ry, cx + rx, cy, cx, cy + ry, cx - rx, cy];
                    return (
                      <Line
                        points={pts}
                        closed
                        stroke={strokeColor}
                        strokeWidth={strokeWidth}
                        dash={[6, 4]}
                      />
                    );
                  })()}
                </>
              )}
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
                display: { xs: "none", md: "block" },
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
                    A Instalar: <strong>{canvasStats.planned}</strong>
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
                    Dañado: <strong>{canvasStats.damaged}</strong>
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
    case "cam_analytics":
      return "Cámara Video Analítica";
    case "cam_thermal":
      return "Cámara Térmica";
    case "dvr_nvr":
      return "Grabador DVR / NVR";
    case "sensor_motion":
      return "Sensor de Movimiento";
    case "alarm_intrusion":
      return "Alarma de Intrusión";
    case "alarm_emergency":
      return "Alarma de Emergencias / Pánico";
    case "gatehouse":
      return "Portería Principal";
    case "vehicle_barrier":
      return "Talanquera Vehicular";
    case "facial_panel":
      return "Panel Reconocimiento Facial";
    case "led_post_light":
      return "Luminaria LED en Poste";
    case "led_floodlight":
      return "Reflector Perimetral LED";
    case "electric_cabinet":
      return "Gabinete Eléctrico";
    case "ups_backup":
      return "UPS / Respaldo Baterías";
    case "network_switch":
      return "Switch de Red / PoE";
    case "power_generator":
      return "Generador Eléctrico";
    default:
      return "Dispositivo";
  }
}

export function getDeviceStatusColor(status?: DeviceStatus): string {
  switch (status) {
    case "EXISTING":
      return "#10B981"; // Verde (Existente)
    case "DAMAGED":
      return "#EF4444"; // Rojo (Dañado)
    case "PLANNED":
      return "#3B82F6"; // Azul (A instalar)
    default:
      return "#10B981";
  }
}

export function getDeviceStatusLabel(status?: DeviceStatus): string {
  switch (status) {
    case "EXISTING":
      return "Existente";
    case "DAMAGED":
      return "Dañado";
    case "PLANNED":
      return "A Instalar";
    default:
      return "Existente";
  }
}

function getDeviceColor(type: CanvasDevice["type"]): string {
  switch (type) {
    case "camera_bullet":
    case "camera_dome":
    case "camera_ptz":
    case "cam_analytics":
    case "cam_thermal":
    case "dvr_nvr":
      return "#1976D2";
    case "sensor_motion":
    case "alarm_intrusion":
    case "alarm_emergency":
      return "#ED6C02";
    case "gatehouse":
    case "vehicle_barrier":
    case "facial_panel":
      return "#2E7D32";
    case "led_post_light":
    case "led_floodlight":
      return "#F59E0B";
    case "electric_cabinet":
    case "ups_backup":
    case "network_switch":
    case "power_generator":
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
    case "cam_analytics":
      return "M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z";
    case "cam_thermal":
      return "M15 13V5c0-1.66-1.34-3-3-3S9 3.34 9 5v8c-1.21.91-2 2.37-2 4 0 2.76 2.24 5 5 5s5-2.24 5-5c0-1.63-.79-3.09-2-4zm-4-8c0-.55.45-1 1-1s1 .45 1 1h-1v1h1v2h-1v1h1v1h-2V5z";
    case "dvr_nvr":
      return "M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zM7 15c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm12-2h-6v-2h6v2z";
    case "sensor_motion":
      return "M12 15c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zm0-8c3.87 0 7 3.13 7 7h2c0-4.97-4.03-9-9-9s-9 4.03-9 9h2c0-3.87 3.13-7 7-7z";
    case "alarm_intrusion":
      return "M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z";
    case "alarm_emergency":
      return "M12 2L1 21h22L12 2zm1 14h-2v-2h2v2zm0-4h-2v-4h2v4z";
    case "gatehouse":
      return "M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm-7 2h2v4h-2V6zm-5 0h3v4H7V6zm12 14H5V12h14v8z";
    case "vehicle_barrier":
      return "M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z";
    case "facial_panel":
      return "M12 2a5 5 0 0 1 5 5v1a5 5 0 0 1-10 0V7a5 5 0 0 1 5-5zm-7 18a7 7 0 0 1 14 0H5z";
    case "led_post_light":
      return "M12 2C8.13 2 5 5.13 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.87-3.13-7-7-7zm-2 17h4v1h-4v-1zm1 2h2v1h-2v-1z";
    case "led_floodlight":
      return "M7 2v11h3v9l7-12h-4l4-8z";
    case "electric_cabinet":
      return "M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-5 13.5l1.5-3.5H11V8l-2 5h2v4z";
    case "ups_backup":
      return "M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4zM11 20v-5.5H9L13 7v5.5h2L11 20z";
    case "network_switch":
      return "M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zM6 10h3v4H6v-4zm5 0h3v4h-3v-4zm5 0h3v4h-3v-4z";
    case "power_generator":
      return "M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-7 11H8v-2h4v2zm5 0h-3v-2h3v2zm3-5H4v-3c0-.55.45-1 1-1h14c.55 0 1 .45 1 1v3zM12 2l-2 4h4l-2-4z";
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
    case "cam_analytics":
      return "IA";
    case "cam_thermal":
      return "T";
    case "dvr_nvr":
      return "DVR";
    case "sensor_motion":
      return "S";
    case "alarm_intrusion":
      return "AI";
    case "alarm_emergency":
      return "SOS";
    case "gatehouse":
      return "G";
    case "vehicle_barrier":
      return "V";
    case "facial_panel":
      return "RF";
    case "led_post_light":
      return "LED";
    case "led_floodlight":
      return "REF";
    case "electric_cabinet":
      return "GE";
    case "ups_backup":
      return "UPS";
    case "network_switch":
      return "SW";
    case "power_generator":
      return "GEN";
    default:
      return "•";
  }
}
