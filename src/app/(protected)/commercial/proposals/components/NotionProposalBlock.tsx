"use client";

import React, { useEffect, useState, memo } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import { ResponsiveImageExtension } from "@/components/format-engine/extensions/ResponsiveImageExtension";
import { DynamicTokenExtension } from "@/components/format-engine/extensions/DynamicTokenExtension";
import {
  Box,
  IconButton,
  Tooltip,
  Divider,
  Fade,
} from "@mui/material";
import {
  DragIndicator,
  ArrowUpward,
  ArrowDownward,
  DeleteOutline,
  FormatBold,
  FormatItalic,
  FormatListBulleted,
  FormatListNumbered,
  FormatAlignLeft,
  FormatAlignCenter,
  FormatAlignJustify,
  HorizontalRule,
} from "@mui/icons-material";

export interface NotionProposalBlockProps {
  id: string;
  type: "paragraph" | "clause";
  title?: string;
  content: string;
  index: number;
  onUpdate: (id: string, updates: { title?: string; content?: string }) => void;
  onRemove: (id: string) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  isActive: boolean;
  onFocus: () => void;
  onRegisterEditor?: (id: string, editorInstance: any) => void;
  onDragStartBlock?: (e: React.DragEvent, index: number) => void;
  onDragOverBlock?: (e: React.DragEvent, index: number) => void;
  onDropBlock?: (e: React.DragEvent, targetIndex: number) => void;
  isDragOver?: boolean;
}

function NotionProposalBlockComponent({
  id,
  type,
  title = "",
  content,
  index,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  isActive,
  onFocus,
  onRegisterEditor,
  onDragStartBlock,
  onDragOverBlock,
  onDropBlock,
  isDragOver = false,
}: NotionProposalBlockProps) {
  const [isHovered, setIsHovered] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
      }),
      Placeholder.configure({
        placeholder:
          type === "clause"
            ? "Redacte los términos, compromisos o condiciones específicas de esta cláusula..."
            : "Escriba aquí el texto explicativo, alcance o notas de la propuesta comercial...",
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      ResponsiveImageExtension,
      DynamicTokenExtension,
    ],
    content: content || "",
    onUpdate: ({ editor }) => {
      onUpdate(id, { content: editor.getHTML() });
    },
    onFocus: () => {
      onFocus();
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    if (editor && onRegisterEditor) {
      onRegisterEditor(id, editor);
    }
  }, [editor, id, onRegisterEditor]);

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content || "");
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  return (
    <Box
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onFocus}
      onDragOver={(e) => onDragOverBlock?.(e, index)}
      onDrop={(e) => onDropBlock?.(e, index)}
      sx={{
        position: "relative",
        mb: 2,
        mt: isActive ? 1.5 : 0,
        borderRadius: "4px",
        transition: "all 0.15s ease-in-out",
        bgcolor: isActive ? "rgba(248, 250, 252, 0.4)" : "transparent",
        borderTop: isDragOver ? "2px solid #6366F1" : "2px solid transparent",
        "&:hover": {
          bgcolor: "rgba(248, 250, 252, 0.6)",
        },
      }}
    >
      {/* Canal Izquierdo: Tirador Drag & Drop y Acciones (Vertical, NUNCA solapa el texto) */}
      <Box
        sx={{
          position: "absolute",
          left: -32,
          top: 2,
          width: 24,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "2px",
          opacity: isHovered || isActive ? 1 : 0,
          transition: "opacity 0.15s cubic-bezier(0.2, 0, 0, 1)",
          zIndex: 10,
        }}
      >
        <Tooltip title="Arrastrar para mover" placement="left">
          <IconButton
            size="small"
            draggable
            onDragStart={(e) => onDragStartBlock?.(e, index)}
            sx={{
              p: 0.25,
              color: "#94A3B8",
              cursor: "grab",
              borderRadius: "4px",
              "&:hover": { color: "#4F46E5", bgcolor: "rgba(99, 102, 241, 0.08)" },
              "&:active": { cursor: "grabbing" },
            }}
          >
            <DragIndicator sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>

        <Tooltip title="Mover arriba" placement="left">
          <span>
            <IconButton
              size="small"
              disabled={!canMoveUp}
              onClick={(e) => {
                e.stopPropagation();
                onMoveUp?.();
              }}
              sx={{ p: 0.2, color: "#64748B", borderRadius: "4px", "&:hover": { color: "#0F172A", bgcolor: "rgba(0,0,0,0.04)" } }}
            >
              <ArrowUpward sx={{ fontSize: 13 }} />
            </IconButton>
          </span>
        </Tooltip>

        <Tooltip title="Mover abajo" placement="left">
          <span>
            <IconButton
              size="small"
              disabled={!canMoveDown}
              onClick={(e) => {
                e.stopPropagation();
                onMoveDown?.();
              }}
              sx={{ p: 0.2, color: "#64748B", borderRadius: "4px", "&:hover": { color: "#0F172A", bgcolor: "rgba(0,0,0,0.04)" } }}
            >
              <ArrowDownward sx={{ fontSize: 13 }} />
            </IconButton>
          </span>
        </Tooltip>

        <Tooltip title="Eliminar bloque" placement="left">
          <IconButton
            size="small"
            color="error"
            onClick={(e) => {
              e.stopPropagation();
              onRemove(id);
            }}
            sx={{ p: 0.2, color: "#EF4444", borderRadius: "4px", opacity: 0.7, "&:hover": { opacity: 1, bgcolor: "rgba(239, 68, 68, 0.08)" } }}
          >
            <DeleteOutline sx={{ fontSize: 14 }} />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Barra Flotante Superior Externa: Cero Colisión con Título o Gutter */}
      {isActive && (
        <Fade in={isActive}>
          <Box
            sx={{
              position: "absolute",
              top: -36,
              left: 0,
              zIndex: 30,
              display: "flex",
              alignItems: "center",
              gap: 0.25,
              p: "2px 6px",
              bgcolor: "#FFFFFF",
              borderRadius: "8px",
              boxShadow: "0 6px 18px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.04)",
              border: "1px solid #E2E8F0",
              width: "fit-content",
            }}
          >
            <Tooltip title="Negrita">
              <IconButton
                size="small"
                color={editor.isActive("bold") ? "primary" : "default"}
                onClick={() => editor.chain().focus().toggleBold().run()}
                sx={{ p: 0.5 }}
              >
                <FormatBold sx={{ fontSize: 15 }} />
              </IconButton>
            </Tooltip>

            <Tooltip title="Cursiva">
              <IconButton
                size="small"
                color={editor.isActive("italic") ? "primary" : "default"}
                onClick={() => editor.chain().focus().toggleItalic().run()}
                sx={{ p: 0.5 }}
              >
                <FormatItalic sx={{ fontSize: 15 }} />
              </IconButton>
            </Tooltip>

            <Tooltip title="Subtítulo H2">
              <IconButton
                size="small"
                color={editor.isActive("heading", { level: 2 }) ? "primary" : "default"}
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                sx={{ p: 0.5, fontWeight: 700, fontSize: "0.72rem" }}
              >
                H2
              </IconButton>
            </Tooltip>

            <Tooltip title="Subtítulo H3">
              <IconButton
                size="small"
                color={editor.isActive("heading", { level: 3 }) ? "primary" : "default"}
                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                sx={{ p: 0.5, fontWeight: 700, fontSize: "0.72rem" }}
              >
                H3
              </IconButton>
            </Tooltip>

            <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 0.5 }} />

            <Tooltip title="Viñetas">
              <IconButton
                size="small"
                color={editor.isActive("bulletList") ? "primary" : "default"}
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                sx={{ p: 0.5 }}
              >
                <FormatListBulleted sx={{ fontSize: 15 }} />
              </IconButton>
            </Tooltip>

            <Tooltip title="Lista Numerada">
              <IconButton
                size="small"
                color={editor.isActive("orderedList") ? "primary" : "default"}
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                sx={{ p: 0.5 }}
              >
                <FormatListNumbered sx={{ fontSize: 15 }} />
              </IconButton>
            </Tooltip>

            <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 0.5 }} />

            <Tooltip title="Alinear a la Izquierda">
              <IconButton
                size="small"
                color={editor.isActive({ textAlign: "left" }) ? "primary" : "default"}
                onClick={() => editor.chain().focus().setTextAlign("left").run()}
                sx={{ p: 0.5 }}
              >
                <FormatAlignLeft sx={{ fontSize: 15 }} />
              </IconButton>
            </Tooltip>

            <Tooltip title="Centrar">
              <IconButton
                size="small"
                color={editor.isActive({ textAlign: "center" }) ? "primary" : "default"}
                onClick={() => editor.chain().focus().setTextAlign("center").run()}
                sx={{ p: 0.5 }}
              >
                <FormatAlignCenter sx={{ fontSize: 15 }} />
              </IconButton>
            </Tooltip>

            <Tooltip title="Justificar">
              <IconButton
                size="small"
                color={editor.isActive({ textAlign: "justify" }) ? "primary" : "default"}
                onClick={() => editor.chain().focus().setTextAlign("justify").run()}
                sx={{ p: 0.5 }}
              >
                <FormatAlignJustify sx={{ fontSize: 15 }} />
              </IconButton>
            </Tooltip>

            <Tooltip title="Línea divisoria">
              <IconButton
                size="small"
                onClick={() => editor.chain().focus().setHorizontalRule().run()}
                sx={{ p: 0.5 }}
              >
                <HorizontalRule sx={{ fontSize: 15 }} />
              </IconButton>
            </Tooltip>
          </Box>
        </Fade>
      )}

      {/* Título de Cláusula si el tipo es 'clause' (Editable en línea sin formulario) */}
      {type === "clause" && (
        <Box sx={{ mb: 0.75 }}>
          <input
            type="text"
            value={title}
            onChange={(e) => onUpdate(id, { title: e.target.value })}
            placeholder="CLÁUSULA: Título de la cláusula..."
            style={{
              width: "100%",
              border: "none",
              outline: "none",
              background: "transparent",
              fontSize: "1rem",
              fontWeight: 800,
              color: "#0F172A",
              fontFamily: "'Inter', sans-serif",
              letterSpacing: "-0.01em",
              padding: "4px 0",
              borderBottom: "1.5px solid #E2E8F0",
            }}
          />
        </Box>
      )}

      {/* Área del Editor de Contenido TipTap */}
      <Box
        sx={{
          "& .ProseMirror": {
            outline: "none !important",
            border: "none !important",
            fontFamily: "'Inter', sans-serif",
            fontSize: "0.88rem",
            lineHeight: 1.6,
            color: "#334155",
            minHeight: "36px",
            "& p": {
              margin: "0 0 8px 0",
            },
            "& h2": {
              fontSize: "1.15rem",
              fontWeight: 700,
              color: "#0F172A",
              margin: "14px 0 6px 0",
            },
            "& h3": {
              fontSize: "1rem",
              fontWeight: 700,
              color: "#1E293B",
              margin: "12px 0 4px 0",
            },
            "& ul, & ol": {
              paddingLeft: "20px",
              margin: "0 0 8px 0",
            },
            "& li": {
              marginBottom: "3px",
            },
            "& blockquote": {
              borderLeft: "3px solid #6366F1",
              paddingLeft: "10px",
              marginLeft: 0,
              color: "#475569",
              fontStyle: "italic",
            },
            "& .tiptap-dynamic-token": {
              display: "inline-flex",
              alignItems: "center",
              bgcolor: "rgba(99, 102, 241, 0.08)",
              color: "#4338CA",
              border: "1px solid rgba(99, 102, 241, 0.2)",
              borderRadius: "4px",
              padding: "1px 5px",
              fontSize: "0.78rem",
              fontWeight: 600,
              fontFamily: "monospace",
              userSelect: "all",
            },
            "& .is-empty::before": {
              color: "#94A3B8",
              content: "attr(data-placeholder)",
              float: "left",
              height: 0,
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

export default memo(NotionProposalBlockComponent);
