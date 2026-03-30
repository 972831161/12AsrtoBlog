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
          <view class="compass">
            <text class="deg">{{ compassDeg }}° NW</text>
            <view class="compass-line"></view>
          </view>
          <view class="exit-btn" @click="closeAR">
            <text class="icon">✕</text>
            <text>退出 AR</text>
          </view>
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
          
          <!-- 漂浮的目标能量舱 (固定在 3D 空间坐标) -->
          <view class="ar-target-3d" :style="target3DPos">
            <view class="target-box" @click="collectCapsule">
              <view class="model-glow"></view>
              <view class="capsule-model">
                <text class="model-icon">{{ activePoint?.icon || '📦' }}</text>
              </view>
              <view class="target-label">
                <text class="name">{{ activePoint?.name }}</text>
                <text class="dist">坐标锚定成功</text>
              </view>
            </view>
          </view>

        </view>
      </view>
    </view>

    <!-- 弹窗部分 -->
    <view class="modal-mask" v-if="selectedPoint" @click="selectedPoint = null">
      <view class="modal-content pb-glass-card" @click.stop>
        <view class="modal-header">
          <text class="icon">{{ selectedPoint.icon }}</text>
          <text class="title">{{ selectedPoint.name }}</text>
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
let stream = null

// 姿态解算变量 (物理空间基准)
const pitch = ref(0) //上下
const yaw = ref(0)   //左右
const roll = ref(0)  //倾斜

let initialPitch = null
let initialYaw = null

const compassDeg = computed(() => Math.floor(280 + yaw.value))

const nearbyPoints = ref([
  { 
    name: '星辰遗迹 #42', 
    distance: 120, 
    icon: '💎', 
    x: 100, y: 120,
    author: '宇宙浪人',
    description: '在这里拍到了最美的晚霞，单车和落日太配了。'
  },
  { 
    name: '补给站能量核心', 
    distance: 350, 
    icon: '⚡️', 
    x: 350, y: 180,
    author: 'PLANET 官方',
    description: '扫码此处 AR 能量舱，可获得 1 积分，兑换咖啡券。'
  },
  { 
    name: '古城墙坐标', 
    distance: 480, 
    icon: '🏯', 
    x: 80, y: 380,
    author: '骑士十二',
    description: '在这条路骑行很久了，希望有人能继续探索下去。'
  }
])

onMounted(() => {
  setTimeout(() => isScanning.value = false, 2500)
  
  // 模拟 Desktop 视差 (鼠标模拟 Yaw 和 Pitch)
  window.addEventListener('mousemove', handleMouseMove)
  // 物理设备陀螺仪
  window.addEventListener('deviceorientation', handleDeviceOrientation, true)
})

onUnmounted(() => {
  window.removeEventListener('mousemove', handleMouseMove)
  window.removeEventListener('deviceorientation', handleDeviceOrientation)
  closeAR()
})

const handleDeviceOrientation = (event) => {
  if (!isARMode.value) return
  
  // beta -> pitch (上下), gamma -> yaw (左右)
  let b = event.beta
  let g = event.gamma
  
  if (initialPitch === null) {
    initialPitch = b
    initialYaw = g
  }
  
  pitch.value = b - initialPitch
  yaw.value = g - initialYaw
}

const handleMouseMove = (e) => {
  if (!isARMode.value || initialYaw !== null) return
  // 鼠标位置映射到 -30 ~ 30 度的旋转模拟
  yaw.value = -(e.clientX - window.innerWidth / 2) / 15
  pitch.value = (e.clientY - window.innerHeight / 2) / 10
}

// 核心转换：利用 CSS 3D 矩阵模拟空间锚定 (逆向补偿)
const worldTransform = computed(() => {
  // 当视角转动时，虚拟世界进行反向旋转，使物体“固定”在视野中某个角度
  return {
    transform: `rotateX(${pitch.value}deg) rotateY(${yaw.value}deg)`
  }
})

// 物体在 3D 空间内的绝对坐标 (相对于 initialPitch/initialYaw)
const target3DPos = computed(() => {
  return {
    // 将物体推向前方 600px 的深度
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
  
  // 针对 iOS 的运动感知权限申请 (必须用户点击触发)
  if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
    try {
      await DeviceOrientationEvent.requestPermission()
    } catch (e) { console.error('iOS Permission Denied', e) }
  }

  try {
    uni.showLoading({ title: '校准空间锚点...' })
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
            initialPitch = null // 开启瞬间重新校准基准位
            initialYaw = null
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
  uni.showToast({
    title: '🎉 空间坐标匹配成功',
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
      
      .target-box {
        position: relative;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        align-items: center;
        
        .model-glow {
          position: absolute;
          width: 300rpx; height: 300rpx;
          background: radial-gradient(circle, $uni-color-primary 0%, transparent 70%);
          opacity: 0.4;
          animation: modelGlow 2s infinite alternate;
        }
        
        .capsule-model {
          width: 180rpx; height: 180rpx;
          border: 4rpx solid $uni-color-primary;
          border-radius: 40rpx;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 80rpx;
          background: rgba(0, 240, 255, 0.15);
          backdrop-filter: blur(10px);
          animation: float3d 4s infinite ease-in-out;
          box-shadow: 0 0 40rpx rgba(0, 240, 255, 0.6);
          transform: perspective(1000px) rotateY(45deg);
        }
        
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
          .dist { font-size: 18rpx; color: $uni-color-primary; letter-spacing: 2rpx; margin-top: 4rpx; }
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
      pointer-events: auto;
      .compass {
        .deg { font-size: 28rpx; color: $uni-color-primary; font-weight: bold; }
        .compass-line { width: 150rpx; height: 1px; background: $uni-color-primary; opacity: 0.5; margin-top: 10rpx; }
      }
      .exit-btn {
        background: rgba(255, 255, 255, 0.1);
        padding: 15rpx 30rpx;
        border-radius: 50rpx;
        color: #fff;
        font-size: 24rpx;
        backdrop-filter: blur(5px);
        border: 1px solid rgba(255,255,255,0.2);
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
.modal-mask { position: fixed; inset: 0; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 2000; padding: 40rpx; .modal-content { width: 600rpx; padding: 60rpx; border-radius: 40rpx; .modal-header { display: flex; align-items: center; gap: 20rpx; .title { font-size: 36rpx; font-weight: 900; } } .modal-footer { display: flex; flex-direction: column; gap: 20rpx; .btn { text-align: center; padding: 24rpx 0; border-radius: 12rpx; &.primary { background: $uni-color-primary; color: #000; } &.secondary { border: 1px solid rgba(255,255,255,0.2); } } } } }

@keyframes scan { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes pulse { 0% { transform: scale(0.5); opacity: 0; } 100% { transform: scale(1.1); opacity: 0; } }
.safe-bottom { height: 160rpx; }
</style>
