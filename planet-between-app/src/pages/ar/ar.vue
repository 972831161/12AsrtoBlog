<template>
  <view class="container">
    <!-- 雷达扫描界面 (默认) -->
    <view v-if="!isARMode" class="radar-view active">
      <view class="header">
        <text class="title pb-text-glow">宇宙坐标雷达</text>
        <text class="subtitle">UNIVERSE RADAR 2.4.0</text>
      </view>
      
      <view class="radar-container">
        <view class="radar-circle">
          <view class="pulse p1"></view>
          <view class="pulse p2"></view>
          <view class="pulse p3"></view>
          <view class="scanner"></view>
          
          <view 
            v-for="(point, index) in nearbyPoints" 
            :key="index"
            class="target-dot"
            :style="{
              left: point.x + 'rpx',
              top: point.y + 'rpx',
              opacity: isScanning ? 0 : 1
            }"
            @click="showDetail(point)"
          >
            <view class="dot-inner"></view>
            <view class="dot-glow"></view>
          </view>

          <view class="center-dot">
            <text class="icon">🛸</text>
          </view>
        </view>
        
        <view class="status-box pb-glass-card">
          <text class="status-msg" v-if="isScanning">正在同步星际坐标...</text>
          <text class="status-msg" v-else>扫描完成，发现 {{ nearbyPoints.length }} 个能量舱</text>
        </view>
      </view>
      
      <scroll-view scroll-y class="points-list">
        <view 
          v-for="(point, index) in nearbyPoints" 
          :key="index"
          class="point-card pb-glass-card"
          @click="showDetail(point)"
        >
          <view class="point-icon">{{ point.icon }}</view>
          <view class="point-info">
            <text class="point-name">{{ point.name }}</text>
            <text class="point-dist">距离你大约 {{ point.distance }}m</text>
          </view>
          <view class="arrow">探测详情 ></view>
        </view>
        <view class="safe-bottom"></view>
      </scroll-view>
      
      <pb-tabbar currentPath="/pages/ar/ar" />
    </view>

    <!-- AR 实景寻宝界面 (3D 空间锚定版) -->
    <view v-if="isARMode" class="ar-real-view">
      <!-- 实时摄像头容器 -->
      <view id="arVideoContainer" class="video-container"></view>
      <view class="camera-mask"></view>

      <!-- AR HUD 叠加层 (2D UI) -->
      <view class="ar-ui-overlay">
        <view class="hud-top">
          <view class="left-group">
            <view class="compass">
              <text class="deg">{{ compassDeg }}° NW</text>
              <view class="compass-line"></view>
            </view>
          </view>
          
          <view class="right-group">
            <view class="reset-btn" @click="resetAnchor">
              <text class="icon">🔄</text>
              <text>重置锚点</text>
            </view>
            <view class="exit-btn" @click="closeAR">
              <text class="icon">✕</text>
              <text>退出 AR</text>
            </view>
          </view>
        </view>

        <!-- 诊断 HUD (Diagnostic HUD) -->
        <view class="debug-hud" style="position:absolute; top:200rpx; left:40rpx; color:#0f0; font-size:20rpx; z-index:1000; pointer-events:none; background:rgba(0,0,0,0.6); padding:16rpx; border-radius:12rpx; font-family:monospace;">
          <view>姿态: P{{ pitch.toFixed(1) }} Y{{ yaw.toFixed(1) }} R{{ roll.toFixed(1) }}</view>
          <view>位移: X{{ posX.toFixed(0) }} Y{{ posY.toFixed(0) }} Z{{ posZ.toFixed(0) }}</view>
          <view>类型: {{ activePoint?.type }} | 传感器: {{ lastMotionTime > 0 ? '在线' : '等待' }}</view>
        </view>

        <view class="hud-bottom">
          <view class="scan-frame"></view>
          <text class="hint-text">空间已对齐，点击漂浮物以获取</text>
        </view>
      </view>

      <!-- 3D 锚定空间层 -->
      <view class="ar-world-container">
        <!-- 这个容器会根据陀螺仪/鼠标反向旋转，模拟物体钉在固定空间 -->
        <view class="ar-world-inner" :style="worldTransform">
          
          <!-- 漂浮的目标彩蛋 (根据类型分发渲染) -->
          <view class="ar-target-3d" :style="target3DPos">
            
            <!-- Type 1: 物体彩蛋 (Object) -->
            <view v-if="activePoint?.type === 'object'" class="target-object" @click="collectCapsule">
              <view class="model-glow"></view>
              <view class="capsule-model">
                <text class="model-icon">{{ activePoint?.icon || '📦' }}</text>
              </view>
              <view class="target-label">
                <text class="name">{{ activePoint?.name }}</text>
                <text class="tag">物体彩蛋</text>
              </view>
            </view>

            <!-- Type 2: 气泡彩蛋 (Bubble) -->
            <view v-if="activePoint?.type === 'bubble'" class="target-bubble" @click="collectCapsule">
              <view class="speech-bubble">
                <text class="message">{{ activePoint?.message }}</text>
                <view class="bubble-arrow"></view>
              </view>
              <view class="target-label light">
                <text class="name">{{ activePoint?.author }} 的留言</text>
              </view>
            </view>

            <!-- Type 3: 全景彩蛋 (Panorama) -->
            <view v-if="activePoint?.type === 'panorama'" class="target-panorama" @click="collectCapsule">
              <view class="panorama-portal">
                <view class="portal-inner">
                  <text class="icon">🌌</text>
                </view>
                <view class="portal-ring"></view>
              </view>
              <view class="target-label">
                <text class="name">{{ activePoint?.name }}</text>
                <text class="tag">全景传送门</text>
              </view>
            </view>

          </view>
        </view>
      </view>
    </view>

  <!-- 沉浸式全景查看器 (Panorama Viewer) -->
    <view v-if="isPanoramaViewerOpen" class="panorama-viewer-overlay">
      <view class="pano-container">
        <image 
          src="/src/static/ar/erhai.png" 
          class="pano-image"
          :style="{ transform: `translateX(${panoramaOffset}px)` }"
          mode="heightFix"
        ></image>
      </view>
      
      <view class="pano-hud">
        <view class="close-pano" @click="isPanoramaViewerOpen = false">
          <text class="icon">✕</text>
          <text>退出预览</text>
        </view>
        <view class="pano-info">
          <text class="title">洱海晨曦 360°</text>
          <text class="hint">左右转动手机以环顾四周</text>
        </view>
      </view>
    </view>

    <!-- 弹窗部分 -->
    <view class="modal-mask" v-if="selectedPoint" @click="selectedPoint = null">
      <view class="modal-content pb-glass-card" @click.stop>
        <view class="modal-header">
          <text class="icon">{{ selectedPoint.icon }}</text>
          <text class="title">{{ selectedPoint.name }}</text>
          <text class="type-tag" :class="selectedPoint.type">{{ 
            selectedPoint.type === 'object' ? '物体彩蛋' : 
            selectedPoint.type === 'bubble' ? '留言气泡' : '全景传送'
          }}</text>
        </view>
        <view class="modal-body">
          <text class="desc">{{ selectedPoint.description }}</text>
          <view class="author-info">
            <text class="label">投放者：</text>
            <text class="value">{{ selectedPoint.author }}</text>
          </view>
        </view>
        <view class="modal-footer">
          <view class="btn primary" @click="startAR(selectedPoint)">开启 AR 寻宝</view>
          <view class="btn secondary" @click="selectedPoint = null">返回</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted, computed, onUnmounted } from 'vue'
import PbTabbar from '@/components/pb-tabbar.vue'

const isScanning = ref(true)
const selectedPoint = ref(null)
const isARMode = ref(false)
const activePoint = ref(null)
const isPanoramaViewerOpen = ref(false)
let stream = null

// 根据航向角计算全景图偏移
const panoramaOffset = computed(() => {
  // 基础偏移：将图片中心对齐
  const base = -1200 
  // 灵敏度下调，增加稳定性
  return base + (-yaw.value * 12)
})

// 1. 姿态解算 (3DoF Rotation)
const pitch = ref(0)
const yaw = ref(0)
const roll = ref(0)

// 2. 位移估算 (Pseudo 6DoF Translation)
const posX = ref(0)
const posY = ref(0)
const posZ = ref(0)
let velX = 0, velY = 0, velZ = 0
let lastMotionTime = 0

let initialPitch = null
let initialYaw = null

const compassDeg = computed(() => Math.floor(280 + yaw.value))

const nearbyPoints = ref([
  { 
    id: 'p1',
    name: '星辰遗迹 #42', 
    distance: 120, 
    icon: '💎', 
    type: 'object',
    x: 100, y: 120,
    author: '宇宙浪人',
    description: '在这里拍到了最美的晚霞，单车和落日太配了。'
  },
  { 
    id: 'p2',
    name: '时空留言板', 
    distance: 350, 
    icon: '💬', 
    type: 'bubble',
    message: '你好，来自 2026 年的朋友！在这个角落骑行真的很舒服。',
    x: 350, y: 180,
    author: '骑行者 A',
    description: '一条跨越维度的留言。'
  },
  { 
    id: 'p3',
    name: '洱海全景影集', 
    distance: 480, 
    icon: '🖼️', 
    type: 'panorama',
    panoramicUrl: '/assets/ar/erhai_360.jpg',
    x: 80, y: 380,
    author: '骑士十二',
    description: '带你瞬间回到洱海边的那个清晨。'
  }
])

onMounted(() => {
  setTimeout(() => isScanning.value = false, 2500)
  
  // 模拟 Desktop 视差
  window.addEventListener('mousemove', handleMouseMove)
  // 3DoF 陀螺仪
  window.addEventListener('deviceorientation', handleDeviceOrientation, true)
  // 6DoF 位移感知 (加速度)
  window.addEventListener('devicemotion', handleDeviceMotion, true)
})

onUnmounted(() => {
  window.removeEventListener('mousemove', handleMouseMove)
  window.removeEventListener('deviceorientation', handleDeviceOrientation)
  window.removeEventListener('devicemotion', handleDeviceMotion)
  closeAR()
})

const handleDeviceOrientation = (event) => {
  if (!isARMode.value) return
  
  // iOS/Android 姿态标准补全
  let b = event.beta  // Pitch (-180 to 180) - 绕 X 轴
  let g = event.gamma // Roll (-90 to 90) - 绕 Y 轴
  let a = event.alpha // Yaw (0 to 360) - 绕 Z 轴 (指南针)
  
  if (initialPitch === null) {
    initialPitch = b
    initialYaw = a
  }
  
  // 一阶低通滤波
  const alpha = 0.2
  pitch.value = pitch.value * (1 - alpha) + (b - initialPitch) * alpha
  
  // 处理 Alpha 环形跳变 (0-360)
  let yawDiff = a - initialYaw
  if (yawDiff > 180) yawDiff -= 360
  if (yawDiff < -180) yawDiff += 360
  yaw.value = yaw.value * (1 - alpha) + yawDiff * alpha
  
  roll.value = g // 侧倾感
}

// 核心逻辑：双重积分估算位移
const handleDeviceMotion = (event) => {
  if (!isARMode.value) return
  
  const acc = event.acceleration // 排除重力的线性加速度
  if (!acc || acc.x === null) return

  const now = Date.now()
  if (lastMotionTime === 0) {
    lastMotionTime = now
    return
  }

  const dt = (now - lastMotionTime) / 1000 // 单位：秒
  lastMotionTime = now

  // 低通滤波 + 阈值过滤 (消除传感器底噪)
  const threshold = 0.15
  const ax = Math.abs(acc.x) < threshold ? 0 : acc.x
  const ay = Math.abs(acc.y) < threshold ? 0 : acc.y
  const az = Math.abs(acc.z) < threshold ? 0 : acc.z

  // 一阶积分求速度 (单位 m/s)
  velX = (velX + ax * dt) * 0.96 // 阻尼系数，防止漂移失控
  velY = (velY + ay * dt) * 0.96
  velZ = (velZ + az * dt) * 0.96

  // 二阶积分求位移 (放大系数，以匹配 CSS 3D 透视感)
  const scale = 1200 
  posX.value += velX * dt * scale
  posY.value += velY * dt * scale
  posZ.value += velZ * dt * scale
}

const handleMouseMove = (e) => {
  if (!isARMode.value || initialYaw !== null) return
  yaw.value = -(e.clientX - window.innerWidth / 2) / 15
  pitch.value = (e.clientY - window.innerHeight / 2) / 10
}

const resetAnchor = () => {
  initialPitch = null
  initialYaw = null
  posX.value = 0
  posY.value = 0
  posZ.value = 0
  velX = 0; velY = 0; velZ = 0
  lastMotionTime = 0
  uni.showToast({ title: '锚点已重置', icon: 'none' })
}

// 核心转换：整合 6DoF 姿态补偿 (反向抵消手机运动)
const worldTransform = computed(() => {
  return {
    transform: `
      perspective(1200px)
      rotateZ(${-roll.value}deg)
      rotateX(${-pitch.value}deg)
      rotateY(${-yaw.value}deg)
      translate3d(${-posX.value}px, ${posY.value}px, ${-posZ.value}px)
    `
  }
})

const target3DPos = computed(() => {
  return {
    transform: `translate3d(0, 0, -600px)`
  }
})

const showDetail = (point) => {
  selectedPoint.value = point
}

const startAR = async (point) => {
  activePoint.value = point
  selectedPoint.value = null
  isARMode.value = true
  
  // 针对 iOS 的运动感知权限申请 (Orientation & Motion)
  if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
    try {
      await DeviceOrientationEvent.requestPermission()
      if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
        await DeviceMotionEvent.requestPermission()
      }
    } catch (e) { console.error('iOS Permission Denied', e) }
  }

  try {
    uni.showLoading({ title: '初始化空间感应...' })
    stream = await navigator.mediaDevices.getUserMedia({ 
      video: { facingMode: 'environment' }, 
      audio: false 
    })
    
    setTimeout(() => {
      const container = document.getElementById('arVideoContainer')
      if (container) {
        container.innerHTML = ''
        const video = document.createElement('video')
        video.setAttribute('autoplay', '')
        video.setAttribute('muted', '')
        video.setAttribute('playsinline', '')
        video.setAttribute('webkit-playsinline', '')
        video.style.cssText = 'width: 100%; height: 100%; object-fit: cover;'
        video.srcObject = stream
        container.appendChild(video)
        video.onloadedmetadata = () => {
          video.play().then(() => {
            initialPitch = null
            initialYaw = null
            posX.value = 0
            posY.value = 0
            posZ.value = 0
            uni.hideLoading()
          })
        }
      }
    }, 400)
  } catch (err) {
    uni.hideLoading()
    console.error('Camera Access Failed:', err)
  }
}

const closeAR = () => {
  isARMode.value = false
  if (stream) {
    stream.getTracks().forEach(track => track.stop())
  }
}

const collectCapsule = () => {
  if (activePoint.value?.type === 'panorama') {
    isPanoramaViewerOpen.value = true
    return
  }
  
  uni.showToast({
    title: '🎉 能量舱收集成功',
    icon: 'success'
  })
  setTimeout(() => closeAR(), 1500)
}
</script>

<style lang="scss">
.container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  box-sizing: border-box;
  overflow: hidden;
  background: #000;
}

// 3D AR 核心样式
.ar-real-view {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  z-index: 50;
  background: #000;
  
  .video-container {
    position: absolute;
    top: 0; left: 0; width: 100%; height: 100%;
    z-index: 1;
  }
  
  .camera-mask {
    position: absolute;
    top: 0; left: 0; width: 100%; height: 100%;
    background: radial-gradient(circle, transparent 40%, rgba(0,0,0,0.4) 100%);
    z-index: 2;
    pointer-events: none;
  }

  // 3D 摄像机投影平面
  .ar-world-container {
    position: absolute;
    top: 0; left: 0; width: 100%; height: 100%;
    z-index: 10;
    perspective: 1200px; // 模拟人眼透视深度
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
    
    .ar-world-inner {
      width: 100%; height: 100%;
      transform-style: preserve-3d; // 核心：开启 3D 渲染
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.1s linear;
    }
    
    .ar-target-3d {
      transform-style: preserve-3d;
      pointer-events: auto;
      
      .target-label {
        margin-top: 40rpx;
        display: flex;
        flex-direction: column;
        align-items: center;
        background: rgba(0, 0, 0, 0.6);
        padding: 10rpx 30rpx;
        border-radius: 20rpx;
        border-left: 6rpx solid $uni-color-primary;
        backdrop-filter: blur(5px);
        
        .name { font-size: 28rpx; font-weight: bold; color: #fff; }
        .tag { font-size: 18rpx; color: $uni-color-primary; letter-spacing: 2rpx; margin-top: 4rpx; background: rgba(0, 240, 255, 0.1); padding: 2rpx 10rpx; border-radius: 4rpx; }
      }

      // Type 1: Object Styles (Reuse existing)
      .target-object {
        display: flex; flex-direction: column; align-items: center;
        .model-glow { position: absolute; width: 300rpx; height: 300rpx; background: radial-gradient(circle, $uni-color-primary 0%, transparent 70%); opacity: 0.4; animation: modelGlow 2s infinite alternate; }
        .capsule-model { width: 180rpx; height: 180rpx; border: 4rpx solid $uni-color-primary; border-radius: 40rpx; display: flex; align-items: center; justify-content: center; font-size: 80rpx; background: rgba(0, 240, 255, 0.15); backdrop-filter: blur(10px); animation: float3d 4s infinite ease-in-out; box-shadow: 0 0 40rpx rgba(0, 240, 255, 0.6); transform: perspective(1000px) rotateY(45deg); }
      }

      // Type 2: Bubble Styles
      .target-bubble {
        display: flex; flex-direction: column; align-items: center;
        .speech-bubble {
          background: rgba(255, 255, 255, 0.9);
          padding: 30rpx 40rpx;
          border-radius: 30rpx;
          min-width: 300rpx;
          max-width: 500rpx;
          position: relative;
          box-shadow: 0 10rpx 40rpx rgba(0,0,0,0.3);
          animation: float3d 5s infinite ease-in-out;
          
          .message { color: #333; font-size: 30rpx; font-weight: 500; line-height: 1.4; }
          .bubble-arrow {
            position: absolute; bottom: -20rpx; left: 50%; transform: translateX(-50%);
            border-left: 20rpx solid transparent; border-right: 20rpx solid transparent; border-top: 20rpx solid rgba(255, 255, 255, 0.9);
          }
        }
        .target-label.light { border-left-color: #fff; background: rgba(255,255,255,0.2); }
      }

      // Type 3: Panorama Styles
      .target-panorama {
        display: flex; flex-direction: column; align-items: center;
        .panorama-portal {
          width: 250rpx; height: 250rpx; position: relative;
          display: flex; align-items: center; justify-content: center;
          animation: portalSpin 10s linear infinite;
          
          .portal-inner {
            width: 200rpx; height: 200rpx; border-radius: 50%;
            background: radial-gradient(circle, #4f46e5 0%, #000 70%);
            display: flex; align-items: center; justify-content: center;
            font-size: 80rpx; box-shadow: inset 0 0 40rpx #818cf8;
          }
          .portal-ring {
            position: absolute; inset: -10rpx; border: 4rpx dashed $uni-color-primary; border-radius: 50%; opacity: 0.6;
          }
        }
      }
    }
  }

  // UI 平面层 (不随 3D 世界旋转)
  .ar-ui-overlay {
    position: absolute;
    top: 0; left: 0; width: 100%; height: 100%;
    z-index: 20;
    pointer-events: none;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 100rpx 40rpx;
    
    .hud-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      pointer-events: auto;
      
      .left-group { display: flex; align-items: center; }
      .right-group { display: flex; align-items: center; gap: 20rpx; }
      
      .compass {
        .deg { font-size: 28rpx; color: $uni-color-primary; font-weight: bold; }
        .compass-line { width: 150rpx; height: 1px; background: $uni-color-primary; opacity: 0.5; margin-top: 10rpx; }
      }
      
      .reset-btn, .exit-btn {
        background: rgba(255, 255, 255, 0.1);
        padding: 15rpx 25rpx;
        border-radius: 50rpx;
        color: #fff;
        font-size: 24rpx;
        backdrop-filter: blur(8px);
        border: 1px solid rgba(255,255,255,0.2);
        display: flex;
        align-items: center;
        gap: 10rpx;
        transition: all 0.2s;
        &:active { transform: scale(0.9); background: rgba(0, 240, 255, 0.2); }
      }
    }
    
    .hud-bottom {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 30rpx;
      .scan-frame {
        width: 300rpx; height: 300rpx;
        border: 2rpx dashed rgba(255, 255, 255, 0.3);
        position: relative;
        &::after {
          content: ''; position: absolute; inset: -20rpx;
          border: 4rpx solid $uni-color-primary;
          clip-path: polygon(0 0, 30% 0, 30% 2rpx, 0 2rpx, 0 30%, 2rpx 30%, 2rpx 0); // 示意，简化
          border-image: linear-gradient(to right, $uni-color-primary 10%, transparent 10%) 1;
        }
      }
      .hint-text { color: rgba(255, 255, 255, 0.6); font-size: 22rpx; }
    }
  }
}

// 动画
@keyframes modelGlow { 0% { transform: scale(0.8); opacity: 0.2; } 100% { transform: scale(1.4); opacity: 0.5; } }
@keyframes float3d { 0%, 100% { transform: translateZ(0) rotateY(0deg); } 50% { transform: translateZ(50px) rotateY(20deg); } }

// 基础样式复用
.header { padding: 60rpx 40rpx 20rpx; .title { font-size: 48rpx; font-weight: 900; letter-spacing: 4rpx; } .subtitle { font-size: 20rpx; color: $uni-text-color-grey; letter-spacing: 4rpx; margin-top: 8rpx; } }
.radar-container { flex: 1.2; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; .radar-circle { width: 600rpx; height: 600rpx; border-radius: 50%; border: 1px solid rgba(0, 240, 255, 0.2); position: relative; .pulse { position: absolute; top: 0; left: 0; right: 0; bottom: 0; border: 1px solid $uni-color-primary; border-radius: 50%; opacity: 0; animation: pulse 4s infinite; &.p2 { animation-delay: 1.3s; } } .scanner { position: absolute; top: 50%; left: 50%; width: 300rpx; height: 300rpx; background: conic-gradient(from 0deg, rgba(0, 240, 255, 0.4) 0deg, transparent 90deg); transform-origin: 0 0; animation: scan 3s linear infinite; border-radius: 0 100% 0 0; } .center-dot { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 40rpx; } .target-dot { position: absolute; width: 24rpx; height: 24rpx; .dot-inner { width: 100%; height: 100%; background: $uni-color-primary; border-radius: 50%; } } } }
.status-box { margin-top: 60rpx; padding: 20rpx 60rpx; border-radius: 40rpx; .status-msg { font-size: 24rpx; color: $uni-color-primary; font-weight: 600; } }
.points-list { flex: 1; padding: 0 40rpx; .point-card { display: flex; align-items: center; gap: 30rpx; padding: 30rpx 40rpx; margin-bottom: 20rpx; .point-info { flex: 1; .point-name { font-size: 28rpx; font-weight: bold; } } .arrow { font-size: 22rpx; color: $uni-color-primary; } } }
.modal-mask { position: fixed; inset: 0; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 2000; padding: 40rpx; 
  .modal-content { width: 600rpx; padding: 60rpx; border-radius: 40rpx; 
    .modal-header { display: flex; align-items: center; flex-wrap: wrap; gap: 20rpx; 
      .title { font-size: 36rpx; font-weight: 900; } 
      .type-tag { font-size: 18rpx; padding: 4rpx 16rpx; border-radius: 50rpx; font-weight: bold; 
        &.object { background: rgba(0, 240, 255, 0.2); color: $uni-color-primary; border: 1px solid $uni-color-primary; }
        &.bubble { background: rgba(255, 255, 255, 0.2); color: #fff; border: 1px solid rgba(255,255,255,0.4); }
        &.panorama { background: rgba(79, 70, 229, 0.2); color: #818cf8; border: 1px solid #818cf8; }
      }
    } 
    .modal-footer { display: flex; flex-direction: column; gap: 20rpx; .btn { text-align: center; padding: 24rpx 0; border-radius: 12rpx; &.primary { background: $uni-color-primary; color: #000; } &.secondary { border: 1px solid rgba(255,255,255,0.2); } } } 
  } 
}

@keyframes scan { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes portalSpin { from { transform: rotate(0deg) scale(1); } 50% { transform: rotate(180deg) scale(1.1); } to { transform: rotate(360deg) scale(1); } }
@keyframes pulse { 0% { transform: scale(0.5); opacity: 0; } 100% { transform: scale(1.1); opacity: 0; } }
// 全景查看器样式
.panorama-viewer-overlay {
  position: fixed; inset: 0; z-index: 5000; background: #000;
  .pano-container {
    width: 100%; height: 100%; overflow: hidden; display: flex; align-items: center;
    .pano-image {
      height: 100vh; width: auto; min-width: 300vw; will-change: transform;
    }
  }
  .pano-hud {
    position: absolute; bottom: 80rpx; left: 0; right: 0; display: flex; flex-direction: column; align-items: center; gap: 40rpx; pointer-events: none;
    .close-pano {
      pointer-events: auto; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); backdrop-filter: blur(10px); padding: 20rpx 40rpx; border-radius: 50rpx; color: #fff; display: flex; align-items: center; gap: 10rpx; font-size: 24rpx;
    }
    .pano-info {
      text-align: center; color: #fff; text-shadow: 0 4rpx 10rpx rgba(0,0,0,0.5);
      .title { font-size: 32rpx; font-weight: bold; display: block; margin-bottom: 8rpx; }
      .hint { font-size: 20rpx; opacity: 0.7; }
    }
  }
}

.safe-bottom { height: 160rpx; }
</style>
