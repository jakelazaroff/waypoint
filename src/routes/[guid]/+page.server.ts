import type { PageServerLoadEvent } from "./$types";

import { getOrCreateDocAndToken } from "@y-sweet/sdk";
import { Y_SWEET_CONNECTION_STRING } from "$env/static/private";

export async function load({ params }: PageServerLoadEvent) {
  return getOrCreateDocAndToken(Y_SWEET_CONNECTION_STRING, params.guid);
}
