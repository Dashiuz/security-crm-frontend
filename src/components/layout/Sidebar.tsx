"use client";

import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Divider,
  Box,
  Typography,
  Collapse,
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  Security as OperationIcon,
  BusinessCenter as AdministrativeIcon,
  ExpandLess,
  ExpandMore,
  Notes as MinutaIcon,
  LocalParking as ParkingIcon,
  People as PeopleIcon,
  HomeWork as CorrespondenceIcon,
  Badge as EmployeeIcon,
  Person as UserIcon,
  AccountTree as DeptIcon,
  Work as PositionIcon,
  VerifiedUser as RoleIcon,
  Business as ClientIcon,
  Domain as DomainIcon,
  Storefront as BuyersIcon,
  GroupWork as ResourcesIcon,
  PersonSearch as ProspectIcon,
  Shield as SecurityStudyIcon,
  Memory as TechProjectIcon,
  Checkroom as UniformIcon,
  Inventory as InventoryIcon,
  FormatListBulleted as ListIcon,
  UploadFile as UploadIcon,
  DirectionsWalk as RouteIcon,
} from "@mui/icons-material";
import { useRouter, usePathname } from "next/navigation";
import { useState, useMemo, useEffect } from "react";
import { useTenant } from "@/providers/TenantProvider";
import { useAuth } from "@/components/AuthContext";

const drawerWidth = 260;

interface MenuItem {
  id?: string;
  text: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: MenuItem[];
  feature?: string;
  permission?: string | string[];
  disabled?: boolean;
  internalOnly?: boolean;
}

const systemMenuItems: MenuItem[] = [
  { text: "Dashboard", icon: <DashboardIcon />, path: "/dashboard" },
  {
    text: "Empresas",
    icon: <DomainIcon />,
    path: "/administrative/tenants",
    permission: "godlike:manage",
  },
  {
    text: "Usuarios",
    icon: <UserIcon />,
    path: "/administrative/users",
    permission: "godlike:manage",
  },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { tenant, isFeatureEnabled } = useTenant();
  const { session } = useAuth();

  const menuItems = useMemo<MenuItem[]>(
    () => [
      { text: "Dashboard", icon: <DashboardIcon />, path: "/dashboard" },
      {
        text: "Empresas",
        icon: <DomainIcon />,
        path: "/administrative/tenants",
        permission: "godlike:manage",
      },
      {
        id: "operaciones",
        text: "Operaciones",
        icon: <OperationIcon />,
        subItems: [
          {
            id: "minutas-cliente",
            text: "Minutas del Cliente",
            icon: <ClientIcon />,
            subItems: [
              {
                text: "Minuta General",
                icon: <MinutaIcon />,
                path: "/operation/minuta-general",
                feature: "minuta",
                permission: ["minuta:manage", "minuta:read"],
              },
              {
                text: "Control de Parqueadero",
                icon: <ParkingIcon />,
                path: "/operation/parking",
                feature: "parking",
                permission: ["minuta:manage", "minuta:read"],
              },
              {
                text: "Control de Visitas",
                icon: <PeopleIcon />,
                path: "/operation/visitor",
                feature: "visitor",
                permission: ["minuta:manage", "minuta:read"],
              },
              {
                text: "Control de Domicilios",
                icon: <CorrespondenceIcon />,
                path: "/operation/correspondence",
                feature: "correspondence",
                permission: ["minuta:manage", "minuta:read"],
              },
            ],
          },
          {
            id: "minutas-tenant",
            text: `Minutas de ${tenant?.name || "la Empresa"}`,
            icon: <DomainIcon />,
            internalOnly: true,
            subItems: [
              {
                text: "Minuta General",
                icon: <MinutaIcon />,
                path: "/operation/internal/minuta-general",
                feature: "minuta",
                permission: ["minuta:manage", "minuta:read"],
              },
              {
                text: "Control de Parqueadero",
                icon: <ParkingIcon />,
                path: "/operation/internal/parking",
                feature: "parking",
                permission: ["minuta:manage", "minuta:read"],
              },
              {
                text: "Control de Visitas",
                icon: <PeopleIcon />,
                path: "/operation/internal/visitor",
                feature: "visitor",
                permission: ["minuta:manage", "minuta:read"],
              },
              {
                text: "Control de Domicilios",
                icon: <CorrespondenceIcon />,
                path: "/operation/internal/correspondence",
                feature: "correspondence",
                permission: ["minuta:manage", "minuta:read"],
              },
            ],
          },
          {
            id: "marcaciones",
            text: "Marcaciones",
            icon: <RouteIcon />,
            disabled: true,
          },
        ],
      },
      {
        id: "mis-clientes",
        text: "Mis Clientes",
        icon: <BuyersIcon />,
        subItems: [
          {
            text: "Listado de Clientes",
            icon: <ListIcon />,
            path: "/administrative/clients",
            feature: "client",
            permission: ["client:manage", "client:read"],
          },
          {
            text: "Prospectos de Cliente",
            icon: <ProspectIcon />,
            path: "/administrative/prospects",
            feature: "client",
            permission: ["client:manage", "client:read"],
          },
          {
            text: "Estudios de Seguridad",
            icon: <SecurityStudyIcon />,
            disabled: true,
          },
          {
            text: "Proyectos de Tecnología",
            icon: <TechProjectIcon />,
            disabled: true,
          },
        ],
      },
      {
        id: "mis-recursos",
        text: "Mis Recursos",
        icon: <ResourcesIcon />,
        subItems: [
          {
            text: "Empleados",
            icon: <EmployeeIcon />,
            path: "/administrative/employees",
            feature: "employee",
            permission: ["employee:manage", "employee:read"],
          },
          {
            text: "Usuarios",
            icon: <UserIcon />,
            path: "/administrative/users",
            feature: "user",
            permission: ["user:manage", "user:read"],
          },
          {
            text: "Departamentos",
            icon: <DeptIcon />,
            path: "/administrative/departments",
            feature: "department",
            permission: ["department:manage", "department:read"],
          },
          {
            text: "Posiciones",
            icon: <PositionIcon />,
            path: "/administrative/positions",
            feature: "position",
            permission: ["position:manage", "position:read"],
          },
          {
            text: "Control de Roles",
            icon: <RoleIcon />,
            path: "/administrative/roles",
            feature: "role",
            permission: ["role:manage", "role:read"],
          },
          {
            text: "Dotaciones",
            icon: <UniformIcon />,
            disabled: true,
          },
          {
            text: "Inventario",
            icon: <InventoryIcon />,
            disabled: true,
          },
        ],
      },
    ],
    [tenant?.name]
  );

  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({
    operaciones: pathname.startsWith("/operation"),
    "minutas-cliente":
      pathname.startsWith("/operation") &&
      !pathname.startsWith("/operation/internal"),
    "minutas-tenant": pathname.startsWith("/operation/internal"),
    "mis-clientes":
      pathname.startsWith("/administrative/clients") ||
      pathname.startsWith("/administrative/prospects"),
    "mis-recursos":
      pathname.startsWith("/administrative/employees") ||
      pathname.startsWith("/administrative/users") ||
      pathname.startsWith("/administrative/departments") ||
      pathname.startsWith("/administrative/positions") ||
      pathname.startsWith("/administrative/roles"),
  });

  useEffect(() => {
    if (pathname.startsWith("/operation/internal")) {
      setOpenSubmenus((prev) => ({
        ...prev,
        operaciones: true,
        "minutas-tenant": true,
      }));
    } else if (pathname.startsWith("/operation")) {
      setOpenSubmenus((prev) => ({
        ...prev,
        operaciones: true,
        "minutas-cliente": true,
      }));
    }
  }, [pathname]);

  const handleSubmenuToggle = (key: string) => {
    setOpenSubmenus((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const hasPermission = (perm?: string | string[]) => {
    if (!perm) return true;
    if (session?.permissions?.includes("godlike:manage")) return true;

    if (Array.isArray(perm)) {
      return perm.some((p) => session?.permissions?.includes(p));
    }
    return session?.permissions?.includes(perm as string);
  };

  const renderMenuItem = (item: MenuItem, level = 0) => {
    if (item.internalOnly && session?.user?.clientId) return null;
    if (item.feature && !isFeatureEnabled(item.feature)) return null;
    if (item.permission && !hasPermission(item.permission)) return null;

    const filteredSubItems = item.subItems?.filter(
      (si) =>
        (!si.internalOnly || !session?.user?.clientId) &&
        (!si.feature || isFeatureEnabled(si.feature)) &&
        (!si.permission || hasPermission(si.permission)),
    );

    const hasSubItems = filteredSubItems && filteredSubItems.length > 0;

    if (item.subItems && !hasSubItems) return null;

    const menuKey = item.id || item.text;
    const isActive = item.path ? pathname === item.path : false;
    const isSubmenuOpen = openSubmenus[menuKey] || false;

    return (
      <div key={menuKey}>
        <ListItem disablePadding sx={{ mb: 0.5 }}>
          <ListItemButton
            disabled={item.disabled}
            onClick={() => {
              if (item.disabled) return;
              if (hasSubItems) {
                handleSubmenuToggle(menuKey);
              } else if (item.path) {
                router.push(item.path);
                onClose();
              }
            }}
            selected={isActive}
            sx={{
              pl: level === 0 ? 2 : level === 1 ? 3.5 : 5,
              borderRadius: 2,
              mx: 1,
              "&.Mui-selected": {
                bgcolor: "primary.light",
                color: "primary.contrastText",
                "& .MuiListItemIcon-root": {
                  color: "primary.contrastText",
                },
                "&:hover": {
                  bgcolor: "primary.main",
                },
              },
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: level === 2 ? 34 : 40,
                color: isActive ? "inherit" : "text.secondary",
              }}
            >
              {item.icon}
            </ListItemIcon>
            <ListItemText
              primary={item.text}
              primaryTypographyProps={{
                fontWeight: isActive || (hasSubItems && isSubmenuOpen) ? 600 : 400,
                fontSize: level === 0 ? "0.9rem" : level === 1 ? "0.85rem" : "0.8rem",
              }}
            />
            {hasSubItems ? (
              isSubmenuOpen ? (
                <ExpandLess />
              ) : (
                <ExpandMore />
              )
            ) : null}
          </ListItemButton>
        </ListItem>
        {hasSubItems && (
          <Collapse in={isSubmenuOpen} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {filteredSubItems!.map((subItem) =>
                renderMenuItem(subItem, level + 1),
              )}
            </List>
          </Collapse>
        )}
      </div>
    );
  };

  const isSystemTenant = tenant?.slug === "system";
  const activeMenuItems = isSystemTenant ? systemMenuItems : menuItems;

  const drawerContent = (
    <div>
      <Toolbar sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        {tenant?.logoUrl ? (
          <Box
            component="img"
            src={tenant.logoUrl}
            alt="Logo"
            sx={{ width: 32, height: 32, objectFit: "contain" }}
          />
        ) : null}
        <Typography variant="h6" color="primary" sx={{ fontWeight: "bold" }}>
          {tenant?.name || "NOXIA"}
        </Typography>
      </Toolbar>
      <Divider />
      <Box sx={{ px: 2, py: 2 }}>
        <Typography
          variant="overline"
          color="text.secondary"
          sx={{ fontWeight: "bold" }}
        >
          {isSystemTenant ? "Administración Global" : "Gestión de Seguridad"}
        </Typography>
      </Box>
      <List sx={{ px: 0 }}>
        {activeMenuItems.map((item) => renderMenuItem(item))}
      </List>
    </div>
  );

  return (
    <Box
      component="nav"
      sx={{ width: { lg: drawerWidth }, flexShrink: { lg: 0 } }}
      aria-label="mailbox folders"
    >
      {/* Mobile drawer (phones portrait & landscape, tablets) */}
      <Drawer
        variant="temporary"
        open={open}
        onClose={onClose}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: "block", lg: "none" },
          "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop drawer (large screens and desktops) */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", lg: "block" },
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: drawerWidth,
            borderRight: "1px solid #e0e0e0",
          },
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
}
