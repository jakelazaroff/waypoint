import { EditorState, Plugin } from "prosemirror-state";
import type { MarkType } from "prosemirror-model";
import type { EditorView } from "prosemirror-view";
import { toggleMark, wrapIn } from "prosemirror-commands";

let bold = $state(false);
let italic = $state(false);
let view: EditorView | undefined;

export function embolden() {
  if (!view) return;
  toggleMark(view.state.schema.marks.strong)(view.state, view.dispatch);
}

export function italicize() {
  if (!view) return;
  toggleMark(view.state.schema.marks.em)(view.state, view.dispatch);
}

export function wrapInBullet() {
  if (!view) return;
  wrapIn(view.state.schema.nodes.bullet_list)(view.state, view.dispatch);
}

export function wrapInNumber() {
  if (!view) return;
  wrapIn(view.state.schema.nodes.ordered_list)(view.state, view.dispatch);
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

  // if the user *just* toggled the given mark, the next character entered will have it
  if (storedMarks?.some(mark => mark.type === type)) return true;

  // otherwise, check whether the selection ranges have the mark applied
  return selection.ranges.every(({ $from, $to }) => {
    // if the selection range is not just the cursor between characters, return whether the range has the mark
    if ($from.pos !== $to.pos) return doc.rangeHasMark($from.pos, $to.pos, type);

    let start = $from.pos,
      end = $to.pos;

    // if cursor is at the beginning of a node, include the next character
    if ($from.parentOffset === 0) end += 1;
    // otherwise, include the previous character
    else start -= 1;

    return doc.rangeHasMark(start, end, type);
  });
}
