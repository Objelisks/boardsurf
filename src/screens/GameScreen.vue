<script setup>
import PlayerHand from '../components/PlayerHand.vue'
import { computed, ref } from 'vue'
import { filter } from 'rxjs'
import Grid, { BIG_GRID_SIZE } from '../components/Grid.vue'
import { countFilled, combineGrids, playToGrid, createGrid, placeGrid, placementProblemTest, rotateGrid, TEAMS } from '../../shared/grid.mjs'
import { useDraggable } from '../composables/useDraggable.js'
import { sendAction, ACTIONS, connection } from '../state/connection.js'
import { wait } from '../../shared/util.js'


const STATES = {
  selecting: 'selecting',
  placing: 'placing',
  waiting: 'waiting',
  showingResults: 'showingResults'
}

// board state
const board = ref(createGrid(15, 15))
board.value[11][3] = 2
board.value[3][11] = 5
const myPlay = ref(null)

// input state
const specialEnabled = ref(false)
const passingEnabled = ref(false)
const selectedCard = ref(null)

// state machine
const state = ref(STATES.selecting)
const selecting = computed(() => state.value === STATES.selecting)
const placing = computed(() => state.value === STATES.placing)

// position/rotation of the preview ghost when placing a card
const { mouseDown: ghostMouseDown, x: ghostDraggableX, y: ghostDraggableY } = useDraggable(placing)
const ghostX = computed(() => ghostDraggableX.value)
const ghostY = computed(() => ghostDraggableY.value)
const placingRotation = ref(0)

const transitionState = (newState) => {
  state.value = newState
}

// listen for results messages
connection.pipe(filter(msg => msg.type === 'results')).subscribe((msg) => {
  transitionState(STATES.showingResults)

  msg.play.team = TEAMS.opponent

  // figure out which card goes first
  const mySpaces = countFilled(myPlay.value.card.grid)
  const theirSpaces = countFilled(msg.play.card.grid)

  const myPlayGrid = playToGrid(myPlay.value, board.value[0].length, board.value.length, TEAMS.local)
  const theirPlayGrid = rotateGrid(playToGrid(msg.play, board.value[0].length, board.value.length, TEAMS.opponent), 2)

  let animation = wait(1000)

  // if tied, merge into a single card and place
  if(mySpaces === theirSpaces) {
    animation = animation.then(() => {
      // merge into a single play...
      // create empty copy of map
      // play both cards
      // wherever there is overlap of equal priority, put a wall (special tiles go over regular tiles)
      const mergedPlayGrids = combineGrids(myPlayGrid, theirPlayGrid)
      board.value = placeGrid(board.value, mergedPlayGrids)
    })
  } else {
    // else place one at a time
    const firstPlay = mySpaces > theirSpaces ? myPlayGrid : theirPlayGrid
    const secondPlay = mySpaces > theirSpaces ? theirPlayGrid : myPlayGrid
    animation = animation.then(() => {
      board.value = placeGrid(board.value, firstPlay)
    })
    .then(wait(1000))
    .then(() => {
      board.value = placeGrid(board.value, secondPlay)
    })
  }
  animation.then(wait(1000)).then(() => {
    // reset to start of turn
    selectedCard.value = null
    myPlay.value = null
    specialEnabled.value = false
    passingEnabled.value = false
    transitionState(STATES.selecting)
  })
})

// style applied to preview card when placing
const ghostStyle = computed(() => {
  const griddedX = Math.floor(ghostX.value/BIG_GRID_SIZE)*BIG_GRID_SIZE
  const griddedY = Math.floor(ghostY.value/BIG_GRID_SIZE)*BIG_GRID_SIZE - board.value.length*BIG_GRID_SIZE
  return {
    left: `${griddedX}px`,
    top: `${griddedY}px`
  }
})

// selected card rotated
const placedGrid = computed(() => {
  return selectedCard.value !== null ? rotateGrid(selectedCard.value.grid, placingRotation.value) : null
})

// round from pixels to spaces
const ghostPositionInSpaces = computed(() => {
  const griddedX = Math.floor(ghostX.value/BIG_GRID_SIZE)
  const griddedY = Math.floor(ghostY.value/BIG_GRID_SIZE)
  return selectedCard.value !== null ? {x: griddedX, y: griddedY} : {x: 0, y: 0}
})

// checks that the ghost card is in a placeable location
const isPlacementValid = computed(() => {
  const test = placementProblemTest(
    board.value,
    placedGrid.value,
    ghostPositionInSpaces.value.x,
    ghostPositionInSpaces.value.y,
    specialEnabled.value)
  return !test
})

// input element callbacks
const togglePassing = () => {
  passingEnabled.value = !passingEnabled.value
}
const toggleSpecial = () => {
  specialEnabled.value = !specialEnabled.value
}
const rotateRight = () => {
  placingRotation.value += 1
}
const rotateLeft = () => {
  placingRotation.value -= 1
}

// card select callback
// either pass or play
// pass: a card is chosen to discard
// play: transition into placing mode and wait for more input
const selectCard = (card) => {
  if(selecting.value) {
    selectedCard.value = card
    if(passingEnabled.value) {
      myPlay.value = {
        card: selectedCard.value,
        action: ACTIONS.pass,
      }
      sendAction(myPlay.value)
      transitionState(STATES.waiting)
    } else {
      transitionState(STATES.placing)
    }
  }
}

// after placing the card, send action to server and wait for results
const confirmPlacement = () => {
  // check validity
  myPlay.value = {
    action: ACTIONS.play,
    card: selectedCard.value,
    special: specialEnabled.value,
    x: ghostPositionInSpaces.value.x,
    y: ghostPositionInSpaces.value.y,
    turns: placingRotation.value
  }
  sendAction(myPlay.value)
  transitionState(STATES.waiting)
}

</script>

<template>
  <main>
    <PlayerInfo name="Player" />
    <PlayerInfo/>

    <div class="hand-area">
      <PlayerHand :input-enabled="selecting" :select-card="selectCard"/>
      <div class="button-area">
        <button @click="togglePassing" :disabled="placing">Pass</button>
        <button @click="toggleSpecial" :class="{active: specialEnabled}">Special {{specialEnabled ? 'ON' : 'OFF'}}</button>
      </div>
    </div>

    <TurnTracker/>
    <GameScore/>
    <PlayerDeck/>

    <div>
      <Grid :grid="board" size="15px" />
      <div v-if="placedGrid" class="draggable" :style="ghostStyle" @mousedown="ghostMouseDown">
        <Grid :grid="placedGrid" size="15px" :placing="true" :invalid="!isPlacementValid"/>
      </div>
    </div>
      <span v-if="placing">drag to move</span>

    <div class="short-buttons" v-if="placing">
      <button @click="rotateRight">↻</button>
      <button @click="rotateLeft">↺</button>
      <button @click="confirmPlacement" :disabled="!isPlacementValid">Confirm</button>
    </div>

    <PlayedCard/>
    <PlayedCard/>
  </main>
</template>

<style scoped>
  main {
    display: flex;
    place-items: center;
    justify-content: space-between;
    width: 70%;
    margin: 0 auto;
  }

  .hand-area {
    display: flex;
    flex-direction: column;
    place-items: center;
    background-color: rgb(50, 20, 50, 0.5);
    padding: 12px;
    border-radius: 16px;
  }

  button {
    font-size: 12pt;
    padding: 16px;
    min-width: 140px;
    margin: 6px;
    color: white;
    background-color: #572cbb;
    border: none;
    border-radius: 16px;
    text-shadow: 1px 1px black;
    box-shadow: 2px 2px black;
    transform: translate(0px, 0px);
    transition: all 200ms;
    box-shadow: 0px 0px 0px black;
    cursor: pointer;
  }

  button:hover {
    background-color: #994cdc;
    box-shadow: 2px 2px 6px black;
    transform: translate(-1px, -1px);
  }

  button:hover.active {
    background-color: #dc814c;
    box-shadow: 2px 2px 6px black;
    transform: translate(-1px, -1px);
  }

  .short-buttons button {
    min-width: 50px;
  }

  .active {
    background-color: rgb(255, 165, 69);
  }

  .draggable {
    position: relative;
    user-select: none;
  }
</style>