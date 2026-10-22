"use client";

import React, { useMemo, useEffect, useState } from "react";
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Chip,
  Avatar,
  Menu,
  MenuItem,
  Drawer,
  useTheme,
  useMediaQuery,
  Badge,
  Stack,
  Collapse,
} from "@mui/material";
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Search as SearchIcon,
  BuildOutlined as ToolboxIcon,
  SettingsOutlined as SettingsIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  Shield as ShieldIcon,
  DrawOutlined as DrawIcon,
  ExpandLess,
  ExpandMore,
  Close as CloseIcon,
} from "@mui/icons-material";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthContext";
import { useTenant } from "@/providers/TenantProvider";
import { useNavigation } from "@/providers/NavigationContext";
import {
  ERP_DIRECTIONS,
  ErpDirectionId,
  NavigationSubItem,
  GeneralToolItem,
  filterAccessibleDirections,
} from "@/config/navigationRegistry";
import { HttpClient } from "@/lib/api/client";
import NavigationIcon from "./NavigationIcon";
import RoadmapFeatureDialog from "./RoadmapFeatureDialog";
import GeneralToolsDrawer from "./GeneralToolsDrawer";
import GlobalCommandPalette from "./GlobalCommandPalette";
import UserSignatureDrawer, { SignatureCreationMode } from "@/components/signatures/UserSignatureDrawer";

export const RAIL_WIDTH = 68;
export const SUBMENU_WIDTH = 250;

export default function DualRailNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { session, logout } = useAuth();
  const { tenant, isFeatureEnabled } = useTenant();

  const {
    isSubmenuPinned,
    toggleSubmenu,
    setSubmenuPinned,
    mobileOpen,
    closeMobile,
    toolsDrawerOpen,
    setToolsDrawerOpen,
    commandPaletteOpen,
    setCommandPaletteOpen,
    currentDirectionId,
    setCurrentDirectionId,
    roadmapItem,
    openRoadmapDialog,
    closeRoadmapDialog,
  } = useNavigation();

  // Profile menu
  const [userMenuAnchor, setUserMenuAnchor] = React.useState<null | HTMLElement>(null);
  const [signatureDrawerOpen, setSignatureDrawerOpen] = useState(false);

  const handleSaveUserSignature = async (dataUrl: string, method: SignatureCreationMode) => {
    await HttpClient.post("/users/me/signature", { signatureDataUrl: dataUrl, method });
  };

  // Accordion expanded state for mobile drawer (keyed by direction ID)
  const [mobileExpandedDirections, setMobileExpandedDirections] = useState<Record<string, boolean>>({});

  // Auto-expand current direction when route changes
  useEffect(() => {
    if (currentDirectionId) {
      setMobileExpandedDirections((prev) => ({
        ...prev,
        [currentDirectionId]: true,
      }));
    }
  }, [currentDirectionId]);

  const handleToggleMobileDirection = (dirId: string) => {
    setMobileExpandedDirections((prev) => ({
      ...prev,
      [dirId]: !prev[dirId],
    }));
  };

  // Identify if user is in Global SaaS Master Console mode (Tenant 'system' without impersonation)
  const isSystemMaster = Boolean(
    (tenant?.slug === "system" || session?.tenantId === "system" || session?.user?.tenantId === "system") &&
    !session?.isImpersonating
  );

  // Filter accessible directions based on RBAC, Features, and Master Mode
  const accessibleDirections = useMemo(() => {
    return filterAccessibleDirections(
      ERP_DIRECTIONS,
      session?.permissions || [],
      isFeatureEnabled,
      session?.permissions?.includes("godlike:manage"),
      session?.user?.clientId,
      isSystemMaster,
    );
  }, [session?.permissions, session?.user?.clientId, isFeatureEnabled, isSystemMaster]);

  // Determine active direction based on pathname
  const activeDirectionId = useMemo<ErpDirectionId>(() => {
    if (isSystemMaster) {
      if (pathname.startsWith("/administrative/tenants")) return "system-tenants";
      if (
        pathname.startsWith("/administrative/users") ||
        pathname.startsWith("/administrative/roles")
      ) {
        return "system-users";
      }
      return "dashboard";
    }

    if (pathname === "/dashboard") return "dashboard";
    if (
      pathname.startsWith("/administrative/clients") ||
      pathname.startsWith("/administrative/my-residents")
    ) {
      return "clients";
    }
    if (pathname.startsWith("/administrative/employees")) {
      return "employees";
    }
    if (pathname.startsWith("/administrative/prospects")) {
      return "commercial";
    }
    if (pathname.startsWith("/operation")) return "operations";
    if (pathname.startsWith("/administrative/pqrs")) return "quality";
    if (
      pathname.startsWith("/administrative/users") ||
      pathname.startsWith("/administrative/roles") ||
      pathname.startsWith("/administrative/departments") ||
      pathname.startsWith("/administrative/positions") ||
      pathname.startsWith("/administrative/tenants")
    ) {
      return "settings";
    }
    return "dashboard";
  }, [pathname, isSystemMaster]);

  // Sync current direction with route
  useEffect(() => {
    setCurrentDirectionId(activeDirectionId);
  }, [activeDirectionId, setCurrentDirectionId]);

  const currentDirection = useMemo(() => {
    return accessibleDirections.find((d) => d.id === currentDirectionId) || accessibleDirections[0];
  }, [accessibleDirections, currentDirectionId]);

  const hasSubmenu = Boolean(currentDirection?.items && currentDirection.items.length > 0);
  const isSubmenuVisible = isSubmenuPinned && hasSubmenu;

  const handleSelectDirection = (dirId: ErpDirectionId) => {
    setCurrentDirectionId(dirId);
    const targetDir = accessibleDirections.find((d) => d.id === dirId);
    const dirHasSubmenu = Boolean(targetDir?.items && targetDir.items.length > 0);

    if (dirHasSubmenu && !isSubmenuPinned) {
      setSubmenuPinned(true);
    }

    if (targetDir?.path) {
      if (pathname !== targetDir.path) {
        router.push(targetDir.path);
      }
      if (isMobile) closeMobile();
    } else if (targetDir?.id === "system-tenants" && pathname !== "/administrative/tenants" && !pathname.startsWith("/administrative/tenants/")) {
      router.push("/administrative/tenants");
      if (isMobile) closeMobile();
    } else if (targetDir?.id === "system-users" && pathname !== "/administrative/users" && pathname !== "/administrative/roles") {
      router.push("/administrative/users");
      if (isMobile) closeMobile();
    }
  };

  const handleSubItemClick = (item: NavigationSubItem) => {
    if (item.status === "ACTIVE" && item.path) {
      router.push(item.path);
      if (isMobile) closeMobile();
    } else {
      openRoadmapDialog(item, currentDirection);
    }
  };

  const handleSelectRoadmapGeneralTool = (tool: GeneralToolItem) => {
    setToolsDrawerOpen(false);
    openRoadmapDialog(
      {
        id: tool.id,
        title: tool.title,
        description: tool.description,
        status: tool.status,
        iconName: tool.iconName,
        roadmapDetails: tool.roadmapDetails,
      },
      null,
    );
  };

  const userInitials = session?.user?.fullName
    ? session.user.fullName
      .trim()
      .split(/\s+/)
      .map((n: string) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase()
    : "U";

  // Submenu Content Render
  const renderSubmenuContent = () => (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Submenu Header */}
      <Box
        sx={{
          p: 2,
          pb: 1.5,
          borderBottom: "1px solid",
          borderColor: "divider",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          bgcolor: "background.paper",
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 0.8,
              color: "primary.main",
              display: "block",
            }}
          >
            {currentDirection?.shortTitle || "Dirección"}
          </Typography>
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 700,
              color: "text.primary",
              lineHeight: 1.3,
              whiteSpace: "normal",
              wordBreak: "break-word",
            }}
          >
            {currentDirection?.title}
          </Typography>
        </Box>

        {!isMobile && (
          <Tooltip title={isSubmenuPinned ? "Colapsar submenú (Ctrl+B)" : "Fijar submenú"}>
            <IconButton
              size="small"
              onClick={toggleSubmenu}
              sx={{ color: "text.secondary" }}
            >
              {isSubmenuPinned ? <ChevronLeftIcon fontSize="small" /> : <ChevronRightIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* Submenu Items */}
      <Box sx={{ p: 1, overflowY: "auto", flexGrow: 1, bgcolor: "background.paper" }}>
        <List disablePadding>
          {currentDirection?.items.map((item) => {
            const isActive = item.path
              ? item.path === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.path)
              : false;

            const isRoadmap = item.status === "ROADMAP";

            return (
              <ListItem key={item.id} disablePadding sx={{ mb: 0.5 }}>
                <Tooltip
                  title={item.description || item.title}
                  placement="right"
                  arrow
                  enterDelay={500}
                >
                  <ListItemButton
                    onClick={() => handleSubItemClick(item)}
                    selected={isActive}
                    sx={{
                      borderRadius: 2,
                      py: 1,
                      px: 1.25,
                      alignItems: "center",
                      borderLeft: isActive
                        ? (theme) => `3px solid ${theme.palette.primary.main}`
                        : "3px solid transparent",
                      transition: "all 0.18s ease-in-out",
                      "&.Mui-selected": {
                        bgcolor: "primary.soft",
                        color: "primary.main",
                        "& .item-icon": { color: "primary.main" },
                      },
                      "&:hover": {
                        bgcolor: isActive ? "primary.soft" : "neutral.50",
                      },
                    }}
                  >
                    <ListItemIcon
                      className="item-icon"
                      sx={{
                        minWidth: 32,
                        alignSelf: "center",
                        color: isActive
                          ? "primary.main"
                          : item.bulletColor || (isRoadmap ? "text.disabled" : "text.secondary"),
                      }}
                    >
                      <NavigationIcon name={item.iconName} fontSize="small" />
                    </ListItemIcon>

                    <ListItemText
                      disableTypography
                      sx={{ my: 0 }}
                      primary={
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 0.75,
                            width: "100%",
                            minWidth: 0,
                          }}
                        >
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: isActive ? 700 : 500,
                              fontSize: "0.83rem",
                              color: isRoadmap ? "text.secondary" : "text.primary",
                              lineHeight: 1.35,
                              whiteSpace: "normal",
                              wordBreak: "break-word",
                            }}
                          >
                            {item.title}
                          </Typography>

                          {isRoadmap && (
                            <Chip
                              label="Planificado"
                              size="small"
                              sx={{
                                height: 18,
                                fontSize: "0.6rem",
                                fontWeight: 700,
                                bgcolor: "neutral.100",
                                color: "text.secondary",
                                flexShrink: 0,
                              }}
                            />
                          )}
                        </Box>
                      }
                    />
                  </ListItemButton>
                </Tooltip>
              </ListItem>
            );
          })}
        </List>
      </Box>

      {/* Submenu Footer */}
      <Box
        sx={{
          p: 1.5,
          borderTop: "1px solid",
          borderColor: "divider",
          bgcolor: "neutral.50",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Typography variant="caption" color="text.secondary">
          {isSystemMaster ? "Noxia SaaS Master" : "Noxia ERP 2026"}
        </Typography>
        <Chip
          label="Ctrl + B"
          size="small"
          sx={{ height: 18, fontSize: "0.62rem", bgcolor: "background.paper", border: "1px solid", borderColor: "divider" }}
        />
      </Box>
    </Box>
  );

  return (
    <>
      {/* ============================================================== */}
      {/* DESKTOP VIEW: DUAL-RAIL (RAIL 68px + SUBMENU 230px)           */}
      {/* ============================================================== */}
      <Box
        sx={{
          display: { xs: "none", md: "flex" },
          position: "fixed",
          top: 64, // Just below Navbar
          left: 0,
          bottom: 0,
          zIndex: (theme) => theme.zIndex.drawer,
        }}
      >
        {/* 1. PRIMARY RAIL (68px) */}
        <Box
          sx={{
            width: RAIL_WIDTH,
            bgcolor: "secondary.main",
            borderRight: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            py: 1.5,
            zIndex: 2,
            boxShadow: "2px 0 8px rgba(15, 23, 42, 0.15)",
          }}
        >
          {/* Top Logo / Shield Isotype */}
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2.5,
              bgcolor: "primary.main",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mb: 2,
              boxShadow: "0 4px 12px rgba(124, 58, 237, 0.35)",
              cursor: "pointer",
              transition: "transform 0.15s ease",
              "&:hover": { transform: "scale(1.05)" },
            }}
            onClick={() => router.push("/dashboard")}
          >
            <ShieldIcon fontSize="small" />
          </Box>

          <Divider sx={{ width: "60%", borderColor: "rgba(255, 255, 255, 0.1)", mb: 1.5 }} />

          {/* Vertical Directions Icons List */}
          <Box
            sx={{
              flexGrow: 1,
              width: "100%",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 1,
              px: 1,
              "&::-webkit-scrollbar": { display: "none" },
            }}
          >
            {accessibleDirections.map((dir) => {
              const isSelected = dir.id === currentDirectionId;
              const isEndOfMasterGroup = dir.id === "employees";

              return (
                <React.Fragment key={dir.id}>
                  <Tooltip
                    title={
                      <Box sx={{ p: 0.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {dir.title}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.7)" }}>
                          {dir.description}
                        </Typography>
                      </Box>
                    }
                    placement="right"
                    arrow
                  >
                    <IconButton
                      onClick={() => handleSelectDirection(dir.id)}
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 2.5,
                        color: isSelected ? "#ffffff" : "rgba(255, 255, 255, 0.65)",
                        bgcolor: isSelected ? "primary.main" : "transparent",
                        border: isSelected
                          ? "1px solid rgba(255, 255, 255, 0.3)"
                          : "1px solid transparent",
                        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                        "&:hover": {
                          bgcolor: isSelected ? "primary.dark" : "rgba(255, 255, 255, 0.12)",
                          color: "#ffffff",
                          transform: "translateY(-1px)",
                        },
                      }}
                    >
                      <Badge
                        color="warning"
                        variant="dot"
                        invisible={!dir.badge}
                        overlap="circular"
                      >
                        <NavigationIcon name={dir.iconName} fontSize="medium" />
                      </Badge>
                    </IconButton>
                  </Tooltip>
                  {isEndOfMasterGroup && (
                    <Divider
                      sx={{
                        width: "60%",
                        borderColor: "rgba(255, 255, 255, 0.12)",
                        my: 0.5,
                      }}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </Box>

          <Divider sx={{ width: "60%", borderColor: "rgba(255, 255, 255, 0.1)", my: 1.5 }} />

          {/* Bottom Utility Actions: Command Palette, Toolbox, Settings */}
          <Stack spacing={1} sx={{ alignItems: "center" }}>
            {/* Command Palette Trigger */}
            <Tooltip title="Búsqueda Global (Ctrl + K)" placement="right" arrow>
              <IconButton
                onClick={() => setCommandPaletteOpen(true)}
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 2,
                  color: "rgba(255, 255, 255, 0.75)",
                  "&:hover": { bgcolor: "rgba(255, 255, 255, 0.15)", color: "#ffffff" },
                }}
              >
                <SearchIcon />
              </IconButton>
            </Tooltip>

            {/* General Tools Trigger (#11) - Solo visible en modo ERP de Empresa */}
            {!isSystemMaster && (
              <Tooltip title="Herramientas Generales" placement="right" arrow>
                <IconButton
                  onClick={() => setToolsDrawerOpen(true)}
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: 2,
                    color: "rgba(255, 255, 255, 0.75)",
                    "&:hover": { bgcolor: "rgba(255, 255, 255, 0.15)", color: "#ffffff" },
                  }}
                >
                  <ToolboxIcon />
                </IconButton>
              </Tooltip>
            )}

            {/* Settings Trigger (#10) - Solo visible en modo ERP de Empresa */}
            {!isSystemMaster && (
              <Tooltip title="Configuración del Sistema" placement="right" arrow>
                <IconButton
                  onClick={() => handleSelectDirection("settings")}
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: 2,
                    color: currentDirectionId === "settings" ? "#ffffff" : "rgba(255, 255, 255, 0.75)",
                    bgcolor: currentDirectionId === "settings" ? "primary.main" : "transparent",
                    "&:hover": { bgcolor: "rgba(255, 255, 255, 0.15)", color: "#ffffff" },
                  }}
                >
                  <SettingsIcon />
                </IconButton>
              </Tooltip>
            )}

            {/* Profile Avatar */}
            <Tooltip title={session?.user?.fullName || "Perfil"} placement="right" arrow>
              <IconButton
                onClick={(e) => setUserMenuAnchor(e.currentTarget)}
                sx={{ p: 0.5, mt: 0.5 }}
              >
                <Avatar
                  src={session?.user?.avatarUrl || undefined}
                  sx={{
                    width: 36,
                    height: 36,
                    bgcolor: "primary.main",
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    border: "2px solid rgba(255, 255, 255, 0.25)",
                  }}
                >
                  {userInitials}
                </Avatar>
              </IconButton>
            </Tooltip>
          </Stack>
        </Box>

        {/* 2. CONTEXTUAL SUBMENU (230px Colapsable) */}
        <Box
          sx={{
            width: isSubmenuVisible ? SUBMENU_WIDTH : 0,
            overflow: "hidden",
            bgcolor: "background.paper",
            borderRight: isSubmenuVisible ? "1px solid" : "none",
            borderColor: "divider",
            transition: "width 0.22s cubic-bezier(0.4, 0, 0.2, 1)",
            zIndex: 1,
            boxShadow: isSubmenuVisible ? "4px 0 12px rgba(15, 23, 42, 0.04)" : "none",
          }}
        >
          {isSubmenuVisible && renderSubmenuContent()}
        </Box>
      </Box>

      {/* ============================================================== */}
      {/* MOBILE VIEW: HIERARCHICAL ACCORDION DRAWER                     */}
      {/* ============================================================== */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={closeMobile}
        ModalProps={{ keepMounted: true }}
        PaperProps={{
          sx: {
            width: "100%",
            maxWidth: 320,
            display: "flex",
            flexDirection: "column",
            bgcolor: "background.paper",
            p: 0,
          },
        }}
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 10,
        }}
      >
        {/* Mobile Drawer Header */}
        <Box
          sx={{
            p: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            bgcolor: "secondary.main",
            color: "#ffffff",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 2,
                bgcolor: "primary.main",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <ShieldIcon fontSize="small" />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#ffffff" }} noWrap>
                {tenant?.name || "NOXIA"}
              </Typography>
              <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.7)", display: "block" }} noWrap>
                {isSystemMaster ? "Consola SaaS Master" : (tenant?.profile?.legalName || "ERP de Seguridad")}
              </Typography>
            </Box>
          </Box>

          <IconButton size="small" onClick={closeMobile} sx={{ color: "rgba(255,255,255,0.8)" }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        {session?.isImpersonating && (
          <Box sx={{ bgcolor: "warning.main", px: 2, py: 0.75 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: "warning.contrastText" }}>
              ⚠️ Administrando Empresa
            </Typography>
          </Box>
        )}

        {/* Mobile Accordion Navigation List */}
        <Box sx={{ flexGrow: 1, overflowY: "auto", py: 1 }}>
          <List disablePadding>
            {accessibleDirections.map((dir) => {
              const isDirectLink = dir.items.length === 0 || Boolean(dir.path && dir.items.length === 0);
              const isSelected = dir.id === currentDirectionId;
              const isExpanded = Boolean(mobileExpandedDirections[dir.id]);

              if (isDirectLink) {
                const targetPath = dir.path || dir.items[0]?.path || "/dashboard";
                const isItemActive = pathname === targetPath;

                return (
                  <React.Fragment key={dir.id}>
                    <ListItem disablePadding sx={{ px: 1, mb: 0.5 }}>
                      <ListItemButton
                        selected={isItemActive}
                        onClick={() => {
                          router.push(targetPath);
                          closeMobile();
                        }}
                        sx={{
                          borderRadius: 2,
                          py: 1,
                          "&.Mui-selected": {
                            bgcolor: "primary.soft",
                            color: "primary.main",
                            fontWeight: 700,
                            "& .dir-icon": { color: "primary.main" },
                          },
                        }}
                      >
                        <ListItemIcon className="dir-icon" sx={{ minWidth: 38, color: isItemActive ? "primary.main" : "text.secondary" }}>
                          <NavigationIcon name={dir.iconName} fontSize="small" />
                        </ListItemIcon>
                        <ListItemText
                          primary={dir.title}
                          primaryTypographyProps={{
                            fontSize: "0.88rem",
                            fontWeight: isItemActive ? 700 : 500,
                          }}
                        />
                      </ListItemButton>
                    </ListItem>
                    {dir.id === "employees" && (
                      <Divider sx={{ my: 1, mx: 1.5, borderColor: "divider" }} />
                    )}
                  </React.Fragment>
                );
              }

              return (
                <React.Fragment key={dir.id}>
                  <Box sx={{ px: 1, mb: 0.5 }}>
                    <ListItemButton
                      onClick={() => handleToggleMobileDirection(dir.id)}
                      selected={isSelected && !isExpanded}
                      sx={{
                        borderRadius: 2,
                        py: 1,
                        "&.Mui-selected": {
                          bgcolor: "neutral.100",
                          color: "primary.main",
                          fontWeight: 700,
                        },
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 38, color: isSelected ? "primary.main" : "text.secondary" }}>
                        <NavigationIcon name={dir.iconName} fontSize="small" />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: isSelected ? 700 : 600,
                                fontSize: "0.88rem",
                                whiteSpace: "normal",
                                lineHeight: 1.3,
                              }}
                            >
                              {dir.shortTitle || dir.title}
                            </Typography>
                            {dir.badge && (
                              <Chip
                                label={dir.badge}
                                size="small"
                                sx={{ height: 18, fontSize: "0.62rem", fontWeight: 700 }}
                              />
                            )}
                          </Box>
                        }
                      />
                      {isExpanded ? <ExpandLess sx={{ fontSize: "1.1rem", color: "text.secondary" }} /> : <ExpandMore sx={{ fontSize: "1.1rem", color: "text.secondary" }} />}
                    </ListItemButton>

                    <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                      <List component="div" disablePadding sx={{ pl: 4, pr: 0.5, py: 0.5 }}>
                        {dir.items.map((subItem) => {
                          const isSubActive = subItem.path
                            ? subItem.path === "/dashboard"
                              ? pathname === "/dashboard"
                              : pathname.startsWith(subItem.path)
                            : false;
                          const isRoadmap = subItem.status === "ROADMAP";

                          return (
                            <ListItem key={subItem.id} disablePadding sx={{ mb: 0.5 }}>
                              <ListItemButton
                                selected={isSubActive}
                                onClick={() => {
                                  handleSubItemClick(subItem);
                                  if (subItem.status === "ACTIVE" && subItem.path) {
                                    closeMobile();
                                  }
                                }}
                                sx={{
                                  borderRadius: 1.5,
                                  py: 0.75,
                                  px: 1.25,
                                  alignItems: "center",
                                  borderLeft: isSubActive
                                    ? (theme) => `3px solid ${theme.palette.primary.main}`
                                    : "3px solid transparent",
                                  "&.Mui-selected": {
                                    bgcolor: "primary.soft",
                                    color: "primary.main",
                                    "& .sub-icon": { color: "primary.main" },
                                  },
                                }}
                              >
                                <ListItemIcon
                                  className="sub-icon"
                                  sx={{
                                    minWidth: 30,
                                    alignSelf: "center",
                                    color: isSubActive ? "primary.main" : (subItem.bulletColor || (isRoadmap ? "text.disabled" : "text.secondary")),
                                  }}
                                >
                                  <NavigationIcon name={subItem.iconName} fontSize="small" />
                                </ListItemIcon>
                                <ListItemText
                                  disableTypography
                                  sx={{ my: 0 }}
                                  primary={
                                    <Box
                                      sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        gap: 0.75,
                                        width: "100%",
                                        minWidth: 0,
                                      }}
                                    >
                                      <Typography
                                        variant="body2"
                                        sx={{
                                          fontSize: "0.82rem",
                                          fontWeight: isSubActive ? 700 : 500,
                                          color: isRoadmap ? "text.secondary" : "text.primary",
                                          lineHeight: 1.35,
                                          whiteSpace: "normal",
                                          wordBreak: "break-word",
                                        }}
                                      >
                                        {subItem.title}
                                      </Typography>
                                      {isRoadmap && (
                                        <Chip
                                          label="Planificado"
                                          size="small"
                                          sx={{
                                            height: 16,
                                            fontSize: "0.58rem",
                                            fontWeight: 700,
                                            bgcolor: "neutral.100",
                                            flexShrink: 0,
                                          }}
                                        />
                                      )}
                                    </Box>
                                  }
                                />
                              </ListItemButton>
                            </ListItem>
                          );
                        })}
                      </List>
                    </Collapse>
                  </Box>
                  {dir.id === "employees" && (
                    <Divider sx={{ my: 1, mx: 1.5, borderColor: "divider" }} />
                  )}
                </React.Fragment>
              );
            })}
          </List>
        </Box>

        {/* Mobile Drawer Footer: Herramientas Generales + Mi Cuenta + Logout */}
        <Box sx={{ borderTop: "1px solid", borderColor: "divider", p: 1.5, bgcolor: "neutral.50" }}>
          {!isSystemMaster && (
            <ListItemButton
              onClick={() => {
                closeMobile();
                setToolsDrawerOpen(true);
              }}
              sx={{ borderRadius: 2, mb: 1, py: 0.75 }}
            >
              <ListItemIcon sx={{ minWidth: 36, color: "primary.main" }}>
                <ToolboxIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary="Herramientas Generales"
                primaryTypographyProps={{ fontSize: "0.82rem", fontWeight: 600 }}
              />
            </ListItemButton>
          )}

          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pt: 0.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
              <Avatar
                src={session?.user?.avatarUrl || undefined}
                sx={{ width: 32, height: 32, bgcolor: "primary.main", fontSize: "0.75rem", fontWeight: 700 }}
              >
                {userInitials}
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 700, fontSize: "0.8rem" }} noWrap>
                  {session?.user?.fullName || "Usuario"}
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap display="block">
                  {session?.user?.position || session?.user?.userType || "Usuario"}
                </Typography>
              </Box>
            </Box>
            <IconButton size="small" onClick={logout} sx={{ color: "error.main" }} title="Cerrar Sesión">
              <LogoutIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      </Drawer>

      {/* Profile Popup Menu */}
      <Menu
        anchorEl={userMenuAnchor}
        open={Boolean(userMenuAnchor)}
        onClose={() => setUserMenuAnchor(null)}
        slotProps={{
          paper: {
            sx: {
              width: 240,
              borderRadius: 2.5,
              mt: 1,
              boxShadow: "0 10px 15px -3px rgba(15, 23, 42, 0.15)",
              border: "1px solid",
              borderColor: "divider",
            },
          },
        }}
      >
        <Box sx={{ px: 2, py: 1.5, borderBottom: "1px solid", borderColor: "divider" }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }} noWrap>
            {session?.user?.fullName || "Usuario"}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap display="block">
            {session?.user?.document || "Documento"} • {session?.user?.userType || "OPERATIVO"}
          </Typography>
        </Box>

        <MenuItem
          onClick={() => {
            setUserMenuAnchor(null);
            router.push("/administrative/users");
          }}
          sx={{ py: 1, fontSize: "0.85rem" }}
        >
          <ListItemIcon sx={{ minWidth: 32 }}>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          Mi Cuenta
        </MenuItem>

        <MenuItem
          onClick={() => {
            setUserMenuAnchor(null);
            setToolsDrawerOpen(true);
          }}
          sx={{ py: 1, fontSize: "0.85rem" }}
        >
          <ListItemIcon sx={{ minWidth: 32 }}>
            <ToolboxIcon fontSize="small" />
          </ListItemIcon>
          Herramientas
        </MenuItem>

        <MenuItem
          onClick={() => {
            setUserMenuAnchor(null);
            setSignatureDrawerOpen(true);
          }}
          sx={{ py: 1, fontSize: "0.85rem" }}
        >
          <ListItemIcon sx={{ minWidth: 32 }}>
            <DrawIcon fontSize="small" />
          </ListItemIcon>
          Mi Firma Digital
        </MenuItem>

        <Divider />

        <MenuItem
          onClick={() => {
            setUserMenuAnchor(null);
            logout();
          }}
          sx={{ py: 1, fontSize: "0.85rem", color: "error.main" }}
        >
          <ListItemIcon sx={{ minWidth: 32, color: "error.main" }}>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          Cerrar Sesión
        </MenuItem>
      </Menu>

      {/* Dialog for Planned Roadmap Features */}
      <RoadmapFeatureDialog
        open={Boolean(roadmapItem)}
        onClose={closeRoadmapDialog}
        item={roadmapItem?.item || null}
        direction={roadmapItem?.direction || null}
      />

      {/* General Tools Drawer (#11) */}
      <GeneralToolsDrawer
        open={toolsDrawerOpen}
        onClose={() => setToolsDrawerOpen(false)}
        onSelectRoadmapTool={handleSelectRoadmapGeneralTool}
      />

      {/* Command Palette (Ctrl+K) */}
      <GlobalCommandPalette
        open={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        directions={accessibleDirections}
        onSelectRoadmapItem={(item, dirTitle) => {
          openRoadmapDialog(
            item,
            accessibleDirections.find((d) => d.title === dirTitle) || null,
          );
        }}
      />

      {/* User Digital Signature Drawer */}
      <UserSignatureDrawer
        open={signatureDrawerOpen}
        onClose={() => setSignatureDrawerOpen(false)}
        onSave={handleSaveUserSignature}
        initialName={session?.user?.fullName || ""}
      />
    </>
  );
}
