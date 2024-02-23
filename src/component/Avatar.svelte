<script lang="ts">
  interface Props {
    name: string;
    color: string;
    size?: number;
  }

  let { name, color, size = 24 } = $props<Props>();
</script>

<svg
  xmlns="http://www.w3.org/2000/svg"
  class="avatar"
  width={size}
  height={size}
  viewBox="0 0 {size} {size}"
>
  <circle cx={size / 2} cy={size / 2} r={size / 2} fill={color}></circle>
  <text
    x="50%"
    y="50%"
    dominant-baseline="central"
    text-anchor="middle"
    fill="white"
    font-weight="bold"
    font-size={size / 1.5}
  >
    {name[0]?.toUpperCase() || "A"}
  </text>
</svg>

<style>
  .avatar {
    box-shadow: 0 0 0 2px #ffffff;
    border-radius: 50%;
    cursor: default;
  }
</style>
