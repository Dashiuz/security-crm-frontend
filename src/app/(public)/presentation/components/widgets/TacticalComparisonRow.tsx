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
        gap: 2,
        alignItems: "center",
        p: "10px 16px",
        borderRadius: "8px",
        backgroundColor: "rgba(18, 14, 40, 0.6)",
        border: "1px solid rgba(124, 58, 237, 0.15)",
        "&:hover": {
          backgroundColor: "rgba(28, 22, 60, 0.7)",
          borderColor: "rgba(124, 58, 237, 0.35)",
        },
      }}
    >
      <Typography sx={{ fontWeight: 700, color: "#F1F5F9", fontSize: "14px" }}>
        {title}
      </Typography>

      {/* Traditional */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Box
          sx={{
            width: 22,
            height: 22,
            borderRadius: "50%",
            backgroundColor: "rgba(239, 68, 68, 0.15)",
            border: "1px solid rgba(239, 68, 68, 0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#EF4444",
            flexShrink: 0,
          }}
        >
          <CloseIcon sx={{ fontSize: 14 }} />
        </Box>
        <Typography sx={{ color: "#94A3B8", fontSize: "13px", lineHeight: 1.3 }}>
          {traditional}
        </Typography>
      </Box>

      {/* Loro ERP */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Box
          sx={{
            width: 22,
            height: 22,
            borderRadius: "50%",
            backgroundColor: "rgba(16, 185, 129, 0.15)",
            border: "1px solid rgba(16, 185, 129, 0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#10B981",
            flexShrink: 0,
          }}
        >
          <CheckIcon sx={{ fontSize: 14 }} />
        </Box>
        <Typography sx={{ color: "#34D399", fontWeight: 600, fontSize: "13px", lineHeight: 1.3 }}>
          {loro}
        </Typography>
      </Box>
    </Box>
  );
}

