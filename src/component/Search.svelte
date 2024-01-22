<script lang="ts">
  import { MapboxHTMLEvent } from "@mapbox/search-js-web";
  import type { SearchBoxRetrieveResponse } from "@mapbox/search-js-core";

  import { PUBLIC_MAPBOX_TOKEN } from "$env/static/public";

  import type { Place } from "~/lib/place";

  interface Props {
    onretrieve(place: Place): void;
  }

  let { onretrieve } = $props<Props>();

  function retrieve(evt: MapboxHTMLEvent<SearchBoxRetrieveResponse>) {
    const [feature] = evt.detail.features;
    onretrieve({
      name: feature.properties.name,
      mapboxId: feature.properties.mapbox_id,
      position: [feature.properties.coordinates.longitude, feature.properties.coordinates.latitude]
    });
  }
</script>

<mapbox-search-box access-token={PUBLIC_MAPBOX_TOKEN} proximity="0,0" on:retrieve={retrieve}
></mapbox-search-box>
