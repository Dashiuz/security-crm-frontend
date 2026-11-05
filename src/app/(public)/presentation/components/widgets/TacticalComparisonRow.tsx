"use client";

import React from "react";
import { Box, Typography } from "@mui/material";
import { Close as CloseIcon, Check as CheckIcon } from "@mui/icons-material";

interface TacticalComparisonRowProps {
  title: string;
  traditional: string;
  loro: string;
}

export default function TacticalComparisonRow({
  title,
  traditional,
  loro,
}: TacticalComparisonRowProps) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "1.2fr 2fr 2fr" },
        gap: { xs: 1.5, md: 3 },
        alignItems: "center",
        p: { xs: "14px 18px", md: "18px 26px" },
        borderRadius: "14px",
        backgroundColor: "rgba(18, 14, 40, 0.78)",
        border: "1.5px solid rgba(124, 58, 237, 0.28)",
        "&:hover": {
          backgroundColor: "rgba(28, 22, 60, 0.88)",
          borderColor: "rgba(124, 58, 237, 0.55)",
        },
      }}
    >
      <Typography sx={{ fontWeight: 850, color: "#FFFFFF", fontSize: { xs: "17px", md: "20px", lg: "22px" } }}>
        {title}
      </Typography>

      {/* Traditional */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <Box
          sx={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            backgroundColor: "rgba(239, 68, 68, 0.18)",
            border: "1.5px solid rgba(239, 68, 68, 0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#EF4444",
            flexShrink: 0,
          }}
        >
          <CloseIcon sx={{ fontSize: 18 }} />
        </Box>
        <Typography sx={{ color: "#CBD5E1", fontSize: { xs: "15px", md: "18px", lg: "19.5px" }, lineHeight: 1.4 }}>
          {traditional}
        </Typography>
      </Box>

      {/* Loro ERP */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <Box
          sx={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            backgroundColor: "rgba(16, 185, 129, 0.18)",
            border: "1.5px solid rgba(16, 185, 129, 0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#10B981",
            flexShrink: 0,
          }}
        >
          <CheckIcon sx={{ fontSize: 18 }} />
        </Box>
        <Typography sx={{ color: "#34D399", fontWeight: 800, fontSize: { xs: "15px", md: "18px", lg: "19.5px" }, lineHeight: 1.4 }}>
          {loro}
        </Typography>
      </Box>
    </Box>
  );
}
