"use client";

import React from "react";
import { Box, Stack, Typography, Chip } from "@mui/material";
import { Verified, WorkspacePremium, MilitaryTech } from "@mui/icons-material";

export interface FormatQualityBadgesBlockProps {
  badges?: string[];
}

const DEFAULT_BADGES = [
  "ISO 9001:2015 (Gestión de Calidad)",
  "BASC V6:2022 (Comercio Seguro)",
  "ISO 45001:2018 (Seguridad y Salud en el Trabajo)",
  "ISO 14001:2015 (Gestión Ambiental)",
];

export default function FormatQualityBadgesBlock({
  badges = DEFAULT_BADGES,
}: FormatQualityBadgesBlockProps) {
  return (
    <Box
      sx={{
        border: "1px solid #D1D5DB",
        borderRadius: 2,
        p: 1.5,
        mb: 2.5,
        bgcolor: "#F9FAFB",
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
        <WorkspacePremium sx={{ color: "#D97706", fontSize: 22 }} />
        <Typography variant="caption" sx={{ fontWeight: 800, color: "#374151", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Certificaciones de Calidad y Cumplimiento Normativo
        </Typography>
      </Stack>

      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        {badges.map((badge, idx) => (
          <Chip
            key={idx}
            icon={<Verified sx={{ fontSize: "16px !important", color: "#059669 !important" }} />}
            label={badge}
            size="small"
            sx={{
              bgcolor: "#FFFFFF",
              border: "1px solid #E5E7EB",
              fontWeight: 600,
              fontSize: "0.75rem",
              color: "#1F2937",
            }}
          />
        ))}
      </Stack>
    </Box>
  );
}
