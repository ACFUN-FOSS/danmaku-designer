<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: number
    label?: string
    min?: number
    max?: number
    step?: number
    unit?: string
    presets?: number[]
  }>(),
  {
    label: '',
    min: 0,
    max: 9999,
    step: 1,
    unit: 'px',
    presets: () => [0, 10, 20, 40, 60, 100, 140, 220],
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const rootRef = ref<HTMLElement | null>(null)
const dragging = ref(false)
const dragMoved = ref(false)
const dragStartX = ref(0)
const dragStartValue = ref(0)
const popoverVisible = ref(false)

const displayValue = computed(() => `${Math.round(props.modelValue)}${props.unit}`)
const presetValues = computed(() => {
  return props.presets.filter(
    (value) => value >= props.min && value <= props.max,
  )
})

const clampValue = (value: number) => {
  return Math.min(props.max, Math.max(props.min, value))
}

const updateValue = (value: number) => {
  emit('update:modelValue', clampValue(value))
}

const updateValueFromInput = (value: number | undefined) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return
  }
  updateValue(Math.round(value))
}

const isInsidePopover = (target: EventTarget | null) => {
  return target instanceof HTMLElement && Boolean(target.closest('.drag-number-field__popover'))
}

const stopDragging = () => {
  dragging.value = false
  window.removeEventListener('mousemove', handleMouseMove)
  window.removeEventListener('mouseup', stopDragging)
  window.setTimeout(() => {
    dragMoved.value = false
  }, 0)
}

const handleMouseMove = (event: MouseEvent) => {
  if (!dragging.value) {
    return
  }
  const delta = event.clientX - dragStartX.value
  if (Math.abs(delta) > 2) {
    dragMoved.value = true
  }
  const nextValue = dragStartValue.value + delta * props.step
  updateValue(Math.round(nextValue))
}

const startDrag = (event: MouseEvent) => {
  dragging.value = true
  dragStartX.value = event.clientX
  dragStartValue.value = props.modelValue
  window.addEventListener('mousemove', handleMouseMove)
  window.addEventListener('mouseup', stopDragging)
}

const togglePopover = async () => {
  if (dragMoved.value) {
    return
  }
  popoverVisible.value = !popoverVisible.value
  await nextTick()
}

const handleDocumentPointerDown = (event: PointerEvent) => {
  if (!popoverVisible.value) {
    return
  }
  const target = event.target
  if (rootRef.value?.contains(target as Node) || isInsidePopover(target)) {
    return
  }
  popoverVisible.value = false
}

onMounted(() => {
  document.addEventListener('pointerdown', handleDocumentPointerDown, true)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', handleDocumentPointerDown, true)
  stopDragging()
})
</script>

<template>
  <div ref="rootRef" class="drag-number-field">
    <span v-if="label" class="drag-number-field__label">{{ label }}</span>
    <el-popover
      v-model:visible="popoverVisible"
      trigger="manual"
      placement="top"
      :width="336"
      popper-class="drag-number-field__popover"
      :hide-after="0"
      :show-after="0"
    >
      <div class="drag-number-field__panel">
        <div class="drag-number-field__panel-top">
          <el-slider
            :model-value="modelValue"
            :min="min"
            :max="max"
            :step="step"
            @update:model-value="(value: number) => updateValue(value)"
          />
          <el-input-number
            class="drag-number-field__value-input"
            :model-value="Math.round(modelValue)"
            :min="min"
            :max="max"
            :step="step"
            controls-position="right"
            @update:model-value="updateValueFromInput"
          />
        </div>

        <div class="drag-number-field__preset-grid">
          <button
            v-for="value in presetValues"
            :key="value"
            class="drag-number-field__preset"
            type="button"
            @click="updateValue(value)"
          >
            {{ value }}
          </button>
        </div>
      </div>

      <template #reference>
        <button
          class="drag-number-field__trigger"
          type="button"
          @mousedown.prevent="startDrag"
          @click.stop="togglePopover"
        >
          {{ displayValue }}
        </button>
      </template>
    </el-popover>
  </div>
</template>

<style scoped>
.drag-number-field {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.drag-number-field__label {
  color: #6b7280;
  font-size: 12px;
}

.drag-number-field__trigger {
  min-width: 64px;
  padding: 3px 7px;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  background: #fff;
  color: #0f172a;
  font-size: 12px;
  cursor: ew-resize;
}

.drag-number-field__trigger:hover {
  border-color: #2563eb;
  color: #2563eb;
}

.drag-number-field__panel {
  display: grid;
  gap: 10px;
}

:deep(.drag-number-field__popover) {
  padding: 8px 10px 10px;
  border-radius: 6px;
  border: 1px solid rgba(37, 99, 235, 0.16);
  box-shadow: 0 16px 36px rgba(15, 23, 42, 0.14);
}

:deep(.drag-number-field__popover .el-popper__arrow::before) {
  border: 1px solid rgba(37, 99, 235, 0.16);
}

.drag-number-field__panel-top {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 108px;
  gap: 10px;
  align-items: center;
}

.drag-number-field__value-input {
  width: 108px;
}

.drag-number-field__value-input :deep(.el-input__wrapper) {
  min-height: 30px;
  border-radius: 4px;
  background: #f1f5f9;
  box-shadow: none;
}

.drag-number-field__value-input :deep(.el-input__inner) {
  font-size: 14px;
  font-weight: 600;
  text-align: left;
}

.drag-number-field__value-input :deep(.el-input-number__increase),
.drag-number-field__value-input :deep(.el-input-number__decrease) {
  width: 22px;
}

.drag-number-field__value-input :deep(.el-input-number__increase),
.drag-number-field__value-input :deep(.el-input-number__decrease) {
  border-color: rgba(148, 163, 184, 0.22);
  background: rgba(255, 255, 255, 0.72);
}

.drag-number-field__preset-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}

.drag-number-field__preset {
  height: 32px;
  border: 1px solid #2563eb;
  border-radius: 4px;
  background: #fff;
  color: #2563eb;
  font-size: 12px;
  line-height: 32px;
  cursor: pointer;
}

.drag-number-field__preset:hover {
  background: #eff6ff;
}
</style>
