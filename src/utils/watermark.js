/**
 * 水印工具函数
 * 用于在页面上创建防删除的水印
 */

class Watermark {
  constructor(options = {}) {
    this.options = {
      text: options.text || '水印文本',
      fontSize: options.fontSize || 16,
      color: options.color || 'rgba(0, 0, 0, 0.08)',
      rotate: options.rotate || -20,
      zIndex: options.zIndex || 9999,
      width: options.width || 300,
      height: options.height || 200,
    }
    this.watermarkDiv = null
    this.observer = null
  }

  // 创建水印
  create() {
    // 如果已存在水印，先移除
    if (this.watermarkDiv) {
      this.remove()
    }

    // 创建 canvas 来绘制水印
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    // 设置 canvas 尺寸
    canvas.width = this.options.width
    canvas.height = this.options.height
    
    // 设置字体样式
    ctx.font = `${this.options.fontSize}px "Microsoft YaHei"`
    ctx.fillStyle = this.options.color
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    
    // 旋转画布
    ctx.translate(canvas.width / 2, canvas.height / 2)
    ctx.rotate((this.options.rotate * Math.PI) / 180)
    
    // 绘制文字（支持多行）
    const lines = this.options.text.split('\n')
    const lineHeight = this.options.fontSize + 5
    lines.forEach((line, index) => {
      const y = (index - (lines.length - 1) / 2) * lineHeight
      ctx.fillText(line, 0, y)
    })
    
    // 创建水印容器
    this.watermarkDiv = document.createElement('div')
    this.watermarkDiv.className = 'watermark-overlay'
    this.watermarkDiv.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: ${this.options.zIndex};
      pointer-events: none;
      background-image: url(${canvas.toDataURL('image/png')});
      background-repeat: repeat;
    `
    
    // 添加到页面
    document.body.appendChild(this.watermarkDiv)
    
    // 监听水印被删除或修改
    this.observe()
  }

  // 监听水印DOM变化，防止被删除
  observe() {
    if (this.observer) {
      this.observer.disconnect()
    }
    
    this.observer = new MutationObserver((mutations) => {
      // 检查水印是否还存在
      let needRecreate = false
      
      // 检测水印是否被移除
      if (this.watermarkDiv && !document.body.contains(this.watermarkDiv)) {
        needRecreate = true
      }
      
      // 如果需要重建，则重新创建
      if (needRecreate) {
        this.create()
      }
    })
    
    // 观察 body 的子节点变化
    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    })

    // 观察水印元素的属性变化
    if (this.watermarkDiv) {
      const attrObserver = new MutationObserver(() => {
        this.create()
      })
      attrObserver.observe(this.watermarkDiv, {
        attributes: true
      })
    }
  }

  // 更新水印文本
  updateText(text) {
    this.options.text = text
    this.create()
  }

  // 移除水印
  remove() {
    if (this.watermarkDiv && document.body.contains(this.watermarkDiv)) {
      this.watermarkDiv.remove()
      this.watermarkDiv = null
    }
    if (this.observer) {
      this.observer.disconnect()
      this.observer = null
    }
  }
}

// 单例模式
let watermarkInstance = null

export const useWatermark = () => {
  const init = (options) => {
    if (!watermarkInstance) {
      watermarkInstance = new Watermark(options)
    } else {
      watermarkInstance.options = { ...watermarkInstance.options, ...options }
    }
    watermarkInstance.create()
    return watermarkInstance
  }

  const update = (text) => {
    if (watermarkInstance) {
      watermarkInstance.updateText(text)
    }
  }

  const remove = () => {
    if (watermarkInstance) {
      watermarkInstance.remove()
      watermarkInstance = null
    }
  }

  return {
    init,
    update,
    remove
  }
}

export default Watermark


