"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Box,
  Button,
  Grid,
  TextField,
  Typography,
  Tabs,
  Tab,
  MenuItem,
  Breadcrumbs,
  Link,
  Chip,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Divider,
  IconButton,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Switch,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  PersonAdd as PersonAddIcon,
  CloudUpload as CloudUploadIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { HttpClient } from "@/lib/api/client";
import { useNotification } from "@/providers/NotificationProvider";
import DataTable from "@/components/common/DataTable";
import PromptConfirmDialog from "@/components/common/PromptConfirmDialog";
import CsvImportDialog from "@/components/common/CsvImportDialog";
import { GridColDef } from "@mui/x-data-grid";
import { formatDateTime } from "@/lib/formatters";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

interface TowerInput {
  towerName: string;
  floorsAmount: number;
  apartmentsPerFloor: number;
  elevators: number;
}

interface AdditionalContact {
  title: string;
  name: string;
  phone: string;
  email: string;
}

interface CouncilMember {
  name: string;
  phone: string;
  email: string;
  unit: string;
}

export default function ClientDetailPage() {
  const params = useParams();
  const clientId = params.id as string;
  const router = useRouter();
  const { showSuccess, showError } = useNotification();

  const [tabIndex, setTabIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [client, setClient] = useState<any | null>(null);
  const [employees, setEmployees] = useState<{ value: string; label: string }[]>([]);

  // Dirty state tracking
  const [isDirty, setIsDirty] = useState(false);
  const [csvImportOpen, setCsvImportOpen] = useState(false);

  // Tab 0: General Info & Location
  const [generalForm, setGeneralForm] = useState({
    name: "",
    nit: "",
    internalCode: "",
    sector: "RESIDENTIAL",
    clientStatus: "ACTIVE",
    address: "",
    phone: "",
    receptionPhone: "",
    email: "",
    city: "Bogotá",
    state: "",
    commune: "",
    neighborhood: "",
    cai: "",
    quadrant: "",
    quadrantPhone: "",
    observations: "",
  });

  // Tab 1: Physical Structure & Common Areas
  const [structureType, setStructureType] = useState<string>("BUILDING_CLUSTER");
  const [floorsAmount, setFloorsAmount] = useState<number>(5);
  const [apartmentsPerFloor, setApartmentsPerFloor] = useState<number>(4);
  const [singleElevators, setSingleElevators] = useState<number>(1);
  const [towers, setTowers] = useState<TowerInput[]>([
    { towerName: "Torre 1", floorsAmount: 10, apartmentsPerFloor: 4, elevators: 2 },
  ]);
  const [unitsAmount, setUnitsAmount] = useState<number>(50);
  const [housePrefix, setHousePrefix] = useState<string>("Casa");
  const [commercialStoresAmount, setCommercialStoresAmount] = useState<number>(0);

  const [entries, setEntries] = useState({
    mainEntry: true,
    separateVehicleEntryExit: false,
    sharedVehicleEntryExit: true,
    exclusivePetEntry: false,
    exclusiveDeliveryEntry: false,
    sharedPetDeliveryEntry: true,
  });
  const [entryImages, setEntryImages] = useState<Record<string, string>>({});

  const [amenities, setAmenities] = useState({
    hasSocialRoom: false,
    socialRoomAmount: 0,
    hasGym: false,
    gymAmount: 0,
    hasPool: false,
    poolAmount: 0,
    hasTennisCourt: false,
    tennisCourtAmount: 0,
    hasBasketballCourt: false,
    basketballCourtAmount: 0,
    hasFootballCourt: false,
    footballCourtAmount: 0,
    hasVolleyballCourt: false,
    volleyballCourtAmount: 0,
    hasSquashCourt: false,
    squashCourtAmount: 0,
    hasPlayground: false,
    playgroundAmount: 0,
    hasParking: true,
    parkingAmount: 50,
    hasGuestParking: true,
    guestParkingAmount: 15,
    hasBicycleRack: true,
    bicycleRackAmount: 20,
    hasStorageRoom: false,
    storageRoomAmount: 0,
  });

  // Tab 2: Contractual Info
  const [contractForm, setContractForm] = useState({
    contractNumber: "",
    contractStatus: "ACTIVE",
    renewedContract: false,
    contractDate: "",
    lastContractDate: "",
    coordinatorInChargeId: "",
    commercialContactId: "",
    weaponsAmount: 0,
    installedTech: false,
    securityStudy: "",
  });
  const [contractMediaFiles, setContractMediaFiles] = useState<Record<string, string>>({});

  // Tab 3: Administration & Contacts
  const [administrationType, setAdministrationType] = useState<string>("INDIVIDUAL");
  const [individualAdmin, setIndividualAdmin] = useState({
    administrator: "",
    identificationNumber: "",
    administratorEmail: "",
    administratorPhone: "",
  });
  const [enterpriseAdmin, setEnterpriseAdmin] = useState({
    companyName: "",
    nit: "",
    phone: "",
    email: "",
    legalRepName: "",
    legalRepId: "",
    legalRepPhone: "",
    additionalContacts: [] as AdditionalContact[],
  });

  // Tab 4: Council of Administration
  const [councilPresident, setCouncilPresident] = useState<CouncilMember>({
    name: "",
    phone: "",
    email: "",
    unit: "",
  });
  const [councilTreasurer, setCouncilTreasurer] = useState<CouncilMember>({
    name: "",
    phone: "",
    email: "",
    unit: "",
  });
  const [councilMembers, setCouncilMembers] = useState<CouncilMember[]>([]);

  // Tab 5: Residents
  const [units, setUnits] = useState<any[]>([]);
  const [residents, setResidents] = useState<any[]>([]);
  const [residentModalOpen, setResidentModalOpen] = useState(false);
  const [selectedResidentId, setSelectedResidentId] = useState<string | null>(null);
  const [deleteResident, setDeleteResident] = useState<any | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  // Resident Filters
  const [filterTower, setFilterTower] = useState<string>("ALL");
  const [filterType, setFilterType] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [residentForm, setResidentForm] = useState({
    unitId: "",
    residentType: "OWNER",
    idType: "CI",
    firstName: "",
    lastName: "",
    document: "",
    phoneNumber: "",
    email: "",
    gender: "M",
    birthdate: "",
    residentSince: new Date().toISOString().split("T")[0],
  });

  // Mark dirty helper
  const markDirty = () => {
    setIsDirty(true);
  };

  // Fetch client details
  const fetchClient = async () => {
    setLoading(true);
    try {
      const [data, employeesData] = await Promise.all([
        HttpClient.get<any>(`/client/${clientId}`),
        HttpClient.get<any[]>("/employee").catch(() => []),
      ]);

      setClient(data);
      setEmployees(
        employeesData.map((e) => ({
          value: e.id,
          label: `${e.fullName} (${e.positionName || "Sin Cargo"})`,
        })),
      );

      // Tab 0
      setGeneralForm({
        name: data.name || "",
        nit: data.nit || "",
        internalCode: data.internalCode || "",
        sector: data.sector || "RESIDENTIAL",
        clientStatus: data.clientStatus || "ACTIVE",
        address: data.address || "",
        phone: data.phone || "",
        receptionPhone: data.receptionPhone || "",
        email: data.email || "",
        city: data.city || "Bogotá",
        state: data.state || "",
        commune: data.commune || "",
        neighborhood: data.neighborhood || "",
        cai: data.cai || "",
        quadrant: data.quadrant || "",
        quadrantPhone: data.quadrantPhone || "",
        observations: data.observations || "",
      });

      // Tab 1
      const props = data.clientProperties || {};
      const sType = props.structureType || "BUILDING_CLUSTER";
      setStructureType(sType);
      setUnitsAmount(props.unitsAmount || 50);
      setCommercialStoresAmount(props.commercialStoresAmount || 0);

      if (data.towers && data.towers.length > 0) {
        setTowers(
          data.towers.map((t: any) => ({
            towerName: t.towerName || "Torre",
            floorsAmount: t.floorsAmount || 10,
            apartmentsPerFloor: t.apartmentsPerFloor || 4,
            elevators: t.elevators || 1,
          })),
        );
        if (sType === "SINGLE_BUILDING") {
          setFloorsAmount(data.towers[0]?.floorsAmount || 5);
          setApartmentsPerFloor(data.towers[0]?.apartmentsPerFloor || 4);
          setSingleElevators(data.towers[0]?.elevators || 1);
        }
      } else {
        setFloorsAmount(5);
        setApartmentsPerFloor(4);
        setSingleElevators(1);
      }

      if (props.entriesDescription) {
        setEntries((prev) => ({ ...prev, ...props.entriesDescription }));
      }
      if (props.entriesMediaFiles) {
        setEntryImages(props.entriesMediaFiles);
      }

      setAmenities({
        hasSocialRoom: Boolean(props.hasSocialRoom),
        socialRoomAmount: props.socialRoomAmount || 0,
        hasGym: Boolean(props.hasGym),
        gymAmount: props.gymAmount || 0,
        hasPool: Boolean(props.hasPool),
        poolAmount: props.poolAmount || 0,
        hasTennisCourt: Boolean(props.hasTennisCourt),
        tennisCourtAmount: props.tennisCourtAmount || 0,
        hasBasketballCourt: Boolean(props.hasBasketballCourt),
        basketballCourtAmount: props.basketballCourtAmount || 0,
        hasFootballCourt: Boolean(props.hasFootballCourt),
        footballCourtAmount: props.footballCourtAmount || 0,
        hasVolleyballCourt: Boolean(props.hasVolleyballCourt),
        volleyballCourtAmount: props.volleyballCourtAmount || 0,
        hasSquashCourt: Boolean(props.hasSquashCourt),
        squashCourtAmount: props.squashCourtAmount || 0,
        hasPlayground: Boolean(props.hasPlayground),
        playgroundAmount: props.playgroundAmount || 0,
        hasParking: Boolean(props.hasParking),
        parkingAmount: props.parkingAmount || 0,
        hasGuestParking: Boolean(props.hasGuestParking),
        guestParkingAmount: props.guestParkingAmount || 0,
        hasBicycleRack: Boolean(props.hasBicycleRack),
        bicycleRackAmount: props.bicycleRackAmount || 0,
        hasStorageRoom: Boolean(props.hasStorageRoom),
        storageRoomAmount: props.storageRoomAmount || 0,
      });

      // Tab 2
      setContractForm({
        contractNumber: data.contractNumber || "",
        contractStatus: data.contractStatus || "ACTIVE",
        renewedContract: Boolean(data.renewedContract),
        contractDate: data.contractDate ? data.contractDate.split("T")[0] : "",
        lastContractDate: data.lastContractDate
          ? data.lastContractDate.split("T")[0]
          : data.contractEndDate
            ? data.contractEndDate.split("T")[0]
            : "",
        coordinatorInChargeId: data.coordinatorInChargeId || "",
        commercialContactId: data.commercialContactId || "",
        weaponsAmount: data.weaponsAmount || 0,
        installedTech: Boolean(data.installedTech),
        securityStudy: data.securityStudy || "",
      });
      if (data.contractMediaFiles) {
        setContractMediaFiles(data.contractMediaFiles);
      }

      // Tab 3
      const admType = data.administrationType || "INDIVIDUAL";
      setAdministrationType(admType);
      const admComp = data.administrationCompanyData || {};

      setIndividualAdmin({
        administrator: data.administrator || "",
        identificationNumber: admComp.identificationNumber || "",
        administratorEmail: data.administratorEmail || "",
        administratorPhone: data.administratorPhone || "",
      });

      setEnterpriseAdmin({
        companyName: admComp.companyName || data.administrator || "",
        nit: admComp.nit || "",
        phone: admComp.phone || data.administratorPhone || "",
        email: admComp.email || data.administratorEmail || "",
        legalRepName: admComp.legalRepName || "",
        legalRepId: admComp.legalRepId || "",
        legalRepPhone: admComp.legalRepPhone || "",
        additionalContacts: admComp.additionalContacts || [],
      });

      // Tab 4
      const cData = data.councilData || {};
      setCouncilPresident(cData.president || { name: "", phone: "", email: "", unit: "" });
      setCouncilTreasurer(cData.treasurer || { name: "", phone: "", email: "", unit: "" });
      setCouncilMembers(cData.councilMembers || []);

      setUnits(data.units || []);
      setIsDirty(false);
    } catch (err: any) {
      showError(err.message || "Error al cargar cliente");
    } finally {
      setLoading(false);
    }
  };

  const fetchResidents = async () => {
    try {
      const data = await HttpClient.get<any[]>(`/resident/by-client/${clientId}`);
      setResidents(data);
    } catch (err: any) {
      showError(err.message || "Error al cargar residentes");
    }
  };

  useEffect(() => {
    if (clientId) {
      fetchClient();
      fetchResidents();
    }
  }, [clientId]);

  // Tower handlers
  const handleAddTower = () => {
    markDirty();
    const nextTowerNum = towers.length + 1;
    setTowers((prev) => [
      ...prev,
      { towerName: `Torre ${nextTowerNum}`, floorsAmount: 10, apartmentsPerFloor: 4, elevators: 1 },
    ]);
  };

  const handleRemoveTower = (index: number) => {
    markDirty();
    setTowers((prev) => prev.filter((_, i) => i !== index));
  };

  const handleTowerChange = (index: number, field: keyof TowerInput, value: any) => {
    markDirty();
    setTowers((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Entrance handlers
  const handleEntryChange = (name: keyof typeof entries, checked: boolean) => {
    markDirty();
    setEntries((prev) => {
      const updated = { ...prev, [name]: checked };
      if (name === "separateVehicleEntryExit" && checked) updated.sharedVehicleEntryExit = false;
      else if (name === "sharedVehicleEntryExit" && checked) updated.separateVehicleEntryExit = false;

      if (name === "sharedPetDeliveryEntry" && checked) {
        updated.exclusivePetEntry = false;
        updated.exclusiveDeliveryEntry = false;
      } else if (name === "exclusivePetEntry" || name === "exclusiveDeliveryEntry") {
        if (checked && updated.exclusivePetEntry && updated.exclusiveDeliveryEntry) {
          updated.sharedPetDeliveryEntry = false;
        }
      }
      return updated;
    });
  };

  const handleImagePlaceholder = (entryKey: string) => {
    markDirty();
    setEntryImages((prev) => ({
      ...prev,
      [entryKey]: `foto_entrada_${entryKey}.jpg (adjuntada)`,
    }));
  };

  // Contract Media Placeholder
  const handleContractDocUpload = (docKey: string) => {
    markDirty();
    setContractMediaFiles((prev) => ({
      ...prev,
      [docKey]: `documento_${docKey}.pdf (cargado)`,
    }));
  };

  // Additional Contacts for Admin Enterprise
  const handleAddEnterpriseContact = () => {
    markDirty();
    setEnterpriseAdmin((prev) => ({
      ...prev,
      additionalContacts: [...prev.additionalContacts, { title: "", name: "", phone: "", email: "" }],
    }));
  };

  const handleRemoveEnterpriseContact = (idx: number) => {
    markDirty();
    setEnterpriseAdmin((prev) => ({
      ...prev,
      additionalContacts: prev.additionalContacts.filter((_, i) => i !== idx),
    }));
  };

  const handleEnterpriseContactChange = (idx: number, field: keyof AdditionalContact, value: string) => {
    markDirty();
    setEnterpriseAdmin((prev) => {
      const updated = [...prev.additionalContacts];
      updated[idx] = { ...updated[idx], [field]: value };
      return { ...prev, additionalContacts: updated };
    });
  };

  // Council Members
  const handleAddCouncilMember = () => {
    markDirty();
    setCouncilMembers((prev) => [...prev, { name: "", phone: "", email: "", unit: "" }]);
  };

  const handleRemoveCouncilMember = (idx: number) => {
    markDirty();
    setCouncilMembers((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleCouncilMemberChange = (idx: number, field: keyof CouncilMember, value: string) => {
    markDirty();
    setCouncilMembers((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      return updated;
    });
  };

  // Save Client Changes
  const handleSaveClientChanges = async () => {
    setSaving(true);
    try {
      const payload: any = {
        ...generalForm,
        ...contractForm,
        contractMediaFiles,
        administrationType,
        administrator:
          administrationType === "INDIVIDUAL"
            ? individualAdmin.administrator
            : enterpriseAdmin.companyName,
        administratorPhone:
          administrationType === "INDIVIDUAL"
            ? individualAdmin.administratorPhone
            : enterpriseAdmin.phone,
        administratorEmail:
          administrationType === "INDIVIDUAL"
            ? individualAdmin.administratorEmail
            : enterpriseAdmin.email,
        administrationCompanyData:
          administrationType === "ENTERPRISE"
            ? enterpriseAdmin
            : {
                identificationNumber: individualAdmin.identificationNumber,
              },
        councilData: {
          president: councilPresident,
          treasurer: councilTreasurer,
          councilMembers: councilMembers.filter((m) => m.name.trim() !== ""),
        },
        structureConfig: {
          structureType,
          floorsAmount: Number(floorsAmount),
          apartmentsPerFloor: Number(apartmentsPerFloor),
          towersAmount: structureType === "SINGLE_BUILDING" ? 1 : towers.length,
          towers:
            structureType === "SINGLE_BUILDING"
              ? [
                  {
                    towerName: "Edificio Principal",
                    floorsAmount: Number(floorsAmount),
                    apartmentsPerFloor: Number(apartmentsPerFloor),
                    elevators: Number(singleElevators),
                  },
                ]
              : towers.map((t) => ({
                  ...t,
                  floorsAmount: Number(t.floorsAmount),
                  apartmentsPerFloor: Number(t.apartmentsPerFloor),
                  elevators: Number(t.elevators || 0),
                })),
          unitsAmount: Number(unitsAmount),
          prefix: housePrefix,
          hasCommercialStores: structureType === "MIXED",
          commercialStoresAmount: structureType === "MIXED" ? Number(commercialStoresAmount) : 0,
          entriesDescription: entries,
          entriesMediaFiles: entryImages,
          ...amenities,
        },
      };

      await HttpClient.patch(`/client/${clientId}`, payload);
      showSuccess("¡Cambios del cliente y conjunto residencial guardados con éxito!");
      setIsDirty(false);
      fetchClient();
    } catch (err: any) {
      showError(err.message || "Error al actualizar cliente.");
    } finally {
      setSaving(false);
    }
  };

  // Filtered residents computed state
  const filteredResidents = useMemo(() => {
    return residents.filter((r) => {
      if (
        filterTower !== "ALL" &&
        r.unit?.tower?.id !== filterTower &&
        r.unit?.towerId !== filterTower
      ) {
        return false;
      }
      if (filterType !== "ALL" && r.residentType !== filterType) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const name = `${r.firstName} ${r.lastName}`.toLowerCase();
        const doc = (r.document || "").toLowerCase();
        const phone = (r.phoneNumber || "").toLowerCase();
        const unitName = (r.unit?.unitName || "").toLowerCase();
        return (
          name.includes(q) ||
          doc.includes(q) ||
          phone.includes(q) ||
          unitName.includes(q)
        );
      }
      return true;
    });
  }, [residents, filterTower, filterType, searchQuery]);

  // Resident Actions
  const handleOpenAddResident = () => {
    setSelectedResidentId(null);
    setResidentForm({
      unitId: units.length > 0 ? units[0].id : "",
      residentType: "OWNER",
      idType: "CI",
      firstName: "",
      lastName: "",
      document: "",
      phoneNumber: "",
      email: "",
      gender: "M",
      birthdate: "",
      residentSince: new Date().toISOString().split("T")[0],
    });
    setResidentModalOpen(true);
  };

  const handleOpenEditResident = (id: string, row: any) => {
    const target = row || residents.find((r) => r.id === id);
    if (!target) return;

    setSelectedResidentId(target.id);
    setResidentForm({
      unitId: target.unitId || target.unit?.id || "",
      residentType: target.residentType || "OWNER",
      idType: target.idType || "CI",
      firstName: target.firstName || "",
      lastName: target.lastName || "",
      document: target.document || "",
      phoneNumber: target.phoneNumber || "",
      email: target.email || "",
      gender: target.gender || "M",
      birthdate: target.birthdate ? target.birthdate.split("T")[0] : "",
      residentSince: target.residentSince ? target.residentSince.split("T")[0] : "",
    });
    setResidentModalOpen(true);
  };

  const handleSaveResident = async () => {
    if (!residentForm.firstName || !residentForm.lastName || !residentForm.document || !residentForm.unitId) {
      showError("Por favor complete los campos obligatorios del residente.");
      return;
    }

    try {
      const payload: any = {
        ...residentForm,
        clientId,
      };

      if (!payload.birthdate) delete payload.birthdate;
      if (!payload.email) delete payload.email;
      if (!payload.gender) delete payload.gender;
      if (!payload.residentSince) delete payload.residentSince;
      if (!payload.idType) delete payload.idType;

      if (selectedResidentId) {
        await HttpClient.patch(`/resident/${selectedResidentId}`, payload);
        showSuccess("Residente actualizado correctamente");
      } else {
        await HttpClient.post("/resident", payload);
        showSuccess("Residente registrado correctamente");
      }

      setResidentModalOpen(false);
      setRefreshTrigger((prev) => prev + 1);
      fetchResidents();
    } catch (err: any) {
      showError(err.message || "Error al guardar residente");
    }
  };

  const handleImportResidentsCsv = async (
    csvRows: Array<Record<string, string>>,
    fileName: string,
  ) => {
    const res = await HttpClient.post<any>("/resident/import/csv", {
      clientId,
      data: csvRows,
      fileName,
    });
    setRefreshTrigger((prev) => prev + 1);
    fetchResidents();
    return res;
  };

  const handleConfirmDeleteResident = async () => {
    if (!deleteResident) return;
    try {
      await HttpClient.delete(`/resident/${deleteResident.id}`);
      showSuccess("Residente dado de baja correctamente");
      setDeleteResident(null);
      setRefreshTrigger((prev) => prev + 1);
      fetchResidents();
    } catch (err: any) {
      showError(err.message || "Error al eliminar residente");
    }
  };

  const residentColumns: GridColDef[] = [
    {
      field: "unitName",
      headerName: "Unidad / Vivienda",
      flex: 1,
      minWidth: 150,
      valueGetter: (value: any, row: any) => row.unit?.unitName || "N/A",
    },
    {
      field: "fullName",
      headerName: "Nombre del Residente",
      flex: 1.5,
      minWidth: 200,
      valueGetter: (value: any, row: any) => `${row.firstName} ${row.lastName}`,
    },
    {
      field: "phoneNumber",
      headerName: "Teléfono / Citofonía",
      flex: 1,
      minWidth: 140,
    },
    {
      field: "residentType",
      headerName: "Tipo Residente",
      width: 140,
      renderCell: (params) => {
        const colors: any = {
          OWNER: "primary",
          TENANT: "info",
          FAMILY_MEMBER: "secondary",
          OTHER: "default",
        };
        const labels: any = {
          OWNER: "Propietario",
          TENANT: "Inquilino",
          FAMILY_MEMBER: "Familiar",
          OTHER: "Otro",
        };
        return (
          <Chip
            label={labels[params.value] || params.value}
            color={colors[params.value] || "default"}
            size="small"
          />
        );
      },
    },
    {
      field: "createdAt",
      headerName: "Creado En",
      width: 160,
      valueFormatter: (value: any) => (value ? formatDateTime(value) : "N/A"),
    },
  ];

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 6 }}>
        <CircularProgress size={48} />
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 6 }}>
      {/* Top Header Bar */}
      <Box
        sx={{
          mb: 3,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Box>
          <Breadcrumbs sx={{ mb: 1 }}>
            <Link
              underline="hover"
              color="inherit"
              href="#"
              onClick={(e) => {
                e.preventDefault();
                router.push("/administrative/clients");
              }}
            >
              Mis Clientes / Clientes
            </Link>
            <Typography color="text.primary">{generalForm.name || client?.name}</Typography>
          </Breadcrumbs>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<ArrowBackIcon />}
              onClick={() => router.push("/administrative/clients")}
              sx={{ borderRadius: 2, textTransform: "none" }}
            >
              Volver a la Lista
            </Button>
            <Typography variant="h5" fontWeight="bold">
              {generalForm.name || client?.name}
            </Typography>
            <Chip label={generalForm.sector} color="primary" size="small" />
            <Chip
              label={generalForm.clientStatus === "ACTIVE" ? "CLIENTE ACTIVO" : generalForm.clientStatus}
              color="success"
              size="small"
              sx={{ fontWeight: 600 }}
            />
          </Box>
        </Box>

        {isDirty && (
          <Button
            variant="contained"
            color="primary"
            size="small"
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
            onClick={handleSaveClientChanges}
            disabled={saving}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              px: 2.5,
              fontWeight: 600,
              boxShadow: 2,
            }}
          >
            {saving ? "Guardando..." : "Guardar Cambios"}
          </Button>
        )}
      </Box>

      {/* Tabs */}
      <Paper sx={{ borderRadius: 3, mb: 3, boxShadow: 1 }}>
        <Tabs
          value={tabIndex}
          onChange={(_, val) => setTabIndex(val)}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
          sx={{ px: 2, borderBottom: 1, borderColor: "divider" }}
        >
          <Tab label="📍 INFORMACIÓN GENERAL Y UBICACIÓN" sx={{ fontWeight: 600, textTransform: "none" }} />
          <Tab label="🏢 ESTRUCTURA FÍSICA Y ÁREAS COMUNES" sx={{ fontWeight: 600, textTransform: "none" }} />
          <Tab label="📄 INFORMACIÓN CONTRACTUAL" sx={{ fontWeight: 600, textTransform: "none" }} />
          <Tab label="👤 ADMINISTRACIÓN Y CONTACTOS" sx={{ fontWeight: 600, textTransform: "none" }} />
          <Tab label="🏛️ CONSEJO DE ADMINISTRACIÓN" sx={{ fontWeight: 600, textTransform: "none" }} />
          <Tab
            label={`👥 RESIDENTES DEL CONJUNTO (${residents.length})`}
            sx={{ fontWeight: 600, textTransform: "none" }}
          />
        </Tabs>

        {/* TAB 0: INFORMACIÓN GENERAL Y UBICACIÓN */}
        <CustomTabPanel value={tabIndex} index={0}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2.5 }}>
              Información de Ubicación y Contacto del Inmueble
            </Typography>

            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  select
                  fullWidth
                  label="Sector *"
                  value={generalForm.sector}
                  onChange={(e) => {
                    markDirty();
                    setGeneralForm({ ...generalForm, sector: e.target.value });
                  }}
                >
                  <MenuItem value="RESIDENTIAL">Residencial (Conjuntos / Edificios)</MenuItem>
                  <MenuItem value="COMMERCIAL">Comercial / Centros Comerciales</MenuItem>
                  <MenuItem value="INDUSTRIAL">Industrial / Parques Industriales</MenuItem>
                  <MenuItem value="GOVERNMENT">Gubernamental</MenuItem>
                  <MenuItem value="OTHER">Otro</MenuItem>
                </TextField>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Nombre / Razón Social *"
                  value={generalForm.name}
                  onChange={(e) => {
                    markDirty();
                    setGeneralForm({ ...generalForm, name: e.target.value });
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  label="NIT *"
                  value={generalForm.nit}
                  onChange={(e) => {
                    markDirty();
                    setGeneralForm({ ...generalForm, nit: e.target.value });
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  label="Código Interno"
                  value={generalForm.internalCode}
                  onChange={(e) => {
                    markDirty();
                    setGeneralForm({ ...generalForm, internalCode: e.target.value });
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  label="Dirección *"
                  value={generalForm.address}
                  onChange={(e) => {
                    markDirty();
                    setGeneralForm({ ...generalForm, address: e.target.value });
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  label="Teléfono *"
                  value={generalForm.phone}
                  onChange={(e) => {
                    markDirty();
                    setGeneralForm({
                      ...generalForm,
                      phone: e.target.value.replace(/\D/g, ""),
                    });
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  label="Teléfono de Recepción / Portería"
                  value={generalForm.receptionPhone}
                  onChange={(e) => {
                    markDirty();
                    setGeneralForm({
                      ...generalForm,
                      receptionPhone: e.target.value.replace(/\D/g, ""),
                    });
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  label="Correo Electrónico *"
                  value={generalForm.email}
                  onChange={(e) => {
                    markDirty();
                    setGeneralForm({ ...generalForm, email: e.target.value });
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  label="Ciudad"
                  value={generalForm.city}
                  onChange={(e) => {
                    markDirty();
                    setGeneralForm({ ...generalForm, city: e.target.value });
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  label="Estado / Departamento"
                  value={generalForm.state}
                  onChange={(e) => {
                    markDirty();
                    setGeneralForm({ ...generalForm, state: e.target.value });
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  label="Localidad / Comuna"
                  value={generalForm.commune}
                  onChange={(e) => {
                    markDirty();
                    setGeneralForm({ ...generalForm, commune: e.target.value });
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  label="Barrio / Zona"
                  value={generalForm.neighborhood}
                  onChange={(e) => {
                    markDirty();
                    setGeneralForm({ ...generalForm, neighborhood: e.target.value });
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  label="CAI Cercano"
                  value={generalForm.cai}
                  onChange={(e) => {
                    markDirty();
                    setGeneralForm({ ...generalForm, cai: e.target.value });
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  label="Cuadrante de Policía"
                  value={generalForm.quadrant}
                  onChange={(e) => {
                    markDirty();
                    setGeneralForm({ ...generalForm, quadrant: e.target.value });
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  label="Teléfono del Cuadrante"
                  value={generalForm.quadrantPhone}
                  onChange={(e) => {
                    markDirty();
                    setGeneralForm({
                      ...generalForm,
                      quadrantPhone: e.target.value.replace(/\D/g, ""),
                    });
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Observaciones"
                  value={generalForm.observations}
                  onChange={(e) => {
                    markDirty();
                    setGeneralForm({ ...generalForm, observations: e.target.value });
                  }}
                />
              </Grid>
            </Grid>
          </Box>
        </CustomTabPanel>

        {/* TAB 1: ESTRUCTURA FÍSICA Y ÁREAS COMUNES */}
        <CustomTabPanel value={tabIndex} index={1}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2.5 }}>
              Modelado de Estructura, Accesos y Áreas Comunes
            </Typography>

            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  select
                  fullWidth
                  label="Tipo de Complejo *"
                  value={structureType}
                  onChange={(e) => {
                    markDirty();
                    setStructureType(e.target.value);
                  }}
                >
                  <MenuItem value="SINGLE_BUILDING">Edificio Único (Torre individual)</MenuItem>
                  <MenuItem value="BUILDING_CLUSTER">Conjunto de Torres / Bloques</MenuItem>
                  <MenuItem value="HOUSE_CLUSTER">Conjunto Cerrado de Casas</MenuItem>
                  <MenuItem value="MIXED">Conjunto Mixto (Residencial + Locales Comerciales)</MenuItem>
                  <MenuItem value="OTHER">Otro Tipo de Inmueble</MenuItem>
                </TextField>
              </Grid>

              {structureType === "MIXED" && (
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Cantidad de Locales Comerciales *"
                    value={commercialStoresAmount}
                    onChange={(e) => {
                      markDirty();
                      setCommercialStoresAmount(Number(e.target.value));
                    }}
                  />
                </Grid>
              )}

              {/* SINGLE_BUILDING */}
              {structureType === "SINGLE_BUILDING" && (
                <Grid size={{ xs: 12 }}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      Definición de Torre / Edificio
                    </Typography>
                  </Box>

                  <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2 }}>
                    <Grid container spacing={2} alignItems="center">
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <TextField
                          fullWidth
                          size="small"
                          type="number"
                          label="Pisos"
                          value={floorsAmount}
                          onChange={(e) => {
                            markDirty();
                            setFloorsAmount(Number(e.target.value));
                          }}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <TextField
                          fullWidth
                          size="small"
                          type="number"
                          label="Aptos / Piso"
                          value={apartmentsPerFloor}
                          onChange={(e) => {
                            markDirty();
                            setApartmentsPerFloor(Number(e.target.value));
                          }}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <TextField
                          fullWidth
                          size="small"
                          type="number"
                          label="Ascensores"
                          value={singleElevators}
                          onChange={(e) => {
                            markDirty();
                            setSingleElevators(Number(e.target.value));
                          }}
                        />
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
              )}

              {/* BUILDING_CLUSTER or MIXED */}
              {(structureType === "BUILDING_CLUSTER" || structureType === "MIXED") && (
                <Grid size={{ xs: 12 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      Definición de Torres / Edificios
                    </Typography>
                    <Button startIcon={<AddIcon />} variant="outlined" size="small" onClick={handleAddTower}>
                      Agregar Torre
                    </Button>
                  </Box>

                  {towers.map((tower, idx) => (
                    <Paper key={idx} variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2 }}>
                      <Grid container spacing={2} alignItems="center">
                        <Grid size={{ xs: 12, sm: 4 }}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Nombre de la Torre"
                            value={tower.towerName}
                            onChange={(e) => handleTowerChange(idx, "towerName", e.target.value)}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 2.5 }}>
                          <TextField
                            fullWidth
                            size="small"
                            type="number"
                            label="Pisos"
                            value={tower.floorsAmount}
                            onChange={(e) => handleTowerChange(idx, "floorsAmount", Number(e.target.value))}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 2.5 }}>
                          <TextField
                            fullWidth
                            size="small"
                            type="number"
                            label="Aptos / Piso"
                            value={tower.apartmentsPerFloor}
                            onChange={(e) => handleTowerChange(idx, "apartmentsPerFloor", Number(e.target.value))}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 2 }}>
                          <TextField
                            fullWidth
                            size="small"
                            type="number"
                            label="Ascensores"
                            value={tower.elevators}
                            onChange={(e) => handleTowerChange(idx, "elevators", Number(e.target.value))}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 1 }}>
                          {towers.length > 1 && (
                            <IconButton color="error" size="small" onClick={() => handleRemoveTower(idx)}>
                              <DeleteIcon />
                            </IconButton>
                          )}
                        </Grid>
                      </Grid>
                    </Paper>
                  ))}
                </Grid>
              )}

              {/* HOUSE_CLUSTER */}
              {structureType === "HOUSE_CLUSTER" && (
                <Grid size={{ xs: 12 }}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      Definición de Casas
                    </Typography>
                  </Box>

                  <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2 }}>
                    <Grid container spacing={2} alignItems="center">
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          fullWidth
                          size="small"
                          type="number"
                          label="Cantidad Total de Casas"
                          value={unitsAmount}
                          onChange={(e) => {
                            markDirty();
                            setUnitsAmount(Number(e.target.value));
                          }}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Prefijo de Inmueble"
                          value={housePrefix}
                          onChange={(e) => {
                            markDirty();
                            setHousePrefix(e.target.value);
                          }}
                        />
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
              )}

              {/* OTHER */}
              {structureType === "OTHER" && (
                <Grid size={{ xs: 12 }}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      Definición de Inmuebles
                    </Typography>
                  </Box>

                  <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2 }}>
                    <Grid container spacing={2} alignItems="center">
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          fullWidth
                          size="small"
                          type="number"
                          label="Cantidad Total de Inmuebles / Unidades"
                          value={unitsAmount}
                          onChange={(e) => {
                            markDirty();
                            setUnitsAmount(Number(e.target.value));
                          }}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Prefijo de Inmueble"
                          value={housePrefix}
                          onChange={(e) => {
                            markDirty();
                            setHousePrefix(e.target.value);
                          }}
                        />
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
              )}

              {/* Entrances */}
              <Grid size={{ xs: 12 }}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 600, my: 1.5 }}>
                  🚪 Entradas y Accesos
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                      <FormGroup>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={entries.mainEntry}
                              onChange={(e) => handleEntryChange("mainEntry", e.target.checked)}
                            />
                          }
                          label="1. Entrada Principal"
                        />
                        {entries.mainEntry && (
                          <Button
                            size="small"
                            startIcon={<CloudUploadIcon />}
                            variant="text"
                            onClick={() => handleImagePlaceholder("mainEntry")}
                            sx={{ ml: 4, mb: 1 }}
                          >
                            {entryImages["mainEntry"] || "Anexar foto Entrada Principal"}
                          </Button>
                        )}

                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={entries.separateVehicleEntryExit}
                              disabled={entries.sharedVehicleEntryExit}
                              onChange={(e) =>
                                handleEntryChange("separateVehicleEntryExit", e.target.checked)
                              }
                            />
                          }
                          label="2. Vehicular separada para entrada y salida"
                        />
                        {entries.separateVehicleEntryExit && (
                          <Button
                            size="small"
                            startIcon={<CloudUploadIcon />}
                            variant="text"
                            onClick={() => handleImagePlaceholder("separateVehicleEntryExit")}
                            sx={{ ml: 4, mb: 1 }}
                          >
                            {entryImages["separateVehicleEntryExit"] || "Anexar foto Vehicular Separada"}
                          </Button>
                        )}

                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={entries.sharedVehicleEntryExit}
                              disabled={entries.separateVehicleEntryExit}
                              onChange={(e) =>
                                handleEntryChange("sharedVehicleEntryExit", e.target.checked)
                              }
                            />
                          }
                          label="3. Vehicular compartida para entrada y salida"
                        />
                        {entries.sharedVehicleEntryExit && (
                          <Button
                            size="small"
                            startIcon={<CloudUploadIcon />}
                            variant="text"
                            onClick={() => handleImagePlaceholder("sharedVehicleEntryExit")}
                            sx={{ ml: 4, mb: 1 }}
                          >
                            {entryImages["sharedVehicleEntryExit"] || "Anexar foto Vehicular Compartida"}
                          </Button>
                        )}
                      </FormGroup>
                    </Paper>
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                      <FormGroup>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={entries.exclusivePetEntry}
                              disabled={entries.sharedPetDeliveryEntry}
                              onChange={(e) => handleEntryChange("exclusivePetEntry", e.target.checked)}
                            />
                          }
                          label="4. Entrada exclusiva mascotas"
                        />
                        {entries.exclusivePetEntry && (
                          <Button
                            size="small"
                            startIcon={<CloudUploadIcon />}
                            variant="text"
                            onClick={() => handleImagePlaceholder("exclusivePetEntry")}
                            sx={{ ml: 4, mb: 1 }}
                          >
                            {entryImages["exclusivePetEntry"] || "Anexar foto Acceso Mascotas"}
                          </Button>
                        )}

                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={entries.exclusiveDeliveryEntry}
                              disabled={entries.sharedPetDeliveryEntry}
                              onChange={(e) => handleEntryChange("exclusiveDeliveryEntry", e.target.checked)}
                            />
                          }
                          label="5. Entrada exclusiva domiciliarios"
                        />
                        {entries.exclusiveDeliveryEntry && (
                          <Button
                            size="small"
                            startIcon={<CloudUploadIcon />}
                            variant="text"
                            onClick={() => handleImagePlaceholder("exclusiveDeliveryEntry")}
                            sx={{ ml: 4, mb: 1 }}
                          >
                            {entryImages["exclusiveDeliveryEntry"] || "Anexar foto Domiciliarios"}
                          </Button>
                        )}

                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={entries.sharedPetDeliveryEntry}
                              disabled={entries.exclusivePetEntry && entries.exclusiveDeliveryEntry}
                              onChange={(e) =>
                                handleEntryChange("sharedPetDeliveryEntry", e.target.checked)
                              }
                            />
                          }
                          label="6. Entrada compartida para mascotas y domiciliarios"
                        />
                        {entries.sharedPetDeliveryEntry && (
                          <Button
                            size="small"
                            startIcon={<CloudUploadIcon />}
                            variant="text"
                            onClick={() => handleImagePlaceholder("sharedPetDeliveryEntry")}
                            sx={{ ml: 4, mb: 1 }}
                          >
                            {entryImages["sharedPetDeliveryEntry"] || "Anexar foto Acceso Compartido"}
                          </Button>
                        )}
                      </FormGroup>
                    </Paper>
                  </Grid>
                </Grid>
              </Grid>

              {/* Amenities */}
              <Grid size={{ xs: 12 }}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 600, my: 1.5 }}>
                  🏊‍♂️ Áreas Comunes, Parqueaderos y Servicios
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 3 }}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Parqueaderos Privados"
                      value={amenities.parkingAmount}
                      onChange={(e) => {
                        markDirty();
                        setAmenities({ ...amenities, parkingAmount: Number(e.target.value) });
                      }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 3 }}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Parqueaderos Visitantes"
                      value={amenities.guestParkingAmount}
                      onChange={(e) => {
                        markDirty();
                        setAmenities({ ...amenities, guestParkingAmount: Number(e.target.value) });
                      }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 3 }}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Bicicleteros"
                      value={amenities.bicycleRackAmount}
                      onChange={(e) => {
                        markDirty();
                        setAmenities({ ...amenities, bicycleRackAmount: Number(e.target.value) });
                      }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 3 }}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Depósitos"
                      value={amenities.storageRoomAmount}
                      onChange={(e) => {
                        markDirty();
                        setAmenities({ ...amenities, storageRoomAmount: Number(e.target.value) });
                      }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 3 }}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Salón Social"
                      value={amenities.socialRoomAmount}
                      onChange={(e) => {
                        markDirty();
                        setAmenities({
                          ...amenities,
                          hasSocialRoom: Number(e.target.value) > 0,
                          socialRoomAmount: Number(e.target.value),
                        });
                      }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 3 }}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Gimnasio"
                      value={amenities.gymAmount}
                      onChange={(e) => {
                        markDirty();
                        setAmenities({
                          ...amenities,
                          hasGym: Number(e.target.value) > 0,
                          gymAmount: Number(e.target.value),
                        });
                      }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 3 }}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Piscinas"
                      value={amenities.poolAmount}
                      onChange={(e) => {
                        markDirty();
                        setAmenities({
                          ...amenities,
                          hasPool: Number(e.target.value) > 0,
                          poolAmount: Number(e.target.value),
                        });
                      }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 3 }}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Canchas de Squash"
                      value={amenities.squashCourtAmount}
                      onChange={(e) => {
                        markDirty();
                        setAmenities({
                          ...amenities,
                          hasSquashCourt: Number(e.target.value) > 0,
                          squashCourtAmount: Number(e.target.value),
                        });
                      }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 3 }}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Canchas de Tenis"
                      value={amenities.tennisCourtAmount}
                      onChange={(e) => {
                        markDirty();
                        setAmenities({
                          ...amenities,
                          hasTennisCourt: Number(e.target.value) > 0,
                          tennisCourtAmount: Number(e.target.value),
                        });
                      }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 3 }}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Canchas de Fútbol"
                      value={amenities.footballCourtAmount}
                      onChange={(e) => {
                        markDirty();
                        setAmenities({
                          ...amenities,
                          hasFootballCourt: Number(e.target.value) > 0,
                          footballCourtAmount: Number(e.target.value),
                        });
                      }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 3 }}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Canchas de Baloncesto"
                      value={amenities.basketballCourtAmount}
                      onChange={(e) => {
                        markDirty();
                        setAmenities({
                          ...amenities,
                          hasBasketballCourt: Number(e.target.value) > 0,
                          basketballCourtAmount: Number(e.target.value),
                        });
                      }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 3 }}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Parques Infantiles"
                      value={amenities.playgroundAmount}
                      onChange={(e) => {
                        markDirty();
                        setAmenities({
                          ...amenities,
                          hasPlayground: Number(e.target.value) > 0,
                          playgroundAmount: Number(e.target.value),
                        });
                      }}
                    />
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Box>
        </CustomTabPanel>

        {/* TAB 2: INFORMACIÓN CONTRACTUAL */}
        <CustomTabPanel value={tabIndex} index={2}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2.5 }}>
              Datos del Contrato y Parámetros de Operación
            </Typography>

            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Número de Contrato *"
                  value={contractForm.contractNumber}
                  onChange={(e) => {
                    markDirty();
                    setContractForm({ ...contractForm, contractNumber: e.target.value });
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  select
                  fullWidth
                  label="Tipo de Contrato"
                  value={contractForm.renewedContract ? "RENEWED" : "NEW"}
                  onChange={(e) => {
                    markDirty();
                    setContractForm({
                      ...contractForm,
                      renewedContract: e.target.value === "RENEWED",
                    });
                  }}
                >
                  <MenuItem value="NEW">Contrato Nuevo</MenuItem>
                  <MenuItem value="RENEWED">Contrato Renovado</MenuItem>
                </TextField>
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  select
                  fullWidth
                  label="Estado del Contrato"
                  value={contractForm.contractStatus}
                  onChange={(e) => {
                    markDirty();
                    setContractForm({ ...contractForm, contractStatus: e.target.value });
                  }}
                >
                  <MenuItem value="ACTIVE">Activo</MenuItem>
                  <MenuItem value="SUSPENDED">Suspendido</MenuItem>
                  <MenuItem value="FINALIZED">Finalizado</MenuItem>
                  <MenuItem value="RENEWED">Renovado</MenuItem>
                  <MenuItem value="INACTIVE">Inactivo</MenuItem>
                </TextField>
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  type="date"
                  label="Fecha Inicial del Contrato"
                  InputLabelProps={{ shrink: true }}
                  value={contractForm.contractDate}
                  onChange={(e) => {
                    markDirty();
                    setContractForm({ ...contractForm, contractDate: e.target.value });
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  type="date"
                  label="Fecha Final del Contrato"
                  InputLabelProps={{ shrink: true }}
                  value={contractForm.lastContractDate}
                  onChange={(e) => {
                    markDirty();
                    setContractForm({ ...contractForm, lastContractDate: e.target.value });
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  select
                  fullWidth
                  label="Coordinador a Cargo"
                  value={contractForm.coordinatorInChargeId}
                  onChange={(e) => {
                    markDirty();
                    setContractForm({ ...contractForm, coordinatorInChargeId: e.target.value });
                  }}
                >
                  <MenuItem value="">-- Sin Asignar --</MenuItem>
                  {employees.map((emp) => (
                    <MenuItem key={emp.value} value={emp.value}>
                      {emp.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  select
                  fullWidth
                  label="Contacto Comercial Asignado"
                  value={contractForm.commercialContactId}
                  onChange={(e) => {
                    markDirty();
                    setContractForm({ ...contractForm, commercialContactId: e.target.value });
                  }}
                >
                  <MenuItem value="">-- Sin Asignar --</MenuItem>
                  {employees.map((emp) => (
                    <MenuItem key={emp.value} value={emp.value}>
                      {emp.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Armas Asignadas"
                  value={contractForm.weaponsAmount}
                  onChange={(e) => {
                    markDirty();
                    setContractForm({ ...contractForm, weaponsAmount: Number(e.target.value) });
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  label="Estudio de Seguridad"
                  value={contractForm.securityStudy}
                  onChange={(e) => {
                    markDirty();
                    setContractForm({ ...contractForm, securityStudy: e.target.value });
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }} sx={{ display: "flex", alignItems: "center" }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={contractForm.installedTech}
                      onChange={(e) => {
                        markDirty();
                        setContractForm({ ...contractForm, installedTech: e.target.checked });
                      }}
                    />
                  }
                  label="Tecnología de Seguridad Instalada"
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Divider sx={{ my: 1.5 }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
                  📎 Documentos Contractuales Adjuntos
                </Typography>
                <Grid container spacing={2}>
                  {["Contrato Principal", "RUT", "Cámara de Comercio", "Póliza de Cumplimiento"].map((doc) => (
                    <Grid size={{ xs: 12, sm: 6, md: 3 }} key={doc}>
                      <Paper variant="outlined" sx={{ p: 2, textAlign: "center", borderRadius: 2 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                          {doc}
                        </Typography>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<CloudUploadIcon />}
                          onClick={() => handleContractDocUpload(doc)}
                        >
                          {contractMediaFiles[doc] ? "Actualizar Archivo" : "Adjuntar Archivo"}
                        </Button>
                        {contractMediaFiles[doc] && (
                          <Typography variant="caption" display="block" color="success.main" sx={{ mt: 0.5 }}>
                            {contractMediaFiles[doc]}
                          </Typography>
                        )}
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </Grid>
            </Grid>
          </Box>
        </CustomTabPanel>

        {/* TAB 3: ADMINISTRACIÓN Y CONTACTOS */}
        <CustomTabPanel value={tabIndex} index={3}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2.5 }}>
              Datos de Administración del Conjunto
            </Typography>

            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  select
                  fullWidth
                  label="Tipo de Administración *"
                  value={administrationType}
                  onChange={(e) => {
                    markDirty();
                    setAdministrationType(e.target.value);
                  }}
                >
                  <MenuItem value="INDIVIDUAL">Administración Individual (Persona Natural)</MenuItem>
                  <MenuItem value="ENTERPRISE">Empresa de Administración (Persona Jurídica)</MenuItem>
                </TextField>
              </Grid>

              {/* INDIVIDUAL */}
              {administrationType === "INDIVIDUAL" ? (
                <>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Nombre Completo del Administrador *"
                      value={individualAdmin.administrator}
                      onChange={(e) => {
                        markDirty();
                        setIndividualAdmin({ ...individualAdmin, administrator: e.target.value });
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth
                      label="Cédula / Documento de Identidad"
                      value={individualAdmin.identificationNumber}
                      onChange={(e) => {
                        markDirty();
                        setIndividualAdmin({ ...individualAdmin, identificationNumber: e.target.value });
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth
                      label="Correo Electrónico del Administrador *"
                      value={individualAdmin.administratorEmail}
                      onChange={(e) => {
                        markDirty();
                        setIndividualAdmin({ ...individualAdmin, administratorEmail: e.target.value });
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth
                      label="Teléfono del Administrador *"
                      value={individualAdmin.administratorPhone}
                      onChange={(e) => {
                        markDirty();
                        setIndividualAdmin({
                          ...individualAdmin,
                          administratorPhone: e.target.value.replace(/\D/g, ""),
                        });
                      }}
                    />
                  </Grid>
                </>
              ) : (
                /* ENTERPRISE */
                <>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Razón Social de la Empresa *"
                      value={enterpriseAdmin.companyName}
                      onChange={(e) => {
                        markDirty();
                        setEnterpriseAdmin({ ...enterpriseAdmin, companyName: e.target.value });
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth
                      label="NIT de la Empresa *"
                      value={enterpriseAdmin.nit}
                      onChange={(e) => {
                        markDirty();
                        setEnterpriseAdmin({ ...enterpriseAdmin, nit: e.target.value });
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth
                      label="Teléfono de la Empresa *"
                      value={enterpriseAdmin.phone}
                      onChange={(e) => {
                        markDirty();
                        setEnterpriseAdmin({
                          ...enterpriseAdmin,
                          phone: e.target.value.replace(/\D/g, ""),
                        });
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth
                      label="Correo de la Empresa *"
                      value={enterpriseAdmin.email}
                      onChange={(e) => {
                        markDirty();
                        setEnterpriseAdmin({ ...enterpriseAdmin, email: e.target.value });
                      }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <Divider sx={{ my: 1.5 }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
                      Representante Legal de la Empresa
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <TextField
                          fullWidth
                          label="Nombre del Representante"
                          value={enterpriseAdmin.legalRepName}
                          onChange={(e) => {
                            markDirty();
                            setEnterpriseAdmin({ ...enterpriseAdmin, legalRepName: e.target.value });
                          }}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <TextField
                          fullWidth
                          label="Cédula del Representante"
                          value={enterpriseAdmin.legalRepId}
                          onChange={(e) => {
                            markDirty();
                            setEnterpriseAdmin({ ...enterpriseAdmin, legalRepId: e.target.value });
                          }}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <TextField
                          fullWidth
                          label="Teléfono del Representante"
                          value={enterpriseAdmin.legalRepPhone}
                          onChange={(e) => {
                            markDirty();
                            setEnterpriseAdmin({
                              ...enterpriseAdmin,
                              legalRepPhone: e.target.value.replace(/\D/g, ""),
                            });
                          }}
                        />
                      </Grid>
                    </Grid>
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", my: 1.5 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        Contactos Adicionales de la Administración
                      </Typography>
                      <Button startIcon={<AddIcon />} variant="outlined" size="small" onClick={handleAddEnterpriseContact}>
                        Agregar Contacto
                      </Button>
                    </Box>

                    {enterpriseAdmin.additionalContacts.map((contact, idx) => (
                      <Paper key={idx} variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2 }}>
                        <Grid container spacing={2} alignItems="center">
                          <Grid size={{ xs: 12, sm: 3 }}>
                            <TextField
                              fullWidth
                              size="small"
                              label="Cargo / Rol"
                              value={contact.title}
                              onChange={(e) => handleEnterpriseContactChange(idx, "title", e.target.value)}
                            />
                          </Grid>
                          <Grid size={{ xs: 12, sm: 3 }}>
                            <TextField
                              fullWidth
                              size="small"
                              label="Nombre"
                              value={contact.name}
                              onChange={(e) => handleEnterpriseContactChange(idx, "name", e.target.value)}
                            />
                          </Grid>
                          <Grid size={{ xs: 12, sm: 3 }}>
                            <TextField
                              fullWidth
                              size="small"
                              label="Teléfono"
                              value={contact.phone}
                              onChange={(e) =>
                                handleEnterpriseContactChange(idx, "phone", e.target.value.replace(/\D/g, ""))
                              }
                            />
                          </Grid>
                          <Grid size={{ xs: 12, sm: 2.5 }}>
                            <TextField
                              fullWidth
                              size="small"
                              label="Correo"
                              value={contact.email}
                              onChange={(e) => handleEnterpriseContactChange(idx, "email", e.target.value)}
                            />
                          </Grid>
                          <Grid size={{ xs: 12, sm: 0.5 }}>
                            <IconButton color="error" size="small" onClick={() => handleRemoveEnterpriseContact(idx)}>
                              <DeleteIcon />
                            </IconButton>
                          </Grid>
                        </Grid>
                      </Paper>
                    ))}
                  </Grid>
                </>
              )}
            </Grid>
          </Box>
        </CustomTabPanel>

        {/* TAB 4: CONSEJO DE ADMINISTRACIÓN */}
        <CustomTabPanel value={tabIndex} index={4}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2.5 }}>
              Miembros del Consejo de Administración
            </Typography>

            <Grid container spacing={3}>
              {/* Presidente */}
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
                  👑 Presidente del Consejo
                </Typography>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 3 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Nombre Completo"
                        value={councilPresident.name}
                        onChange={(e) => {
                          markDirty();
                          setCouncilPresident({ ...councilPresident, name: e.target.value });
                        }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 3 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Teléfono"
                        value={councilPresident.phone}
                        onChange={(e) => {
                          markDirty();
                          setCouncilPresident({
                            ...councilPresident,
                            phone: e.target.value.replace(/\D/g, ""),
                          });
                        }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 3 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Correo Electrónico"
                        value={councilPresident.email}
                        onChange={(e) => {
                          markDirty();
                          setCouncilPresident({ ...councilPresident, email: e.target.value });
                        }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 3 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Torre / Apartamento / Casa"
                        value={councilPresident.unit}
                        onChange={(e) => {
                          markDirty();
                          setCouncilPresident({ ...councilPresident, unit: e.target.value });
                        }}
                      />
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              {/* Tesorero */}
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
                  💰 Tesorero del Consejo
                </Typography>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 3 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Nombre Completo"
                        value={councilTreasurer.name}
                        onChange={(e) => {
                          markDirty();
                          setCouncilTreasurer({ ...councilTreasurer, name: e.target.value });
                        }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 3 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Teléfono"
                        value={councilTreasurer.phone}
                        onChange={(e) => {
                          markDirty();
                          setCouncilTreasurer({
                            ...councilTreasurer,
                            phone: e.target.value.replace(/\D/g, ""),
                          });
                        }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 3 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Correo Electrónico"
                        value={councilTreasurer.email}
                        onChange={(e) => {
                          markDirty();
                          setCouncilTreasurer({ ...councilTreasurer, email: e.target.value });
                        }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 3 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Torre / Apartamento / Casa"
                        value={councilTreasurer.unit}
                        onChange={(e) => {
                          markDirty();
                          setCouncilTreasurer({ ...councilTreasurer, unit: e.target.value });
                        }}
                      />
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              {/* Consejeros / Vocales */}
              <Grid size={{ xs: 12 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Consejeros Vocales Adicionales
                  </Typography>
                  <Button startIcon={<AddIcon />} variant="outlined" size="small" onClick={handleAddCouncilMember}>
                    Agregar Consejero
                  </Button>
                </Box>

                {councilMembers.map((member, idx) => (
                  <Paper key={idx} variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2 }}>
                    <Grid container spacing={2} alignItems="center">
                      <Grid size={{ xs: 12, sm: 3 }}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Nombre Completo"
                          value={member.name}
                          onChange={(e) => handleCouncilMemberChange(idx, "name", e.target.value)}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 3 }}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Teléfono"
                          value={member.phone}
                          onChange={(e) =>
                            handleCouncilMemberChange(idx, "phone", e.target.value.replace(/\D/g, ""))
                          }
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 3 }}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Correo Electrónico"
                          value={member.email}
                          onChange={(e) => handleCouncilMemberChange(idx, "email", e.target.value)}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 2.5 }}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Torre / Apto / Casa"
                          value={member.unit}
                          onChange={(e) => handleCouncilMemberChange(idx, "unit", e.target.value)}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 0.5 }}>
                        <IconButton color="error" size="small" onClick={() => handleRemoveCouncilMember(idx)}>
                          <DeleteIcon />
                        </IconButton>
                      </Grid>
                    </Grid>
                  </Paper>
                ))}
              </Grid>
            </Grid>
          </Box>
        </CustomTabPanel>

        {/* TAB 5: RESIDENTES */}
        <CustomTabPanel value={tabIndex} index={5}>
          <Box sx={{ p: 3 }}>
            {/* Filter & Action Toolbar */}
            <Grid container spacing={2} sx={{ mb: 3 }} alignItems="center">
              <Grid size={{ xs: 12, sm: 3 }}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Filtrar por Torre"
                  value={filterTower}
                  onChange={(e) => setFilterTower(e.target.value)}
                >
                  <MenuItem value="ALL">Todas las Torres</MenuItem>
                  {towers.map((t, idx) => (
                    <MenuItem key={idx} value={t.towerName}>
                      {t.towerName}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid size={{ xs: 12, sm: 3 }}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Tipo de Residente"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <MenuItem value="ALL">Todos los Tipos</MenuItem>
                  <MenuItem value="OWNER">Propietario</MenuItem>
                  <MenuItem value="TENANT">Inquilino</MenuItem>
                  <MenuItem value="FAMILY_MEMBER">Familiar</MenuItem>
                  <MenuItem value="OTHER">Otro</MenuItem>
                </TextField>
              </Grid>

              <Grid size={{ xs: 12, sm: 3 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Buscar Residente / Cédula / Apto"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 3 }} sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<CloudUploadIcon />}
                  onClick={() => setCsvImportOpen(true)}
                  sx={{ textTransform: "none" }}
                >
                  Cargar CSV
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<PersonAddIcon />}
                  onClick={handleOpenAddResident}
                  sx={{ textTransform: "none" }}
                >
                  + Residente
                </Button>
              </Grid>
            </Grid>

            {/* Residents Data Table */}
            <DataTable
              title="Residentes Registrados"
              endpoint={`/resident/by-client/${clientId}`}
              rows={filteredResidents}
              columns={residentColumns}
              onEdit={handleOpenEditResident}
              onDelete={(id, row) => setDeleteResident(row || residents.find((r) => r.id === id))}
              hideCreateButton
              hideStatusFilter
            />
          </Box>
        </CustomTabPanel>
      </Paper>

      {/* MODAL: ADD / EDIT RESIDENT */}
      <Dialog open={residentModalOpen} onClose={() => setResidentModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedResidentId ? "Editar Residente" : "Registrar Nuevo Residente"}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <TextField
                select
                fullWidth
                label="Unidad / Vivienda Asignada *"
                value={residentForm.unitId}
                onChange={(e) => setResidentForm({ ...residentForm, unitId: e.target.value })}
              >
                {units.map((u) => (
                  <MenuItem key={u.id} value={u.id}>
                    {u.tower ? `${u.tower.towerName} - ` : ""}
                    {u.unitName}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                fullWidth
                label="Tipo de Residente *"
                value={residentForm.residentType}
                onChange={(e) => setResidentForm({ ...residentForm, residentType: e.target.value })}
              >
                <MenuItem value="OWNER">Propietario</MenuItem>
                <MenuItem value="TENANT">Inquilino</MenuItem>
                <MenuItem value="FAMILY_MEMBER">Familiar</MenuItem>
                <MenuItem value="OTHER">Otro</MenuItem>
              </TextField>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                fullWidth
                label="Tipo de Identificación"
                value={residentForm.idType}
                onChange={(e) => setResidentForm({ ...residentForm, idType: e.target.value })}
              >
                <MenuItem value="CI">Cédula de Identidad</MenuItem>
                <MenuItem value="PASSPORT">Pasaporte</MenuItem>
                <MenuItem value="NIT">NIT</MenuItem>
                <MenuItem value="OTHER">Otro</MenuItem>
              </TextField>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Nombres *"
                value={residentForm.firstName}
                onChange={(e) => setResidentForm({ ...residentForm, firstName: e.target.value })}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Apellidos *"
                value={residentForm.lastName}
                onChange={(e) => setResidentForm({ ...residentForm, lastName: e.target.value })}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Número de Documento *"
                value={residentForm.document}
                onChange={(e) => setResidentForm({ ...residentForm, document: e.target.value })}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Teléfono / Celular"
                value={residentForm.phoneNumber}
                onChange={(e) =>
                  setResidentForm({
                    ...residentForm,
                    phoneNumber: e.target.value.replace(/\D/g, ""),
                  })
                }
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Correo Electrónico"
                value={residentForm.email}
                onChange={(e) => setResidentForm({ ...residentForm, email: e.target.value })}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                fullWidth
                label="Género"
                value={residentForm.gender}
                onChange={(e) => setResidentForm({ ...residentForm, gender: e.target.value })}
              >
                <MenuItem value="M">Masculino</MenuItem>
                <MenuItem value="F">Femenino</MenuItem>
                <MenuItem value="OTHER">Otro</MenuItem>
              </TextField>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                type="date"
                label="Fecha de Nacimiento"
                InputLabelProps={{ shrink: true }}
                value={residentForm.birthdate}
                onChange={(e) => setResidentForm({ ...residentForm, birthdate: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setResidentModalOpen(false)} color="inherit">
            Cancelar
          </Button>
          <Button variant="contained" onClick={handleSaveResident}>
            Guardar Residente
          </Button>
        </DialogActions>
      </Dialog>

      {/* CSV Import Dialog for Residents */}
      <CsvImportDialog
        open={csvImportOpen}
        onClose={() => setCsvImportOpen(false)}
        title="Carga Masiva de Residentes"
        templateColumns={[
          "unitName",
          "firstName",
          "lastName",
          "document",
          "phoneNumber",
          "email",
          "residentType",
        ]}
        onImport={handleImportResidentsCsv}
        onSuccessRedirect={() => {
          setRefreshTrigger((prev) => prev + 1);
          fetchResidents();
        }}
      />

      {/* Confirm Delete Resident Dialog */}
      <PromptConfirmDialog
        open={Boolean(deleteResident)}
        title="Dar de baja Residente"
        description={`¿Está seguro de que desea dar de baja al residente "${deleteResident?.firstName} ${deleteResident?.lastName}"? Para confirmar, escriba "ELIMINAR" a continuación.`}
        expectedValue="ELIMINAR"
        inputLabel='Escriba "ELIMINAR" para confirmar'
        confirmButtonText="Dar de baja"
        confirmColor="error"
        onClose={() => setDeleteResident(null)}
        onConfirm={handleConfirmDeleteResident}
      />
    </Box>
  );
}
