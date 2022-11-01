<script setup>
import GameScreen from '../screens/GameScreen.vue'
import { connection, localId, gameId, sendRequest, sendAccept } from '../state/connection'
import { activeScreen } from '../state/screen'
import { ref } from 'vue'
import { filter } from 'rxjs';

console.log('connect screen')

const connectAddr = ref('')
const requests = ref([])
const currentTime = ref(Date.now())
setInterval(() => {
  currentTime.value = Date.now()
  requests.value = requests.value.filter((request) => {
    return ((30000 + request.time - currentTime.value) / 1000) > 0
  })
}, 1000)

connection
  .pipe(filter((msg) => msg.type === "request"))
  .subscribe((msg) => {
    requests.value.push({id: msg.id, time: Date.now()})
  })

connection
  .pipe(filter((msg) => msg.type === "start"))
  .subscribe((msg) => {
    activeScreen.screen = GameScreen
    gameId.value = msg.id
  })

const requestClick = () => {
  console.log('connecting', connectAddr.value)
  sendRequest(connectAddr.value)
}

const acceptClick = (id) => {
  sendAccept(id)
  console.log('accepting request from: ', id)
}

</script>

<template>
  <main>
    <h1>connect to a friend</h1>
    <span>your id: {{ localId }}</span>
    <div>
      <input type="text" v-model="connectAddr" placeholder="enter an id here"/>
      <span>request to <button @click="requestClick">play</button></span>
    </div>
    <div>
      <ul>
        <li v-for="request in requests"><span>
          {{ request.id }} wants to play <button @click="() => acceptClick(request.id)">join</button>
          ({{((30000 + request.time - currentTime) / 1000).toFixed(0)}})
        </span></li>
      </ul>
    </div>
    <aside>
      <h2>how to play</h2>
    </aside>
  </main>
</template>

<style scoped>
  main {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    width: 70%;
    margin: 0 auto;
  }
</style>