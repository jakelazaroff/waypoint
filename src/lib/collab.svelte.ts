import { YSweetProvider } from "@y-sweet/client";
import type { RelativePosition } from "yjs";

import Doc from "./doc.svelte";

export interface User {
  name: string;
  color: string;
}

interface Peer {
  user: User;
  cursor?: RelativePosition;
}

export default class Collab {
  #provider = $state<YSweetProvider>({} as YSweetProvider);
  #local: Peer = { user: { name: "", color: "" } };

  awareness = $derived(this.#provider.awareness);

  #states = $state<Peer[]>([]);
  local = $state<Peer>(this.#local);
  peers = $derived(this.#states.filter(peer => peer !== this.local));

  constructor(url: string, doc: Doc, user: User) {
    this.#provider = new YSweetProvider(url, doc.guid, doc.ydoc);

    this.#local = this.local = { user };
    this.#provider.awareness.setLocalStateField("user", user);

    this.#provider.awareness.on("change", () => {
      // TODO: actually check types
      this.local = (this.#provider.awareness.getLocalState() as Peer) || this.#local;
      this.#states = [...this.#provider.awareness.getStates().values()] as Peer[];
    });
  }

  set cursor(pos: RelativePosition) {
    this.#provider.awareness.setLocalStateField("cursor", pos);
  }
}

const COLORS = [
  "#FF5C5C",
  "#FFB65C",
  // "#FAFF70",
  "#88FF70",
  "#47F0FF",
  "#478EFF",
  "#745CFF",
  "#FF85FF"
];

const ADJECTIVES = [
  "auspicious",
  "brave",
  "clever",
  "daring",
  "eager",
  "fearless",
  "gracious",
  "happy",
  "intelligent",
  "jolly",
  "kind",
  "lively",
  "mighty",
  "noble",
  "optimistic",
  "polite",
  "quick",
  "reliable",
  "strong",
  "trustworthy",
  "unique",
  "valiant",
  "witty",
  "xenial",
  "youthful",
  "zesty"
];

const ANIMALS = [
  "alligator",
  "bear",
  "cat",
  "dog",
  "elephant",
  "fox",
  "giraffe",
  "horse",
  "iguana",
  "jaguar",
  "kangaroo",
  "lion",
  "monkey",
  "narwhal",
  "owl",
  "penguin",
  "quetzal",
  "rabbit",
  "squirrel",
  "tiger",
  "urchin",
  "viper",
  "wombat",
  "xerus",
  "yak",
  "zebra"
];

function choose<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

export function randomColor() {
  return choose(COLORS);
}

export function randomUsername() {
  return choose(ADJECTIVES) + "-" + choose(ANIMALS);
}
