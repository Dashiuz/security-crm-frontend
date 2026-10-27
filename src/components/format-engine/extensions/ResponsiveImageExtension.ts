import { Node, mergeAttributes } from "@tiptap/core";

export const ResponsiveImageExtension = Node.create({
  name: "image",
  group: "block",
  selectable: true,
  draggable: true,
  atom: true,

  addAttributes() {
    return {
      src: { default: null },
      alt: { default: "Imagen / Anexo" },
      title: { default: null },
      style: {
        default:
          "max-width: 100%; height: auto; display: block; margin: 12px auto; border-radius: 4px; border: 1px solid #E2E8F0;",
      },
    };
  },

  parseHTML() {
    return [{ tag: "img[src]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["img", mergeAttributes(HTMLAttributes)];
  },
});
