<template>
  <view class="pb-tabbar glass-nav">
    <view 
      class="tab-item" 
      v-for="(item, index) in tabs" 
      :key="index"
      :class="{ active: currentPath === item.path }"
      @click="switchTab(item.path)"
    >
      <text class="icon">{{ item.icon }}</text>
      <text class="label">{{ item.text }}</text>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  currentPath: {
    type: String,
    required: true
  }
})

const tabs = [
  { path: '/pages/index/index', icon: '⚡️', text: '控制' },
  { path: '/pages/record/record', icon: '🚴', text: '行程' },
  { path: '/pages/community/community', icon: '🗺️', text: '路书' },
  { path: '/pages/ar/ar', icon: '🪐', text: '宇宙' },
  { path: '/pages/mine/mine', icon: '👨‍🚀', text: '我的' }
]

const switchTab = (path) => {
  if (path === props.currentPath) return
  uni.redirectTo({
    url: path
  })
}
</script>

<style lang="scss">
.pb-tabbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 120rpx;
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
  z-index: 999;
}

.glass-nav {
  background: rgba(13, 13, 13, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.tab-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  flex: 1;
  height: 100%;
  transition: all 0.3s ease;
  opacity: 0.5;

  .icon {
    font-size: 40rpx;
    filter: grayscale(100%);
    transition: all 0.3s ease;
  }

  .label {
    font-size: 20rpx;
    color: $uni-text-color-grey;
    letter-spacing: 2rpx;
    transition: all 0.3s ease;
  }

  &.active {
    opacity: 1;
    transform: translateY(-4rpx);

    .icon {
      filter: grayscale(0%);
      text-shadow: 0 0 10px rgba(0, 240, 255, 0.5);
    }

    .label {
      color: $uni-color-primary;
      font-weight: bold;
      text-shadow: 0 0 8px $uni-color-primary-light;
    }
  }
}
</style>
