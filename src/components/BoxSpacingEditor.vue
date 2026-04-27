<script setup lang="ts">
import DragNumberField from './DragNumberField.vue'

type SpacingValue = {
  top: number
  right: number
  bottom: number
  left: number
}

defineProps<{
  modelValue: SpacingValue
}>()

const emit = defineEmits<{
  'update:modelValue': [value: SpacingValue]
}>()
</script>

<template>
  <div class="box-spacing">
    <div class="box-spacing__outer">
      <span class="box-spacing__tag">内边距</span>
      <div class="box-spacing__value box-spacing__value--top">
        <DragNumberField
          :model-value="modelValue.top"
          unit="px"
          :step="1"
          @update:model-value="(value) => emit('update:modelValue', { ...modelValue, top: value })"
        />
      </div>
      <div class="box-spacing__value box-spacing__value--right">
        <DragNumberField
          :model-value="modelValue.right"
          unit="px"
          :step="1"
          @update:model-value="(value) => emit('update:modelValue', { ...modelValue, right: value })"
        />
      </div>
      <div class="box-spacing__value box-spacing__value--bottom">
        <DragNumberField
          :model-value="modelValue.bottom"
          unit="px"
          :step="1"
          @update:model-value="(value) => emit('update:modelValue', { ...modelValue, bottom: value })"
        />
      </div>
      <div class="box-spacing__value box-spacing__value--left">
        <DragNumberField
          :model-value="modelValue.left"
          unit="px"
          :step="1"
          @update:model-value="(value) => emit('update:modelValue', { ...modelValue, left: value })"
        />
      </div>

      <div class="box-spacing__inner">
        <div class="box-spacing__preview">内容区域</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.box-spacing {
  width: 100%;
}

.box-spacing__outer {
  position: relative;
  min-height: 148px;
  border: 1px dashed #60a5fa;
  border-radius: 8px;
  background: #eff6ff;
}

.box-spacing__tag {
  position: absolute;
  top: 12px;
  left: 16px;
  color: #2563eb;
  font-size: 13px;
  font-weight: 600;
}

.box-spacing__inner {
  position: absolute;
  inset: 40px 76px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px dashed #60a5fa;
  border-radius: 6px;
  background: rgba(96, 165, 250, 0.16);
}

.box-spacing__preview {
  width: 100%;
  height: 100%;
  margin: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px dashed #93c5fd;
  border-radius: 4px;
  color: #475569;
  font-size: 12px;
}

.box-spacing__value {
  position: absolute;
  z-index: 1;
}

.box-spacing__value--top {
  top: 4px;
  left: 50%;
  transform: translateX(-50%);
}

.box-spacing__value--right {
  top: 50%;
  right: 8px;
  transform: translateY(-50%);
}

.box-spacing__value--bottom {
  bottom: 4px;
  left: 50%;
  transform: translateX(-50%);
}

.box-spacing__value--left {
  top: 50%;
  left: 8px;
  transform: translateY(-50%);
}
</style>
