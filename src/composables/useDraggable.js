import { onMounted, onUnmounted, ref } from 'vue'

export const useDraggable = () => {
  const x = ref(0)
  const y = ref(0)
  const moving = ref(false)

  const mouseDown = (event) => {
    moving.value = true
  }

  const mouseMove = (event) => {
    if(moving.value) {
      event.preventDefault()
      x.value += event.movementX
      y.value += event.movementY
    }
  }

  const mouseUp = () => {
    moving.value = false
  }

  onMounted(() => {
    window.addEventListener('mousemove', mouseMove)
    window.addEventListener('mouseup', mouseUp)
  })

  onUnmounted(() => {
    window.removeEventListener('mousemove', mouseMove)
    window.removeEventListener('mouseup', mouseUp)
  })

  return { x, y, mouseDown}
}