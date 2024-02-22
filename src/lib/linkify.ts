import { Plugin } from "prosemirror-state";
import { Fragment, Slice, type Node } from "prosemirror-model";

const HTTP_LINK_REGEX =
  /\bhttps?:\/\/[a-zA-Z0-9\-]+(?:\.[a-zA-Z0-9\-]+)*(?::\d+)?(?:\/[^\s.]*\/?)*/g;

/** Take a fragment and return a new fragment with URLs marked as links */
function _linkify(fragment: Fragment) {
  const nodes: Node[] = [];

  fragment.forEach(child => {
    // if it's not a text node, recurse into its children
    if (!child.isText) return void nodes.push(child.copy(_linkify(child.content)));

    // get the link mark
    const link = child.type.schema.marks["link"];

    const text = child.text || "";
    let pos = 0,
      match: RegExpExecArray | null;

    // loop through all matches
    while ((match = HTTP_LINK_REGEX.exec(text))) {
      // get the start and end indices
      const start = match.index,
        end = start + match[0].length;

      // if there's text before the link, push it to the nodes list
      if (start > 0) nodes.push(child.cut(pos, start));

      // get the link text and create the mark
      const href = text.slice(start, end);
      const mark = link.create({ href }).addToSet(child.marks);

      // push the marked text into the nodes array
      nodes.push(child.cut(start, end).mark(mark));
      pos = end;
    }

    // copy over whatever is left
    if (pos < text.length) nodes.push(child.cut(pos));
  });

  return Fragment.fromArray(nodes);
}

export default function linkify() {
  return new Plugin({
    props: {
      // add link marks to URLs in pasted text
      transformPasted(slice) {
        return new Slice(_linkify(slice.content), slice.openStart, slice.openEnd);
      },
      handleClick(view, pos, evt) {
        // only follow links if the meta key is held down
        if (!evt.metaKey) return;

        // only follow clicks on <a> tags with href attributes
        const el = view.domAtPos(pos).node.parentElement;
        if (el?.tagName !== "A" || !el.getAttribute("href")) return;

        // create a link tag with the same href and click it
        const a = document.createElement("a");
        a.href = el.getAttribute("href") || "";
        a.target = "_blank";
        a.click();

        // prevent other plugins from handling this event
        return true;
      }
    }
  });
}
