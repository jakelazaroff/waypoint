import { EditorState, Plugin } from "prosemirror-state";
import type { MarkType } from "prosemirror-model";
import type { EditorView } from "prosemirror-view";
import { toggleMark } from "prosemirror-commands";

let bold = $state(false);
let italic = $state(false);
let view: EditorView | undefined;

export function embolden() {
  if (view) toggleMark(view.state.schema.marks.strong)(view.state, view.dispatch);
}

export function italicize() {
  if (view) toggleMark(view.state.schema.marks.em)(view.state, view.dispatch);
}

export default {
  get bold() {
    return bold;
  },
  set bold(value: boolean) {
    bold = value;
  },

  get italic() {
    return italic;
  },
  set italic(value: boolean) {
    italic = value;
  }
};

export const plugin = new Plugin({
  view(editorView) {
    view = editorView;

    return {
      update({ state }) {
        bold = hasMark(state, state.schema.marks.strong);
        italic = hasMark(state, state.schema.marks.em);
      }
    };
  }
});

function hasMark(state: EditorState, type: MarkType) {
  const { doc, selection, storedMarks } = state;

  if (storedMarks?.some(mark => mark.type === type)) return true;
  return selection.ranges.every(({ $from, $to }) => doc.rangeHasMark($from.pos - 1, $to.pos, type));
}
