<template>
  <view class="dashboard">
    <!-- Top Status Bar Area -->
    <view class="header">
      <view class="status-indicator">
        <text class="status-dot online"></text>
        <text class="status-text">CONNECTED</text>
      </view>
      <view class="model-info">
        <text class="model-brand pb-text-glow">PLANET 宇宙</text>
        <text class="model-name">VAPOR</text>
        <!-- Bike Hero Image (Positioned Under Vapor) -->
        <view class="hero-section">
          <image src="../../static/images/vapor_bike.webp" mode="aspectFit" class="hero-image"></image>
        </view>
      </view>
    </view>

    <!-- Riding HUD Panel (Only when Riding) -->
    <view class="riding-hud pb-glass-card" v-if="isRiding">
      <view class="main-group">
        <view class="hud-item large">
          <text class="label">当前速度</text>
          <text class="val pb-text-glow">{{ currentSpeed }}</text>
          <text class="unit">km/h</text>
        </view>
        <view class="hud-item heart">
          <text class="label">心率</text>
          <text class="val pulse-text">{{ heartRate }}</text>
          <text class="unit">BPM</text>
        </view>
        <view class="hud-item">
          <text class="label">功率</text>
          <text class="val">{{ power }}</text>
          <text class="unit">WATTS</text>
        </view>
      </view>

      <view class="divider"></view>

      <view class="grid-group">
        <view class="sub-item">
          <text class="l">里程</text>
          <text class="v">{{ distanceCount.toFixed(2) }} km</text>
        </view>
        <view class="sub-item">
          <text class="l">时间</text>
          <text class="v">{{ rideTimeStr }}</text>
        </view>
        <view class="sub-item">
          <text class="l">平均速度</text>
          <text class="v">{{ avgSpeed }} km/h</text>
        </view>
        <view class="sub-item">
          <text class="l">海拔</text>
          <text class="v">{{ altitude }} m</text>
        </view>
        <view class="sub-item">
          <text class="l">坡度</text>
          <text class="v">{{ slope }} %</text>
        </view>
        <view class="sub-item">
          <text class="l">爬升</text>
          <text class="v">{{ climb }} m</text>
        </view>
        <view class="sub-item full-width">
          <text class="l">踏频 (RPM)</text>
          <text class="v highlight">{{ cadence }}</text>
        </view>
      </view>

      <!-- Hydration Bar -->
      <view class="water-section" @click="refillWater">
        <view class="water-header">
          <text class="label">💧 补水状态</text>
          <text class="percent" :class="{ low: waterLevel < 20 }">{{ waterLevel.toFixed(0) }}%</text>
        </view>
        <view class="water-track">
          <view class="water-bar" :style="{ width: waterLevel + '%' }"></view>
        </view>
        <text class="hint">点击即刻补满</text>
      </view>
    </view>

    <!-- Original Display (Only when NOT Riding) -->
    <view class="main-display" v-if="!isRiding">
      <view class="battery-ring">
        <!-- Dashboard Speedometer Text -->
        <view class="speed-container">
          <text class="speed-value">28</text>
          <text class="speed-unit">km/h</text>
        </view>
      </view>
      <view class="range-info">
        <text class="range-label">EST. RANGE</text>
        <text class="range-value pb-text-glow">64 km</text>
      </view>
      <view class="battery-percentage pb-glass-card">
        <text class="icon">🔋</text>
        <text class="value">88%</text>
      </view>
    </view>

    <!-- Quick Controls & Stats (Only when NOT Riding) -->
    <template v-if="!isRiding">
      <view class="controls-grid">
        <view class="control-btn pb-glass-card" :class="{ active: isLocked }" @click="toggleLock">
          <view class="icon">{{ isLocked ? '🔒' : '🔓' }}</view>
          <text class="label">{{ isLocked ? 'LOCKED' : 'UNLOCKED' }}</text>
        </view>
        <view class="control-btn pb-glass-card" :class="{ active: lightOn }" @click="toggleLight">
          <view class="icon">💡</view>
          <text class="label">LIGHTS</text>
        </view>
        <view class="control-btn pb-glass-card" @click="soundHorn">
          <view class="icon">🔔</view>
          <text class="label">HORN</text>
        </view>
      </view>

      <view class="stats-panel pb-glass-card">
        <view class="stat-item">
          <text class="stat-title">TRIP DIST</text>
          <text class="stat-value">12.4 km</text>
        </view>
        <view class="stat-divider"></view>
        <view class="stat-item">
          <text class="stat-title">RIDE TIME</text>
          <text class="stat-value">42 min</text>
        </view>
        <view class="stat-divider"></view>
        <view class="stat-item">
          <text class="stat-title">ASSIST MODE</text>
          <text class="stat-value pb-text-glow">TURBO</text>
        </view>
      </view>
    </template>
    
    <!-- Action Button -->
    <view class="action-section">
      <view class="start-btn" :class="{ 'stop-mode': isRiding }" @click="toggleRiding">
        <text class="btn-text">{{ isRiding ? 'STOP RIDING' : 'START RIDING' }}</text>
        <view class="btn-glow"></view>
      </view>
    </view>

    <view class="safe-bottom"></view>
    <pb-tabbar currentPath="/pages/index/index" />
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import PbTabbar from '@/components/pb-tabbar.vue'

const isLocked = ref(false)
const lightOn = ref(true)

const toggleLock = () => {
  isLocked.value = !isLocked.value
  uni.showToast({
    title: isLocked.value ? 'Vehicle Locked' : 'Vehicle Unlocked',
    icon: 'none'
  })
}

const toggleLight = () => {
  lightOn.value = !lightOn.value
}

const soundHorn = () => {
  uni.vibrateShort()
  uni.showToast({ title: 'Beep!', icon: 'none' })
}

const isRiding = ref(false)
const rideTimer = ref(null)

// Ride Pro Data
const currentSpeed = ref(28)
const heartRate = ref(135)
const power = ref(220)
const distanceCount = ref(12.42)
const rideSeconds = ref(2520) // 42 min
const avgSpeed = ref(18.5)
const altitude = ref(350)
const slope = ref(3)
const climb = ref(210)
const cadence = ref(85)
const waterLevel = ref(80) // 补水进度 0-100

const formatTime = (s) => {
  const h = Math.floor(s / 3600).toString().padStart(2, '0')
  const m = Math.floor((s % 3600) / 60).toString().padStart(2, '0')
  const sec = (s % 60).toString().padStart(2, '0')
  return `${h}:${m}:${sec}`
}

const rideTimeStr = computed(() => formatTime(rideSeconds.value))

const startRiding = () => {
  uni.vibrateLong()
  uni.showLoading({ title: '初始化智能座舱...' })
  setTimeout(() => {
    uni.hideLoading()
    isRiding.value = true
    uni.showToast({ title: '系统就绪，开始骑行', icon: 'success' })
    
    // Start Data Sync
    rideTimer.value = setInterval(() => {
      // 模拟动态变化
      currentSpeed.value = Math.floor(25 + Math.random() * 8)
      heartRate.value = Math.floor(130 + Math.random() * 15)
      power.value = Math.floor(180 + Math.random() * 60)
      rideSeconds.value++
      distanceCount.value += 0.01 / 60 // 约每秒增加一点里程
      waterLevel.value = Math.max(0, waterLevel.value - 0.05) // 持续衰减
      
      if (Math.random() > 0.95) {
        altitude.value += Math.floor(Math.random() * 2)
        climb.value += Math.floor(Math.random() * 1)
      }
    }, 1000)
  }, 1000)
}

const toggleRiding = () => {
  if (isRiding.value) {
    uni.showModal({
      title: '结束骑行',
      content: '确定要保存本次宇宙骑行数据吗？',
      success: (res) => {
        if (res.confirm) {
          isRiding.value = false
          if (rideTimer.value) clearInterval(rideTimer.value)
          uni.showToast({ title: '数据已同步至星云', icon: 'success' })
        }
      }
    })
  } else {
    startRiding()
  }
}

const refillWater = () => {
  waterLevel.value = 100
  uni.showToast({ title: '水源已补满', icon: 'none' })
}
</script>

<style lang="scss">
.dashboard {
  padding: 40rpx;
  display: flex;
  flex-direction: column;
  gap: 60rpx;
  padding-bottom: 120rpx;
}

.hero-section {
  width: 100%;
  height: 240rpx;
  display: flex;
  justify-content: center;
  margin-top: 10rpx;
  
  .hero-image {
    width: 500rpx;
    height: 100%;
    filter: drop-shadow(0 0 30rpx rgba(0, 240, 255, 0.4)) invert(1) hue-rotate(180deg) brightness(1.5);
    mix-blend-mode: screen; 
    animation: floatBike 6s infinite ease-in-out;
  }
}

@keyframes floatBike {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-20rpx) rotate(2deg); }
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20rpx;

  .status-indicator {
    display: flex;
    align-items: center;
    gap: 12rpx;

    .status-dot {
      width: 16rpx;
      height: 16rpx;
      border-radius: 50%;
      background-color: $uni-text-color-grey;

      &.online {
        background-color: $uni-color-success;
        box-shadow: 0 0 8px $uni-color-success;
      }
    }

    .status-text {
      font-size: 24rpx;
      color: $uni-text-color-grey;
      letter-spacing: 2rpx;
      text-transform: uppercase;
    }
  }

  .model-info {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    
    .model-brand {
      font-size: 18rpx;
      letter-spacing: 4rpx;
      text-transform: uppercase;
    }
    
    .model-name {
      font-size: 44rpx;
      font-weight: 900;
      color: #ffffff;
      letter-spacing: 6rpx;
      margin-top: 4rpx;
      text-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
    }
  }
}

.main-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  margin-top: 40rpx;

  .battery-ring {
    width: 480rpx;
    height: 480rpx;
    border-radius: 50%;
    border: 4rpx solid $pb-glass-border;
    border-top-color: $uni-color-primary;
    border-right-color: $uni-color-primary;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    box-shadow: inset 0 0 40rpx $uni-color-primary-light, 0 0 40rpx $uni-color-primary-light;
    transform: rotate(-45deg); /* To make the gap at bottom */

    .speed-container {
      transform: rotate(45deg);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;

      .speed-value {
        font-size: 140rpx;
        font-weight: 800;
        line-height: 1;
        color: white;
        text-shadow: 0 0 20px rgba(255, 255, 255, 0.5);
      }

      .speed-unit {
        font-size: 28rpx;
        color: $uni-text-color-grey;
        margin-top: 10rpx;
        letter-spacing: 4rpx;
      }
    }
  }

  .range-info {
    position: absolute;
    bottom: -30rpx;
    display: flex;
    flex-direction: column;
    align-items: center;
    background: $uni-bg-color;
    padding: 10rpx 40rpx;

    .range-label {
      font-size: 20rpx;
      color: $uni-text-color-grey;
      letter-spacing: 2rpx;
    }

    .range-value {
      font-size: 40rpx;
      font-weight: 700;
      margin-top: 8rpx;
    }
  }

  .battery-percentage {
    position: absolute;
    top: 40rpx;
    right: 0;
    display: flex;
    align-items: center;
    gap: 12rpx;
    padding: 12rpx 24rpx;
    border-radius: 40rpx;

    .icon {
      font-size: 28rpx;
    }
    
    .value {
      font-size: 28rpx;
      font-weight: bold;
    }
  }
}

.controls-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 30rpx;
  margin-top: 60rpx;

  .control-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 30rpx 0;
    gap: 16rpx;
    transition: all 0.3s ease;

    .icon {
      font-size: 48rpx;
      opacity: 0.7;
    }

    .label {
      font-size: 22rpx;
      color: $uni-text-color-grey;
      letter-spacing: 2rpx;
    }

    &.active {
      border-color: $uni-color-primary;
      background: $uni-color-primary-light;
      
      .icon, .label {
        color: $uni-color-primary;
        opacity: 1;
      }
    }
    
    &:active {
      transform: scale(0.95);
    }
  }
}

.stats-panel {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20rpx;
  padding: 40rpx;

  .stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12rpx;

    .stat-title {
      font-size: 20rpx;
      color: $uni-text-color-grey;
      letter-spacing: 2rpx;
    }

    .stat-value {
      font-size: 32rpx;
      font-weight: 600;
    }
  }

  .stat-divider {
    width: 2rpx;
    height: 60rpx;
    background-color: $pb-glass-border;
  }
}

.action-section {
  display: flex;
  justify-content: center;
  margin-top: 20rpx;
  
  .start-btn {
    width: 80%;
    height: 100rpx;
    background: $uni-color-primary;
    border-radius: 50rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    box-shadow: 0 0 30rpx rgba(0, 240, 255, 0.4);
    transition: all 0.3s;
    
    .btn-text {
      color: #000;
      font-size: 32rpx;
      font-weight: 900;
      letter-spacing: 4rpx;
      z-index: 2;
    }
    
    .btn-glow {
      position: absolute;
      inset: 0;
      border-radius: 50rpx;
      box-shadow: 0 0 40rpx $uni-color-primary;
      opacity: 0.5;
      animation: pulseGlow 2s infinite;
    }
    
    &.stop-mode {
      background: #ff4d4f;
      box-shadow: 0 0 30rpx rgba(255, 77, 79, 0.4);
      .btn-glow {
        box-shadow: 0 0 40rpx #ff4d4f;
      }
    }
    
    &:active {
      transform: scale(0.95);
      filter: brightness(1.2);
    }
  }
}

@keyframes pulseGlow {
  0% { transform: scale(0.95); opacity: 0.3; }
  50% { transform: scale(1.05); opacity: 0.6; }
  100% { transform: scale(0.95); opacity: 0.3; }
}

/* Riding HUD Styles */
.riding-hud {
  margin-top: 20rpx;
  padding: 40rpx;
  display: flex;
  flex-direction: column;
  gap: 30rpx;

  .main-group {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    
    .hud-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      flex: 1;
      
      .label { font-size: 18rpx; color: #666; letter-spacing: 2rpx; text-transform: uppercase; }
      .val { font-size: 50rpx; font-weight: 800; color: #fff; line-height: 1.2; }
      .unit { font-size: 18rpx; color: #444; }
      
      &.large {
        flex: 1.5;
        .val { font-size: 100rpx; }
      }
      &.heart {
        .pulse-text { 
          color: #ff4d4f; 
          animation: heartPulse 1s infinite alternate; 
          text-shadow: 0 0 10rpx rgba(255, 77, 79, 0.4);
        }
      }
    }
  }

  .divider {
    height: 1px;
    background: linear-gradient(to right, transparent, $pb-glass-border, transparent);
    margin: 10rpx 0;
  }

  .grid-group {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24rpx;
    
    .sub-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10rpx 0;
      
      .l { font-size: 20rpx; color: $uni-text-color-grey; }
      .v { font-size: 26rpx; font-weight: 600; color: #fff; }
      
      &.full-width {
        grid-column: span 2;
        padding-top: 20rpx;
        border-top: 1px dashed rgba(255,255,255,0.1);
        .highlight { color: $uni-color-primary; text-shadow: 0 0 10rpx $uni-color-primary; font-size: 32rpx; }
      }
    }
  }

  .water-section {
    margin-top: 20rpx;
    background: rgba(0, 240, 255, 0.05);
    padding: 24rpx;
    border-radius: 16rpx;
    border: 1px solid rgba(0, 240, 255, 0.1);
    display: flex;
    flex-direction: column;
    gap: 16rpx;
    
    &:active { background: rgba(0, 240, 255, 0.15); }

    .water-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      .label { font-size: 20rpx; color: #00f0ff; font-weight: bold; }
      .percent { font-size: 24rpx; font-weight: 900; color: #00f0ff; &.low { color: #ffbc00; animation: flash 1s infinite; } }
    }
    
    .water-track {
      height: 16rpx;
      background: rgba(0,0,0,0.3);
      border-radius: 50rpx;
      overflow: hidden;
      .water-bar {
        height: 100%;
        background: linear-gradient(to right, #0099ff, #00f0ff);
        box-shadow: 0 0 15rpx #00f0ff;
        border-radius: 50rpx;
        transition: width 0.3s ease;
      }
    }
    
    .hint { font-size: 14rpx; color: #444; text-align: center; letter-spacing: 2rpx; }
  }
}

@keyframes heartPulse { from { transform: scale(0.95); } to { transform: scale(1.05); } }
@keyframes flash { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }

.safe-bottom {
  height: 140rpx;
}
</style>
