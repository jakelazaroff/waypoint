<script lang="ts">
  import type { Snippet } from "svelte";
  import Button from "./Button.svelte";
  import Icon from "./Icon.svelte";

  interface Props {
    title: string;
    children: Snippet;
  }

  let { title, children } = $props<Props>();

  let dialog = $state<HTMLDialogElement>();
  export function show() {
    dialog?.showModal();
  }

  export function hide() {
    dialog?.close();
  }
</script>

<!-- svelte-ignore a11y-no-noninteractive-element-interactions a11y-click-events-have-key-events -->
<dialog
  class="modal"
  bind:this={dialog}
  onclick={evt => {
    if (evt.currentTarget.tagName !== "DIALOG") return;

    const rect = dialog?.getBoundingClientRect();
    if (!rect) return;

    const isInDialog =
      rect.top <= evt.clientY &&
      evt.clientY <= rect.top + rect.height &&
      rect.left <= evt.clientX &&
      evt.clientX <= rect.left + rect.width;
    if (!isInDialog) dialog?.close();
  }}
>
  <header class="header">
    <span class="title">{title}</span>
    <Button onclick={() => dialog?.close()}><Icon name="close" /></Button>
  </header>
  <div class="content">
    {@render children()}
  </div>
</dialog>

<style>
  .modal {
    position: absolute;
    top: 50%;
    left: 50%;
    translate: -50% -50%;
    border-radius: 16px;
    border: none;
  }

  ::backdrop {
    background-color: #00000099;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    box-shadow: 0 1px 0 #00000022;
  }

  .title {
    font-weight: 700;
    font-size: 1.25rem;
  }

  .content {
    padding: 16px;
  }
</style>
