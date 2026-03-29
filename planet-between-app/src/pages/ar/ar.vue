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

    <!-- AR 实景寻宝界面 -->
    <view v-if="isARMode" class="ar-real-view">
      <!-- 实时摄像头容器 (H5 模拟 - 使用原生 DOM 以绕过封装) -->
      <view id="arVideoContainer" class="video-container"></view>
      <view class="camera-mask"></view>

      <!-- AR HUD 叠加层 -->
      <view class="ar-hud">
        <view class="hud-top">
          <view class="compass">
            <text class="deg">285° NW</text>
            <view class="compass-line"></view>
          </view>
          <view class="exit-btn" @click="closeAR">
            <text class="icon">✕</text>
            <text>退出 AR</text>
          </view>
        </view>

        <!-- 漂浮的目标能量舱 (模拟 3D) -->
        <view class="ar-target" :style="targetStyle">
          <view class="target-box" @click="collectCapsule">
            <view class="model-glow"></view>
            <view class="capsule-model">
              <text class="model-icon">{{ activePoint?.icon || '📦' }}</text>
            </view>
            <view class="target-pointer">
              <view class="aim-line"></view>
              <view class="tag">
                <text class="name">{{ activePoint?.name }}</text>
                <text class="dist">{{ activePoint?.distance }}m</text>
              </view>
            </view>
          </view>
        </view>

        <!-- 底部底部指引 -->
        <view class="hud-bottom">
          <view class="scan-frame"></view>
          <text class="hint-text">已锁定坐标，点击能量舱以获取</text>
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
const videoElement = ref(null)
let stream = null

// Mock 模拟平滑位移效果 (陀螺仪效果模拟)
const offsetX = ref(0)
const offsetY = ref(0)

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
  
  // 模拟陀螺仪细微波动 (Desktop)
  window.addEventListener('mousemove', handleMouseMove)
  // 核心修复：监听物理设备陀螺仪 (Mobile)实现空间锚定
  window.addEventListener('deviceorientation', handleDeviceOrientation, true)
})

onUnmounted(() => {
  window.removeEventListener('mousemove', handleMouseMove)
  window.removeEventListener('deviceorientation', handleDeviceOrientation)
  closeAR()
})

let initialBeta = null
let initialGamma = null

const handleDeviceOrientation = (event) => {
  if (!isARMode.value) return
  
  const { beta, gamma } = event
  
  // 首次记录基准位姿
  if (initialBeta === null) {
      initialBeta = beta
      initialGamma = gamma
  }
  
  // 计算偏移量并反向补偿 (模拟空间固定)
  // 灵敏度系数 15.0，可根据实际体验调整
  offsetX.value = (gamma - initialGamma) * 15
  offsetY.value = (beta - initialBeta) * 15
}

const handleMouseMove = (e) => {
  if (!isARMode.value || initialBeta !== null) return // 如果有陀螺仪，优先使用陀螺仪
  offsetX.value = (e.clientX - window.innerWidth / 2) / 10
  offsetY.value = (e.clientY - window.innerHeight / 2) / 10
}

const targetStyle = computed(() => {
  return {
    transform: `translate(${offsetX.value}px, ${offsetY.value}px)`
  }
})

const showDetail = (point) => {
  selectedPoint.value = point
}

const startAR = async (point) => {
  activePoint.value = point
  selectedPoint.value = null
  isARMode.value = true
  
  try {
    uni.showLoading({ title: '开启 AR 相机...' })
    stream = await navigator.mediaDevices.getUserMedia({ 
      video: { facingMode: 'environment' }, 
      audio: false 
    })
    
    // 强制使用原生 DOM 挂载，彻底解决 uni-video 导致的黑屏/旋转
    setTimeout(() => {
      const container = document.getElementById('arVideoContainer')
      if (container) {
        // 先清空
        container.innerHTML = ''
        const video = document.createElement('video')
        video.setAttribute('autoplay', '')
        video.setAttribute('muted', '')
        video.setAttribute('playsinline', '')
        video.setAttribute('webkit-playsinline', '')
        video.style.width = '100%'
        video.style.height = '100%'
        video.style.objectFit = 'cover'
        video.className = 'camera-feed'
        
        video.srcObject = stream
        container.appendChild(video)
        
        video.onloadedmetadata = () => {
          video.play().then(() => {
            uni.hideLoading()
          }).catch(e => {
            console.error('Play failed:', e)
            uni.hideLoading()
          })
        }
      } else {
        uni.hideLoading()
      }
    }, 500)
  } catch (err) {
    uni.hideLoading()
    console.error('Camera Access Failed:', err)
    uni.showModal({
      title: 'AR 启动失败',
      content: '请在浏览器设置中允许开启摄像头权限，以体验 AR 功能。',
      showCancel: false
    })
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
    title: '🎉 成功获取能量舱！获得 10 积分',
    icon: 'success'
  })
  setTimeout(() => {
    closeAR()
  }, 1500)
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

// AR 实景模式样式
.ar-real-view {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  z-index: 50;
  
  .video-container {
    position: absolute;
    top: 0; left: 0; width: 100%; height: 100%;
    
    .camera-feed {
      width: 100%; height: 100%;
      object-fit: cover;
    }
    
    .camera-mask {
      position: absolute;
      top: 0; left: 0; width: 100%; height: 100%;
      background: radial-gradient(circle, transparent 30%, rgba(0,0,0,0.5) 100%);
      pointer-events: none;
    }
  }
  
  .ar-hud {
    position: relative;
    z-index: 10;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 80rpx 40rpx 100rpx;
    pointer-events: none;
    
    .hud-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      pointer-events: auto;
      
      .compass {
        display: flex;
        flex-direction: column;
        gap: 10rpx;
        .deg { font-size: 24rpx; color: $uni-color-primary; font-weight: bold; }
        .compass-line { width: 100rpx; height: 1px; background: linear-gradient(to right, $uni-color-primary, transparent); }
      }
      
      .exit-btn {
        display: flex;
        align-items: center;
        gap: 10rpx;
        background: rgba(0,0,0,0.5);
        padding: 10rpx 30rpx;
        border-radius: 40rpx;
        border: 1px solid rgba(255,255,255,0.2);
        color: #fff;
        font-size: 24rpx;
      }
    }
    
    .ar-target {
      position: absolute;
      top: 40%; left: 50%;
      margin-left: -150rpx;
      margin-top: -150rpx;
      width: 300rpx; height: 300rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.1s ease-out;
      pointer-events: auto;
      
      .target-box {
        position: relative;
        cursor: pointer;
        
        .model-glow {
          position: absolute;
          width: 200rpx; height: 200rpx;
          background: radial-gradient(circle, $uni-color-primary 0%, transparent 70%);
          opacity: 0.3;
          animation: modelGlow 2s infinite alternate;
        }
        
        .capsule-model {
          width: 160rpx; height: 160rpx;
          border: 4rpx solid $uni-color-primary;
          border-radius: 40rpx;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 80rpx;
          background: rgba(0, 240, 255, 0.1);
          backdrop-filter: blur(4px);
          animation: float 3s infinite ease-in-out;
          box-shadow: 0 0 30rpx $uni-color-primary;
        }
        
        .target-pointer {
          position: absolute;
          top: 0; left: 180rpx;
          width: 200rpx;
          
          .aim-line {
            width: 80rpx; height: 1px;
            background: $uni-color-primary;
            margin-top: 40rpx;
          }
          
          .tag {
            display: flex;
            flex-direction: column;
            .name { font-size: 24rpx; font-weight: bold; white-space: nowrap; }
            .dist { font-size: 20rpx; color: $uni-color-primary; }
          }
        }
      }
    }
    
    .hud-bottom {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 30rpx;
      
      .scan-frame {
        width: 400rpx; height: 100rpx;
        border: 2rpx solid rgba(0, 240, 255, 0.3);
        position: relative;
        &::before { content: ''; position: absolute; top: 0; left: 0; width: 40rpx; height: 40rpx; border-top: 4rpx solid $uni-color-primary; border-left: 4rpx solid $uni-color-primary; }
        &::after { content: ''; position: absolute; bottom: 0; right: 0; width: 40rpx; height: 40rpx; border-bottom: 4rpx solid $uni-color-primary; border-right: 4rpx solid $uni-color-primary; }
      }
      
      .hint-text {
        font-size: 24rpx;
        color: rgba(255,255,255,0.7);
        letter-spacing: 2rpx;
      }
    }
  }
}

// 动画保持不变或新增
@keyframes modelGlow {
  0% { transform: scale(1); opacity: 0.2; }
  100% { transform: scale(1.5); opacity: 0.5; }
}

@keyframes float {
  0%, 100% { transform: translateY(0) rotate(0); }
  50% { transform: translateY(-30rpx) rotate(5deg); }
}

// 复用旧样式
.header { padding: 60rpx 40rpx 20rpx; .title { font-size: 48rpx; font-weight: 900; letter-spacing: 4rpx; } .subtitle { font-size: 20rpx; color: $uni-text-color-grey; letter-spacing: 4rpx; margin-top: 8rpx; } }
.radar-container { flex: 1.2; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; .radar-circle { width: 600rpx; height: 600rpx; border-radius: 50%; border: 1px solid rgba(0, 240, 255, 0.2); position: relative; background: radial-gradient(circle, rgba(0, 240, 255, 0.05) 0%, transparent 70%); .pulse { position: absolute; top: 0; left: 0; right: 0; bottom: 0; border: 1px solid $uni-color-primary; border-radius: 50%; opacity: 0; animation: pulse 4s infinite; &.p2 { animation-delay: 1.3s; } &.p3 { animation-delay: 2.6s; } } .scanner { position: absolute; top: 50%; left: 50%; width: 300rpx; height: 300rpx; background: conic-gradient(from 0deg, rgba(0, 240, 255, 0.4) 0deg, transparent 90deg); transform-origin: 0 0; animation: scan 3s linear infinite; border-radius: 0 100% 0 0; } .center-dot { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 40rpx; z-index: 5; } .target-dot { position: absolute; width: 24rpx; height: 24rpx; transition: opacity 0.5s ease; .dot-inner { width: 100%; height: 100%; background: $uni-color-primary; border-radius: 50%; box-shadow: 0 0 10px $uni-color-primary; } .dot-glow { position: absolute; top: -10rpx; left: -10rpx; right: -10rpx; bottom: -10rpx; border: 1px solid $uni-color-primary; border-radius: 50%; opacity: 0.5; animation: dotPulse 2s infinite; } } } }
.status-box { margin-top: 60rpx; padding: 20rpx 60rpx; border-radius: 40rpx; .status-msg { font-size: 24rpx; color: $uni-color-primary; letter-spacing: 2rpx; font-weight: 600; } }
.points-list { flex: 1; padding: 0 40rpx; .point-card { display: flex; align-items: center; gap: 30rpx; padding: 30rpx 40rpx; margin-bottom: 20rpx; .point-icon { font-size: 40rpx; } .point-info { flex: 1; display: flex; flex-direction: column; gap: 6rpx; .point-name { font-size: 28rpx; font-weight: bold; } .point-dist { font-size: 20rpx; color: $uni-text-color-grey; } } .arrow { font-size: 22rpx; color: $uni-color-primary; font-weight: bold; } } }
.modal-mask { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 2000; padding: 40rpx; .modal-content { width: 600rpx; padding: 60rpx; border-radius: 40rpx; display: flex; flex-direction: column; gap: 40rpx; .modal-header { display: flex; align-items: center; gap: 20rpx; .icon { font-size: 60rpx; } .title { font-size: 36rpx; font-weight: 900; } } .modal-body { .desc { color: rgba(255, 255, 255, 0.8); font-size: 28rpx; line-height: 1.6; } .author-info { margin-top: 30rpx; display: flex; align-items: center; .label { font-size: 22rpx; color: $uni-text-color-grey; } .value { font-size: 24rpx; font-weight: bold; color: $uni-color-primary; } } } .modal-footer { display: flex; flex-direction: column; gap: 20rpx; .btn { text-align: center; padding: 24rpx 0; border-radius: 12rpx; font-size: 28rpx; font-weight: bold; transition: all 0.3s ease; &.primary { background: $uni-color-primary; color: #000; } &.secondary { border: 1px solid rgba(255,255,255,0.2); } &:active { transform: scale(0.98); opacity: 0.8; } } } } }

@keyframes scan { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes pulse { 0% { transform: scale(0.5); opacity: 0; } 50% { opacity: 0.5; } 100% { transform: scale(1.1); opacity: 0; } }
@keyframes dotPulse { 0% { transform: scale(1); opacity: 0.8; } 100% { transform: scale(1.8); opacity: 0; } }
.safe-bottom { height: 160rpx; }
</style>
