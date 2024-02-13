<script lang="ts">
  import { GeocodingApi, type PeliasGeoJSONFeature } from "@stadiamaps/api";
  import type { XmlFragment } from "yjs";
  import { ySyncPlugin, yUndoPlugin, undo, redo } from "y-prosemirror";
  import { schema as basic } from "prosemirror-schema-basic";
  import { EditorState, type EditorStateConfig } from "prosemirror-state";
  import { type NodeSpec, Schema } from "prosemirror-model";
  import { baseKeymap, toggleMark } from "prosemirror-commands";
  import { EditorView } from "prosemirror-view";
  import { history } from "prosemirror-history";
  import { keymap } from "prosemirror-keymap";
  import { addListNodes, liftListItem, sinkListItem, splitListItem } from "prosemirror-schema-list";
  import {
    inputRules,
    wrappingInputRule,
    smartQuotes,
    emDash,
    ellipsis,
    undoInputRule
  } from "prosemirror-inputrules";
  import "prosemirror-view/style/prosemirror.css";

  import autocomplete from "~/lib/autocomplete.svelte";
  import focus from "~/lib/focus";
  import linkify from "~/lib/linkify";
  import LocationResults from "~/component/LocationResults.svelte";
  import { center } from "~/store/map.svelte";

  interface Props {
    document: XmlFragment;
    focused: boolean;
  }

  let { focused, document } = $props<Props>();

  let el = $state<HTMLElement>();

  const api = new GeocodingApi();

  const place: NodeSpec = {
    group: "inline",
    inline: true,
    atom: true,
    selectable: false,
    draggable: false,
    attrs: { name: {}, lon: {}, lat: {} },
    toDOM: node => ["place-tag", node.attrs, "@" + node.attrs.name],
    parseDOM: [
      {
        tag: "place-tag",
        getAttrs(dom: string | HTMLElement) {
          if (typeof dom === "string") return false;

          const data: { [key: string]: string } = {};
          for (const attribute of dom.attributes) {
            data[attribute.name] = attribute.value;
          }

          return { ...data, name: dom.innerText.replace(/^@/, "") };
        }
      }
    ]
  };

  const route: NodeSpec = {
    content: "list_item+",
    group: "block",
    parseDOM: [
      {
        tag: "ol",
        getAttrs(dom) {
          if (typeof dom === "string") return false;
          if (!("route" in dom.dataset)) return false;

          return {};
        }
      }
    ],
    toDOM(_node) {
      return ["ol", { "data-route": "" }, 0];
    }
  };

  const nodes = addListNodes(
    basic.spec.nodes.append({ place, route }),
    "paragraph block*",
    "block"
  );

  const schema = new Schema({ nodes, marks: basic.spec.marks });
  const places = autocomplete<PeliasGeoJSONFeature>({
    inputId: "autocomplete-input",
    menuId: "autocomplete-results",
    onInput: text =>
      text.length >= 3 ? api.autocomplete({ text }).then(res => res.features) : Promise.resolve([]),
    onAccept: feature => {
      return schema.nodes.place.create({
        name: feature.properties?.name,
        lon: "" + feature.geometry.coordinates[0],
        lat: "" + feature.geometry.coordinates[1]
      });
    }
  });

  let config: EditorStateConfig = $derived({
    schema,
    plugins: [
      ySyncPlugin(document),
      yUndoPlugin(),
      ...places.plugin,
      linkify(),
      focus(),
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
          wrappingInputRule(
            /^(\d+)\.\s$/,
            schema.nodes.ordered_list,
            match => ({ order: +match[1] }),
            (match, node) => node.childCount + node.attrs.order == +match[1]
          ),
          wrappingInputRule(/^\s*([-+*])\s$/, schema.nodes.bullet_list),
          wrappingInputRule(/^\s*(~)\s$/, schema.nodes.route)
        ]
      })
    ]
  });

  let prose = $derived(EditorState.create(config));
  let view = $state<EditorView>()!!!;

  $effect(() => {
    if (!el) return;
    view = new EditorView(el, {
      state: prose
      // dispatchTransaction(tr) {
      //   view.updateState(view.state.apply(tr));
      //   _document = view.state.toJSON().doc;

      //   const selected = view.state.selection.$head.node(1);
      //   if (selected) _focus = selected.toJSON();
      // }
    });

    return () => view.destroy();
  });
</script>

<div class="outline" class:focused bind:this={el}></div>

{#if places.state.open}
  <div
    class="results"
    style:left={places.state.position.x + "px"}
    style:top={places.state.position.y + "px"}
  >
    <LocationResults
      id="autocomplete-results"
      labelledBy="autocomplete-input"
      query={places.state.query}
      results={places.state.results}
      highlighted={places.state.highlighted}
      onselect={places.select}
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

  .outline :global(place-tag) {
    color: #5c7cfa;
    font-weight: bold;
  }

  .results {
    position: fixed;
    z-index: 99999999;
  }
</style>
