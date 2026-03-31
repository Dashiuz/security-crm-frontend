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
  AssignmentInd as AssignIcon,
  Key as PermissionIcon,
  Business as ClientIcon,
  Domain as DomainIcon,
} from "@mui/icons-material";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import { useTenant } from "@/providers/TenantProvider";
import { useAuth } from "@/components/AuthContext";

const drawerWidth = 260;

interface MenuItem {
  text: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: MenuItem[];
  feature?: string;
  permission?: string | string[];
}

const menuItems: MenuItem[] = [
  { text: "Dashboard", icon: <DashboardIcon />, path: "/dashboard" },
  {
    text: "Empresas",
    icon: <DomainIcon />,
    path: "/administrative/tenants",
    permission: "godlike:manage",
  },
  {
    text: "Operaciones",
    icon: <OperationIcon />,
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
        permission: ["parking:manage", "parking:read"],
      },
      {
        text: "Control de Visitas",
        icon: <PeopleIcon />,
        path: "/operation/visitor",
        feature: "visitor",
        permission: ["visitor:manage", "visitor:read"],
      },
      {
        text: "Control de Domicilios",
        icon: <CorrespondenceIcon />,
        path: "/operation/correspondence",
        feature: "correspondence",
        permission: ["correspondence:manage", "correspondence:read"],
      },
    ],
  },
  {
    text: "Administrativo",
    icon: <AdministrativeIcon />,
    subItems: [
      {
        text: "Clientes",
        icon: <ClientIcon />,
        path: "/administrative/clients",
        feature: "client",
        permission: ["client:manage", "client:read"],
      },
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
    ],
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
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({
    Operaciones: pathname.startsWith("/operation"),
    Administrativo: pathname.startsWith("/administrative"),
  });

  const handleSubmenuToggle = (text: string) => {
    setOpenSubmenus((prev) => ({ ...prev, [text]: !prev[text] }));
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
    if (item.feature && !isFeatureEnabled(item.feature)) return null;
    if (item.permission && !hasPermission(item.permission)) return null;

    const filteredSubItems = item.subItems?.filter(
      (si) =>
        (!si.feature || isFeatureEnabled(si.feature)) &&
        (!si.permission || hasPermission(si.permission)),
    );

    const hasSubItems = filteredSubItems && filteredSubItems.length > 0;
    
    // Completely hide parent items if all their children were filtered out
    if (item.subItems && !hasSubItems) return null;

    const isActive = item.path ? pathname === item.path : false;
    const isSubmenuOpen = openSubmenus[item.text] || false;

    return (
      <div key={item.text}>
        <ListItem disablePadding sx={{ mb: 0.5 }}>
          <ListItemButton
            onClick={() => {
              if (hasSubItems) {
                handleSubmenuToggle(item.text);
              } else if (item.path) {
                router.push(item.path);
                onClose();
              }
            }}
            selected={isActive}
            sx={{
              pl: level * 3 + 2,
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
                minWidth: 40,
                color: isActive ? "inherit" : "text.secondary",
              }}
            >
              {item.icon}
            </ListItemIcon>
            <ListItemText
              primary={item.text}
              primaryTypographyProps={{
                fontWeight: isActive || hasSubItems ? 600 : 400,
                fontSize: level === 0 ? "0.9rem" : "0.85rem",
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
          Gestión de Seguridad
        </Typography>
      </Box>
      <List sx={{ px: 0 }}>
        {menuItems.map((item) => renderMenuItem(item))}
      </List>
    </div>
  );

  return (
    <Box
      component="nav"
      sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      aria-label="mailbox folders"
    >
      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={open}
        onClose={onClose}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          display: { xs: "block", sm: "none" },
          "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", sm: "block" },
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
