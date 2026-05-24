import { Awareness } from "y-protocols/awareness";
import type { RelativePosition } from "yjs";

import Doc from "./doc.svelte";

export interface User {
  name: string;
  color: string;
}

interface Peer {
  user: User;
  cursor?: { anchor?: RelativePosition; head?: RelativePosition };
}

export default class Collab {
  #local: Peer = { user: { name: "", color: "" } };

  awareness: Awareness;

  #states = $state<Peer[]>([]);
  local = $state<Peer>(this.#local);
  peers = $derived(this.#states.filter(peer => peer !== this.local));

  constructor(doc: Doc, user: User) {
    this.awareness = new Awareness(doc.ydoc);

    this.#local = this.local = { user };
    this.awareness.setLocalStateField("user", user);

    this.awareness.on("change", () => {
      // TODO: actually check types
      const local = (this.awareness.getLocalState() as Peer) || this.#local;
      this.local = this.#local = { ...local, cursor: local.cursor || this.#local.cursor };

      this.#states = [...this.awareness.getStates().values()] as Peer[];
    });
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
  "Auspicious",
  "Brave",
  "Clever",
  "Daring",
  "Eager",
  "Fearless",
  "Gracious",
  "Happy",
  "Intelligent",
  "Jolly",
  "Kind",
  "Lively",
  "Mighty",
  "Noble",
  "Optimistic",
  "Polite",
  "Quick",
  "Reliable",
  "Strong",
  "Trustworthy",
  "Unique",
  "Valiant",
  "Witty",
  "Xenial",
  "Youthful",
  "Zesty"
];

const ANIMALS = [
  "Alligator",
  "Bear",
  "Cat",
  "Dog",
  "Elephant",
  "Fox",
  "Giraffe",
  "Horse",
  "Iguana",
  "Jaguar",
  "Kangaroo",
  "Lion",
  "Monkey",
  "Narwhal",
  "Owl",
  "Penguin",
  "Quetzal",
  "Rabbit",
  "Squirrel",
  "Tiger",
  "Urchin",
  "Vicuña",
  "Wombat",
  "Xerus",
  "Yak",
  "Zebra"
];

function choose<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

export function randomColor() {
  return choose(COLORS);
}

export function randomUsername() {
  return choose(ADJECTIVES) + " " + choose(ANIMALS);
}
