<script lang="ts">
  import { GeocodingApi, type PeliasGeoJSONFeature } from "@stadiamaps/api";
  import { type XmlFragment } from "yjs";
  import { ySyncPlugin, yUndoPlugin, undo, redo, yCursorPlugin } from "y-prosemirror";
  import { schema as basic } from "prosemirror-schema-basic";
  import { EditorState } from "prosemirror-state";
  import { type NodeSpec, Schema, Node } from "prosemirror-model";
  import { baseKeymap, toggleMark } from "prosemirror-commands";
  import { EditorView, type NodeViewConstructor } from "prosemirror-view";
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
  import type Collab from "~/lib/collab.svelte";
  import { plugin as editor } from "~/lib/editor.svelte";
  import { type SvelteComponent, type ComponentType, mount, untrack } from "svelte";
  import PlaceTag from "~/component/PlaceTag.svelte";

  interface Props {
    document: XmlFragment;
    collab: Collab;
    focused: boolean;
  }

  let { collab, focused, document } = $props<Props>();

  let el = $state<HTMLElement>();

  const api = new GeocodingApi();

  const place: NodeSpec = {
    group: "inline",
    inline: true,
    atom: true,
    selectable: false,
    draggable: false,
    attrs: { name: {}, lon: {}, lat: {}, navigate: {} },
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

  // const popover = new Plugin({
  //   view: () => ({
  //     update(view, lastState) {
  //       let state = view.state;
  //       // Don't do anything if the document/selection didn't change
  //       if (lastState && lastState.doc.eq(state.doc) && lastState.selection.eq(state.selection))
  //         return;

  //       // Hide the tooltip if the selection is empty
  //       if (state.selection.empty) {
  //         this.tooltip.style.display = "none";
  //         return;
  //       }

  //       // Otherwise, reposition it and update its content
  //       this.tooltip.style.display = "";
  //       let { from, to } = state.selection;
  //       // These are in screen coordinates
  //       let start = view.coordsAtPos(from),
  //         end = view.coordsAtPos(to);
  //       // The box in which the tooltip is positioned, to use as base
  //       let box = this.tooltip.offsetParent.getBoundingClientRect();
  //       // Find a center-ish x position from the selection endpoints (when
  //       // crossing lines, end may be more to the left)
  //       let left = Math.max((start.left + end.left) / 2, start.left + 3);
  //       this.tooltip.style.left = left - box.left + "px";
  //       this.tooltip.style.bottom = box.bottom - start.top + "px";
  //       this.tooltip.textContent = to - from;
  //     }
  //   })
  // });

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

  class SvelteNodeView {
    node: Node;
    view: EditorView;
    getPos: () => number | undefined;
    dom: Element;

    constructor(
      comp: ComponentType<
        SvelteComponent<Record<string, any> & { onchange(name: string, value: any): void }>
      >,
      tag: string,
      node: Node,
      view: EditorView,
      getPos: () => number | undefined
    ) {
      this.node = node;
      this.view = view;
      this.getPos = getPos;

      const target = (this.dom = window.document.createElement(tag));
      target.style.display = "contents";

      mount(comp, {
        target,
        props: {
          ...node.attrs,
          onchange(name, value) {
            const pos = getPos();
            if (pos === undefined) return;

            const tr = view.state.tr.setNodeAttribute(pos, name, value);
            view.dispatch(tr);
          }
        }
      });
    }

    static create(comp: ComponentType, tag: string = "div"): NodeViewConstructor {
      return (node, view, dom) => new SvelteNodeView(comp, tag, node, view, dom);
    }
  }

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
        lat: "" + feature.geometry.coordinates[1],
        navigate: true
      });
    }
  });

  let view = $state<EditorView>()!!!;

  $effect(() => {
    if (!el) return;

    view = new EditorView(el, {
      nodeViews: { place: SvelteNodeView.create(PlaceTag, "place-tag") },
      state: EditorState.create({
        schema,
        plugins: [
          ySyncPlugin(document),
          yCursorPlugin(collab.awareness),
          yUndoPlugin(),
          editor,
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
      })
    });

    untrack(() => view).dom.addEventListener("scroll", e => {
      if (e.currentTarget instanceof HTMLElement) scrolled = e.currentTarget.scrollTop > 0;
    });

    return () => view.destroy();
  });

  let scrolled = $state(false);
</script>

<div class="outline" class:focused class:scrolled bind:this={el}></div>

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
    position: relative;
    height: 100%;
    display: grid;
    overflow: hidden;
  }

  .outline::after {
    content: "";
    display: block;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    opacity: 0;
    transition: opacity 0.25s ease;
    background-image: linear-gradient(to right, #00000022 50%, transparent);
  }

  .outline.scrolled::after {
    opacity: 1;
  }

  .outline :global(:has([aria-expanded="true"])) {
    position: relative;
    z-index: 1;
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

  .outline :global(p) {
    margin: 0;
  }

  .outline :global(:where(ol, ul)) {
    list-style: revert;
    margin-inline-start: 1.5em;
  }

  .outline :global(ol[data-route]) {
    list-style: none;
  }

  .outline :global(ol[data-route]) > :global(li) {
    position: relative;
  }

  .outline :global(ol[data-route]) > :global(li)::before {
    content: "";
    display: inline-block;
    position: absolute;
    top: 0.25em;
    width: 1em;
    height: 1em;
    margin-left: -1.25em;
    margin-right: 0.25em;

    background: center url("/bullet.svg") no-repeat;
    background-size: 0.625em;
  }

  .results {
    position: fixed;
    z-index: 99999999;
  }

  :global(.ProseMirror-yjs-cursor) {
    position: relative;
    margin-left: -1px;
    margin-right: -1px;
    border-left: 1px solid;
    border-right: 1px solid;
    word-break: normal;
    border-radius: 1px;
  }

  :global(.ProseMirror-yjs-cursor)::after {
    content: "";
    display: block;
    position: absolute;
    width: 4px;
    left: -2px;
    top: 0;
    height: 100%;
  }

  :global(.ProseMirror-yjs-cursor) > :global(div) {
    position: absolute;
    top: -1.05em;
    left: -1px;
    font-size: 0.75rem;
    background-color: black;
    border-radius: 2px;
    font-style: normal;
    font-weight: bold;
    line-height: normal;
    user-select: none;
    color: white;
    padding: 1px 4px 0;
    white-space: nowrap;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.25s ease;
  }

  :global(.ProseMirror-yjs-cursor):hover > :global(div) {
    opacity: 1;
  }
</style>
