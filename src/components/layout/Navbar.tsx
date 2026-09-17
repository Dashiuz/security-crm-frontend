"use client";

import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Avatar,
  Menu,
  MenuItem,
  Button,
  Chip,
  Stack,
  Divider,
} from "@mui/material";
import {
  Menu as MenuIcon,
  AccountCircle,
  HomeWork as ClientIcon,
  Badge as BadgeIcon,
  Person as PersonIcon,
  Logout as LogoutIcon,
} from "@mui/icons-material";
import { useAuth } from "@/components/AuthContext";
import { AuthService } from "@/lib/api/auth";
import { useState } from "react";
import { useTenant } from "@/providers/TenantProvider";

interface NavbarProps {
  onMenuClick: () => void;
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  const { session, logout } = useAuth();
  const { tenant } = useTenant();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleClose();
    logout();
  };

  const handleExitImpersonation = async () => {
    try {
      await AuthService.exitImpersonation();
      window.location.href = "/administrative/tenants";
    } catch (error) {
      console.error("Failed to exit impersonation:", error);
    }
  };

  return (
    <AppBar
      position="fixed"
      sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
    >
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={onMenuClick}
          sx={{ mr: 2, display: { lg: "none" } }}
        >
          <MenuIcon />
        </IconButton>
        <Box sx={{ flexGrow: 1, display: "flex", alignItems: "center", gap: { xs: 1, sm: 2, md: 3 }, minWidth: 0, overflow: "hidden" }}>
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{
              fontWeight: "bold",
              letterSpacing: { xs: 0.5, sm: 1 },
              fontSize: { xs: "0.95rem", sm: "1.15rem", md: "1.25rem" },
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {tenant?.name || "NOXIA CRM"}
          </Typography>

          {Boolean(session?.user?.clientName || session?.user?.client?.name) && (
            <Chip
              icon={<ClientIcon style={{ color: "#fff", fontSize: "1rem" }} />}
              label={`Conjunto: ${session?.user?.clientName || session?.user?.client?.name}`}
              size="small"
              sx={{
                display: { xs: "none", md: "inline-flex" },
                bgcolor: "rgba(255, 255, 255, 0.15)",
                color: "#fff",
                fontWeight: 600,
                fontSize: "0.8rem",
                borderRadius: 1.5,
              }}
            />
          )}
        </Box>

        {session?.isImpersonating && (
          <Box
            sx={{
              mr: { xs: 1, sm: 2 },
              display: "flex",
              alignItems: "center",
              bgcolor: "warning.light",
              px: { xs: 1, sm: 2 },
              py: 0.5,
              borderRadius: 2,
              border: "1px solid",
              borderColor: "warning.main",
            }}
          >
            {/* Desktop Text */}
            <Typography
              variant="body2"
              color="warning.dark"
              sx={{ fontWeight: "bold", mr: 2, display: { xs: "none", sm: "block" } }}
            >
              ⚠️ Administrando: {tenant?.name || session.tenantId}
            </Typography>
            {/* Mobile Text */}
            <Typography
              variant="body2"
              color="warning.dark"
              sx={{ fontWeight: "bold", mr: 1, display: { xs: "block", sm: "none" }, fontSize: "0.75rem" }}
            >
              ⚠️ Admin
            </Typography>
            <Button
              variant="contained"
              color="warning"
              size="small"
              onClick={handleExitImpersonation}
              sx={{
                textTransform: "none",
                borderRadius: 2,
                boxShadow: "none",
                minWidth: { xs: "auto", sm: 64 },
                px: { xs: 1, sm: 2 },
                py: { xs: 0.25, sm: 0.5 },
                fontSize: { xs: "0.7rem", sm: "0.8125rem" },
                "&:hover": { boxShadow: "none", bgcolor: "warning.main" },
              }}
            >
              Cerrar
            </Button>
          </Box>
        )}

        {session && (() => {
          const userInitials = session.user?.fullName
            ? session.user.fullName
                .trim()
                .split(/\s+/)
                .map((n: string) => n[0])
                .slice(0, 2)
                .join("")
                .toUpperCase()
            : "U";
          const avatarSrc = session.user?.avatarUrl || undefined;

          return (
            <Box sx={{ display: "flex", alignItems: "center" }}>
              {/* Clickable Profile Button (Name + Avatar) */}
              <Box
                onClick={handleMenu}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.25,
                  cursor: "pointer",
                  px: 1.2,
                  py: 0.6,
                  borderRadius: 3,
                  transition: "all 0.2s ease",
                  "&:hover": {
                    bgcolor: "rgba(255, 255, 255, 0.15)",
                  },
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    display: { xs: "none", sm: "block" },
                    fontWeight: 600,
                    color: "inherit",
                    fontSize: "0.875rem",
                  }}
                >
                  {session.user?.fullName || "Usuario"}
                </Typography>
                <Avatar
                  src={avatarSrc}
                  sx={{
                    width: 36,
                    height: 36,
                    bgcolor: avatarSrc ? "transparent" : "secondary.main",
                    color: "#ffffff",
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    border: "2px solid rgba(255, 255, 255, 0.4)",
                    boxShadow: "0 2px 6px rgba(0, 0, 0, 0.15)",
                    flexShrink: 0,
                  }}
                >
                  {userInitials}
                </Avatar>
              </Box>

              {/* Profile Dropdown Menu & Card */}
              <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                anchorOrigin={{
                  vertical: "bottom",
                  horizontal: "right",
                }}
                keepMounted
                transformOrigin={{
                  vertical: "top",
                  horizontal: "right",
                }}
                open={Boolean(anchorEl)}
                onClose={handleClose}
                slotProps={{
                  paper: {
                    elevation: 5,
                    sx: {
                      width: 300,
                      maxWidth: "100%",
                      mt: 1.5,
                      borderRadius: 3,
                      overflow: "hidden",
                      boxShadow: "0 10px 30px rgba(0, 0, 0, 0.16)",
                      border: "1px solid",
                      borderColor: "divider",
                    },
                  },
                }}
              >
                {/* Profile Card Header */}
                <Box
                  sx={{
                    p: 2.5,
                    pb: 2,
                    bgcolor: (theme) =>
                      theme.palette.mode === "dark" ? "background.paper" : "#f8f9fa",
                    borderBottom: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <Stack direction="row" spacing={1.75} alignItems="center" sx={{ mb: 1.5 }}>
                    <Avatar
                      src={avatarSrc}
                      sx={{
                        width: 52,
                        height: 52,
                        bgcolor: avatarSrc ? "transparent" : "primary.main",
                        color: "#fff",
                        fontSize: "1.2rem",
                        fontWeight: 700,
                        border: "2px solid",
                        borderColor: "primary.light",
                        boxShadow: "0 3px 8px rgba(0, 0, 0, 0.12)",
                        flexShrink: 0,
                      }}
                    >
                      {userInitials}
                    </Avatar>
                    <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                      <Typography
                        variant="subtitle1"
                        sx={{
                          fontWeight: 700,
                          lineHeight: 1.25,
                          fontSize: "0.95rem",
                          color: "text.primary",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                        title={session.user.fullName}
                      >
                        {session.user.fullName}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          color: "text.secondary",
                          fontWeight: 500,
                          display: "flex",
                          alignItems: "center",
                          gap: 0.5,
                          mt: 0.5,
                          lineHeight: 1.2,
                        }}
                      >
                        <BadgeIcon sx={{ fontSize: 14, color: "primary.main" }} />
                        {session.user.position || "Personal Operativo"}
                      </Typography>
                    </Box>
                  </Stack>

                  {/* Badges: Role and Department */}
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                    <Chip
                      size="small"
                      label={session.user.roleName || (session.isImpersonating ? "Super Administrador" : "Usuario")}
                      color="primary"
                      variant="filled"
                      sx={{
                        fontWeight: 600,
                        fontSize: "0.72rem",
                        height: 22,
                      }}
                    />
                    {session.user.department && (
                      <Chip
                        size="small"
                        label={session.user.department}
                        variant="outlined"
                        sx={{
                          fontWeight: 500,
                          fontSize: "0.72rem",
                          height: 22,
                        }}
                      />
                    )}
                  </Stack>
                </Box>

                {/* Menu Items */}
                <Box sx={{ py: 1 }}>
                  <MenuItem
                    onClick={handleClose}
                    sx={{
                      py: 1.25,
                      px: 2.5,
                      fontSize: "0.875rem",
                      fontWeight: 500,
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                    }}
                  >
                    <PersonIcon sx={{ fontSize: 20, color: "text.secondary" }} />
                    Mi Perfil
                  </MenuItem>

                  <Divider sx={{ my: 0.5 }} />

                  <MenuItem
                    onClick={handleLogout}
                    sx={{
                      py: 1.25,
                      px: 2.5,
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      color: "error.main",
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                      "&:hover": {
                        bgcolor: "error.lighter",
                      },
                    }}
                  >
                    <LogoutIcon sx={{ fontSize: 20, color: "error.main" }} />
                    Cerrar Sesión
                  </MenuItem>
                </Box>
              </Menu>
            </Box>
          );
        })()}
      </Toolbar>
    </AppBar>
  );
}
