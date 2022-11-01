<script setup>
import Grid from './Grid.vue'
import { countFilled } from '../../shared/grid.mjs'
import { ref, computed } from 'vue'

const {card} = defineProps(['card'])

const grid = ref(card.grid)
const name = ref(card.name)
const spaces = computed(() => countFilled(grid.value))
const specialCost = computed(() => new Array(card.special).map(() => 'x'))
</script>

<template>
  <section class="card">
    <Grid :grid="grid" :width="grid[0].length" :height="grid.length" size="10px"/>
    <div class="details">
      <span>{{ spaces }}</span>
      <span class="special-cost"><div v-for="box in specialCost"></div></span>
    </div>
  </section>
</template>

<style scoped>
  .card {
    display: grid;
    grid: 1fr / 1fr;
    background-color: rgba(55, 55, 55, 0.5);
    padding: 16px;
    border-radius: 16px;
    transform: translate(0px, 0px);
    transition: all 200ms;
    box-shadow: 0px 0px 0px black;
    cursor: pointer;
  }

  .card:hover {
    background-color: rgba(55, 55, 55, 0.75);
    box-shadow: 2px 2px 6px black;
    transform: translate(-2px, -2px);
  }

  .details {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .special-cost {
    display: flex;
    height: 10px;
  }
  
  .special-cost div {
    height: 10px;
    width: 10px;
    border: 1px solid rgba(55, 55, 55, 0.75);
    background-color: orange;
  }
</style>
