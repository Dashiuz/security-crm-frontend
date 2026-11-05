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
    <Box className="bento-card" sx={{ flex: 1, minWidth: { xs: 0, sm: 200 }, p: { xs: 2.5, md: 3.5 } }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
        {badgeText && <span className={badgeClasses[badgeType]} style={{ fontSize: "13.5px", padding: "4px 12px" }}>{badgeText}</span>}
        {icon && <Box sx={{ color: "rgba(167, 139, 250, 0.8)", display: "flex" }}>{icon}</Box>}
      </Box>
      <Typography
        variant="h3"
        sx={{
          fontFamily: "'JetBrains Mono', monospace",
          fontWeight: 900,
          color: "#FFFFFF",
          fontSize: { xs: "36px", sm: "44px", md: "52px", lg: "60px" },
          lineHeight: 1.05,
          mb: 1,
        }}
      >
        {value}
      </Typography>
      <Typography
        variant="body2"
        sx={{
          fontWeight: 850,
          color: "#FFFFFF",
          fontSize: { xs: "17px", md: "20px", lg: "22px" },
          mb: sublabel ? 0.8 : 0,
        }}
      >
        {label}
      </Typography>
      {sublabel && (
        <Typography
          variant="caption"
          sx={{
            color: "#CBD5E1",
            fontSize: { xs: "14.5px", md: "17px", lg: "18.5px" },
            lineHeight: 1.45,
            display: "block",
          }}
        >
          {sublabel}
        </Typography>
      )}
    </Box>
  );
}
