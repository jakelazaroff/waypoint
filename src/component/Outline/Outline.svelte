<script lang="ts">
  import { schema as basic } from "prosemirror-schema-basic";
  import { EditorState, type EditorStateConfig } from "prosemirror-state";
  import { Node, Schema } from "prosemirror-model";
  import { baseKeymap, toggleMark } from "prosemirror-commands";
  import { EditorView } from "prosemirror-view";
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

  import autocomplete from "~/lib/autocomplete";
  import focus from "~/lib/focus";
  import linkify from "~/lib/linkify";
  import "./LocationResults.svelte";
  import LocationResults from "./LocationResults.svelte";
  import { center } from "~/store/map.svelte";

  interface Props {
    document: unknown;
    focus: unknown;
    focused: boolean;
  }

  let { focused, document: _document, focus: _focus } = $props<Props>();
  export function load(doc: any) {
    try {
      prose = EditorState.create({ ...config, doc: Node.fromJSON(schema, doc) });
      view.updateState(prose);
      _document = view.state.toJSON().doc;
    } catch (e) {
      console.error(`Error loading document`, e);
    }
  }

  let el = $state<HTMLElement>();
  let query = $state("");

  let position = $state({ x: 0, y: 0 });

  const autocompleteTag = "pmac-tag";
  const {
    select,
    addNodes: addAutoCompleteNodes,
    plugin: autocompletePlugin
  } = autocomplete({
    onInput(text, node) {
      query = text;

      if (!node) return;
      const bounds = node.getBoundingClientRect();
      position = { x: bounds.left, y: node.offsetHeight + bounds.top };
    },
    toDOM: (node: Node) => [
      autocompleteTag,
      {
        name: node.attrs.name,
        longitude: node.attrs.data.position[0],
        latitude: node.attrs.data.position[1]
      },
      "@" + node.attrs.text
    ],
    parseDOM: {
      tag: autocompleteTag,
      getAttrs(dom) {
        if (typeof dom === "string") return {};

        const lng = Number(dom.getAttribute("longitude")),
          lat = Number(dom.getAttribute("latitude"));
        const name = dom.innerText.replace(/^@/, "");
        const data = { name, position: [lng, lat] };

        return { text: name, data };
      }
    }
  });

  const schema = new Schema({
    nodes: addAutoCompleteNodes(addListNodes(basic.spec.nodes, "paragraph block*", "block")),
    marks: basic.spec.marks
  });

  const config: EditorStateConfig = {
    schema,
    plugins: [
      linkify(),
      focus(),
      autocompletePlugin,
      history(),
      keymap({
        "Mod-z": undo,
        "Mod-y": redo,
        "Mod-b": toggleMark(schema.marks.strong),
        "Mod-i": toggleMark(schema.marks.em),
        "Mod-d": () => (focused = !focused) || true,
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

        const selected = view.state.selection.$head.node(1);
        if (selected) _focus = selected.toJSON();
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
      center={$center}
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

  .outline :global(pmac-tag) {
    color: #5c7cfa;
    font-weight: bold;
  }

  .results {
    position: fixed;
    z-index: 99999999;
  }
</style>
