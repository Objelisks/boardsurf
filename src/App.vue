<script setup>
  import { activeScreen } from './state/screen'
</script>

<template>
  <component :is="activeScreen.screen"></component>
  <!-- <div class="hidden">
    <svg id="stripes" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style="stroke: black; stroke-width:20px;">
      <line x1="-25" y1="75" x2="75" y2="-25"></line>
      <line x1="-25" y1="150" x2="125" y2="0"></line>
      <line x1="-25" y1="225" x2="175" y2="25"></line>
    </svg>
    <svg id="dots" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="25" cy="25" r="20"></circle>
      <circle cx="75" cy="25" r="20"></circle>
      <circle cx="25" cy="75" r="20"></circle>
      <circle cx="75" cy="75" r="20"></circle>
    </svg>
  </div> -->
</template>

<style>
  body {
    background-color: #031229;
    color: rgba(235, 235, 235, 0.64);
    min-height: 100vh;
    line-height: 1.6;
    font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu,
      Cantarell, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
    font-size: 15px;
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  .hidden {
    display: none;
  }
</style>
