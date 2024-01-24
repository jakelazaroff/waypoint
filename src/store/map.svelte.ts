import { writable } from "svelte/store";
import { type Coordinate } from "~/lib/place";

export const center = writable<Coordinate>([0, 0]);
