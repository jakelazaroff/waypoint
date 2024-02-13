import type { Fragment, Node } from "prosemirror-model";
import type { EditorView } from "prosemirror-view";
import { autocomplete, ActionKind, KEEP_OPEN } from "prosemirror-autocomplete";

interface Options<T> {
  inputId: string;
  menuId: string;
  onInput(text: string): Promise<T[]>;
  onAccept(result: T): Fragment | Node;
}

interface State<T> {
  view?: EditorView;
  open: boolean;
  query: string;
  results: T[];
  highlighted: number;
  range?: { from: number; to: number };
  position: { x: number; y: number };
}

export default function <T>(options: Options<T>) {
  const internal = $state<State<T>>({
    open: false,
    query: "",
    results: [],
    highlighted: -1,
    position: { x: 0, y: 0 }
  });

  function select(index: number) {
    if (!internal.range || !internal.view) return;

    const result = options.onAccept(internal.results[index]);
    const { from, to } = internal.range;
    const tr = internal.view.state.tr.deleteRange(from, to).insert(from, result);
    internal.view.dispatch(tr);

    internal.open = false;
    internal.query = "";
    internal.results = [];
    internal.highlighted = -1;
  }

  function moveHighlight(delta: number, results: T[] = internal.results) {
    if (results.length === 0) {
      internal.highlighted = -1;
      return;
    }

    // update the highlighted index
    internal.highlighted += delta;

    // ensure the highlighted index is within the results list
    if (internal.highlighted < 0) internal.highlighted = results.length - 1;
    else if (internal.highlighted >= results.length) internal.highlighted = 0;
  }

  const plugin = autocomplete({
    reducer(action) {
      internal.view = action.view;

      switch (action.kind) {
        case ActionKind.open:
        case ActionKind.filter: {
          const el = action.view.domAtPos(action.range.from, 1).node.parentElement;

          if (!el) {
            internal.open = false;
            internal.query = "";
            return false;
          }

          const { left, top, height } = el.getBoundingClientRect();
          internal.open = true;
          internal.range = action.range;
          internal.position = { x: left, y: top + height };
          internal.query = action.filter || "";
          options.onInput(internal.query).then(async results => {
            internal.results = results;
            moveHighlight(Infinity, results);
          });
          return KEEP_OPEN;
        }

        case ActionKind.left:
        case ActionKind.up: {
          action.event?.preventDefault();
          moveHighlight(-1);

          return KEEP_OPEN;
        }

        case ActionKind.down:
        case ActionKind.right: {
          action.event?.preventDefault();
          moveHighlight(1);

          return KEEP_OPEN;
        }

        case ActionKind.enter: {
          const result = options.onAccept(internal.results[internal.highlighted]);
          const { from, to } = action.range;
          const tr = action.view.state.tr.deleteRange(from, to).insert(from, result);
          action.view.dispatch(tr);
          // fallthrough
        }

        case ActionKind.close: {
          internal.open = false;
          internal.query = "";
          internal.results = [];
          internal.highlighted = -1;
          return false;
        }

        default:
          return false;
      }
    },
    triggers: [
      {
        name: "place",
        trigger: "@",
        decorationAttrs: { "id": options.inputId, "aria-owns": options.menuId }
      }
    ]
  });

  return { plugin, state: internal, select };
}
