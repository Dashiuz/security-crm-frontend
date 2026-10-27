"use client";

import React, { useEffect, useState, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import { Table, TableCell, TableHeader, TableRow } from "@tiptap/extension-table";

import { DynamicTokenExtension } from "../extensions/DynamicTokenExtension";
import { ResponsiveImageExtension } from "../extensions/ResponsiveImageExtension";
import {
  Box,
  Stack,
  IconButton,
  Tooltip,
  Divider,
  Chip,
  Typography,
  Menu,
  MenuItem,
  Button,
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
  TableChart,
  ViewColumn,
  TableRows,
  Delete,
  CallMerge,
  CallSplit,
  Add,
  HorizontalRule,
  FitScreen,
  AddPhotoAlternate,
} from "@mui/icons-material";

export interface FormatTipTapEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  availableVariables?: Array<{ key: string; label: string; category?: string }>;
  minHeight?: number;
  maxHeight?: number;
}

export default function FormatTipTapEditor({
  value,
  onChange,
  placeholder = "Escriba o pegue el contenido del formato. Puede pegar tablas directamente desde Excel o Word con Ctrl+V...",
  availableVariables = [],
  minHeight = 320,
  maxHeight = 600,
}: FormatTipTapEditorProps) {
  const [tableMenuAnchor, setTableMenuAnchor] = useState<null | HTMLElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      DynamicTokenExtension,
      ResponsiveImageExtension,
    ],
    content: value || "",
    editorProps: {
      transformPastedHTML(html) {
        if (!html) return html;
        try {
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, "text/html");
          const tables = doc.querySelectorAll("table");
          tables.forEach((table) => {
            table.style.width = "100%";
            table.style.maxWidth = "100%";
            table.style.tableLayout = "auto";
            table.style.margin = "12px 0";

            const headerCells = table.querySelectorAll("tr:first-child th, tr:first-child td");
            if (headerCells.length >= 6) {
              table.classList.add("table-dense-a4");
            }

            const cells = table.querySelectorAll("th, td");
            cells.forEach((cell: any) => {
              cell.style.whiteSpace = "normal";
              cell.style.wordBreak = "break-word";
              cell.style.maxWidth = "none";
              if (cell.style.width && cell.style.width.includes("px")) {
                cell.style.width = "auto";
              }
            });
          });
          return doc.body.innerHTML;
        } catch {
          return html;
        }
      },
    },
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

  const handleTableMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setTableMenuAnchor(event.currentTarget);
  };

  const handleTableMenuClose = () => {
    setTableMenuAnchor(null);
  };

  const handleFitTableToA4 = () => {
    const currentHtml = editor.getHTML();
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(currentHtml, "text/html");
      const tables = doc.querySelectorAll("table");
      tables.forEach((table) => {
        table.style.width = "100%";
        table.style.maxWidth = "100%";
        table.style.tableLayout = "auto";
        const cols = table.querySelectorAll("tr:first-child th, tr:first-child td");
        if (cols.length >= 6) {
          table.classList.add("table-dense-a4");
        }
        table.querySelectorAll("th, td").forEach((cell: any) => {
          cell.style.whiteSpace = "normal";
          cell.style.wordBreak = "break-word";
          cell.style.width = "auto";
        });
      });
      editor.commands.setContent(doc.body.innerHTML);
    } catch {
      // fallback
    }
    handleTableMenuClose();
  };

  const handleImageFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        editor.chain().focus().insertContent({
          type: "image",
          attrs: { src: dataUrl, alt: file.name },
        }).run();
      }
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  return (
    <Box
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        overflow: "hidden",
        bgcolor: "background.paper",
        boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.05)",
        transition: "border-color 0.2s ease-in-out",
        "&:hover": {
          borderColor: "primary.main",
        },
      }}
    >
      {/* Barra de herramientas superior */}
      <Box
        sx={{
          p: 1,
          bgcolor: "grey.50",
          borderBottom: "1px solid",
          borderColor: "divider",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 0.5,
        }}
      >
        {/* Estilos de Texto */}
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

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

        {/* Títulos */}
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

        <Tooltip title="Título 3">
          <IconButton
            size="small"
            color={editor.isActive("heading", { level: 3 }) ? "primary" : "default"}
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            sx={{ fontWeight: 700, fontSize: "0.7rem" }}
          >
            H3
          </IconButton>
        </Tooltip>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

        {/* Listas */}
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

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

        {/* Alineaciones */}
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

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

        {/* Herramientas de Tabla TipTap (Word / Excel) */}
        <Button
          size="small"
          variant={editor.isActive("table") ? "contained" : "outlined"}
          color="primary"
          startIcon={<TableChart fontSize="small" />}
          onClick={handleTableMenuOpen}
          sx={{ textTransform: "none", py: 0.4, px: 1, fontSize: "0.8rem", borderRadius: 1.5 }}
        >
          Tablas & Celdas
        </Button>

        <Tooltip title="Ajustar tabla a Hoja A4 (100% ancho y sin desbordes)">
          <Button
            size="small"
            variant="outlined"
            color="success"
            startIcon={<FitScreen fontSize="small" />}
            onClick={handleFitTableToA4}
            sx={{ textTransform: "none", py: 0.4, px: 1, fontSize: "0.8rem", borderRadius: 1.5 }}
          >
            Ajustar a Hoja A4
          </Button>
        </Tooltip>

        <input
          type="file"
          ref={fileInputRef}
          style={{ display: "none" }}
          accept="image/*"
          onChange={handleImageFileChange}
        />
        <Tooltip title="Insertar imagen local o anexo gráfico">
          <Button
            size="small"
            variant="outlined"
            color="secondary"
            startIcon={<AddPhotoAlternate fontSize="small" />}
            onClick={() => fileInputRef.current?.click()}
            sx={{ textTransform: "none", py: 0.4, px: 1, fontSize: "0.8rem", borderRadius: 1.5 }}
          >
            Imagen / Anexo
          </Button>
        </Tooltip>

        <Menu
          anchorEl={tableMenuAnchor}
          open={Boolean(tableMenuAnchor)}
          onClose={handleTableMenuClose}
        >
          <MenuItem onClick={handleFitTableToA4}>
            <FitScreen fontSize="small" sx={{ mr: 1, color: "success.main" }} />
            Ajustar Tabla a Hoja A4 (100%)
          </MenuItem>
          <Divider />
          <MenuItem
            onClick={() => {
              editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
              handleTableMenuClose();
            }}
          >
            <TableChart fontSize="small" sx={{ mr: 1, color: "primary.main" }} />
            Insertar Tabla 3x3
          </MenuItem>
          <Divider />
          <MenuItem
            disabled={!editor.can().addColumnBefore()}
            onClick={() => {
              editor.chain().focus().addColumnBefore().run();
              handleTableMenuClose();
            }}
          >
            <ViewColumn fontSize="small" sx={{ mr: 1 }} />
            Agregar Columna Antes
          </MenuItem>
          <MenuItem
            disabled={!editor.can().addColumnAfter()}
            onClick={() => {
              editor.chain().focus().addColumnAfter().run();
              handleTableMenuClose();
            }}
          >
            <ViewColumn fontSize="small" sx={{ mr: 1 }} />
            Agregar Columna Después
          </MenuItem>
          <MenuItem
            disabled={!editor.can().deleteColumn()}
            onClick={() => {
              editor.chain().focus().deleteColumn().run();
              handleTableMenuClose();
            }}
          >
            <Delete fontSize="small" sx={{ mr: 1, color: "error.main" }} />
            Eliminar Columna
          </MenuItem>
          <Divider />
          <MenuItem
            disabled={!editor.can().addRowBefore()}
            onClick={() => {
              editor.chain().focus().addRowBefore().run();
              handleTableMenuClose();
            }}
          >
            <TableRows fontSize="small" sx={{ mr: 1 }} />
            Agregar Fila Arriba
          </MenuItem>
          <MenuItem
            disabled={!editor.can().addRowAfter()}
            onClick={() => {
              editor.chain().focus().addRowAfter().run();
              handleTableMenuClose();
            }}
          >
            <TableRows fontSize="small" sx={{ mr: 1 }} />
            Agregar Fila Abajo
          </MenuItem>
          <MenuItem
            disabled={!editor.can().deleteRow()}
            onClick={() => {
              editor.chain().focus().deleteRow().run();
              handleTableMenuClose();
            }}
          >
            <Delete fontSize="small" sx={{ mr: 1, color: "error.main" }} />
            Eliminar Fila
          </MenuItem>
          <Divider />
          <MenuItem
            disabled={!editor.can().mergeCells()}
            onClick={() => {
              editor.chain().focus().mergeCells().run();
              handleTableMenuClose();
            }}
          >
            <CallMerge fontSize="small" sx={{ mr: 1 }} />
            Combinar Celdas
          </MenuItem>
          <MenuItem
            disabled={!editor.can().splitCell()}
            onClick={() => {
              editor.chain().focus().splitCell().run();
              handleTableMenuClose();
            }}
          >
            <CallSplit fontSize="small" sx={{ mr: 1 }} />
            Dividir Celda
          </MenuItem>
          <Divider />
          <MenuItem
            disabled={!editor.can().deleteTable()}
            onClick={() => {
              editor.chain().focus().deleteTable().run();
              handleTableMenuClose();
            }}
          >
            <Delete fontSize="small" sx={{ mr: 1, color: "error.main" }} />
            Eliminar Tabla Completa
          </MenuItem>
        </Menu>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

        {/* Separador y limpieza */}
        <Tooltip title="Línea divisoria">
          <IconButton
            size="small"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
          >
            <HorizontalRule fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title="Cita en bloque">
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

      {/* Barra de inserción de Variables Dinámicas */}
      {availableVariables.length > 0 && (
        <Box
          sx={{
            p: 1.25,
            bgcolor: "#FEF2F2",
            borderBottom: "1px dashed #FECACA",
          }}
        >
          <Typography
            variant="caption"
            sx={{
              fontWeight: 700,
              color: "#DC2626",
              display: "block",
              mb: 0.75,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Variables Disponibles (Haga clic para insertar en la posición del cursor o dentro de celdas de tabla):
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
                  fontSize: "0.75rem",
                  cursor: "pointer",
                  bgcolor: "#FFFFFF",
                  border: "1px solid #FCA5A5",
                  color: "#B91C1C",
                  fontWeight: 700,
                  transition: "all 0.15s ease-in-out",
                  "&:hover": {
                    bgcolor: "#FEE2E2",
                    borderColor: "#DC2626",
                    transform: "scale(1.02)",
                  },
                }}
              />
            ))}
          </Stack>
        </Box>
      )}

      {/* Lienzo del Editor */}
      <Box
        sx={{
          p: 2.5,
          minHeight,
          maxHeight,
          overflowY: "auto",
          bgcolor: "#FFFFFF",
          "& .ProseMirror": {
            outline: "none",
            minHeight: minHeight - 40,
            fontSize: "0.95rem",
            lineHeight: 1.7,
            color: "#1E293B",
            "& p.is-editor-empty:first-of-type::before": {
              content: "attr(data-placeholder)",
              float: "left",
              color: "text.disabled",
              pointerEvents: "none",
              height: 0,
            },
            "& h1": {
              fontSize: "1.5rem",
              fontWeight: 800,
              mb: 1.5,
              mt: 2,
              color: "#0F172A",
              borderBottom: "1px solid #E2E8F0",
              pb: 0.5,
            },
            "& h2": {
              fontSize: "1.25rem",
              fontWeight: 700,
              mb: 1,
              mt: 1.5,
              color: "#1E293B",
            },
            "& h3": {
              fontSize: "1.1rem",
              fontWeight: 600,
              mb: 0.75,
              mt: 1.25,
              color: "#334155",
            },
            "& ul, & ol": { pl: 3, mb: 1.5 },
            "& blockquote": {
              borderLeft: "4px solid #6366F1",
              pl: 2,
              py: 0.5,
              ml: 0,
              my: 1.5,
              bgcolor: "#F8FAFC",
              fontStyle: "italic",
              color: "#475569",
            },
            "& hr": {
              border: "none",
              borderTop: "1px solid #CBD5E1",
              my: 2,
            },
            // Estilos avanzados de Tablas (Word / Excel) adaptados a hoja A4
            "& table": {
              borderCollapse: "collapse",
              width: "100% !important",
              maxWidth: "100% !important",
              tableLayout: "auto",
              margin: "16px 0",
              overflow: "hidden",
              border: "1px solid #CBD5E1",
              fontSize: "0.88rem",
              wordBreak: "break-word",
            },
            "& table td, & table th": {
              minWidth: "2em",
              border: "1px solid #CBD5E1",
              padding: "7px 10px",
              verticalAlign: "top",
              boxSizing: "border-box",
              position: "relative",
              wordBreak: "break-word",
              whiteSpace: "normal !important",
            },
            "& table.table-dense-a4 td, & table.table-dense-a4 th": {
              padding: "4px 6px",
              fontSize: "0.75rem",
            },
            "& table th": {
              fontWeight: 700,
              textAlign: "left",
              backgroundColor: "#F1F5F9",
              color: "#0F172A",
            },
            "& img": {
              maxWidth: "100%",
              height: "auto",
              display: "block",
              margin: "12px auto",
              borderRadius: "4px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.06)",
            },
            "& table .selectedCell:after": {
              zIndex: 2,
              position: "absolute",
              content: '""',
              left: 0,
              right: 0,
              top: 0,
              bottom: 0,
              background: "rgba(99, 102, 241, 0.15)",
              pointerEvents: "none",
            },
            "& table .column-resize-handle": {
              position: "absolute",
              right: -2,
              top: 0,
              bottom: -2,
              width: 4,
              backgroundColor: "#6366F1",
              pointerEvents: "none",
            },
          },
        }}
      >
        <EditorContent editor={editor} />
      </Box>
    </Box>
  );
}
