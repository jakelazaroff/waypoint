import type { Node, NodeSpec, ResolvedPos, Schema } from "prosemirror-model";
import { Plugin, PluginKey } from "prosemirror-state";
import { Decoration, DecorationSet, EditorView } from "prosemirror-view";

const regexp = (char: string) => new RegExp(`(^|\\s)${char}([\\w-\\+]+\\s?[\\w-\\+]*)$`);

export function getMatch($position: ResolvedPos) {
  const text = $position.doc.textBetween($position.before(), $position.pos, "\n", "\0");

  const match = text.match(regexp("@"));
  if (!match) return;
  let [fullmatch, _, query] = match;

  // adjust index to remove the matched extra space
  let index = match.index ?? 0;
  index = fullmatch.startsWith(" ") ? index + 1 : index;
  fullmatch = fullmatch.startsWith(" ") ? fullmatch.substring(1, fullmatch.length) : fullmatch;

  // the absolute position of the match in the document
  const from = $position.start() + index,
    to = from + fullmatch.length,
    range = { from, to };

  return { range, query };
}

interface State {
  active: boolean;
  range: { from: number; to: number };
  text: string;
}

function defaultState(): State {
  return {
    active: false,
    range: { from: 0, to: 0 },
    text: ""
  };
}

interface AutocompleteOptions {
  mentionTag?: string;
  onInput?(query: string, node?: HTMLElement): void;
}

export type InputEvent = CustomEvent<{ query: string }>;
export type SelectEvent = CustomEvent<{ text: string; data: unknown }>;

const key = new PluginKey<State>();

export function autocomplete(options: AutocompleteOptions) {
  const opts = {
    mentionTag: "pmac-mention",
    onInput: () => {},
    ...options
  };

  const plugin = new Plugin<State>({
    key,

    state: {
      init() {
        return defaultState();
      },

      apply(tr, _state) {
        const next = defaultState();
        const selection = tr.selection;
        if (selection.from !== selection.to) return next;

        const $position = selection.$from;
        const match = getMatch($position);

        // if match found update state
        if (match) {
          next.active = true;
          next.range = match.range;
          next.text = match.query;
        }

        return next;
      }
    },

    props: {
      handleKeyDown(view, evt) {
        switch (evt.key) {
          case "Escape":
            const state = (this.state = defaultState());
            opts.onInput(state?.text ?? "");
            return true;
        }
      },

      // decorate the currently active @mention text in ui
      decorations(editor) {
        const state = this.getState(editor);
        if (!state?.active) return null;

        return DecorationSet.create(editor.doc, [
          Decoration.inline(state.range.from, state.range.to, { nodeName: opts.mentionTag })
        ]);
      }
    },

    view() {
      return {
        update(view) {
          const state = key.getState(view.state);

          const parent = view.domAtPos(view.state.selection.$from.pos).node;
          let node: HTMLElement | undefined = undefined;
          if (parent instanceof HTMLElement)
            node = parent.querySelector<HTMLElement>(opts.mentionTag) ?? undefined;

          opts.onInput(state?.text ?? "", node);
        }
      };
    }
  });

  return plugin;
}

const mention: NodeSpec = {
  group: "inline",
  inline: true,
  atom: true,
  selectable: false,
  draggable: false,
  attrs: { text: {}, data: {} },
  toDOM: (node: Node) => ["pmac-mention", node.attrs.data, "@" + node.attrs.text]
};

export function addMentionNodes(nodes: Schema["spec"]["nodes"]) {
  return nodes.append({ mention });
}

export function select(view: EditorView, attrs: { text: string; data: unknown }) {
  const state = key.getState(view.state);
  if (!state) return console.warn("No state found for autocomplete plugin");

  const node = view.state.schema.nodes["mention"].create(attrs);
  const tr = view.state.tr.replaceWith(state.range.from, state.range.to, node);

  view.dispatch(tr);
}
