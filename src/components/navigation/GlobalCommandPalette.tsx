"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  TextField,
  InputAdornment,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  Chip,
  Divider,
} from "@mui/material";
import {
  Search as SearchIcon,
  ArrowForward as ArrowIcon,
  KeyboardReturn as EnterIcon,
  Business as BusinessIcon,
  PeopleAlt as PeopleIcon,
  Speed as SpeedIcon,
} from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { ERP_DIRECTIONS, GENERAL_TOOLS, NavigationSubItem, ErpDirection } from "@/config/navigationRegistry";
import NavigationIcon from "./NavigationIcon";

interface GlobalCommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onSelectRoadmapItem: (item: NavigationSubItem, directionTitle: string) => void;
  directions?: ErpDirection[];
}

export default function GlobalCommandPalette({
  open,
  onClose,
  onSelectRoadmapItem,
  directions = ERP_DIRECTIONS,
}: GlobalCommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  // Keyboard shortcut Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (open) {
          onClose();
        } else {
          // Parent controls opening
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  // Flattened searchable items
  const allSearchableItems = useMemo(() => {
    const results: Array<{
      id: string;
      title: string;
      description: string;
      category: string;
      iconName: string;
      status: "ACTIVE" | "ROADMAP";
      path?: string;
      rawItem?: NavigationSubItem;
      directionTitle?: string;
    }> = [];

    // Add directions
    directions.forEach((dir) => {
      if (dir.items.length === 0 && dir.path) {
        results.push({
          id: dir.id,
          title: dir.title,
          description: dir.description,
          category: "Acceso Principal",
          iconName: dir.iconName,
          status: "ACTIVE",
          path: dir.path,
        });
      } else {
        dir.items.forEach((item) => {
          results.push({
            id: `${dir.id}-${item.id}`,
            title: item.title,
            description: item.description,
            category: dir.title,
            iconName: item.iconName,
            status: item.status,
            path: item.path,
            rawItem: item,
            directionTitle: dir.title,
          });
        });
      }
    });

    // Add general tools
    GENERAL_TOOLS.forEach((tool) => {
      results.push({
        id: tool.id,
        title: tool.title,
        description: tool.description,
        category: "Herramientas Generales",
        iconName: tool.iconName,
        status: tool.status,
        path: tool.targetPath,
      });
    });

    return results;
  }, [directions]);

  // Filtered list with priority sorting
  const filtered = useMemo(() => {
    if (!query.trim()) {
      return allSearchableItems.slice(0, 10);
    }
    const q = query.toLowerCase().trim();
    const matches = allSearchableItems.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q),
    );

    // Prioritize exact/prefix matches and ACTIVE routes over ROADMAP
    return matches.sort((a, b) => {
      const aTitle = a.title.toLowerCase();
      const bTitle = b.title.toLowerCase();
      const aScore = aTitle.startsWith(q) ? 3 : aTitle.includes(q) ? 2 : 1;
      const bScore = bTitle.startsWith(q) ? 3 : bTitle.includes(q) ? 2 : 1;
      if (aScore !== bScore) return bScore - aScore;

      const aActive = a.status === "ACTIVE" ? 1 : 0;
      const bActive = b.status === "ACTIVE" ? 1 : 0;
      return bActive - aActive;
    });
  }, [allSearchableItems, query]);

  const handleSelect = (item: (typeof allSearchableItems)[0]) => {
    onClose();
    setQuery("");
    if (item.status === "ACTIVE" && item.path) {
      router.push(item.path);
    } else if (item.rawItem) {
      onSelectRoadmapItem(item.rawItem, item.directionTitle || "");
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: 3,
            p: 0,
            overflow: "hidden",
            boxShadow: "0 25px 50px -12px rgba(15, 23, 42, 0.35)",
            border: "1px solid",
            borderColor: "divider",
            mt: { xs: 4, md: 10 },
            verticalAlign: "top",
          },
        },
      }}
    >
      {/* Search Input Box */}
      <Box sx={{ p: 2, bgcolor: "background.paper", borderBottom: "1px solid", borderColor: "divider" }}>
        <TextField
          autoFocus
          fullWidth
          variant="standard"
          placeholder="Buscar dirección, módulo, minuta o herramienta... (Ctrl + K)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          InputProps={{
            disableUnderline: true,
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: "primary.main", mr: 1, fontSize: 24 }} />
              </InputAdornment>
            ),
            sx: { fontSize: "1.05rem", fontWeight: 500 },
          }}
        />

        {/* Quick Access Pills for Transversal Masters */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mt: 1.5, flexWrap: "wrap" }}>
          <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, mr: 0.5 }}>
            Accesos directos:
          </Typography>
          <Chip
            icon={<BusinessIcon sx={{ fontSize: "0.95rem !important" }} />}
            label="Clientes"
            size="small"
            clickable
            onClick={() => {
              onClose();
              router.push("/administrative/clients");
            }}
            sx={{
              height: 24,
              fontSize: "0.75rem",
              fontWeight: 600,
              bgcolor: "primary.soft",
              color: "primary.main",
              border: "1px solid",
              borderColor: "primary.light",
              "&:hover": { bgcolor: "primary.main", color: "#ffffff" },
            }}
          />
          <Chip
            icon={<PeopleIcon sx={{ fontSize: "0.95rem !important" }} />}
            label="Empleados"
            size="small"
            clickable
            onClick={() => {
              onClose();
              router.push("/administrative/employees");
            }}
            sx={{
              height: 24,
              fontSize: "0.75rem",
              fontWeight: 600,
              bgcolor: "primary.soft",
              color: "primary.main",
              border: "1px solid",
              borderColor: "primary.light",
              "&:hover": { bgcolor: "primary.main", color: "#ffffff" },
            }}
          />
          <Chip
            icon={<SpeedIcon sx={{ fontSize: "0.95rem !important" }} />}
            label="Dashboard"
            size="small"
            clickable
            onClick={() => {
              onClose();
              router.push("/dashboard");
            }}
            sx={{
              height: 24,
              fontSize: "0.75rem",
              fontWeight: 600,
              bgcolor: "neutral.100",
              color: "text.primary",
              "&:hover": { bgcolor: "neutral.200" },
            }}
          />
        </Box>
      </Box>

      {/* Results List */}
      <DialogContent sx={{ p: 1, maxHeight: 420, overflowY: "auto" }}>
        {filtered.length === 0 ? (
          <Box sx={{ py: 6, textAlign: "center", color: "text.secondary" }}>
            <Typography variant="body2">No se encontraron módulos con &quot;{query}&quot;</Typography>
          </Box>
        ) : (
          <List disablePadding>
            {filtered.map((item) => (
              <ListItem key={item.id} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => handleSelect(item)}
                  sx={{
                    borderRadius: 2,
                    p: 1.2,
                    "&:hover": {
                      bgcolor: "primary.soft",
                      "& .arrow-icon": { transform: "translateX(3px)", color: "primary.main" },
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 42, color: item.status === "ACTIVE" ? "primary.main" : "text.secondary" }}>
                    <NavigationIcon name={item.iconName} fontSize="small" />
                  </ListItemIcon>

                  <ListItemText
                    primary={
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {item.title}
                        </Typography>
                        <Chip
                          label={item.category}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: "0.68rem",
                            fontWeight: 600,
                            bgcolor: "neutral.100",
                            color: "text.secondary",
                          }}
                        />
                        {item.status === "ROADMAP" && (
                          <Chip
                            label="Planificado"
                            size="small"
                            sx={{
                              height: 18,
                              fontSize: "0.65rem",
                              fontWeight: 700,
                              bgcolor: "warning.soft",
                              color: "warning.dark",
                            }}
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block" }}>
                        {item.description}
                      </Typography>
                    }
                  />

                  <ArrowIcon
                    className="arrow-icon"
                    sx={{
                      fontSize: "1rem",
                      color: "text.disabled",
                      transition: "transform 0.15s ease",
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>

      {/* Footer shortcut tips */}
      <Divider />
      <Box
        sx={{
          px: 2,
          py: 1,
          bgcolor: "neutral.50",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          color: "text.secondary",
        }}
      >
        <Typography variant="caption">Noxia Global Command Palette</Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Chip
            icon={<EnterIcon sx={{ fontSize: "0.8rem !important" }} />}
            label="Navegar"
            size="small"
            sx={{ height: 20, fontSize: "0.7rem" }}
          />
          <Chip label="ESC cerrar" size="small" sx={{ height: 20, fontSize: "0.7rem" }} />
        </Box>
      </Box>
    </Dialog>
  );
}
