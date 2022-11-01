<script setup>
import Card from './Card.vue'
import {splattershot, heroshot} from '../../shared/cards.js'

const { selectCard } = defineProps(['selectCard'])
</script>

<template>
  <section>
    <Card :card="splattershot" @click="selectCard(splattershot)"/>
    <Card :card="splattershot" @click="selectCard(splattershot)"/>
    <Card :card="heroshot" @click="selectCard(heroshot)"/>
    <Card :card="heroshot" @click="selectCard(heroshot)"/>
  </section>
</template>

<style scoped>
section {
  display: grid;
  grid: 1fr 1fr / 1fr 1fr;
  gap: 10px;
}
</style>
