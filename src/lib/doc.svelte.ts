import {
  Doc as YDoc,
  XmlElement,
  createAbsolutePositionFromRelativePosition,
  type AbstractType,
  type RelativePosition,
  encodeStateAsUpdate,
  applyUpdate
} from "yjs";
import type { Place, Route } from "./place";

export default class Doc {
  #ydoc = $state(new YDoc());
  outline = $derived(this.#ydoc.getXmlFragment("outline"));

  constructor(ydoc = new YDoc()) {
    this.#ydoc = ydoc;

    // HACK places: the yjs doc is mutated internally, so we need to manually invalidate the reactive variable
    this.#invalidateOutline();
    this.#ydoc.on("update", () => this.#invalidateOutline());
  }

  // HACK places: the yjs doc is mutated internally, so we need to manually invalidate the reactive variable
  #outline = $state(this.#ydoc.getXmlFragment("outline"));
  #invalidateOutline() {
    // @ts-expect-error
    this.#outline = undefined;
    this.#outline = this.#ydoc.getXmlFragment("outline");
  }

  /** Given a relative position, return the highest ancestor element below the root */
  #subtree(pos?: RelativePosition) {
    if (!pos) return this.#outline;

    // get the corresponding absolute position
    const abs = createAbsolutePositionFromRelativePosition(pos, this.#ydoc);
    if (!abs) return this.#outline;

    const ancestors: AbstractType<unknown>[] = [];

    // iterate through the position's ancestors
    let current = abs.type;
    while (current.parent) {
      ancestors.push(current);
      current = current.parent;
    }

    // find highest ancestor below the root
    const ancestor = ancestors.at(-1);

    return ancestor instanceof XmlElement ? ancestor : this.#outline;
  }

  /** Given a relative position, return a list of places within that subtree */
  places(pos?: RelativePosition) {
    const root = this.#subtree(pos);

    const results: Place[] = [];
    for (const el of root.querySelectorAll("place")) {
      if (!(el instanceof XmlElement)) continue;

      // get the place data
      const name = el.getAttribute("name");
      const lon = Number(el.getAttribute("lon"));
      const lat = Number(el.getAttribute("lat"));
      if (!name || Number.isNaN(lon) || Number.isNaN(lat)) continue;

      // push the place into the results list
      results.push({ type: "place", name, position: [lon, lat] });
    }

    return results;
  }

  /** Given a relative position, return a list of routes within that subtree */
  routes(pos?: RelativePosition) {
    const root = this.#subtree(pos);

    const results: Route[] = [];

    const routes = root instanceof XmlElement ? [root] : root.querySelectorAll("route");
    for (const route of routes) {
      if (!(route instanceof XmlElement)) continue;

      const result: Route = { type: "route", places: [] };

      for (const place of route.querySelectorAll("place")) {
        if (!(place instanceof XmlElement)) continue;

        // find the closest ancestor that's a <route>, <oredered_list> or <bullet>list>
        let current = place?.parent;
        while (current !== route.parent && current !== null) {
          if (!(current instanceof XmlElement)) break;

          if (new Set(["route", "ordered_list", "bullet_list"]).has(current.nodeName)) break;
          current = current.parent;
        }

        // if the closest ancestor isn't the current route, skip the place
        if (current !== route) continue;

        // get the place data
        const name = place.getAttribute("name");
        const lon = Number(place.getAttribute("lon"));
        const lat = Number(place.getAttribute("lat"));
        if (!name || Number.isNaN(lon) || Number.isNaN(lat)) continue;

        // push the place into the route
        result.places.push({ type: "place", name, position: [lon, lat] });
      }

      // if the route has at least one places, push it into the results list
      if (result.places.length) results.push(result);
    }

    return results;
  }

  serialize(filename: string) {
    return new File([encodeStateAsUpdate(this.#ydoc)], filename);
  }

  static parse(data: Uint8Array) {
    const ydoc = new YDoc();
    applyUpdate(ydoc, new Uint8Array(data));
    return new Doc(ydoc);
  }
}
