import type { RequestEvent } from "./$types";

export function GET({ request }: RequestEvent) {
  const url = new URL(request.url);

  let dest = "https://nominatim.openstreetmap.org" + url.pathname.replace(/^\/nominatim/, "");
  if (url.search) dest += url.search;

  return fetch(dest);
}
