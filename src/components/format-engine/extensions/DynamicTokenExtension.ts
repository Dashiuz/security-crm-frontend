import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

export const DynamicTokenExtension = Extension.create({
  name: "dynamicToken",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("dynamicTokenDecoration"),
        props: {
          decorations(state) {
            const { doc } = state;
            const decorations: Decoration[] = [];
            const regex = /\{\{\s*([a-zA-Z0-9_\.]+)\s*\}\}/g;

            doc.descendants((node, pos) => {
              if (node.isText && node.text) {
                let match: RegExpExecArray | null;
                while ((match = regex.exec(node.text)) !== null) {
                  const start = pos + match.index;
                  const end = start + match[0].length;
                  decorations.push(
                    Decoration.inline(start, end, {
                      class: "noxia-dynamic-token",
                      style:
                        "color: #DC2626; font-weight: 700; background-color: #FEF2F2; padding: 1px 5px; border-radius: 4px; border: 1px solid #FECACA; font-family: monospace; font-size: 0.88em; letter-spacing: 0.02em;",
                    })
                  );
                }
              }
            });

            return DecorationSet.create(doc, decorations);
          },
        },
      }),
    ];
  },
});
