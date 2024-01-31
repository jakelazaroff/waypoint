import { Plugin } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";

export default function focus() {
  // annotate currently selected nodes and their ancestors with a "focused" class
  return new Plugin({
    props: {
      decorations(state) {
        const decorations: Decoration[] = [];
        state.doc.nodesBetween(state.selection.from, state.selection.to, (node, pos) => {
          if (!node.isBlock) return;

          const decoration = Decoration.node(pos, pos + node.nodeSize, { class: "focused" });
          decorations.push(decoration);
        });

        return DecorationSet.create(state.doc, decorations);
      }
    }
  });
}
