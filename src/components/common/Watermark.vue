<template>
  <div class="watermark-container" ref="watermarkRef"></div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'

const props = defineProps({
  text: {
    type: String,
    default: '水印文本'
  },
  fontSize: {
    type: Number,
    default: 16
  },
  color: {
    type: String,
    default: 'rgba(0, 0, 0, 0.08)'
  },
  rotate: {
    type: Number,
    default: -20
  },
  zIndex: {
    type: Number,
    default: 9999
  }
})

const watermarkRef = ref(null)
let watermarkDiv = null
let observer = null

// 创建水印
const createWatermark = () => {
  if (!watermarkRef.value) return

  // 如果已存在水印，先移除
  if (watermarkDiv) {
    watermarkDiv.remove()
  }

  // 创建 canvas 来绘制水印
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  
  // 设置 canvas 尺寸
  canvas.width = 300
  canvas.height = 200
  
  // 设置字体样式
  ctx.font = `${props.fontSize}px "Microsoft YaHei"`
  ctx.fillStyle = props.color
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  
  // 旋转画布
  ctx.translate(canvas.width / 2, canvas.height / 2)
  ctx.rotate((props.rotate * Math.PI) / 180)
  
  // 绘制文字
  ctx.fillText(props.text, 0, 0)
  
  // 创建水印容器
  watermarkDiv = document.createElement('div')
  watermarkDiv.className = 'watermark-overlay'
  watermarkDiv.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: ${props.zIndex};
    pointer-events: none;
    background-image: url(${canvas.toDataURL('image/png')});
    background-repeat: repeat;
  `
  
  // 添加到页面
  document.body.appendChild(watermarkDiv)
  
  // 监听水印被删除或修改
  observeWatermark()
}

// 监听水印DOM变化，防止被删除
const observeWatermark = () => {
  if (observer) {
    observer.disconnect()
  }
  
  observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      // 检测水印是否被移除
      if (!document.body.contains(watermarkDiv)) {
        createWatermark()
      }
      // 检测水印样式是否被修改
      if (watermarkDiv && mutation.type === 'attributes') {
        createWatermark()
      }
    })
  })
  
  // 观察 body 的子节点变化和属性变化
  observer.observe(document.body, {
    childList: true,
    attributes: true,
    subtree: true
  })
}

// 移除水印
const removeWatermark = () => {
  if (watermarkDiv) {
    watermarkDiv.remove()
    watermarkDiv = null
  }
  if (observer) {
    observer.disconnect()
    observer = null
  }
}

onMounted(() => {
  createWatermark()
})

onBeforeUnmount(() => {
  removeWatermark()
})

// 监听属性变化，重新创建水印
watch(() => [props.text, props.fontSize, props.color, props.rotate], () => {
  createWatermark()
}, { deep: true })
</script>

<style scoped>
.watermark-container {
  display: none;
}
</style>

