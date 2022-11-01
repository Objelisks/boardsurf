<script setup>
import { isEmpty } from 'rxjs';
import { isOwned, isSpecial, TEAMS } from '../../shared/grid.mjs'
const {
  grid,
  size='10px',
  placing,
  invalid
} = defineProps(['grid', 'size', 'placing', 'invalid'])

const shapeStyle = {
  'grid-template-columns': `repeat(${grid?.[0].length}, ${size})`,
  'grid-template-rows': `repeat(${grid?.length}, ${size})`
}

</script>

<script>
export const BIG_GRID_SIZE=15
</script>

<template>
  <div class="grid" :style="shapeStyle">
    <div :class="{
      space: space > 0, empty: isEmpty(space), local: isOwned(space, TEAMS.local), opponent: isOwned(space, TEAMS.opponent),
      special: isSpecial(space), placing, invalid }" v-for="space in grid?.flat()"></div>
  </div>
</template>

<style scoped>
.grid {
  display: grid;
}

.space {
  border: 1px solid rgba(55, 55, 55, 1.0);
}

.empty {
  border: 1px solid rgba(55, 55, 55, 1.0);
}

.empty.placing {
  border: none;
}

.space.local {
  background-color: yellow;
}
.space.local.special {
  background-color: orange;
}
.space.opponent {
  background-color: rgb(57, 33, 197);
}
.space.opponent.special {
  background-color: rgb(21, 175, 218);
}

.space.placing {
  mask: url("data:image/svg+xml, %3Csvg id='stripes' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg' style='stroke: black; stroke-width:24px;'%3E%3Cline x1='-25' y1='75' x2='75' y2='-25'%3E%3C/line%3E%3Cline x1='-25' y1='150' x2='125' y2='0'%3E%3C/line%3E%3Cline x1='-25' y1='225' x2='175' y2='25'%3E%3C/line%3E%3C/svg%3E");
}
.space.placing.special {
  mask: url("data:image/svg+xml,%3Csvg id='dots' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='25' cy='25' r='20'%3E%3C/circle%3E%3Ccircle cx='75' cy='25' r='20'%3E%3C/circle%3E%3Ccircle cx='25' cy='75' r='20'%3E%3C/circle%3E%3Ccircle cx='75' cy='75' r='20'%3E%3C/circle%3E%3C/svg%3E");
}
.space.placing.invalid {
  background-color: white;
}
.space.placing.special.invalid {
  background-color: grey;
}
</style>
