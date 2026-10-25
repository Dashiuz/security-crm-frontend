"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  TextField,
  MenuItem,
  FormControlLabel,
  Switch,
  Skeleton,
  useTheme,
  Divider,
  IconButton,
  Chip,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
} from "@mui/material";
import ResponsiveFormDrawer from "@/components/common/ResponsiveFormDrawer";
import TipTapRichEditor from "@/app/(protected)/commercial/proposals/components/TipTapRichEditor";
import {
  EditRounded as EditIcon,
  SaveRounded as SaveIcon,
  CloseRounded as CloseIcon,
  GavelRounded as GavelIcon,
  BusinessRounded as BusinessIcon,
  GroupsRounded as GroupsIcon,
  AddRounded as AddIcon,
  DeleteRounded as DeleteIcon,
  CloudUploadOutlined as CloudUploadIcon,
  InsertDriveFileOutlined as FileIcon,
  OpenInNew as OpenInNewIcon,
  CheckCircleRounded as CheckCircleIcon,
  PersonOutlineRounded as PersonIcon,
  SecurityRounded as ShieldIcon,
  ArticleRounded as DocIcon,
  FactCheckRounded as AnsIcon,
} from "@mui/icons-material";
import { useClientDetail } from "../ClientContext";
import { StorageApi, MediaTypeCategory } from "@/lib/api/storage";
import { useNotification } from "@/providers/NotificationProvider";
import {
  commercialLegalApi,
  InsurancePolicyDto,
  ContractAddendumDto,
  AnsCommitmentDto,
  PolicyType,
  PolicyStatus,
  AnsCommitmentType,
  AnsCommitmentStatus,
} from "@/lib/api/commercial-legal";

const POLICY_TYPE_LABELS: Record<PolicyType, string> = {
  COMPLIANCE: "Cumplimiento",
  WAGES_AND_BENEFITS: "Salarios y Prestaciones Sociales",
  SERVICE_QUALITY: "Calidad del Servicio",
  CIVIL_LIABILITY_PLO: "Resp. Civil Extracontractual (PLO)",
  GLOBAL_THEFT: "Hurto Global y Fidelidad Comercial",
};

const POLICY_STATUS_CONFIG: Record<
  PolicyStatus,
  { label: string; color: "success" | "warning" | "error" | "default" }
> = {
  ACTIVE: { label: "Vigente", color: "success" },
  EXPIRING_SOON: { label: "Por Vencer (<30d)", color: "warning" },
  EXPIRED: { label: "Vencida", color: "error" },
  CANCELLED: { label: "Cancelada", color: "default" },
};

const ANS_TYPE_LABELS: Record<AnsCommitmentType, string> = {
  SECURITY_STUDY_DELIVERY: "Estudio de Seguridad",
  PRIOR_TAKEOVER_EMPALME: "Acta de Empalme e Instalación",
  FREE_GUARD_SUPPORT_12H: "Horas Apoyo Gratuito (12h)",
  QUARTERLY_MANAGEMENT_REP: "Informe Trimestral Gestión",
};

const ANS_STATUS_CONFIG: Record<
  AnsCommitmentStatus,
  { label: string; color: "warning" | "success" | "error" }
> = {
  PENDING: { label: "Pendiente", color: "warning" },
  FULFILLED: { label: "Cumplido", color: "success" },
  BREACHED: { label: "Incumplido", color: "error" },
};

const formatCopCurrency = (amount: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(amount || 0);

interface DynamicContact {
  roleName: string;
  name: string;
  document: string;
  email: string;
  phone: string;
}

interface CouncilMember {
  name: string;
  phone: string;
  email: string;
  unit: string;
}

const CONTRACT_DOC_TYPES = [
  { key: "financialStatements", label: "Estados Financieros" },
  { key: "legalRepresentation", label: "Representación Jurídica" },
  { key: "serviceOrder", label: "Orden de Servicio" },
  { key: "contractDoc", label: "Documento de Contrato" },
  { key: "otroSi", label: "Otro Sí" },
  { key: "basc", label: "Certificación BASC" },
  { key: "insurancePolicy", label: "Pólizas de Seguro" },
  { key: "techContract", label: "Contratos de Tecnología" },
];

export default function ClientLegalPage() {
  const { clientId, client, loading, saving, updateLegal, permissions } =
    useClientDetail();
  const theme = useTheme();
  const { showError, showSuccess } = useNotification();

  const [editingCard, setEditingCard] = useState<string | null>(null);

  // Contract state
  const [contractForm, setContractForm] = useState({
    contractNumber: "",
    contractStatus: "ACTIVE",
    renewedContract: false,
    contractDate: "",
    lastContractDate: "",
    contractEndDate: "",
  });
  const [contractMediaFiles, setContractMediaFiles] = useState<
    Record<string, any>
  >({});
  const [uploadingDocKey, setUploadingDocKey] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeDocKey, setActiveDocKey] = useState<string | null>(null);

  useEffect(() => {
    const input = fileInputRef.current;
    if (!input) return;
    const handleCancel = () => {
      setActiveDocKey(null);
      setUploadingDocKey(null);
    };
    input.addEventListener("cancel", handleCancel);
    return () => {
      input.removeEventListener("cancel", handleCancel);
    };
  }, []);

  // Administration state
  const [administrationType, setAdministrationType] =
    useState<string>("INDIVIDUAL");
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
    additionalContacts: [] as DynamicContact[],
  });

  // Council state
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

  useEffect(() => {
    if (client) {
      setContractForm({
        contractNumber: client.contractNumber || "",
        contractStatus: client.contractStatus || "ACTIVE",
        renewedContract: Boolean(client.renewedContract),
        contractDate: client.contractDate
          ? client.contractDate.split("T")[0]
          : "",
        lastContractDate: client.lastContractDate
          ? client.lastContractDate.split("T")[0]
          : "",
        contractEndDate: client.contractEndDate
          ? client.contractEndDate.split("T")[0]
          : client.lastContractDate
          ? client.lastContractDate.split("T")[0]
          : "",
      });

      if (client.contractMediaFiles) {
        setContractMediaFiles(client.contractMediaFiles);
      }

      const admType = client.administrationType || "INDIVIDUAL";
      setAdministrationType(admType);
      const admComp = client.administrationCompanyData || {};

      setIndividualAdmin({
        administrator: client.administrator || "",
        identificationNumber:
          admComp.identificationNumber || admComp.representativeDocument || "",
        administratorEmail: client.administratorEmail || "",
        administratorPhone: client.administratorPhone || "",
      });

      const rawAdditional = admComp.additionalContacts || [];
      const normalizedAdditional: DynamicContact[] = rawAdditional.map(
        (c: any) => ({
          roleName: c.roleName || c.title || "Contacto Adicional",
          name: c.name || "",
          document: c.document || "",
          email: c.email || "",
          phone: c.phone || "",
        }),
      );

      setEnterpriseAdmin({
        companyName: admComp.companyName || client.administrator || "",
        nit: admComp.nit || "",
        phone: admComp.phone || client.administratorPhone || "",
        email: admComp.email || client.administratorEmail || "",
        legalRepName: admComp.legalRepName || "",
        legalRepId: admComp.legalRepId || "",
        legalRepPhone: admComp.legalRepPhone || "",
        additionalContacts: normalizedAdditional,
      });

      const cData = client.councilData || {};
      setCouncilPresident(
        cData.president || { name: "", phone: "", email: "", unit: "" },
      );
      setCouncilTreasurer(
        cData.treasurer || { name: "", phone: "", email: "", unit: "" },
      );
      setCouncilMembers(cData.councilMembers || []);
    }
  }, [client]);

  // Commercial Legal Portfolio state (SPEC-ADM-022)
  const [policies, setPolicies] = useState<InsurancePolicyDto[]>([]);
  const [loadingPolicies, setLoadingPolicies] = useState(false);
  const [policyModalOpen, setPolicyModalOpen] = useState(false);
  const [savingPolicy, setSavingPolicy] = useState(false);
  const [policyForm, setPolicyForm] = useState({
    policyType: "CIVIL_LIABILITY_PLO" as PolicyType,
    insuranceCompanyName: "",
    policyCertificateNumber: "",
    insuredAmount: 0,
    effectiveStartDate: "",
    effectiveEndDate: "",
    status: "ACTIVE" as PolicyStatus,
  });

  const [addendums, setAddendums] = useState<ContractAddendumDto[]>([]);
  const [loadingAddendums, setLoadingAddendums] = useState(false);
  const [addendumModalOpen, setAddendumModalOpen] = useState(false);
  const [savingAddendum, setSavingAddendum] = useState(false);
  const [addendumForm, setAddendumForm] = useState({
    addendumNumber: "",
    title: "",
    effectiveStartDate: "",
    effectiveEndDate: "",
    durationYears: 1,
    reinvestmentAmountPact: 0,
    disbursedAmount: 0,
    disbursementDate: "",
    description: "",
  });

  const [ansList, setAnsList] = useState<AnsCommitmentDto[]>([]);
  const [loadingAns, setLoadingAns] = useState(false);
  const [ansModalOpen, setAnsModalOpen] = useState(false);
  const [savingAns, setSavingAns] = useState(false);
  const [ansForm, setAnsForm] = useState({
    commitmentType: "SECURITY_STUDY_DELIVERY" as AnsCommitmentType,
    title: "",
    dueDate: "",
    deliveredDate: "",
    status: "PENDING" as AnsCommitmentStatus,
    evidenceNotes: "",
  });

  const fetchPolicies = useCallback(async () => {
    if (!clientId) return;
    setLoadingPolicies(true);
    try {
      const data = await commercialLegalApi.getPoliciesByClient(clientId);
      setPolicies(data);
    } catch (err: any) {
      showError(err.message || "Error al cargar pólizas de seguro");
    } finally {
      setLoadingPolicies(false);
    }
  }, [clientId, showError]);

  const fetchAddendums = useCallback(async () => {
    if (!clientId) return;
    setLoadingAddendums(true);
    try {
      const data = await commercialLegalApi.getAddendumsByClient(clientId);
      setAddendums(data);
    } catch (err: any) {
      showError(err.message || "Error al cargar otrosíes contractuales");
    } finally {
      setLoadingAddendums(false);
    }
  }, [clientId, showError]);

  const fetchAns = useCallback(async () => {
    if (!clientId) return;
    setLoadingAns(true);
    try {
      const data = await commercialLegalApi.getAnsByClient(clientId);
      setAnsList(data);
    } catch (err: any) {
      showError(err.message || "Error al cargar compromisos ANS");
    } finally {
      setLoadingAns(false);
    }
  }, [clientId, showError]);

  useEffect(() => {
    if (clientId) {
      fetchPolicies();
      fetchAddendums();
      fetchAns();
    }
  }, [clientId, fetchPolicies, fetchAddendums, fetchAns]);

  const handleCreatePolicy = async () => {
    if (!policyForm.insuranceCompanyName || !policyForm.policyCertificateNumber) {
      showError("Por favor ingrese la aseguradora y el número de póliza");
      return;
    }
    setSavingPolicy(true);
    try {
      await commercialLegalApi.createPolicy({
        ...policyForm,
        clientId,
        insuredAmount: Number(policyForm.insuredAmount) || 0,
        effectiveStartDate: policyForm.effectiveStartDate || new Date().toISOString(),
        effectiveEndDate: policyForm.effectiveEndDate || new Date().toISOString(),
      });
      showSuccess("Póliza registrada exitosamente");
      setPolicyModalOpen(false);
      setPolicyForm({
        policyType: "CIVIL_LIABILITY_PLO",
        insuranceCompanyName: "",
        policyCertificateNumber: "",
        insuredAmount: 0,
        effectiveStartDate: "",
        effectiveEndDate: "",
        status: "ACTIVE",
      });
      await fetchPolicies();
    } catch (err: any) {
      showError(err.message || "Error al registrar póliza");
    } finally {
      setSavingPolicy(false);
    }
  };

  const handleDeletePolicy = async (id: string) => {
    if (!confirm("¿Está seguro de eliminar esta póliza?")) return;
    try {
      await commercialLegalApi.deletePolicy(id);
      showSuccess("Póliza eliminada");
      await fetchPolicies();
    } catch (err: any) {
      showError(err.message || "Error al eliminar póliza");
    }
  };

  const handleCreateAddendum = async () => {
    if (!addendumForm.addendumNumber || !addendumForm.title) {
      showError("Por favor ingrese el número y título del otrosí");
      return;
    }
    setSavingAddendum(true);
    try {
      await commercialLegalApi.createAddendum({
        ...addendumForm,
        clientId,
        durationYears: Number(addendumForm.durationYears) || 1,
        reinvestmentAmountPact: Number(addendumForm.reinvestmentAmountPact) || 0,
        disbursedAmount: Number(addendumForm.disbursedAmount) || 0,
        effectiveStartDate: addendumForm.effectiveStartDate || new Date().toISOString(),
        effectiveEndDate: addendumForm.effectiveEndDate || new Date().toISOString(),
        disbursementDate: addendumForm.disbursementDate || undefined,
      });
      showSuccess("Otrosí contractual registrado exitosamente");
      setAddendumModalOpen(false);
      setAddendumForm({
        addendumNumber: "",
        title: "",
        effectiveStartDate: "",
        effectiveEndDate: "",
        durationYears: 1,
        reinvestmentAmountPact: 0,
        disbursedAmount: 0,
        disbursementDate: "",
        description: "",
      });
      await fetchAddendums();
    } catch (err: any) {
      showError(err.message || "Error al registrar otrosí");
    } finally {
      setSavingAddendum(false);
    }
  };

  const handleDeleteAddendum = async (id: string) => {
    if (!confirm("¿Está seguro de eliminar este otrosí?")) return;
    try {
      await commercialLegalApi.deleteAddendum(id);
      showSuccess("Otrosí eliminado");
      await fetchAddendums();
    } catch (err: any) {
      showError(err.message || "Error al eliminar otrosí");
    }
  };

  const handleCreateAns = async () => {
    if (!ansForm.title || !ansForm.dueDate) {
      showError("Por favor ingrese el título y la fecha límite del compromiso ANS");
      return;
    }
    setSavingAns(true);
    try {
      await commercialLegalApi.createAns({
        ...ansForm,
        clientId,
        deliveredDate: ansForm.deliveredDate || undefined,
      });
      showSuccess("Compromiso ANS registrado exitosamente");
      setAnsModalOpen(false);
      setAnsForm({
        commitmentType: "SECURITY_STUDY_DELIVERY",
        title: "",
        dueDate: "",
        deliveredDate: "",
        status: "PENDING",
        evidenceNotes: "",
      });
      await fetchAns();
    } catch (err: any) {
      showError(err.message || "Error al registrar compromiso ANS");
    } finally {
      setSavingAns(false);
    }
  };

  const handleToggleAnsStatus = async (item: AnsCommitmentDto) => {
    const nextStatus: AnsCommitmentStatus = item.status === "PENDING" ? "FULFILLED" : "PENDING";
    try {
      await commercialLegalApi.updateAns(item.id, {
        status: nextStatus,
        deliveredDate: nextStatus === "FULFILLED" ? new Date().toISOString().split("T")[0] : null,
      });
      showSuccess(`Compromiso marcado como ${ANS_STATUS_CONFIG[nextStatus].label}`);
      await fetchAns();
    } catch (err: any) {
      showError(err.message || "Error al actualizar estado del compromiso ANS");
    }
  };

  const handleDeleteAns = async (id: string) => {
    if (!confirm("¿Está seguro de eliminar este compromiso ANS?")) return;
    try {
      await commercialLegalApi.deleteAns(id);
      showSuccess("Compromiso ANS eliminado");
      await fetchAns();
    } catch (err: any) {
      showError(err.message || "Error al eliminar compromiso ANS");
    }
  };

  // Upload handler for contractual documents
  const triggerDocUpload = (docKey: string) => {
    setActiveDocKey(docKey);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeDocKey) return;

    try {
      setUploadingDocKey(activeDocKey);
      const res = await StorageApi.uploadMedia({
        file,
        entityType: MediaTypeCategory.DOCUMENT,
        entityId: clientId,
        clientId,
        subType: `contract_${activeDocKey}`,
      });

      setContractMediaFiles((prev) => ({
        ...prev,
        [activeDocKey]: {
          mediaId: res.id,
          fileName: res.fileName,
          url: res.presignedUrl || res.url,
          sizeBytes: res.sizeBytes,
        },
      }));

      showSuccess(`Documento contractual "${file.name}" cargado exitosamente.`);
    } catch (err: any) {
      showError(err.message || "Error al subir documento contractual.");
    } finally {
      setUploadingDocKey(null);
      setActiveDocKey(null);
    }
  };

  const handleRemoveDoc = (docKey: string) => {
    setContractMediaFiles((prev) => {
      const copy = { ...prev };
      delete copy[docKey];
      return copy;
    });
  };

  const handleSaveContract = async () => {
    const success = await updateLegal({
      contractNumber: contractForm.contractNumber,
      contractStatus: contractForm.contractStatus,
      renewedContract: contractForm.renewedContract,
      contractDate: contractForm.contractDate || null,
      lastContractDate: contractForm.lastContractDate || null,
      contractEndDate: contractForm.contractEndDate || null,
      contractMediaFiles,
    });
    if (success) setEditingCard(null);
  };

  // Administration Handlers
  const handleAddAdditionalContact = () => {
    setEnterpriseAdmin((prev) => ({
      ...prev,
      additionalContacts: [
        ...prev.additionalContacts,
        {
          roleName: "Asistente de Administración",
          name: "",
          document: "",
          email: "",
          phone: "",
        },
      ],
    }));
  };

  const handleRemoveAdditionalContact = (idx: number) => {
    setEnterpriseAdmin((prev) => ({
      ...prev,
      additionalContacts: prev.additionalContacts.filter((_, i) => i !== idx),
    }));
  };

  const handleAdditionalContactChange = (
    idx: number,
    field: keyof DynamicContact,
    val: string,
  ) => {
    setEnterpriseAdmin((prev) => {
      const copy = [...prev.additionalContacts];
      copy[idx] = { ...copy[idx], [field]: val };
      return { ...prev, additionalContacts: copy };
    });
  };

  const handleSaveAdministration = async () => {
    const payload: any = {
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
    };

    const success = await updateLegal(payload);
    if (success) setEditingCard(null);
  };

  // Council Handlers
  const handleAddCouncilMember = () => {
    setCouncilMembers((prev) => [
      ...prev,
      { name: "", phone: "", email: "", unit: "" },
    ]);
  };

  const handleRemoveCouncilMember = (idx: number) => {
    setCouncilMembers((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleCouncilMemberChange = (
    idx: number,
    field: keyof CouncilMember,
    val: string,
  ) => {
    setCouncilMembers((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: val };
      return copy;
    });
  };

  const handleSaveCouncil = async () => {
    const success = await updateLegal({
      councilData: {
        president: councilPresident,
        treasurer: councilTreasurer,
        councilMembers: councilMembers.filter((m) => m.name.trim() !== ""),
      },
    });
    if (success) setEditingCard(null);
  };

  const renderField = (
    label: string,
    value?: string | number | null,
    chip?: {
      color?: "success" | "warning" | "error" | "default" | "primary" | "info";
      label?: string;
    },
  ) => {
    const isValEmpty =
      value === undefined || value === null || String(value).trim() === "";

    return (
      <Box
        sx={{
          p: 2,
          height: "100%",
          minHeight: 74,
          borderRadius: 2.5,
          bgcolor: (theme) =>
            theme.palette.mode === "dark"
              ? "rgba(255, 255, 255, 0.03)"
              : "rgba(0, 0, 0, 0.02)",
          border: "1px solid",
          borderColor: "divider",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          transition: "all 0.18s ease-in-out",
          "&:hover": {
            bgcolor: (theme) =>
              theme.palette.mode === "dark"
                ? "rgba(255, 255, 255, 0.05)"
                : "rgba(0, 0, 0, 0.035)",
            borderColor: (theme) =>
              theme.palette.mode === "dark"
                ? "rgba(255, 255, 255, 0.15)"
                : "rgba(0, 0, 0, 0.12)",
          },
        }}
      >
        <Typography
          variant="caption"
          sx={{
            color: "text.secondary",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            fontSize: "0.68rem",
            mb: 0.6,
          }}
        >
          {label}
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          {chip && !isValEmpty ? (
            <Chip
              size="small"
              label={chip.label || String(value)}
              color={chip.color || "default"}
              sx={{ fontWeight: 600, fontSize: "0.75rem", height: 24 }}
            />
          ) : (
            <Typography
              variant="body2"
              sx={{
                fontWeight: 600,
                color: isValEmpty ? "text.disabled" : "text.primary",
                wordBreak: "break-word",
              }}
            >
              {!isValEmpty ? String(value) : "No especificado"}
            </Typography>
          )}
        </Box>
      </Box>
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <Skeleton variant="rounded" height={160} />
        <Skeleton variant="rounded" height={220} />
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {/* Hidden file input for contractual documents upload */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        accept="application/pdf,image/*,.doc,.docx,.xls,.xlsx"
        onChange={handleFileChange}
      />

      {/* Page Title */}
      <Box>
        <Typography variant="h5" fontWeight={700}>
          Legal y Contratos
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Gestione las cláusulas contractuales, documentación soporte, contactos administrativos y el consejo directivo.
        </Typography>
      </Box>

      {/* Card 1: Información Contractual y Documentación Soporte */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 3,
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
            <GavelIcon color="primary" />
            <Typography variant="subtitle1" fontWeight={700}>
              Información Contractual y Documentos
            </Typography>
          </Box>
          {permissions.canEditLegal &&
            (editingCard === "contract" ? (
              <Box sx={{ display: "flex", gap: 1 }}>
                <Button
                  size="small"
                  variant="outlined"
                  color="inherit"
                  startIcon={<CloseIcon />}
                  onClick={() => setEditingCard(null)}
                  disabled={saving}
                >
                  Cancelar
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveContract}
                  disabled={saving}
                >
                  Guardar Contrato
                </Button>
              </Box>
            ) : (
              <Button
                size="small"
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={() => setEditingCard("contract")}
              >
                Editar
              </Button>
            ))}
        </Box>
        <Divider sx={{ mb: 2.5 }} />

        {editingCard === "contract" ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Número de Contrato"
                  value={contractForm.contractNumber}
                  onChange={(e) =>
                    setContractForm({
                      ...contractForm,
                      contractNumber: e.target.value,
                    })
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  select
                  size="small"
                  label="Estado del Contrato"
                  value={contractForm.contractStatus}
                  onChange={(e) =>
                    setContractForm({
                      ...contractForm,
                      contractStatus: e.target.value,
                    })
                  }
                >
                  <MenuItem value="ACTIVE">Activo</MenuItem>
                  <MenuItem value="INACTIVE">Inactivo</MenuItem>
                  <MenuItem value="PENDING">Pendiente</MenuItem>
                  <MenuItem value="TERMINATED">Terminado</MenuItem>
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={contractForm.renewedContract}
                      onChange={(e) =>
                        setContractForm({
                          ...contractForm,
                          renewedContract: e.target.checked,
                        })
                      }
                    />
                  }
                  label="Prórroga Automática"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  type="date"
                  size="small"
                  label="Fecha Inicio"
                  slotProps={{ inputLabel: { shrink: true } }}
                  value={contractForm.contractDate}
                  onChange={(e) =>
                    setContractForm({
                      ...contractForm,
                      contractDate: e.target.value,
                    })
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  type="date"
                  size="small"
                  label="Fecha de Término"
                  slotProps={{ inputLabel: { shrink: true } }}
                  value={contractForm.contractEndDate}
                  onChange={(e) =>
                    setContractForm({
                      ...contractForm,
                      contractEndDate: e.target.value,
                    })
                  }
                />
              </Grid>
            </Grid>

            {/* Soportes Contractuales Reales (8 tipos de documentos) */}
            <Box>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
                Archivos y Soportes Contractuales (PDF o Imagen)
              </Typography>
              <Grid container spacing={2}>
                {CONTRACT_DOC_TYPES.map((doc) => {
                  const uploaded = contractMediaFiles[doc.key];
                  const isUploading = uploadingDocKey === doc.key;

                  return (
                    <Grid size={{ xs: 12, sm: 6, md: 3 }} key={doc.key}>
                      <Paper
                        variant="outlined"
                        sx={{
                          p: 1.8,
                          borderRadius: 2,
                          height: "100%",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                          bgcolor: uploaded
                            ? (theme) =>
                                theme.palette.mode === "dark"
                                  ? "rgba(46, 125, 50, 0.08)"
                                  : "rgba(46, 125, 50, 0.04)"
                            : "inherit",
                          border: uploaded
                            ? "1px solid rgba(46, 125, 50, 0.4)"
                            : undefined,
                        }}
                      >
                        <Box sx={{ mb: 1.5 }}>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            fontWeight={700}
                            display="block"
                          >
                            {doc.label}
                          </Typography>
                          {uploaded ? (
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 0.8,
                                mt: 0.5,
                              }}
                            >
                              <FileIcon fontSize="small" color="success" />
                              <Typography
                                variant="caption"
                                fontWeight={600}
                                noWrap
                                sx={{ maxWidth: 140 }}
                                title={uploaded.fileName}
                              >
                                {uploaded.fileName}
                              </Typography>
                            </Box>
                          ) : (
                            <Typography
                              variant="caption"
                              color="text.disabled"
                              sx={{ mt: 0.5, display: "block" }}
                            >
                              Sin soporte cargado
                            </Typography>
                          )}
                        </Box>

                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                          }}
                        >
                          <Button
                            size="small"
                            fullWidth
                            variant={uploaded ? "outlined" : "contained"}
                            color={uploaded ? "inherit" : "primary"}
                            startIcon={
                              uploaded ? <CheckCircleIcon /> : <CloudUploadIcon />
                            }
                            onClick={() => triggerDocUpload(doc.key)}
                            disabled={isUploading}
                          >
                            {isUploading
                              ? "Subiendo..."
                              : uploaded
                              ? "Archivo Adjuntado (Cambiar)"
                              : "Adjuntar Archivo"}
                          </Button>
                          {uploaded && (
                            <>
                              <Tooltip title="Ver Documento">
                                <IconButton
                                  size="small"
                                  component="a"
                                  href={uploaded.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <OpenInNewIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleRemoveDoc(doc.key)}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </>
                          )}
                        </Box>
                      </Paper>
                    </Grid>
                  );
                })}
              </Grid>
            </Box>
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 3 }}>
                {renderField(
                  "Número de Contrato",
                  contractForm.contractNumber,
                )}
              </Grid>
              <Grid size={{ xs: 12, sm: 3 }}>
                {renderField(
                  "Estado del Contrato",
                  contractForm.contractStatus === "ACTIVE"
                    ? "Activo"
                    : contractForm.contractStatus,
                  {
                    color:
                      contractForm.contractStatus === "ACTIVE"
                        ? "success"
                        : "warning",
                    label:
                      contractForm.contractStatus === "ACTIVE"
                        ? "Activo"
                        : contractForm.contractStatus,
                  },
                )}
              </Grid>
              <Grid size={{ xs: 12, sm: 3 }}>
                {renderField(
                  "Fecha de Inicio",
                  contractForm.contractDate || "No definida",
                )}
              </Grid>
              <Grid size={{ xs: 12, sm: 3 }}>
                {renderField(
                  "Fecha de Término",
                  contractForm.contractEndDate || "Indefinida",
                )}
              </Grid>
            </Grid>

            {/* Visualización de Soportes Contractuales */}
            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                fontWeight={700}
                sx={{ textTransform: "uppercase", display: "block", mb: 1 }}
              >
                Soportes Contractuales Registrados
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {CONTRACT_DOC_TYPES.filter(
                  (d) => contractMediaFiles[d.key],
                ).map((doc) => {
                  const file = contractMediaFiles[doc.key];
                  return (
                    <Chip
                      key={doc.key}
                      icon={<FileIcon fontSize="small" />}
                      label={`${doc.label}: ${file.fileName}`}
                      variant="outlined"
                      color="primary"
                      component="a"
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      clickable
                      onDelete={undefined}
                    />
                  );
                })}
                {Object.keys(contractMediaFiles).length === 0 && (
                  <Typography variant="body2" color="text.disabled">
                    No se han adjuntado soportes contractuales aún.
                  </Typography>
                )}
              </Box>
            </Box>
          </Box>
        )}
      </Paper>

      {/* Card 2: Administración y Contactos Adicionales */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 3,
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
            <BusinessIcon color="primary" />
            <Typography variant="subtitle1" fontWeight={700}>
              Administración y Contactos Directos
            </Typography>
          </Box>
          {permissions.canEditLegal &&
            (editingCard === "administration" ? (
              <Box sx={{ display: "flex", gap: 1 }}>
                <Button
                  size="small"
                  variant="outlined"
                  color="inherit"
                  startIcon={<CloseIcon />}
                  onClick={() => setEditingCard(null)}
                  disabled={saving}
                >
                  Cancelar
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveAdministration}
                  disabled={saving}
                >
                  Guardar Administración
                </Button>
              </Box>
            ) : (
              <Button
                size="small"
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={() => setEditingCard("administration")}
              >
                Editar
              </Button>
            ))}
        </Box>
        <Divider sx={{ mb: 2.5 }} />

        {editingCard === "administration" ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            <TextField
              select
              size="small"
              label="Tipo de Administración"
              value={administrationType}
              onChange={(e) => setAdministrationType(e.target.value)}
              sx={{ width: 280 }}
            >
              <MenuItem value="INDIVIDUAL">
                Persona Natural (Individual / Delegado)
              </MenuItem>
              <MenuItem value="ENTERPRISE">
                Empresa Administradora Tercerizada
              </MenuItem>
            </TextField>

            {administrationType === "INDIVIDUAL" ? (
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Nombre del Administrador"
                    value={individualAdmin.administrator}
                    onChange={(e) =>
                      setIndividualAdmin({
                        ...individualAdmin,
                        administrator: e.target.value,
                      })
                    }
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Cédula / Identificación"
                    value={individualAdmin.identificationNumber}
                    onChange={(e) =>
                      setIndividualAdmin({
                        ...individualAdmin,
                        identificationNumber: e.target.value,
                      })
                    }
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Teléfono de Contacto"
                    value={individualAdmin.administratorPhone}
                    onChange={(e) =>
                      setIndividualAdmin({
                        ...individualAdmin,
                        administratorPhone: e.target.value,
                      })
                    }
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Correo Electrónico"
                    value={individualAdmin.administratorEmail}
                    onChange={(e) =>
                      setIndividualAdmin({
                        ...individualAdmin,
                        administratorEmail: e.target.value,
                      })
                    }
                  />
                </Grid>
              </Grid>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Razón Social Empresa"
                      value={enterpriseAdmin.companyName}
                      onChange={(e) =>
                        setEnterpriseAdmin({
                          ...enterpriseAdmin,
                          companyName: e.target.value,
                        })
                      }
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="NIT Empresa"
                      value={enterpriseAdmin.nit}
                      onChange={(e) =>
                        setEnterpriseAdmin({
                          ...enterpriseAdmin,
                          nit: e.target.value,
                        })
                      }
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Teléfono Corporativo"
                      value={enterpriseAdmin.phone}
                      onChange={(e) =>
                        setEnterpriseAdmin({
                          ...enterpriseAdmin,
                          phone: e.target.value,
                        })
                      }
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Correo Corporativo"
                      value={enterpriseAdmin.email}
                      onChange={(e) =>
                        setEnterpriseAdmin({
                          ...enterpriseAdmin,
                          email: e.target.value,
                        })
                      }
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Representante Legal"
                      value={enterpriseAdmin.legalRepName}
                      onChange={(e) =>
                        setEnterpriseAdmin({
                          ...enterpriseAdmin,
                          legalRepName: e.target.value,
                        })
                      }
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Cédula Representante"
                      value={enterpriseAdmin.legalRepId}
                      onChange={(e) =>
                        setEnterpriseAdmin({
                          ...enterpriseAdmin,
                          legalRepId: e.target.value,
                        })
                      }
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Teléfono Representante"
                      value={enterpriseAdmin.legalRepPhone}
                      onChange={(e) =>
                        setEnterpriseAdmin({
                          ...enterpriseAdmin,
                          legalRepPhone: e.target.value,
                        })
                      }
                    />
                  </Grid>
                </Grid>

                {/* Contactos Adicionales Dinámicos (Punto 6) */}
                <Box>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      mb: 1.5,
                    }}
                  >
                    <Typography variant="subtitle2" fontWeight={700}>
                      Contactos Adicionales de la Administración (
                      {enterpriseAdmin.additionalContacts.length})
                    </Typography>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<AddIcon />}
                      onClick={handleAddAdditionalContact}
                    >
                      Agregar Contacto
                    </Button>
                  </Box>

                  <Grid container spacing={2}>
                    {enterpriseAdmin.additionalContacts.map((contact, idx) => (
                      <Grid size={12} key={idx}>
                        <Paper
                          variant="outlined"
                          sx={{
                            p: 2,
                            display: "flex",
                            alignItems: "center",
                            gap: 1.5,
                            flexWrap: "wrap",
                            borderRadius: 2,
                          }}
                        >
                          <TextField
                            size="small"
                            label="Cargo / Rol"
                            value={contact.roleName}
                            onChange={(e) =>
                              handleAdditionalContactChange(
                                idx,
                                "roleName",
                                e.target.value,
                              )
                            }
                            sx={{ minWidth: 180, flex: 1 }}
                            placeholder="Ej: Asistente Operativo"
                          />
                          <TextField
                            size="small"
                            label="Nombre Completo"
                            value={contact.name}
                            onChange={(e) =>
                              handleAdditionalContactChange(
                                idx,
                                "name",
                                e.target.value,
                              )
                            }
                            sx={{ minWidth: 180, flex: 1 }}
                          />
                          <TextField
                            size="small"
                            label="Teléfono"
                            value={contact.phone}
                            onChange={(e) =>
                              handleAdditionalContactChange(
                                idx,
                                "phone",
                                e.target.value,
                              )
                            }
                            sx={{ minWidth: 140, flex: 1 }}
                          />
                          <TextField
                            size="small"
                            label="Correo Electrónico"
                            value={contact.email}
                            onChange={(e) =>
                              handleAdditionalContactChange(
                                idx,
                                "email",
                                e.target.value,
                              )
                            }
                            sx={{ minWidth: 180, flex: 1 }}
                          />
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleRemoveAdditionalContact(idx)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              </Box>
            )}
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 4 }}>
                {renderField(
                  "Tipo de Administración",
                  administrationType === "INDIVIDUAL"
                    ? "Persona Natural"
                    : "Empresa Administradora",
                )}
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                {renderField(
                  "Administrador / Razón Social",
                  administrationType === "INDIVIDUAL"
                    ? individualAdmin.administrator
                    : enterpriseAdmin.companyName,
                )}
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                {renderField(
                  "Teléfono de Contacto",
                  administrationType === "INDIVIDUAL"
                    ? individualAdmin.administratorPhone
                    : enterpriseAdmin.phone,
                )}
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                {renderField(
                  "Correo Electrónico",
                  administrationType === "INDIVIDUAL"
                    ? individualAdmin.administratorEmail
                    : enterpriseAdmin.email,
                )}
              </Grid>
              {administrationType === "ENTERPRISE" && (
                <>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    {renderField(
                      "Representante Legal",
                      enterpriseAdmin.legalRepName,
                    )}
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    {renderField(
                      "Teléfono Representante",
                      enterpriseAdmin.legalRepPhone,
                    )}
                  </Grid>
                </>
              )}
            </Grid>

            {/* Listado de Contactos Adicionales en Read-Only */}
            {administrationType === "ENTERPRISE" &&
              enterpriseAdmin.additionalContacts &&
              enterpriseAdmin.additionalContacts.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    fontWeight={700}
                    sx={{ textTransform: "uppercase", display: "block", mb: 1 }}
                  >
                    Contactos Adicionales Registrados
                  </Typography>
                  <Grid container spacing={1.5}>
                    {enterpriseAdmin.additionalContacts.map((c, i) => (
                      <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
                        <Paper
                          variant="outlined"
                          sx={{ p: 1.5, borderRadius: 2 }}
                        >
                          <Typography variant="subtitle2" fontWeight={700}>
                            {c.name || "Sin nombre"}
                          </Typography>
                          <Chip
                            size="small"
                            label={c.roleName || "Contacto"}
                            variant="outlined"
                            color="info"
                            sx={{ mt: 0.5, mb: 0.5, height: 22 }}
                          />
                          <Typography
                            variant="caption"
                            display="block"
                            color="text.secondary"
                          >
                            Tel: {c.phone || "N/A"} • Email: {c.email || "N/A"}
                          </Typography>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}
          </Box>
        )}
      </Paper>

      {/* Card 3: Consejo de Administración (Mesa Directiva y Vocales Dinámicos) */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 3,
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
            <GroupsIcon color="primary" />
            <Typography variant="subtitle1" fontWeight={700}>
              Consejo de Administración (Mesa Directiva y Vocales)
            </Typography>
          </Box>
          {permissions.canEditLegal &&
            (editingCard === "council" ? (
              <Box sx={{ display: "flex", gap: 1 }}>
                <Button
                  size="small"
                  variant="outlined"
                  color="inherit"
                  startIcon={<CloseIcon />}
                  onClick={() => setEditingCard(null)}
                  disabled={saving}
                >
                  Cancelar
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveCouncil}
                  disabled={saving}
                >
                  Guardar Consejo
                </Button>
              </Box>
            ) : (
              <Button
                size="small"
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={() => setEditingCard("council")}
              >
                Editar
              </Button>
            ))}
        </Box>
        <Divider sx={{ mb: 2.5 }} />

        {editingCard === "council" ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {/* Presidente */}
            <Box>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
                Presidente del Consejo
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Nombre Completo"
                    value={councilPresident.name}
                    onChange={(e) =>
                      setCouncilPresident({
                        ...councilPresident,
                        name: e.target.value,
                      })
                    }
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 3 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Teléfono"
                    value={councilPresident.phone}
                    onChange={(e) =>
                      setCouncilPresident({
                        ...councilPresident,
                        phone: e.target.value,
                      })
                    }
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 3 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Correo"
                    value={councilPresident.email}
                    onChange={(e) =>
                      setCouncilPresident({
                        ...councilPresident,
                        email: e.target.value,
                      })
                    }
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 2 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Unidad / Apto"
                    value={councilPresident.unit}
                    onChange={(e) =>
                      setCouncilPresident({
                        ...councilPresident,
                        unit: e.target.value,
                      })
                    }
                  />
                </Grid>
              </Grid>
            </Box>

            {/* Tesorero */}
            <Box>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
                Tesorero del Consejo
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Nombre Completo"
                    value={councilTreasurer.name}
                    onChange={(e) =>
                      setCouncilTreasurer({
                        ...councilTreasurer,
                        name: e.target.value,
                      })
                    }
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 3 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Teléfono"
                    value={councilTreasurer.phone}
                    onChange={(e) =>
                      setCouncilTreasurer({
                        ...councilTreasurer,
                        phone: e.target.value,
                      })
                    }
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 3 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Correo"
                    value={councilTreasurer.email}
                    onChange={(e) =>
                      setCouncilTreasurer({
                        ...councilTreasurer,
                        email: e.target.value,
                      })
                    }
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 2 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Unidad / Apto"
                    value={councilTreasurer.unit}
                    onChange={(e) =>
                      setCouncilTreasurer({
                        ...councilTreasurer,
                        unit: e.target.value,
                      })
                    }
                  />
                </Grid>
              </Grid>
            </Box>

            {/* Otros Consejeros / Vocales Dinámicos (Punto 7) */}
            <Box>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  mb: 1.5,
                }}
              >
                <Typography variant="subtitle2" fontWeight={700}>
                  Otros Consejeros / Vocales ({councilMembers.length})
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={handleAddCouncilMember}
                >
                  Agregar Consejero / Vocal
                </Button>
              </Box>

              <Grid container spacing={2}>
                {councilMembers.map((member, idx) => (
                  <Grid size={12} key={idx}>
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 2,
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                        flexWrap: "wrap",
                        borderRadius: 2,
                      }}
                    >
                      <TextField
                        size="small"
                        label="Nombre Consejero"
                        value={member.name}
                        onChange={(e) =>
                          handleCouncilMemberChange(idx, "name", e.target.value)
                        }
                        sx={{ minWidth: 200, flex: 1 }}
                      />
                      <TextField
                        size="small"
                        label="Teléfono"
                        value={member.phone}
                        onChange={(e) =>
                          handleCouncilMemberChange(idx, "phone", e.target.value)
                        }
                        sx={{ minWidth: 140, flex: 1 }}
                      />
                      <TextField
                        size="small"
                        label="Correo"
                        value={member.email}
                        onChange={(e) =>
                          handleCouncilMemberChange(idx, "email", e.target.value)
                        }
                        sx={{ minWidth: 180, flex: 1 }}
                      />
                      <TextField
                        size="small"
                        label="Unidad / Apto"
                        value={member.unit}
                        onChange={(e) =>
                          handleCouncilMemberChange(idx, "unit", e.target.value)
                        }
                        sx={{ minWidth: 110, width: 120 }}
                      />
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleRemoveCouncilMember(idx)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  fontWeight={600}
                >
                  PRESIDENTE DEL CONSEJO
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {councilPresident.name || "No designado"}
                </Typography>
                {councilPresident.phone && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                  >
                    Tel: {councilPresident.phone} • Apto:{" "}
                    {councilPresident.unit || "N/A"}
                  </Typography>
                )}
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  fontWeight={600}
                >
                  TESORERO DEL CONSEJO
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {councilTreasurer.name || "No designado"}
                </Typography>
                {councilTreasurer.phone && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                  >
                    Tel: {councilTreasurer.phone} • Apto:{" "}
                    {councilTreasurer.unit || "N/A"}
                  </Typography>
                )}
              </Grid>
            </Grid>

            {/* Listado de Vocales en Read-Only */}
            {councilMembers && councilMembers.length > 0 && (
              <Box sx={{ mt: 1 }}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  fontWeight={700}
                  sx={{ textTransform: "uppercase", display: "block", mb: 1 }}
                >
                  Otros Consejeros y Vocales ({councilMembers.length})
                </Typography>
                <Grid container spacing={1.5}>
                  {councilMembers.map((m, i) => (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
                      <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                        <Typography variant="subtitle2" fontWeight={700}>
                          {m.name || "Sin nombre"}
                        </Typography>
                        <Chip
                          size="small"
                          label={`Vocal • ${m.unit || "Sin unidad"}`}
                          variant="outlined"
                          color="primary"
                          sx={{ mt: 0.5, mb: 0.5, height: 22 }}
                        />
                        <Typography
                          variant="caption"
                          display="block"
                          color="text.secondary"
                        >
                          Tel: {m.phone || "N/A"} • Email: {m.email || "N/A"}
                        </Typography>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
          </Box>
        )}
      </Paper>

      {/* SECTION 1: PÓLIZAS CONTRACTUALES DE SEGURO */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 3, boxShadow: 1 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2.5,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <ShieldIcon color="primary" />
            <Typography variant="h6" fontWeight={700}>
              PÓLIZAS CONTRACTUALES DE SEGURO
            </Typography>
            <Chip
              size="small"
              label={`${policies.length} Póliza${policies.length === 1 ? "" : "s"}`}
              color="primary"
              variant="outlined"
            />
          </Box>
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => setPolicyModalOpen(true)}
            sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
          >
            Nueva Póliza
          </Button>
        </Box>

        {loadingPolicies ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={28} />
          </Box>
        ) : policies.length === 0 ? (
          <Paper
            variant="outlined"
            sx={{
              p: 3,
              textAlign: "center",
              borderRadius: 2,
              bgcolor: "background.default",
            }}
          >
            <Typography variant="body2" color="text.secondary">
              No hay pólizas registradas para este cliente. Haga clic en "Nueva Póliza" para registrar la primera.
            </Typography>
          </Paper>
        ) : (
          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: "action.hover" }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Tipo de Póliza</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Aseguradora</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>N° Póliza / Certificado</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Valor Asegurado</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Vigencia</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">Estado</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {policies.map((p) => {
                  const statusCfg = POLICY_STATUS_CONFIG[p.status] || {
                    label: p.status,
                    color: "default",
                  };
                  return (
                    <TableRow key={p.id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>
                        {POLICY_TYPE_LABELS[p.policyType] || p.policyType}
                      </TableCell>
                      <TableCell>{p.insuranceCompanyName}</TableCell>
                      <TableCell sx={{ fontFamily: "monospace", fontSize: "0.85rem" }}>
                        {p.policyCertificateNumber}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>
                        {formatCopCurrency(p.insuredAmount)}
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" display="block">
                          Desde: {p.effectiveStartDate ? p.effectiveStartDate.split("T")[0] : "-"}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Hasta: {p.effectiveEndDate ? p.effectiveEndDate.split("T")[0] : "-"}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          size="small"
                          label={statusCfg.label}
                          color={statusCfg.color}
                          variant="filled"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Eliminar Póliza">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeletePolicy(p.id)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* SECTION 2: OTROSÍES Y ADICIONES CONTRACTUALES (OSI) */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 3, boxShadow: 1 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2.5,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <DocIcon color="primary" />
            <Typography variant="h6" fontWeight={700}>
              OTROSÍES Y ADICIONES CONTRACTUALES (OSI)
            </Typography>
            <Chip
              size="small"
              label={`${addendums.length} Otrosí${addendums.length === 1 ? "" : "s"}`}
              color="primary"
              variant="outlined"
            />
          </Box>
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => setAddendumModalOpen(true)}
            sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
          >
            Nuevo Otrosí
          </Button>
        </Box>

        {loadingAddendums ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={28} />
          </Box>
        ) : addendums.length === 0 ? (
          <Paper
            variant="outlined"
            sx={{
              p: 3,
              textAlign: "center",
              borderRadius: 2,
              bgcolor: "background.default",
            }}
          >
            <Typography variant="body2" color="text.secondary">
              No hay otrosíes registrados para este cliente. Haga clic en "Nuevo Otrosí" para registrar adiciones de reinversión o prórrogas.
            </Typography>
          </Paper>
        ) : (
          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: "action.hover" }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>N° Otrosí</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Título / Objeto</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Vigencia / Plazo</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Reinversión Pactada</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Desembolsado</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Fecha Desembolso</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {addendums.map((a) => (
                  <TableRow key={a.id} hover>
                    <TableCell sx={{ fontWeight: 700, fontFamily: "monospace" }}>
                      {a.addendumNumber}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {a.title}
                      </Typography>
                      {a.description && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          {a.description}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" display="block">
                        {a.effectiveStartDate ? a.effectiveStartDate.split("T")[0] : "-"} al{" "}
                        {a.effectiveEndDate ? a.effectiveEndDate.split("T")[0] : "-"}
                      </Typography>
                      <Chip
                        size="small"
                        label={`${a.durationYears} año${a.durationYears === 1 ? "" : "s"}`}
                        variant="outlined"
                        sx={{ mt: 0.5, height: 20, fontSize: "0.7rem" }}
                      />
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>
                      {formatCopCurrency(a.reinvestmentAmountPact)}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: "success.main" }}>
                      {formatCopCurrency(a.disbursedAmount)}
                    </TableCell>
                    <TableCell>
                      {a.disbursementDate ? a.disbursementDate.split("T")[0] : "Pendiente"}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Eliminar Otrosí">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteAddendum(a.id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* SECTION 3: COMPROMISOS DE NIVELES DE SERVICIO (ANS) */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 3, boxShadow: 1 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2.5,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <AnsIcon color="primary" />
            <Typography variant="h6" fontWeight={700}>
              COMPROMISOS DE NIVELES DE SERVICIO (ANS)
            </Typography>
            <Chip
              size="small"
              label={`${ansList.length} Compromiso${ansList.length === 1 ? "" : "s"}`}
              color="primary"
              variant="outlined"
            />
          </Box>
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => setAnsModalOpen(true)}
            sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
          >
            Nuevo Compromiso ANS
          </Button>
        </Box>

        {loadingAns ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={28} />
          </Box>
        ) : ansList.length === 0 ? (
          <Paper
            variant="outlined"
            sx={{
              p: 3,
              textAlign: "center",
              borderRadius: 2,
              bgcolor: "background.default",
            }}
          >
            <Typography variant="body2" color="text.secondary">
              No hay compromisos ANS pactados para este cliente. Haga clic en "Nuevo Compromiso ANS" para registrar entregables de seguridad o informes.
            </Typography>
          </Paper>
        ) : (
          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: "action.hover" }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Tipo de Compromiso</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Título / Entregable</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Fecha Límite</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Fecha Cumplimiento</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">Estado ANS</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ansList.map((ans) => {
                  const statusCfg = ANS_STATUS_CONFIG[ans.status] || {
                    label: ans.status,
                    color: "warning",
                  };
                  return (
                    <TableRow key={ans.id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>
                        {ANS_TYPE_LABELS[ans.commitmentType] || ans.commitmentType}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {ans.title}
                        </Typography>
                        {ans.evidenceNotes && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            Evidencia: {ans.evidenceNotes}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {ans.dueDate ? ans.dueDate.split("T")[0] : "-"}
                      </TableCell>
                      <TableCell>
                        {ans.deliveredDate ? ans.deliveredDate.split("T")[0] : "Pendiente"}
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          size="small"
                          label={statusCfg.label}
                          color={statusCfg.color}
                          variant="filled"
                          onClick={() => handleToggleAnsStatus(ans)}
                          sx={{ cursor: "pointer" }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Eliminar Compromiso">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteAns(ans.id)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* DRAWER: NUEVA PÓLIZA */}
      <ResponsiveFormDrawer
        open={policyModalOpen}
        onClose={() => !savingPolicy && setPolicyModalOpen(false)}
        title="Registrar Póliza de Seguro Contractual"
        subtitle="Cumplimiento, Salarios, Calidad del Servicio y Responsabilidad Civil"
        isSubmitting={savingPolicy}
        submitButtonText="Guardar Póliza"
        formId="create-policy-form"
      >
        <Box
          component="form"
          id="create-policy-form"
          onSubmit={(e) => {
            e.preventDefault();
            handleCreatePolicy();
          }}
        >
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12 }}>
              <TextField
                select
                fullWidth
                size="small"
                label="Tipo de Póliza *"
                value={policyForm.policyType}
                onChange={(e) =>
                  setPolicyForm({ ...policyForm, policyType: e.target.value as PolicyType })
                }
              >
                {Object.entries(POLICY_TYPE_LABELS).map(([k, label]) => (
                  <MenuItem key={k} value={k}>
                    {label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Aseguradora *"
                placeholder="ej. Seguros Bolívar, SURA, Seguros del Estado"
                value={policyForm.insuranceCompanyName}
                onChange={(e) =>
                  setPolicyForm({ ...policyForm, insuranceCompanyName: e.target.value })
                }
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="N° Póliza / Certificado *"
                placeholder="ej. POL-2026-99882"
                value={policyForm.policyCertificateNumber}
                onChange={(e) =>
                  setPolicyForm({ ...policyForm, policyCertificateNumber: e.target.value })
                }
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Valor Asegurado (COP) *"
                value={policyForm.insuredAmount}
                onChange={(e) =>
                  setPolicyForm({ ...policyForm, insuredAmount: Number(e.target.value) })
                }
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                fullWidth
                size="small"
                label="Estado *"
                value={policyForm.status}
                onChange={(e) =>
                  setPolicyForm({ ...policyForm, status: e.target.value as PolicyStatus })
                }
              >
                {Object.entries(POLICY_STATUS_CONFIG).map(([k, cfg]) => (
                  <MenuItem key={k} value={k}>
                    {cfg.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="Fecha de Inicio"
                InputLabelProps={{ shrink: true }}
                value={policyForm.effectiveStartDate}
                onChange={(e) =>
                  setPolicyForm({ ...policyForm, effectiveStartDate: e.target.value })
                }
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="Fecha de Fin / Vencimiento"
                InputLabelProps={{ shrink: true }}
                value={policyForm.effectiveEndDate}
                onChange={(e) =>
                  setPolicyForm({ ...policyForm, effectiveEndDate: e.target.value })
                }
              />
            </Grid>
          </Grid>
        </Box>
      </ResponsiveFormDrawer>

      {/* DRAWER: NUEVO OTROSÍ */}
      <ResponsiveFormDrawer
        open={addendumModalOpen}
        onClose={() => !savingAddendum && setAddendumModalOpen(false)}
        title="Registrar Otrosí / Adición Contractual"
        subtitle="Modificaciones de plazo, valor, puestos y reinversión pactada"
        isSubmitting={savingAddendum}
        submitButtonText="Guardar Otrosí"
        formId="create-addendum-form"
      >
        <Box
          component="form"
          id="create-addendum-form"
          onSubmit={(e) => {
            e.preventDefault();
            handleCreateAddendum();
          }}
        >
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="N° Otrosí *"
                placeholder="ej. OSI-2026-001"
                value={addendumForm.addendumNumber}
                onChange={(e) =>
                  setAddendumForm({ ...addendumForm, addendumNumber: e.target.value })
                }
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Duración (Años) *"
                value={addendumForm.durationYears}
                onChange={(e) =>
                  setAddendumForm({ ...addendumForm, durationYears: Number(e.target.value) })
                }
                required
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                size="small"
                label="Título / Objeto *"
                placeholder="ej. Adición Presupuestal y Cámaras PTZ"
                value={addendumForm.title}
                onChange={(e) =>
                  setAddendumForm({ ...addendumForm, title: e.target.value })
                }
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Reinversión Pactada (COP) *"
                value={addendumForm.reinvestmentAmountPact}
                onChange={(e) =>
                  setAddendumForm({
                    ...addendumForm,
                    reinvestmentAmountPact: Number(e.target.value),
                  })
                }
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Monto Desembolsado (COP)"
                value={addendumForm.disbursedAmount}
                onChange={(e) =>
                  setAddendumForm({
                    ...addendumForm,
                    disbursedAmount: Number(e.target.value),
                  })
                }
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="Fecha de Inicio"
                InputLabelProps={{ shrink: true }}
                value={addendumForm.effectiveStartDate}
                onChange={(e) =>
                  setAddendumForm({ ...addendumForm, effectiveStartDate: e.target.value })
                }
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="Fecha de Fin"
                InputLabelProps={{ shrink: true }}
                value={addendumForm.effectiveEndDate}
                onChange={(e) =>
                  setAddendumForm({ ...addendumForm, effectiveEndDate: e.target.value })
                }
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="Fecha de Desembolso"
                InputLabelProps={{ shrink: true }}
                value={addendumForm.disbursementDate}
                onChange={(e) =>
                  setAddendumForm({ ...addendumForm, disbursementDate: e.target.value })
                }
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ mb: 1, display: "block" }}>
                CLÁUSULAS CONTRACTUALES Y ESPECIFICACIONES TÉCNICAS (EDITOR ENRIQUECIDO)
              </Typography>
              <TipTapRichEditor
                value={addendumForm.description || ""}
                onChange={(html) =>
                  setAddendumForm({ ...addendumForm, description: html })
                }
                placeholder="Redacte aquí las cláusulas especiales, equipamiento o compromisos de reinversión en el puesto..."
              />
            </Grid>
          </Grid>
        </Box>
      </ResponsiveFormDrawer>

      {/* DRAWER: NUEVO COMPROMISO ANS */}
      <ResponsiveFormDrawer
        open={ansModalOpen}
        onClose={() => !savingAns && setAnsModalOpen(false)}
        title="Registrar Compromiso de Niveles de Servicio (ANS)"
        subtitle="Estudios de seguridad, actas de empalme, refuerzos y reportes trimestrales"
        isSubmitting={savingAns}
        submitButtonText="Guardar Compromiso ANS"
        formId="create-ans-form"
      >
        <Box
          component="form"
          id="create-ans-form"
          onSubmit={(e) => {
            e.preventDefault();
            handleCreateAns();
          }}
        >
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12 }}>
              <TextField
                select
                fullWidth
                size="small"
                label="Tipo de Compromiso *"
                value={ansForm.commitmentType}
                onChange={(e) =>
                  setAnsForm({
                    ...ansForm,
                    commitmentType: e.target.value as AnsCommitmentType,
                  })
                }
              >
                {Object.entries(ANS_TYPE_LABELS).map(([k, label]) => (
                  <MenuItem key={k} value={k}>
                    {label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                size="small"
                label="Título / Entregable *"
                placeholder="ej. Entrega de Estudio de Seguridad con Matriz de Riesgos"
                value={ansForm.title}
                onChange={(e) =>
                  setAnsForm({ ...ansForm, title: e.target.value })
                }
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="Fecha Límite Pactada *"
                InputLabelProps={{ shrink: true }}
                value={ansForm.dueDate}
                onChange={(e) =>
                  setAnsForm({ ...ansForm, dueDate: e.target.value })
                }
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                fullWidth
                size="small"
                label="Estado Inicial *"
                value={ansForm.status}
                onChange={(e) =>
                  setAnsForm({
                    ...ansForm,
                    status: e.target.value as AnsCommitmentStatus,
                  })
                }
              >
                {Object.entries(ANS_STATUS_CONFIG).map(([k, cfg]) => (
                  <MenuItem key={k} value={k}>
                    {cfg.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="Fecha de Entrega (Opcional)"
                InputLabelProps={{ shrink: true }}
                value={ansForm.deliveredDate}
                onChange={(e) =>
                  setAnsForm({ ...ansForm, deliveredDate: e.target.value })
                }
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ mb: 1, display: "block" }}>
                NOTAS DE EVIDENCIA, RADICADOS Y ACUERDOS TÉCNICOS (EDITOR ENRIQUECIDO)
              </Typography>
              <TipTapRichEditor
                value={ansForm.evidenceNotes || ""}
                onChange={(html) =>
                  setAnsForm({ ...ansForm, evidenceNotes: html })
                }
                placeholder="Especifique los radicados de acta, número de entrega o detalles de cumplimiento técnico..."
              />
            </Grid>
          </Grid>
        </Box>
      </ResponsiveFormDrawer>
    </Box>
  );
}
