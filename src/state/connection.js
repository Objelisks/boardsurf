import { filter } from 'rxjs'
import { webSocket } from 'rxjs/webSocket'
import { ref } from 'vue'

export const ACTIONS = {
  play: 'play',
  pass: 'pass'
}
export const localId = ref(null)
export const gameId = ref(null)

export const connection = webSocket({ url: 'ws://localhost:8090', openObserver: {next: () => {
  console.log('connected to server')
}}})

connection.subscribe((data) => {
  console.log(data)
})
connection.pipe(filter((msg) => msg.type === 'id')).subscribe((msg) => {
  localId.value = msg.id
})
connection.pipe(filter((msg) => msg.type === 'start')).subscribe((msg) => {
  gameId.value = msg.id
})

export const sendRequest = (id) => {
  connection.next({type: 'request', id})
}

export const sendAccept = (id) => {
  connection.next({type: 'accept', id})
}

// {card, action, special?, x?, y?, turns?}
export const sendAction = (action) => {
  connection.next({type: 'action', gameId: gameId.value, ...action})
}