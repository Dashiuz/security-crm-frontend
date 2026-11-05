"use client";

import React from "react";
import { Box, Typography } from "@mui/material";

interface TacticalStatCardProps {
  value: string;
  label: string;
  sublabel?: string;
  badgeText?: string;
  badgeType?: "emerald" | "violet" | "amber" | "rose";
  icon?: React.ReactNode;
}

export default function TacticalStatCard({
  value,
  label,
  sublabel,
  badgeText,
  badgeType = "violet",
  icon,
}: TacticalStatCardProps) {
  const badgeClasses = {
    violet: "tactical-pill tactical-pill-violet",
    emerald: "tactical-pill tactical-pill-emerald",
    amber: "tactical-pill tactical-pill-amber",
    rose: "tactical-pill tactical-pill-rose",
  };

  return (
    <Box className="bento-card" sx={{ flex: 1, minWidth: 200 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
        {badgeText && <span className={badgeClasses[badgeType]}>{badgeText}</span>}
        {icon && <Box sx={{ color: "rgba(167, 139, 250, 0.8)", display: "flex" }}>{icon}</Box>}
      </Box>
      <Typography
        variant="h3"
        sx={{
          fontFamily: "'JetBrains Mono', monospace",
          fontWeight: 800,
          color: "#FFFFFF",
          fontSize: { xs: "28px", md: "36px" },
          lineHeight: 1.1,
          mb: 0.5,
        }}
      >
        {value}
      </Typography>
      <Typography
        variant="body2"
        sx={{
          fontWeight: 600,
          color: "#E2E8F0",
          fontSize: "14px",
          mb: sublabel ? 0.2 : 0,
        }}
      >
        {label}
      </Typography>
      {sublabel && (
        <Typography
          variant="caption"
          sx={{
            color: "#94A3B8",
            fontSize: "12px",
            display: "block",
          }}
        >
          {sublabel}
        </Typography>
      )}
    </Box>
  );
}

