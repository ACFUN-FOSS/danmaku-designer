<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import BoxSpacingEditor from '@/components/BoxSpacingEditor.vue'
import DragNumberField from '@/components/DragNumberField.vue'

type CornerKey = 'topLeft' | 'topRight' | 'bottomRight' | 'bottomLeft'

type CornerValue = {
  radius: number
  visible: boolean
}

type EdgeKey = 'top' | 'right' | 'bottom' | 'left'

type BorderEdgeValue = {
  visible: boolean
  width: number
  style: 'solid' | 'dashed' | 'dotted'
  color: string | null
}

type SpacingValue = {
  top: number
  right: number
  bottom: number
  left: number
}

type ContainerNode = {
  id: string
  type: 'container'
  name: string
  x: number
  y: number
  width: number
  height: number
  padding: SpacingValue
  border: {
    edges: Record<EdgeKey, BorderEdgeValue>
  }
  radius: {
    corners: Record<CornerKey, CornerValue>
  }
  background: {
    color: string
    image: string
    size: 'cover' | 'contain' | '100% 100%' | 'auto'
  }
}

type ResizeHandle =
  | 'top-left'
  | 'top-right'
  | 'bottom-right'
  | 'bottom-left'
  | 'top'
  | 'right'
  | 'bottom'
  | 'left'

const canvasSize = reactive({
  width: 1920,
  height: 1080,
})

const canvasBackground = reactive({
  color: 'transparent',
  image: '',
  size: 'cover' as 'cover' | 'contain' | '100% 100%' | 'auto',
})

const canvasWidthPresets = [375, 414, 768, 800, 1024, 1280, 1366, 1440, 1600, 1920, 2560, 3840]
const canvasHeightPresets = [667, 736, 800, 900, 1024, 1080, 1200, 1440, 1600, 2160]
const borderWidthPresets = [0, 1, 2, 4, 6, 8, 10, 12]
const radiusPresets = [0, 2, 5, 8, 10, 12, 16, 20, 24, 32]

const buildAxisPresets = (limit: number) => {
  return Array.from(
    new Set([
      0,
      Math.round(limit * 0.05),
      Math.round(limit * 0.1),
      Math.round(limit * 0.2),
      Math.round(limit * 0.25),
      Math.round(limit * 0.33),
      Math.round(limit * 0.5),
      Math.round(limit * 0.66),
      Math.round(limit * 0.75),
      Math.round(limit * 0.9),
      limit,
    ]),
  )
    .filter((value) => value >= 0 && value <= limit)
    .sort((a, b) => a - b)
    .slice(0, 12)
}

const buildSizePresets = (limit: number, min: number) => {
  return Array.from(
    new Set([
      min,
      Math.max(min, Math.round(limit * 0.1)),
      Math.max(min, Math.round(limit * 0.2)),
      Math.max(min, Math.round(limit * 0.25)),
      Math.max(min, Math.round(limit * 0.33)),
      Math.max(min, Math.round(limit * 0.5)),
      Math.max(min, Math.round(limit * 0.66)),
      Math.max(min, Math.round(limit * 0.75)),
      Math.max(min, Math.round(limit * 0.9)),
      limit,
    ]),
  )
    .filter((value) => value >= min && value <= limit)
    .sort((a, b) => a - b)
    .slice(0, 12)
}

const nodeXPresets = computed(() => buildAxisPresets(canvasSize.width))
const nodeYPresets = computed(() => buildAxisPresets(canvasSize.height))
const nodeWidthPresets = computed(() => buildSizePresets(canvasSize.width, 40))
const nodeHeightPresets = computed(() => buildSizePresets(canvasSize.height, 40))

const zoom = ref(100)
const minZoom = 40
const maxZoom = 200
const drawerOpen = ref(true)
const leftDrawerOpen = ref(true)
const activeTab = ref('style')
const borderEditMode = ref<'linked' | 'split'>('split')
const radiusEditMode = ref<'linked' | 'split'>('split')
const rootRef = ref<HTMLElement | null>(null)
const layerListRef = ref<HTMLElement | null>(null)

const workspaceOffset = reactive({
  x: 480,
  y: 90,
})

const canvasBoardStyle = computed(() => ({
  left: `calc(50% + ${workspaceOffset.x}px)`,
  top: `calc(50% + ${workspaceOffset.y}px)`,
  transform: `translate(-50%, -50%) scale(${zoom.value / 100})`,
}))

const hasCanvasVisibleBackground = computed(() => {
  const color = (canvasBackground.color || '').replace(/\s+/g, '').toLowerCase()
  const hasColor = Boolean(color) && color !== 'transparent' && color !== 'rgba(0,0,0,0)'
  return hasColor || Boolean(canvasBackground.image)
})

const canvasSurfaceStyle = computed(() => ({
  width: `${canvasSize.width}px`,
  height: `${canvasSize.height}px`,
  backgroundColor: canvasBackground.color || 'transparent',
  backgroundImage: [
    canvasBackground.image ? `url(${canvasBackground.image})` : '',
    hasCanvasVisibleBackground.value
      ? ''
      : 'linear-gradient(45deg, rgba(148, 163, 184, 0.2) 25%, transparent 25%, transparent 75%, rgba(148, 163, 184, 0.2) 75%, rgba(148, 163, 184, 0.2))',
    hasCanvasVisibleBackground.value
      ? ''
      : 'linear-gradient(45deg, rgba(148, 163, 184, 0.2) 25%, transparent 25%, transparent 75%, rgba(148, 163, 184, 0.2) 75%, rgba(148, 163, 184, 0.2))',
  ]
    .filter(Boolean)
    .join(', '),
  backgroundSize: [
    canvasBackground.image ? canvasBackground.size : '',
    hasCanvasVisibleBackground.value ? '' : '16px 16px',
    hasCanvasVisibleBackground.value ? '' : '16px 16px',
  ]
    .filter(Boolean)
    .join(', '),
  backgroundPosition: [
    canvasBackground.image ? 'center' : '',
    hasCanvasVisibleBackground.value ? '' : '0 0',
    hasCanvasVisibleBackground.value ? '' : '8px 8px',
  ]
    .filter(Boolean)
    .join(', '),
  backgroundRepeat: [
    canvasBackground.image ? 'no-repeat' : '',
    hasCanvasVisibleBackground.value ? '' : 'repeat',
    hasCanvasVisibleBackground.value ? '' : 'repeat',
  ]
    .filter(Boolean)
    .join(', '),
}))

const workspaceDebugText = computed(() => {
  return `x:${Math.round(workspaceOffset.x)} y:${Math.round(workspaceOffset.y)}`
})

const createContainerNode = (index = 0): ContainerNode => ({
  id: `container-${Date.now()}`,
  type: 'container',
  name: `容器 ${index + 1}`,
  x: 120 + index * 30,
  y: 96 + index * 30,
  width: 360,
  height: 200,
  padding: {
    top: 20,
    right: 20,
    bottom: 20,
    left: 20,
  },
  border: {
    edges: {
      top: { visible: true, width: 1, style: 'solid', color: '#94a3b8' },
      right: { visible: true, width: 1, style: 'solid', color: '#94a3b8' },
      bottom: { visible: true, width: 1, style: 'solid', color: '#94a3b8' },
      left: { visible: true, width: 1, style: 'solid', color: '#94a3b8' },
    },
  },
  radius: {
    corners: {
      topLeft: { radius: 4, visible: true },
      topRight: { radius: 4, visible: true },
      bottomRight: { radius: 4, visible: true },
      bottomLeft: { radius: 4, visible: true },
    },
  },
  background: {
    color: '#ffffff',
    image: '',
    size: 'cover',
  },
})

const nodes = ref<ContainerNode[]>([createContainerNode(0)])

const selectedNodeId = ref(nodes.value[0]?.id ?? '')
const selectedTarget = ref<'canvas' | 'node'>('node')

const selectedNode = computed(() => {
  if (selectedTarget.value !== 'node') {
    return null
  }
  return nodes.value.find((node) => node.id === selectedNodeId.value) ?? null
})

const isCanvasSelected = computed(() => selectedTarget.value === 'canvas')

const layerNodes = computed(() => {
  return [...nodes.value]
})

const layerDragState = reactive({
  activeId: '',
  insertIndex: -1,
  pointerId: -1,
  startY: 0,
  currentY: 0,
})

const addContainer = () => {
  const node = createContainerNode(nodes.value.length)
  nodes.value.push(node)
  selectedNodeId.value = node.id
  selectedTarget.value = 'node'
}

const removeNode = (nodeId: string) => {
  const index = nodes.value.findIndex((node) => node.id === nodeId)
  if (index === -1) {
    return
  }
  nodes.value.splice(index, 1)
  if (selectedNodeId.value === nodeId) {
    selectedNodeId.value = nodes.value[index]?.id ?? nodes.value[index - 1]?.id ?? ''
    selectedTarget.value = selectedNodeId.value ? 'node' : 'canvas'
  }
}

const selectCanvas = () => {
  selectedTarget.value = 'canvas'
}

const selectNode = (nodeId: string) => {
  selectedNodeId.value = nodeId
  selectedTarget.value = 'node'
}

const updateLayerInsertIndex = (clientY: number) => {
  if (!layerDragState.activeId || !layerListRef.value) {
    return
  }
  const otherItems = Array.from(layerListRef.value.querySelectorAll<HTMLElement>('.layer-item')).filter(
    (item) => item.dataset.nodeId !== layerDragState.activeId,
  )
  let nextIndex = otherItems.length
  for (let index = 0; index < otherItems.length; index += 1) {
    const rect = otherItems[index].getBoundingClientRect()
    if (clientY < rect.top + rect.height / 2) {
      nextIndex = index
      break
    }
  }
  layerDragState.insertIndex = nextIndex
}

const handleLayerPointerMove = (event: PointerEvent) => {
  if (event.pointerId !== layerDragState.pointerId) {
    return
  }
  layerDragState.currentY = event.clientY
  updateLayerInsertIndex(event.clientY)
}

const applyLayerDrop = () => {
  const activeId = layerDragState.activeId
  if (!activeId) {
    return
  }

  const topToBottom = [...layerNodes.value]
  const activeIndex = topToBottom.findIndex((node) => node.id === activeId)
  if (activeIndex === -1 || layerDragState.insertIndex < 0) {
    return
  }

  const [movedNode] = topToBottom.splice(activeIndex, 1)
  topToBottom.splice(Math.max(0, Math.min(layerDragState.insertIndex, topToBottom.length)), 0, movedNode)
  nodes.value = topToBottom
}

const finishLayerDrag = (commit = false) => {
  if (commit) {
    applyLayerDrop()
  }
  window.removeEventListener('pointermove', handleLayerPointerMove)
  window.removeEventListener('pointerup', handleLayerPointerUp)
  window.removeEventListener('pointercancel', handleLayerPointerUp)
  layerDragState.activeId = ''
  layerDragState.insertIndex = -1
  layerDragState.pointerId = -1
  layerDragState.startY = 0
  layerDragState.currentY = 0
}

const handleLayerPointerUp = (event: PointerEvent) => {
  if (event.pointerId !== layerDragState.pointerId) {
    return
  }
  finishLayerDrag(true)
}

const startLayerDrag = (event: PointerEvent, nodeId: string) => {
  if (event.button !== 0) {
    return
  }
  event.preventDefault()
  event.stopPropagation()
  layerDragState.activeId = nodeId
  layerDragState.pointerId = event.pointerId
  layerDragState.startY = event.clientY
  layerDragState.currentY = event.clientY
  layerDragState.insertIndex = layerNodes.value.findIndex((node) => node.id === nodeId)
  updateLayerInsertIndex(event.clientY)
  window.addEventListener('pointermove', handleLayerPointerMove)
  window.addEventListener('pointerup', handleLayerPointerUp)
  window.addEventListener('pointercancel', handleLayerPointerUp)
}

const getVisibleInsertIndex = () => {
  const activeId = layerDragState.activeId
  const activeIndex = layerNodes.value.findIndex((node) => node.id === activeId)
  const filteredIndex = layerDragState.insertIndex
  if (activeIndex === -1 || filteredIndex < 0) {
    return -1
  }
  if (filteredIndex === activeIndex) {
    return -1
  }
  return filteredIndex <= activeIndex ? filteredIndex : filteredIndex + 1
}

const getLayerItemStyle = (nodeId: string) => {
  if (nodeId !== layerDragState.activeId) {
    return undefined
  }
  return {
    transform: `translateY(${layerDragState.currentY - layerDragState.startY}px) scale(1.01)`,
  }
}

const borderEdges: EdgeKey[] = ['top', 'right', 'bottom', 'left']
const radiusCorners: CornerKey[] = ['topLeft', 'topRight', 'bottomRight', 'bottomLeft']

const updateBorderEdge = (
  edge: EdgeKey,
  field: keyof BorderEdgeValue,
  value: BorderEdgeValue[keyof BorderEdgeValue],
) => {
  if (!selectedNode.value) {
    return
  }
  if (borderEditMode.value === 'linked') {
    borderEdges.forEach((key) => {
      selectedNode.value!.border.edges[key][field] = value as never
    })
    return
  }
  selectedNode.value.border.edges[edge][field] = value as never
}

const updateRadiusCorner = (
  corner: CornerKey,
  field: keyof CornerValue,
  value: CornerValue[keyof CornerValue],
) => {
  if (!selectedNode.value) {
    return
  }
  if (radiusEditMode.value === 'linked') {
    radiusCorners.forEach((key) => {
      selectedNode.value!.radius.corners[key][field] = value as never
    })
    return
  }
  selectedNode.value.radius.corners[corner][field] = value as never
}

const setZoom = (nextZoom: number) => {
  const clampedZoom = Math.max(minZoom, Math.min(maxZoom, nextZoom))
  if (clampedZoom === zoom.value) {
    return
  }
  const scaleRatio = clampedZoom / zoom.value
  workspaceOffset.x *= scaleRatio
  workspaceOffset.y *= scaleRatio
  zoom.value = clampedZoom
}

const zoomIn = () => {
  setZoom(zoom.value + 10)
}

const zoomOut = () => {
  setZoom(zoom.value - 10)
}

const resetZoom = () => {
  setZoom(100)
}

const handleWheel = (event: WheelEvent) => {
  if (!event.ctrlKey && !event.metaKey) {
    return
  }
  event.preventDefault()
  if (event.deltaY > 0) {
    setZoom(zoom.value - 10)
  } else {
    setZoom(zoom.value + 10)
  }
}

const dragState = reactive({
  activeId: '',
  startX: 0,
  startY: 0,
  originX: 0,
  originY: 0,
  pointerId: -1,
})

const resizeState = reactive({
  activeId: '',
  handle: '' as ResizeHandle | '',
  startX: 0,
  startY: 0,
  originX: 0,
  originY: 0,
  originWidth: 0,
  originHeight: 0,
  pointerId: -1,
})

const spacePressed = ref(false)
const canvasPanning = reactive({
  active: false,
  startX: 0,
  startY: 0,
  originX: 0,
  originY: 0,
})

const stopCanvasDrag = () => {
  window.removeEventListener('pointermove', handleCanvasDrag)
  window.removeEventListener('pointerup', stopCanvasDrag)
  window.removeEventListener('pointercancel', stopCanvasDrag)
  dragState.activeId = ''
  dragState.pointerId = -1
}

const stopResizeDrag = () => {
  window.removeEventListener('pointermove', handleResizeDrag)
  window.removeEventListener('pointerup', stopResizeDrag)
  window.removeEventListener('pointercancel', stopResizeDrag)
  resizeState.activeId = ''
  resizeState.handle = ''
  resizeState.pointerId = -1
}

const handleCanvasDrag = (event: PointerEvent) => {
  if (!dragState.activeId || event.pointerId !== dragState.pointerId) {
    return
  }
  const node = nodes.value.find((item) => item.id === dragState.activeId)
  if (!node) {
    return
  }
  const scale = zoom.value / 100
  node.x = Math.max(0, Math.round(dragState.originX + (event.clientX - dragState.startX) / scale))
  node.y = Math.max(0, Math.round(dragState.originY + (event.clientY - dragState.startY) / scale))
}

const startCanvasDrag = (event: PointerEvent, node: ContainerNode) => {
  if (spacePressed.value || event.button !== 0) {
    return
  }
  event.preventDefault()
  selectNode(node.id)
  dragState.activeId = node.id
  dragState.pointerId = event.pointerId
  dragState.startX = event.clientX
  dragState.startY = event.clientY
  dragState.originX = node.x
  dragState.originY = node.y
  window.addEventListener('pointermove', handleCanvasDrag)
  window.addEventListener('pointerup', stopCanvasDrag)
  window.addEventListener('pointercancel', stopCanvasDrag)
}

const handleResizeDrag = (event: PointerEvent) => {
  if (!resizeState.activeId || event.pointerId !== resizeState.pointerId) {
    return
  }
  const node = nodes.value.find((item) => item.id === resizeState.activeId)
  if (!node) {
    return
  }
  const scale = zoom.value / 100
  const deltaX = (event.clientX - resizeState.startX) / scale
  const deltaY = (event.clientY - resizeState.startY) / scale
  const minWidth = 80
  const minHeight = 60

  let nextX = resizeState.originX
  let nextY = resizeState.originY
  let nextWidth = resizeState.originWidth
  let nextHeight = resizeState.originHeight

  if (resizeState.handle === 'top-left' || resizeState.handle === 'bottom-left' || resizeState.handle === 'left') {
    nextWidth = Math.max(minWidth, resizeState.originWidth - deltaX)
    nextX = resizeState.originX + (resizeState.originWidth - nextWidth)
  }
  if (resizeState.handle === 'top-right' || resizeState.handle === 'bottom-right' || resizeState.handle === 'right') {
    nextWidth = Math.max(minWidth, resizeState.originWidth + deltaX)
  }
  if (resizeState.handle === 'top-left' || resizeState.handle === 'top-right' || resizeState.handle === 'top') {
    nextHeight = Math.max(minHeight, resizeState.originHeight - deltaY)
    nextY = resizeState.originY + (resizeState.originHeight - nextHeight)
  }
  if (resizeState.handle === 'bottom-left' || resizeState.handle === 'bottom-right' || resizeState.handle === 'bottom') {
    nextHeight = Math.max(minHeight, resizeState.originHeight + deltaY)
  }

  node.x = Math.max(0, Math.round(nextX))
  node.y = Math.max(0, Math.round(nextY))
  node.width = Math.round(nextWidth)
  node.height = Math.round(nextHeight)
}

const startResizeDrag = (event: PointerEvent, node: ContainerNode, handle: ResizeHandle) => {
  if (spacePressed.value || event.button !== 0) {
    return
  }
  event.preventDefault()
  event.stopPropagation()
  selectNode(node.id)
  resizeState.activeId = node.id
  resizeState.handle = handle
  resizeState.pointerId = event.pointerId
  resizeState.startX = event.clientX
  resizeState.startY = event.clientY
  resizeState.originX = node.x
  resizeState.originY = node.y
  resizeState.originWidth = node.width
  resizeState.originHeight = node.height
  window.addEventListener('pointermove', handleResizeDrag)
  window.addEventListener('pointerup', stopResizeDrag)
  window.addEventListener('pointercancel', stopResizeDrag)
}

const stopCanvasPan = () => {
  window.removeEventListener('pointermove', handleCanvasPan)
  window.removeEventListener('pointerup', stopCanvasPan)
  window.removeEventListener('pointercancel', stopCanvasPan)
  canvasPanning.active = false
}

const handleCanvasPan = (event: PointerEvent) => {
  if (!canvasPanning.active) {
    return
  }
  workspaceOffset.x = canvasPanning.originX + (event.clientX - canvasPanning.startX)
  workspaceOffset.y = canvasPanning.originY + (event.clientY - canvasPanning.startY)
}

const startCanvasPan = (event: PointerEvent | MouseEvent) => {
  if (!spacePressed.value || event.button !== 0) {
    return
  }
  event.preventDefault()
  event.stopPropagation()
  canvasPanning.active = true
  canvasPanning.startX = event.clientX
  canvasPanning.startY = event.clientY
  canvasPanning.originX = workspaceOffset.x
  canvasPanning.originY = workspaceOffset.y
  window.addEventListener('pointermove', handleCanvasPan)
  window.addEventListener('pointerup', stopCanvasPan)
  window.addEventListener('pointercancel', stopCanvasPan)
}

const handleKeyDown = (event: KeyboardEvent) => {
  if (event.code !== 'Space') {
    return
  }
  const target = event.target as HTMLElement | null
  if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
    return
  }
  if (target?.isContentEditable) {
    return
  }
  event.preventDefault()
  spacePressed.value = true
}

const handleKeyUp = (event: KeyboardEvent) => {
  if (event.code !== 'Space') {
    return
  }
  spacePressed.value = false
  stopCanvasPan()
}

onMounted(() => {
  rootRef.value?.focus()
  document.addEventListener('keydown', handleKeyDown, true)
  document.addEventListener('keyup', handleKeyUp, true)
  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('keyup', handleKeyUp)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeyDown, true)
  document.removeEventListener('keyup', handleKeyUp, true)
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('keyup', handleKeyUp)
  stopCanvasDrag()
  stopResizeDrag()
  stopCanvasPan()
})

const getNodeStyle = (node: ContainerNode) => {
  const stackIndex = nodes.value.length - nodes.value.findIndex((item) => item.id === node.id)
  const borderRadius = [
    node.radius.corners.topLeft.visible ? node.radius.corners.topLeft.radius : 0,
    node.radius.corners.topRight.visible ? node.radius.corners.topRight.radius : 0,
    node.radius.corners.bottomRight.visible ? node.radius.corners.bottomRight.radius : 0,
    node.radius.corners.bottomLeft.visible ? node.radius.corners.bottomLeft.radius : 0,
  ]
    .map((value) => `${value}px`)
    .join(' ')

  const getEdgeBorder = (edge: BorderEdgeValue) => {
    return edge.visible ? `${edge.width}px ${edge.style} ${edge.color ?? 'transparent'}` : '0 solid transparent'
  }

  return {
    left: `${node.x}px`,
    top: `${node.y}px`,
    zIndex: node.id === selectedNodeId.value && selectedTarget.value === 'node' ? nodes.value.length + 10 : stackIndex,
    width: `${node.width}px`,
    height: `${node.height}px`,
    padding: `${node.padding.top}px ${node.padding.right}px ${node.padding.bottom}px ${node.padding.left}px`,
    borderTop: getEdgeBorder(node.border.edges.top),
    borderRight: getEdgeBorder(node.border.edges.right),
    borderBottom: getEdgeBorder(node.border.edges.bottom),
    borderLeft: getEdgeBorder(node.border.edges.left),
    borderRadius,
    backgroundColor: node.background.color || 'transparent',
    backgroundImage: node.background.image ? `url(${node.background.image})` : 'none',
    backgroundSize: node.background.size,
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
  }
}
</script>

<template>
  <div ref="rootRef" class="designer-page" tabindex="0">
    <aside class="designer-page__sidebar" :class="{ 'is-open': leftDrawerOpen }">
      <button class="designer-page__sidebar-toggle" type="button" @click="leftDrawerOpen = !leftDrawerOpen">
        {{ leftDrawerOpen ? '收起' : '展开' }}
      </button>
      <div class="designer-page__sidebar-body">
        <div class="panel-card">
          <div class="panel-card__header">
            <span>组件库</span>
            <el-tag size="small" type="primary">容器</el-tag>
          </div>
          <button class="component-card" type="button" @click="addContainer">
            <span class="component-card__title">基础容器</span>
            <span class="component-card__desc">当前唯一支持的布局容器，可拖入画布后继续扩展。</span>
          </button>
        </div>

        <div class="panel-card">
          <div class="panel-card__header">
            <span>画布</span>
            <span class="panel-card__muted">{{ canvasSize.width }} x {{ canvasSize.height }}</span>
          </div>
          <div class="canvas-toolbar">
            <el-button size="small" @click="zoomOut">缩小</el-button>
            <el-button size="small" @click="resetZoom">{{ zoom }}%</el-button>
            <el-button size="small" @click="zoomIn">放大</el-button>
          </div>
          <p class="panel-card__tip">按住 Ctrl 或 Command 滚轮也能缩放，拖拽容器可调整画布位置。</p>
        </div>

        <div class="panel-card">
          <div class="panel-card__header">
            <span>容器层级</span>
            <span class="panel-card__muted">{{ nodes.length }} 个</span>
          </div>
          <div v-if="layerNodes.length" ref="layerListRef" class="layer-list">
            <div
              class="layer-drop-zone"
              :class="{ 'is-active': getVisibleInsertIndex() === 0 }"
            />
            <button
              v-for="(node, index) in layerNodes"
              :key="node.id"
              :data-node-id="node.id"
              class="layer-item"
              :class="{
                'is-selected': node.id === selectedNodeId && selectedTarget === 'node',
                'is-dragging': node.id === layerDragState.activeId,
                'is-drop-before': getVisibleInsertIndex() === index,
                'is-drop-after': getVisibleInsertIndex() === index + 1,
              }"
              :style="getLayerItemStyle(node.id)"
              type="button"
              @click="selectNode(node.id)"
            >
              <div class="layer-item__info">
                <span class="layer-item__name">{{ node.name }}</span>
                <span class="layer-item__meta">{{ node.width }} x {{ node.height }}</span>
              </div>
              <span class="layer-item__grip" @pointerdown="startLayerDrag($event, node.id)">⋮⋮</span>
            </button>
            <div
              class="layer-drop-zone"
              :class="{ 'is-active': getVisibleInsertIndex() === layerNodes.length }"
            />
          </div>
          <div v-else class="empty-state empty-state--compact">还没有容器，先从上面新增一个。</div>
        </div>
      </div>
    </aside>

    <div class="designer-page__hud">
      <div class="pan-indicator" :class="{ 'is-active': spacePressed || canvasPanning.active }">
        {{
          canvasPanning.active
            ? `正在拖动画布 · ${workspaceDebugText}`
            : spacePressed
              ? `空格平移模式已开启 · ${workspaceDebugText}`
              : `按住空格可拖动画布 · ${workspaceDebugText}`
        }}
      </div>
    </div>

    <section
      class="canvas-stage"
      :class="{ 'is-space-panning': spacePressed, 'is-panning': canvasPanning.active }"
      @pointerdown="startCanvasPan"
      @wheel="handleWheel"
    >
      <div class="canvas-stage__viewport">
        <div class="canvas-grid">
          <div class="canvas-board" :style="canvasBoardStyle">
            <div
              class="canvas-board__surface"
              :style="canvasSurfaceStyle"
              @click.stop="selectCanvas"
            >
              <div
                v-for="node in nodes"
                :key="node.id"
                class="canvas-node"
                :class="{ 'is-selected': node.id === selectedNodeId && selectedTarget === 'node' }"
                :style="getNodeStyle(node)"
                @pointerdown.stop.prevent="spacePressed ? startCanvasPan($event) : startCanvasDrag($event, node)"
                @click.stop="selectNode(node.id)"
              >
                <template v-if="node.id === selectedNodeId && selectedTarget === 'node'">
                  <button
                    class="canvas-node__resize-handle canvas-node__resize-handle--top-left"
                    type="button"
                    @pointerdown.stop.prevent="startResizeDrag($event, node, 'top-left')"
                  />
                  <button
                    class="canvas-node__resize-handle canvas-node__resize-handle--top-right"
                    type="button"
                    @pointerdown.stop.prevent="startResizeDrag($event, node, 'top-right')"
                  />
                  <button
                    class="canvas-node__resize-handle canvas-node__resize-handle--bottom-right"
                    type="button"
                    @pointerdown.stop.prevent="startResizeDrag($event, node, 'bottom-right')"
                  />
                  <button
                    class="canvas-node__resize-handle canvas-node__resize-handle--bottom-left"
                    type="button"
                    @pointerdown.stop.prevent="startResizeDrag($event, node, 'bottom-left')"
                  />
                  <div
                    class="canvas-node__resize-edge canvas-node__resize-edge--top"
                    @pointerdown.stop.prevent="startResizeDrag($event, node, 'top')"
                  />
                  <div
                    class="canvas-node__resize-edge canvas-node__resize-edge--right"
                    @pointerdown.stop.prevent="startResizeDrag($event, node, 'right')"
                  />
                  <div
                    class="canvas-node__resize-edge canvas-node__resize-edge--bottom"
                    @pointerdown.stop.prevent="startResizeDrag($event, node, 'bottom')"
                  />
                  <div
                    class="canvas-node__resize-edge canvas-node__resize-edge--left"
                    @pointerdown.stop.prevent="startResizeDrag($event, node, 'left')"
                  />
                </template>
                <div class="canvas-node__meta">
                  <span>{{ node.name }}</span>
                  <span>{{ node.width }} x {{ node.height }}</span>
                </div>
                <div class="canvas-node__content"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <aside class="designer-inspector" :class="{ 'is-open': drawerOpen }">
      <button class="designer-inspector__toggle" type="button" @click="drawerOpen = !drawerOpen">
        {{ drawerOpen ? '收起' : '展开' }}
      </button>
      <div class="drawer-panel">
        <div class="drawer-panel__body">
          <div class="drawer-panel__header">
            <div class="drawer-panel__header-row">
              <div>
              <strong>{{ isCanvasSelected ? '画布' : selectedNode?.name ?? '未选中容器' }}</strong>
              <p>{{ isCanvasSelected ? '当前正在编辑画布属性。' : '当前只维护一种容器类型，后续可以在这个 schema 上继续扩展。' }}</p>
              </div>
              <el-button
                v-if="selectedNode"
                type="danger"
                plain
                size="small"
                @click="removeNode(selectedNode.id)"
              >
                删除
              </el-button>
            </div>
          </div>

          <el-tabs v-model="activeTab" stretch>
            <el-tab-pane label="管理设置" name="manage">
              <div class="empty-state">管理设置预留中，后续接入事件、数据源和层级能力。</div>
            </el-tab-pane>

            <el-tab-pane label="样式" name="style">
              <template v-if="isCanvasSelected">
              <section class="form-section">
                <div class="form-section__title">尺寸</div>
                <div class="inline-grid">
                  <div class="field-card field-card--inline">
                    <span>宽度</span>
                    <DragNumberField
                      v-model="canvasSize.width"
                      :min="320"
                      :max="3840"
                      :presets="canvasWidthPresets"
                    />
                  </div>
                  <div class="field-card field-card--inline">
                    <span>高度</span>
                    <DragNumberField
                      v-model="canvasSize.height"
                      :min="180"
                      :max="2160"
                      :presets="canvasHeightPresets"
                    />
                  </div>
                </div>
              </section>
              <section class="form-section">
                <div class="form-section__title">背景</div>
                <div class="stack-grid">
                  <div class="inline-grid inline-grid--background">
                    <div class="field-card field-card--inline field-card--color-inline">
                      <span>背景颜色</span>
                      <el-color-picker v-model="canvasBackground.color" show-alpha />
                    </div>
                    <div class="field-card field-card--inline">
                      <span>填充方式</span>
                      <el-select v-model="canvasBackground.size">
                        <el-option label="覆盖铺满" value="cover" />
                        <el-option label="完整显示" value="contain" />
                        <el-option label="拉伸填满" value="100% 100%" />
                        <el-option label="原始尺寸" value="auto" />
                      </el-select>
                    </div>
                  </div>
                  <div class="field-card">
                    <span>背景图</span>
                    <el-input
                      v-model="canvasBackground.image"
                      placeholder="输入图片地址"
                      clearable
                    />
                  </div>
                </div>
              </section>
              </template>
              <template v-else-if="selectedNode">
              <section class="form-section">
                <div class="form-section__title">位置</div>
                <div class="inline-grid">
                  <div class="field-card field-card--inline">
                    <span>X</span>
                    <DragNumberField
                      v-model="selectedNode.x"
                      :min="0"
                      :max="canvasSize.width"
                      :presets="nodeXPresets"
                    />
                  </div>
                  <div class="field-card field-card--inline">
                    <span>Y</span>
                    <DragNumberField
                      v-model="selectedNode.y"
                      :min="0"
                      :max="canvasSize.height"
                      :presets="nodeYPresets"
                    />
                  </div>
                </div>
              </section>

              <section class="form-section">
                <div class="form-section__title">尺寸</div>
                <div class="inline-grid">
                  <div class="field-card field-card--inline">
                    <span>宽度</span>
                    <DragNumberField
                      v-model="selectedNode.width"
                      :min="40"
                      :max="canvasSize.width"
                      :presets="nodeWidthPresets"
                    />
                  </div>
                  <div class="field-card field-card--inline">
                    <span>高度</span>
                    <DragNumberField
                      v-model="selectedNode.height"
                      :min="40"
                      :max="canvasSize.height"
                      :presets="nodeHeightPresets"
                    />
                  </div>
                </div>
              </section>

              <section class="form-section">
                <div class="form-section__title">内边距</div>
                <BoxSpacingEditor v-model="selectedNode.padding" />
              </section>

              <section class="form-section">
                <div class="form-section__title">边框</div>
                <div class="mode-switch">
                  <el-radio-group v-model="borderEditMode" size="small">
                    <el-radio-button label="linked">统一修改</el-radio-button>
                    <el-radio-button label="split">分别修改</el-radio-button>
                  </el-radio-group>
                </div>
                <div class="stack-grid">
                  <div class="inline-grid">
                    <div class="field-card">
                      <span class="field-card__title">上边</span>
                      <div class="field-card__compact-grid">
                        <DragNumberField
                          :model-value="selectedNode.border.edges.top.width"
                          :min="0"
                          :max="40"
                          :presets="borderWidthPresets"
                          @update:model-value="(value) => updateBorderEdge('top', 'width', value)"
                        />
                        <el-switch
                          :model-value="selectedNode.border.edges.top.visible"
                          inline-prompt
                          active-text="显示"
                          inactive-text="隐藏"
                          @update:model-value="(value: boolean) => updateBorderEdge('top', 'visible', value)"
                        />
                        <div class="field-card__wide-control">
                          <el-select
                            :model-value="selectedNode.border.edges.top.style"
                            @update:model-value="(value: 'solid' | 'dashed' | 'dotted') => updateBorderEdge('top', 'style', value)"
                          >
                            <el-option label="实线" value="solid" />
                            <el-option label="虚线" value="dashed" />
                            <el-option label="点线" value="dotted" />
                          </el-select>
                        </div>
                        <div class="field-card__color-control">
                          <el-color-picker
                            :model-value="selectedNode.border.edges.top.color"
                            show-alpha
                            @update:model-value="(value: string | null) => updateBorderEdge('top', 'color', value)"
                          />
                        </div>
                      </div>
                    </div>
                    <div class="field-card">
                      <span class="field-card__title">右边</span>
                      <div class="field-card__compact-grid">
                        <DragNumberField
                          :model-value="selectedNode.border.edges.right.width"
                          :min="0"
                          :max="40"
                          :presets="borderWidthPresets"
                          @update:model-value="(value) => updateBorderEdge('right', 'width', value)"
                        />
                        <el-switch
                          :model-value="selectedNode.border.edges.right.visible"
                          inline-prompt
                          active-text="显示"
                          inactive-text="隐藏"
                          @update:model-value="(value: boolean) => updateBorderEdge('right', 'visible', value)"
                        />
                        <div class="field-card__wide-control">
                          <el-select
                            :model-value="selectedNode.border.edges.right.style"
                            @update:model-value="(value: 'solid' | 'dashed' | 'dotted') => updateBorderEdge('right', 'style', value)"
                          >
                            <el-option label="实线" value="solid" />
                            <el-option label="虚线" value="dashed" />
                            <el-option label="点线" value="dotted" />
                          </el-select>
                        </div>
                        <div class="field-card__color-control">
                          <el-color-picker
                            :model-value="selectedNode.border.edges.right.color"
                            show-alpha
                            @update:model-value="(value: string | null) => updateBorderEdge('right', 'color', value)"
                          />
                        </div>
                      </div>
                    </div>
                    <div class="field-card">
                      <span class="field-card__title">下边</span>
                      <div class="field-card__compact-grid">
                        <DragNumberField
                          :model-value="selectedNode.border.edges.bottom.width"
                          :min="0"
                          :max="40"
                          :presets="borderWidthPresets"
                          @update:model-value="(value) => updateBorderEdge('bottom', 'width', value)"
                        />
                        <el-switch
                          :model-value="selectedNode.border.edges.bottom.visible"
                          inline-prompt
                          active-text="显示"
                          inactive-text="隐藏"
                          @update:model-value="(value: boolean) => updateBorderEdge('bottom', 'visible', value)"
                        />
                        <div class="field-card__wide-control">
                          <el-select
                            :model-value="selectedNode.border.edges.bottom.style"
                            @update:model-value="(value: 'solid' | 'dashed' | 'dotted') => updateBorderEdge('bottom', 'style', value)"
                          >
                            <el-option label="实线" value="solid" />
                            <el-option label="虚线" value="dashed" />
                            <el-option label="点线" value="dotted" />
                          </el-select>
                        </div>
                        <div class="field-card__color-control">
                          <el-color-picker
                            :model-value="selectedNode.border.edges.bottom.color"
                            show-alpha
                            @update:model-value="(value: string | null) => updateBorderEdge('bottom', 'color', value)"
                          />
                        </div>
                      </div>
                    </div>
                    <div class="field-card">
                      <span class="field-card__title">左边</span>
                      <div class="field-card__compact-grid">
                        <DragNumberField
                          :model-value="selectedNode.border.edges.left.width"
                          :min="0"
                          :max="40"
                          :presets="borderWidthPresets"
                          @update:model-value="(value) => updateBorderEdge('left', 'width', value)"
                        />
                        <el-switch
                          :model-value="selectedNode.border.edges.left.visible"
                          inline-prompt
                          active-text="显示"
                          inactive-text="隐藏"
                          @update:model-value="(value: boolean) => updateBorderEdge('left', 'visible', value)"
                        />
                        <div class="field-card__wide-control">
                          <el-select
                            :model-value="selectedNode.border.edges.left.style"
                            @update:model-value="(value: 'solid' | 'dashed' | 'dotted') => updateBorderEdge('left', 'style', value)"
                          >
                            <el-option label="实线" value="solid" />
                            <el-option label="虚线" value="dashed" />
                            <el-option label="点线" value="dotted" />
                          </el-select>
                        </div>
                        <div class="field-card__color-control">
                          <el-color-picker
                            :model-value="selectedNode.border.edges.left.color"
                            show-alpha
                            @update:model-value="(value: string | null) => updateBorderEdge('left', 'color', value)"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section class="form-section">
                <div class="form-section__title">圆角</div>
                <div class="mode-switch">
                  <el-radio-group v-model="radiusEditMode" size="small">
                    <el-radio-button label="linked">统一修改</el-radio-button>
                    <el-radio-button label="split">分别修改</el-radio-button>
                  </el-radio-group>
                </div>
                <div class="stack-grid">
                  <div class="inline-grid">
                    <div class="field-card">
                      <span class="field-card__title">左上半径</span>
                      <div class="field-card__compact-grid">
                        <DragNumberField
                          :model-value="selectedNode.radius.corners.topLeft.radius"
                          :max="200"
                          :presets="radiusPresets"
                          @update:model-value="(value) => updateRadiusCorner('topLeft', 'radius', value)"
                        />
                        <el-switch
                          :model-value="selectedNode.radius.corners.topLeft.visible"
                          inline-prompt
                          active-text="显示"
                          inactive-text="隐藏"
                          @update:model-value="(value: boolean) => updateRadiusCorner('topLeft', 'visible', value)"
                        />
                      </div>
                    </div>
                    <div class="field-card">
                      <span class="field-card__title">右上半径</span>
                      <div class="field-card__compact-grid">
                        <DragNumberField
                          :model-value="selectedNode.radius.corners.topRight.radius"
                          :max="200"
                          :presets="radiusPresets"
                          @update:model-value="(value) => updateRadiusCorner('topRight', 'radius', value)"
                        />
                        <el-switch
                          :model-value="selectedNode.radius.corners.topRight.visible"
                          inline-prompt
                          active-text="显示"
                          inactive-text="隐藏"
                          @update:model-value="(value: boolean) => updateRadiusCorner('topRight', 'visible', value)"
                        />
                      </div>
                    </div>
                    <div class="field-card">
                      <span class="field-card__title">右下半径</span>
                      <div class="field-card__compact-grid">
                        <DragNumberField
                          :model-value="selectedNode.radius.corners.bottomRight.radius"
                          :max="200"
                          :presets="radiusPresets"
                          @update:model-value="(value) => updateRadiusCorner('bottomRight', 'radius', value)"
                        />
                        <el-switch
                          :model-value="selectedNode.radius.corners.bottomRight.visible"
                          inline-prompt
                          active-text="显示"
                          inactive-text="隐藏"
                          @update:model-value="(value: boolean) => updateRadiusCorner('bottomRight', 'visible', value)"
                        />
                      </div>
                    </div>
                    <div class="field-card">
                      <span class="field-card__title">左下半径</span>
                      <div class="field-card__compact-grid">
                        <DragNumberField
                          :model-value="selectedNode.radius.corners.bottomLeft.radius"
                          :max="200"
                          :presets="radiusPresets"
                          @update:model-value="(value) => updateRadiusCorner('bottomLeft', 'radius', value)"
                        />
                        <el-switch
                          :model-value="selectedNode.radius.corners.bottomLeft.visible"
                          inline-prompt
                          active-text="显示"
                          inactive-text="隐藏"
                          @update:model-value="(value: boolean) => updateRadiusCorner('bottomLeft', 'visible', value)"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section class="form-section">
                <div class="form-section__title">背景</div>
                <div class="stack-grid">
                  <div class="inline-grid inline-grid--background">
                    <div class="field-card field-card--inline field-card--color-inline">
                      <span>背景颜色</span>
                      <el-color-picker v-model="selectedNode.background.color" show-alpha />
                    </div>
                    <div class="field-card field-card--inline">
                      <span>填充方式</span>
                      <el-select v-model="selectedNode.background.size">
                        <el-option label="覆盖铺满" value="cover" />
                        <el-option label="完整显示" value="contain" />
                        <el-option label="拉伸填满" value="100% 100%" />
                        <el-option label="原始尺寸" value="auto" />
                      </el-select>
                    </div>
                  </div>
                  <div class="field-card">
                    <span>背景图</span>
                    <el-input
                      v-model="selectedNode.background.image"
                      placeholder="输入图片地址"
                      clearable
                    />
                  </div>
                </div>
              </section>
              </template>
              <div v-else class="empty-state">点击画布空白区域可编辑画布，点击容器可编辑容器样式。</div>
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>
    </aside>
  </div>
</template>

<style scoped>
.designer-page {
  position: relative;
  min-height: 100vh;
  color: #0f172a;
  outline: none;
}

.designer-page:focus {
  outline: none;
}

.designer-page:has(.canvas-stage.is-space-panning),
.designer-page:has(.canvas-stage.is-panning) {
  cursor: grab;
}

.designer-page:has(.canvas-stage.is-panning) {
  cursor: grabbing;
}

.designer-page__sidebar {
  position: fixed;
  top: 20px;
  left: 20px;
  bottom: 20px;
  z-index: 4;
  width: auto;
  padding: 18px 0 18px 18px;
  background: rgba(248, 250, 252, 0.85);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 14px;
  backdrop-filter: blur(18px);
  overflow: visible;
  transform: translateX(calc(-100% + 28px));
  transition: transform 0.22s ease;
}

.designer-page__sidebar.is-open {
  transform: translateX(0);
}

.designer-page__sidebar-toggle {
  position: absolute;
  top: 18px;
  right: -28px;
  width: 28px;
  height: 72px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-left: 0;
  border-radius: 0 10px 10px 0;
  background: rgba(255, 255, 255, 0.92);
  color: #334155;
  font-size: 12px;
  writing-mode: vertical-rl;
  cursor: pointer;
}

.designer-page__sidebar-body {
  height: 100%;
  overflow: auto;
  width: 280px;
  padding: 8px 10px 8px 0;
  scrollbar-gutter: stable;
}

.panel-card {
  margin-bottom: 18px;
  padding: 16px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.86);
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.05);
}

.panel-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
  font-weight: 600;
}

.panel-card__muted,
.panel-card__tip {
  color: #64748b;
  font-size: 12px;
}

.layer-list {
  display: grid;
  gap: 8px;
}

.layer-drop-zone {
  position: relative;
  height: 10px;
  margin: -2px 0;
}

.layer-drop-zone::after {
  content: '';
  position: absolute;
  left: 8px;
  right: 8px;
  top: 50%;
  height: 2px;
  border-radius: 999px;
  background: transparent;
  transform: translateY(-50%);
  transition: background 0.15s ease;
}

.layer-drop-zone.is-active::after {
  background: #2563eb;
}

.layer-item {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
  width: 100%;
  padding: 10px 12px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 8px;
  background: #fff;
  text-align: left;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    background 0.2s ease,
    box-shadow 0.2s ease;
}

.layer-item:hover {
  border-color: rgba(37, 99, 235, 0.28);
  box-shadow: 0 10px 24px rgba(37, 99, 235, 0.08);
}

.layer-item.is-selected {
  border-color: rgba(37, 99, 235, 0.5);
  background: rgba(239, 246, 255, 0.9);
}

.layer-item.is-dragging {
  z-index: 2;
  opacity: 0.96;
  box-shadow: 0 16px 28px rgba(15, 23, 42, 0.18);
  border-color: rgba(37, 99, 235, 0.42);
  transition: none;
  pointer-events: none;
}

.layer-item.is-drop-before::before,
.layer-item.is-drop-after::after {
  content: '';
  position: absolute;
  left: 8px;
  right: 8px;
  height: 2px;
  border-radius: 999px;
  background: #2563eb;
  pointer-events: none;
}

.layer-item.is-drop-before::before {
  top: -5px;
}

.layer-item.is-drop-after::after {
  bottom: -5px;
}

.layer-item__info {
  display: grid;
  min-width: 0;
  gap: 4px;
}

.layer-item__name {
  font-size: 13px;
  font-weight: 600;
  color: #0f172a;
}

.layer-item__meta {
  color: #64748b;
  font-size: 12px;
}

.layer-item__grip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  font-size: 14px;
  letter-spacing: -1px;
  cursor: grab;
  user-select: none;
  touch-action: none;
}

.layer-item__grip:active {
  cursor: grabbing;
}

.component-card {
  width: 100%;
  padding: 14px;
  border: 1px dashed #93c5fd;
  border-radius: 8px;
  background: linear-gradient(135deg, #eff6ff, #ffffff);
  text-align: left;
  cursor: pointer;
}

.component-card__title {
  display: block;
  margin-bottom: 6px;
  font-weight: 600;
}

.component-card__desc {
  display: block;
  color: #64748b;
  font-size: 13px;
  line-height: 1.6;
}

.canvas-toolbar {
  display: flex;
  gap: 8px;
  margin-top: 8px;
  margin-bottom: 10px;
}

.designer-page__hud {
  position: fixed;
  top: 20px;
  left: 50%;
  z-index: 4;
  transform: translateX(-50%);
  pointer-events: none;
}

.pan-indicator {
  padding: 6px 10px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.78);
  color: #64748b;
  font-size: 12px;
  white-space: nowrap;
  transition:
    color 0.2s ease,
    border-color 0.2s ease,
    background 0.2s ease;
}

.pan-indicator.is-active {
  border-color: rgba(37, 99, 235, 0.32);
  background: rgba(219, 234, 254, 0.95);
  color: #1d4ed8;
}

.canvas-stage {
  position: fixed;
  inset: 0;
  overflow: hidden;
  background:
    linear-gradient(90deg, rgba(148, 163, 184, 0.15) 1px, transparent 1px) 0 0 / 24px 24px,
    linear-gradient(rgba(148, 163, 184, 0.15) 1px, transparent 1px) 0 0 / 24px 24px,
    linear-gradient(180deg, rgba(255, 255, 255, 0.95), rgba(241, 245, 249, 0.95));
}

.canvas-stage__viewport {
  position: absolute;
  inset: 0;
  overflow: hidden;
  user-select: none;
}

.canvas-stage.is-space-panning {
  cursor: grab;
}

.canvas-stage.is-panning {
  cursor: grabbing;
}

.canvas-stage.is-space-panning .canvas-node,
.canvas-stage.is-panning .canvas-node {
  cursor: inherit;
}

.canvas-grid {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  pointer-events: none;
}

.canvas-board {
  position: absolute;
  transform-origin: center center;
  will-change: transform;
  pointer-events: auto;
}

.canvas-board__surface {
  position: relative;
  overflow: hidden;
  border-radius: 12px;
  box-shadow:
    0 20px 50px rgba(15, 23, 42, 0.08),
    inset 0 0 0 1px rgba(100, 116, 139, 0.24);
}

.canvas-board__surface::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  border: 1px solid rgba(59, 130, 246, 0.12);
  border-radius: inherit;
}

.canvas-node {
  position: absolute;
  display: flex;
  flex-direction: column;
  cursor: move;
  transition:
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.canvas-node__resize-handle {
  position: absolute;
  z-index: 2;
  width: 12px;
  height: 12px;
  padding: 0;
  border: 2px solid #2563eb;
  border-radius: 50%;
  background: #fff;
  cursor: nwse-resize;
}

.canvas-node__resize-handle--top-left {
  top: -11px;
  left: -11px;
  cursor: nwse-resize;
}

.canvas-node__resize-handle--top-right {
  top: -11px;
  right: -11px;
  cursor: nesw-resize;
}

.canvas-node__resize-handle--bottom-right {
  right: -11px;
  bottom: -11px;
  cursor: nwse-resize;
}

.canvas-node__resize-handle--bottom-left {
  left: -11px;
  bottom: -11px;
  cursor: nesw-resize;
}

.canvas-node__resize-edge {
  position: absolute;
  z-index: 1;
  background: transparent;
}

.canvas-node__resize-edge--top {
  top: -12px;
  left: 10px;
  right: 10px;
  height: 20px;
  cursor: ns-resize;
}

.canvas-node__resize-edge--right {
  top: 10px;
  right: -12px;
  bottom: 10px;
  width: 20px;
  cursor: ew-resize;
}

.canvas-node__resize-edge--bottom {
  bottom: -12px;
  left: 10px;
  right: 10px;
  height: 20px;
  cursor: ns-resize;
}

.canvas-node__resize-edge--left {
  top: 10px;
  left: -12px;
  bottom: 10px;
  width: 20px;
  cursor: ew-resize;
}

.canvas-node:hover {
  box-shadow: 0 10px 30px rgba(37, 99, 235, 0.12);
}

.canvas-node.is-selected {
  outline: 2px solid #2563eb;
  outline-offset: 4px;
}

.canvas-node__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  color: #334155;
  font-size: 12px;
}

.canvas-node__content {
  flex: 1;
  min-height: 60px;
  background: transparent;
}

.designer-inspector {
  position: fixed;
  top: 20px;
  right: 20px;
  bottom: 20px;
  z-index: 5;
  width: auto;
  transform: translateX(calc(100% - 28px));
  transition: transform 0.22s ease;
}

.designer-inspector.is-open {
  transform: translateX(0);
}

.designer-inspector__toggle {
  position: absolute;
  top: 18px;
  left: -28px;
  width: 28px;
  height: 72px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-right: 0;
  border-radius: 10px 0 0 10px;
  background: rgba(255, 255, 255, 0.92);
  color: #334155;
  font-size: 12px;
  writing-mode: vertical-rl;
  cursor: pointer;
}

.drawer-panel {
  height: 100%;
  overflow: hidden;
  width: 420px;
  padding: 12px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 14px;
  background: #f5f7fb;
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08);
}

.drawer-panel__body {
  height: 100%;
  overflow: auto;
  padding: 6px 10px 12px 0;
  scrollbar-gutter: stable;
}

.drawer-panel__header {
  margin-bottom: 14px;
}

.drawer-panel__header-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.drawer-panel__header p {
  margin: 6px 0 0;
  color: #64748b;
  font-size: 13px;
  line-height: 1.6;
}

.form-section {
  margin-bottom: 14px;
  padding: 10px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.9);
}

.form-section__title {
  margin-bottom: 10px;
  font-weight: 600;
  font-size: 13px;
}

.mode-switch {
  margin-bottom: 10px;
}

.inline-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
}

.inline-grid--background {
  grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr);
}

.stack-grid {
  display: grid;
  gap: 8px;
}

.field-card {
  display: grid;
  gap: 6px;
  padding: 8px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 6px;
  background: #fff;
  font-size: 12px;
}

.field-card--inline {
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 10px;
}

.field-card--inline :deep(.drag-number-field),
.field-card--inline :deep(.el-select),
.field-card--inline :deep(.el-color-picker) {
  justify-self: end;
}

.field-card--inline :deep(.el-select) {
  width: 100%;
}

.field-card--color-inline {
  grid-template-columns: auto auto;
}

.field-card__title {
  font-weight: 600;
}

.field-card__compact-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 6px;
  align-items: center;
}

.field-card__compact-grid :deep(.el-select),
.field-card__compact-grid :deep(.drag-number-field) {
  width: 100%;
}

.field-card__compact-grid :deep(.el-select) {
  min-width: 0;
}

.field-card__compact-grid :deep(.drag-number-field__trigger) {
  width: 100%;
}

.field-card__wide-control {
  min-width: 0;
}

.field-card__wide-control :deep(.el-select) {
  width: 100%;
  min-width: 0;
}

.field-card__color-control {
  display: flex;
  justify-content: flex-end;
}

.field-card__color-control :deep(.el-color-picker) {
  width: 100%;
  justify-content: flex-end;
}

.field-card__color-control :deep(.el-color-picker__trigger) {
  width: 42px;
  min-width: 42px;
  height: 32px;
  border-radius: 4px;
}

.switch-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 6px;
  background: #fff;
  font-size: 12px;
}

.empty-state {
  padding: 24px;
  border: 1px dashed #cbd5e1;
  border-radius: 8px;
  color: #64748b;
  background: #f8fafc;
  line-height: 1.7;
}

.empty-state--compact {
  padding: 12px;
  font-size: 12px;
}

:deep(.designer-inspector .el-tabs__header) {
  margin-bottom: 12px;
}

:deep(.designer-inspector .el-tabs__nav-wrap::after) {
  height: 1px;
  background: rgba(148, 163, 184, 0.18);
}

:deep(.designer-inspector .el-tabs__item) {
  height: 34px;
  font-size: 12px;
  font-weight: 600;
}

:deep(.designer-inspector .el-input__wrapper),
:deep(.designer-inspector .el-select__wrapper),
:deep(.designer-inspector .el-input-number) {
  border-radius: 4px;
}

@media (max-width: 1200px) {
  .designer-page__sidebar {
    width: 240px;
  }

  .designer-inspector {
    width: 360px;
  }
}
</style>
