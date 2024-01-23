<script lang="ts">
  import { schema as basic } from "prosemirror-schema-basic";
  import { EditorState, Plugin, type EditorStateConfig } from "prosemirror-state";
  import { Node, Schema } from "prosemirror-model";
  import { baseKeymap, toggleMark } from "prosemirror-commands";
  import { Decoration, DecorationSet, EditorView } from "prosemirror-view";
  import { undo, redo, history } from "prosemirror-history";
  import { keymap } from "prosemirror-keymap";
  import { addListNodes, liftListItem, sinkListItem, splitListItem } from "prosemirror-schema-list";
  import {
    inputRules,
    wrappingInputRule,
    smartQuotes,
    emDash,
    ellipsis,
    undoInputRule,
    textblockTypeInputRule
  } from "prosemirror-inputrules";
  import "prosemirror-view/style/prosemirror.css";

  import { autocomplete, select, addMentionNodes } from "~/lib/autocomplete";
  import "./LocationResults.svelte";
  import LocationResults from "./LocationResults.svelte";
  import type { Coordinate } from "~/lib/place";

  interface Props {
    center: Coordinate;
    document: unknown;
    focus: unknown;
    focused: boolean;
  }

  let { center, focused, document: _document, focus: _focus } = $props<Props>();
  export function load(doc: any) {
    if (!doc.type) return;
    prose = EditorState.create({ ...config, doc: Node.fromJSON(schema, doc) });
    view.updateState(prose);
    _document = view.state.toJSON().doc;
  }

  let el = $state<HTMLElement>();
  let query = $state("");

  let position = $state({ x: 0, y: 0 });

  const schema = new Schema({
    nodes: addMentionNodes(addListNodes(basic.spec.nodes, "paragraph block*", "block")),
    marks: basic.spec.marks
  });

  const config: EditorStateConfig = {
    schema,
    plugins: [
      new Plugin({
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
      }),
      autocomplete({
        onInput(text, node) {
          query = text;

          if (!node) return;
          const bounds = node.getBoundingClientRect();
          position = { x: bounds.left, y: node.offsetHeight + bounds.top };
        }
      }),
      history(),
      keymap({
        "Mod-z": undo,
        "Mod-y": redo,
        "Mod-b": toggleMark(schema.marks.strong),
        "Mod-i": toggleMark(schema.marks.em),
        "Mod-d": () => {
          focused = !focused;
          return true;
        },
        "Backspace": undoInputRule,
        "Enter": splitListItem(schema.nodes.list_item),
        "Mod-]": sinkListItem(schema.nodes.list_item),
        "Tab": sinkListItem(schema.nodes.list_item),
        "Mod-[": liftListItem(schema.nodes.list_item),
        "Shift+Tab": liftListItem(schema.nodes.list_item)
      }),
      keymap(baseKeymap),
      inputRules({
        rules: [
          ...smartQuotes,
          emDash,
          ellipsis,
          textblockTypeInputRule(/\@/, schema.nodes.place),
          wrappingInputRule(
            /^(\d+)\.\s$/,
            schema.nodes.ordered_list,
            match => ({ order: +match[1] }),
            (match, node) => node.childCount + node.attrs.order == +match[1]
          ),
          wrappingInputRule(/^\s*([-+*])\s$/, schema.nodes.bullet_list)
        ]
      })
    ]
  };

  let prose = $state(EditorState.create(config));
  let view = $state<EditorView>()!!!;

  $effect(() => {
    if (!el) return;

    view = new EditorView(el, {
      state: prose,
      dispatchTransaction(tr) {
        view.updateState(view.state.apply(tr));
        _document = view.state.toJSON().doc;
        _focus = view.state.selection.$head.node(1).toJSON();
      }
    });
    return () => view.destroy();
  });
</script>

<div class="outline" class:focused bind:this={el}></div>
{#if query}
  <div class="results" style:left={position.x + "px"} style:top={position.y + "px"}>
    <LocationResults
      {query}
      {center}
      onselect={place => select(view, { text: place.name, data: place })}
    />
  </div>
{/if}

<style>
  .outline {
    all: unset;
    height: 100%;
    display: grid;
    overflow: hidden;
  }

  .outline :global(.ProseMirror) {
    padding: 1rem;
    overflow: auto;
  }

  .outline :global(.ProseMirror):focus-visible {
    outline: 0;
  }

  .outline.focused :global(.ProseMirror > :not(.focused)) {
    opacity: 0.25;
  }

  .outline :global(:where(ol, ul)) {
    list-style: revert;
    margin-inline-start: 1.5em;
  }

  .outline :global(pmac-mention) {
    color: blue;
    font-weight: bold;
  }

  .results {
    position: fixed;
    z-index: 99999999;
  }
</style>
