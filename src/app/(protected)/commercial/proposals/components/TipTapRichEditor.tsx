"use client";

import React, { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import {
  Box,
  Stack,
  IconButton,
  Tooltip,
  Divider,
  Chip,
  Typography,
} from "@mui/material";
import {
  FormatBold,
  FormatItalic,
  FormatListBulleted,
  FormatListNumbered,
  FormatAlignLeft,
  FormatAlignCenter,
  FormatAlignRight,
  FormatAlignJustify,
  Title,
  FormatQuote,
  FormatClear,
} from "@mui/icons-material";

interface TipTapRichEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  availableVariables?: { key: string; label: string }[];
}

const DEFAULT_VARIABLES = [
  { key: "client_name", label: "Nombre Cliente" },
  { key: "service_name", label: "Servicio" },
  { key: "monthly_rate", label: "Tarifa Mensual" },
  { key: "company_legal_name", label: "Empresa Seguridad" },
  { key: "company_nit", label: "NIT Empresa" },
  { key: "current_year", label: "Año Vigencia" },
  { key: "contract_validity_days", label: "Días Validez" },
];

export default function TipTapRichEditor({
  value,
  onChange,
  placeholder = "Redacte aquí la cláusula, minuta o propuesta comercial...",
  availableVariables = DEFAULT_VARIABLES,
}: TipTapRichEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
    ],
    content: value || "",
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || "");
    }
  }, [value, editor]);

  if (!editor) {
    return null;
  }

  const insertVariable = (varKey: string) => {
    editor.chain().focus().insertContent(`{{${varKey}}}`).run();
  };

  return (
    <Box
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        overflow: "hidden",
        bgcolor: "background.paper",
        transition: "border-color 0.2s ease-in-out",
        "&:hover": {
          borderColor: "primary.main",
        },
      }}
    >
      {/* Toolbar */}
      <Box
        sx={{
          p: 0.75,
          bgcolor: "neutral.50",
          borderBottom: "1px solid",
          borderColor: "divider",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 0.5,
        }}
      >
        <Tooltip title="Negrita (Ctrl+B)">
          <IconButton
            size="small"
            color={editor.isActive("bold") ? "primary" : "default"}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <FormatBold fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title="Cursiva (Ctrl+I)">
          <IconButton
            size="small"
            color={editor.isActive("italic") ? "primary" : "default"}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <FormatItalic fontSize="small" />
          </IconButton>
        </Tooltip>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.25 }} />

        <Tooltip title="Título 1">
          <IconButton
            size="small"
            color={editor.isActive("heading", { level: 1 }) ? "primary" : "default"}
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          >
            <Title fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title="Título 2">
          <IconButton
            size="small"
            color={editor.isActive("heading", { level: 2 }) ? "primary" : "default"}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            sx={{ fontWeight: 700, fontSize: "0.75rem" }}
          >
            H2
          </IconButton>
        </Tooltip>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.25 }} />

        <Tooltip title="Lista con viñetas">
          <IconButton
            size="small"
            color={editor.isActive("bulletList") ? "primary" : "default"}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <FormatListBulleted fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title="Lista numerada">
          <IconButton
            size="small"
            color={editor.isActive("orderedList") ? "primary" : "default"}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            <FormatListNumbered fontSize="small" />
          </IconButton>
        </Tooltip>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.25 }} />

        <Tooltip title="Alinear a la izquierda">
          <IconButton
            size="small"
            color={editor.isActive({ textAlign: "left" }) ? "primary" : "default"}
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
          >
            <FormatAlignLeft fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title="Centrar">
          <IconButton
            size="small"
            color={editor.isActive({ textAlign: "center" }) ? "primary" : "default"}
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
          >
            <FormatAlignCenter fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title="Alinear a la derecha">
          <IconButton
            size="small"
            color={editor.isActive({ textAlign: "right" }) ? "primary" : "default"}
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
          >
            <FormatAlignRight fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title="Justificar">
          <IconButton
            size="small"
            color={editor.isActive({ textAlign: "justify" }) ? "primary" : "default"}
            onClick={() => editor.chain().focus().setTextAlign("justify").run()}
          >
            <FormatAlignJustify fontSize="small" />
          </IconButton>
        </Tooltip>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.25 }} />

        <Tooltip title="Cita textual">
          <IconButton
            size="small"
            color={editor.isActive("blockquote") ? "primary" : "default"}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
          >
            <FormatQuote fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title="Limpiar formato">
          <IconButton
            size="small"
            onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
          >
            <FormatClear fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Variables Dinámicas Disponibles */}
      <Box sx={{ p: 1, bgcolor: "rgba(99, 102, 241, 0.04)", borderBottom: "1px dashed", borderColor: "divider" }}>
        <Typography variant="caption" sx={{ fontWeight: 700, color: "primary.main", display: "block", mb: 0.5 }}>
          Variables Dinámicas (clic para insertar en la posición del cursor):
        </Typography>
        <Stack direction="row" spacing={0.6} flexWrap="wrap" useFlexGap>
          {availableVariables.map((v) => (
            <Chip
              key={v.key}
              label={`+ {{${v.key}}}`}
              size="small"
              onClick={() => insertVariable(v.key)}
              sx={{
                fontFamily: "monospace",
                fontSize: "0.72rem",
                cursor: "pointer",
                bgcolor: "background.paper",
                border: "1px solid",
                borderColor: "primary.light",
                color: "primary.dark",
                fontWeight: 600,
                "&:hover": {
                  bgcolor: "primary.soft",
                  borderColor: "primary.main",
                },
              }}
            />
          ))}
        </Stack>
      </Box>

      {/* Editor Content */}
      <Box
        sx={{
          p: 2,
          minHeight: 220,
          maxHeight: 480,
          overflowY: "auto",
          fontFamily: "inherit",
          "& .ProseMirror": {
            outline: "none",
            minHeight: 180,
            fontSize: "0.92rem",
            lineHeight: 1.6,
            "& p.is-editor-empty:first-of-type::before": {
              content: "attr(data-placeholder)",
              float: "left",
              color: "text.disabled",
              pointerEvents: "none",
              height: 0,
            },
            "& h1": { fontSize: "1.4rem", fontWeight: 700, mb: 1, color: "text.primary" },
            "& h2": { fontSize: "1.2rem", fontWeight: 700, mb: 1, color: "text.primary" },
            "& h3": { fontSize: "1.05rem", fontWeight: 600, mb: 0.5, color: "text.primary" },
            "& ul, & ol": { pl: 3, mb: 1 },
            "& blockquote": {
              borderLeft: "3px solid",
              borderColor: "primary.main",
              pl: 1.5,
              ml: 0,
              fontStyle: "italic",
              color: "text.secondary",
            },
          },
        }}
      >
        <EditorContent editor={editor} />
      </Box>
    </Box>
  );
}
