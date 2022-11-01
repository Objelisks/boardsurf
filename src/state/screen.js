import ConnectScreen from '../screens/ConnectScreen.vue'
import GameScreen from '../screens/GameScreen.vue'
import { reactive } from 'vue'

export const activeScreen = reactive({screen: ConnectScreen})