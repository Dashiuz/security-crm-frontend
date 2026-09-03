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
} from "@mui/material";
import { Menu as MenuIcon, AccountCircle, HomeWork as ClientIcon } from "@mui/icons-material";
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

        {session && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography
              variant="body2"
              sx={{ display: { xs: "none", sm: "block" } }}
            >
              {session.user?.fullName || "Usuario"}
            </Typography>
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenu}
              color="inherit"
            >
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: "secondary.main",
                  fontSize: "1rem",
                }}
              >
                {session.user.fullName?.[0]?.toUpperCase() || "?"}
              </Avatar>
            </IconButton>
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
            >
              <MenuItem onClick={handleClose}>Mi Perfil</MenuItem>
              <MenuItem onClick={handleLogout}>Cerrar Sesión</MenuItem>
            </Menu>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
}
