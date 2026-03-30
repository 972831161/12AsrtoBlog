<template>
  <view class="container">
    <view class="user-header">
      <view class="avatar-wrap pb-glass-card">
        <text class="avatar-icon">🧑‍🚀</text>
      </view>
      <view class="user-info">
        <text class="nickname pb-text-glow">十二的宇宙</text>
        <text class="uid">ID: PB-827394</text>
      </view>
    </view>
    
    <!-- Main Menu -->
    <view class="menu-list" v-if="currentView === 'main'">
      <view class="menu-item pb-glass-card" @click="currentView = 'garage'">
        <text class="icon">🚲</text>
        <text class="label">我的车库 (1)</text>
        <text class="arrow">></text>
      </view>
      <view class="menu-item pb-glass-card" @click="currentView = 'achievements'">
        <text class="icon">🏆</text>
        <text class="label">成就徽章 (4)</text>
        <text class="arrow">></text>
      </view>
      <view class="menu-item pb-glass-card" @click="handleMenuClick('我的路书')">
        <text class="icon">🗺️</text>
        <text class="label">我的路书</text>
        <text class="arrow">></text>
      </view>
      <view class="menu-item pb-glass-card" @click="handleMenuClick('服务与支持')">
        <text class="icon">🛠️</text>
        <text class="label">服务与支持</text>
        <text class="arrow">></text>
      </view>
    </view>

    <!-- My Garage View -->
    <view class="sub-view" v-if="currentView === 'garage'">
      <view class="sub-header">
        <text class="back-btn" @click="currentView = 'main'">⬅ 返回</text>
        <text class="sub-title">我的车库</text>
      </view>
      <view class="garage-card pb-glass-card">
        <image src="../../static/images/vapor_bike.png" mode="aspectFit" class="bike-img"></image>
        <view class="bike-info">
          <text class="brand">PLANET</text>
          <text class="name pb-text-glow">VAPOR</text>
          <view class="status-badge">在线</view>
        </view>
      </view>
    </view>

    <!-- Achievements View -->
    <view class="sub-view" v-if="currentView === 'achievements'">
      <view class="sub-header">
        <text class="back-btn" @click="currentView = 'main'">⬅ 返回</text>
        <text class="sub-title">成就勋章</text>
      </view>
      <view class="badge-grid">
        <view class="badge-item" v-for="(b, i) in badges" :key="i">
          <view class="badge-icon pb-glass-card">{{ b.icon }}</view>
          <text class="badge-name">{{ b.name }}</text>
        </view>
      </view>
    </view>
    
    <view class="safe-bottom"></view>
    <pb-tabbar currentPath="/pages/mine/mine" />
  </view>
</template>

<script setup>
import { ref } from 'vue'
import PbTabbar from '@/components/pb-tabbar.vue'

const currentView = ref('main')

const badges = ref([
  { name: '先行者', icon: '🚀' },
  { name: '夜骑侠', icon: '🌙' },
  { name: '万米达人', icon: '📏' },
  { name: '社区之星', icon: '⭐' }
])

const handleMenuClick = (item) => {
  uni.showToast({
    title: `${item} 正在解锁中...`,
    icon: 'none',
    duration: 2000
  })
}
</script>

<style lang="scss">
.container {
  padding: 40rpx;
  display: flex;
  flex-direction: column;
  gap: 60rpx;
}

.user-header {
  display: flex;
  align-items: center;
  gap: 40rpx;
  margin-top: 40rpx;
  
  .avatar-wrap {
    width: 140rpx;
    height: 140rpx;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    
    .avatar-icon {
      font-size: 80rpx;
    }
  }
  
  .user-info {
    display: flex;
    flex-direction: column;
    gap: 12rpx;
    
    .nickname {
      font-size: 40rpx;
      font-weight: bold;
    }
    
    .uid {
      font-size: 24rpx;
      color: $uni-text-color-grey;
      letter-spacing: 2rpx;
    }
  }
}

.menu-list {
  display: flex;
  flex-direction: column;
  gap: 30rpx;
  
  .menu-item {
    display: flex;
    align-items: center;
    gap: 30rpx;
    padding: 30rpx 40rpx;
    transition: all 0.3s ease;
    
    .icon {
      font-size: 40rpx;
    }
    
    .label {
      font-size: 30rpx;
      letter-spacing: 2rpx;
      flex: 1;
    }
    
    .arrow {
      font-size: 24rpx;
      color: rgba(255, 255, 255, 0.3);
    }
    
    &:active {
      transform: scale(0.98);
      background: rgba(0, 240, 255, 0.1);
    }
  }
}

.sub-view {
  display: flex;
  flex-direction: column;
  gap: 40rpx;
  animation: slideIn 0.3s ease-out;
  
  .sub-header {
    display: flex;
    align-items: center;
    gap: 30rpx;
    .back-btn { font-size: 28rpx; color: $uni-color-primary; }
    .sub-title { font-size: 32rpx; font-weight: bold; color: #fff; }
  }
  
  .garage-card {
    display: flex;
    align-items: center;
    gap: 40rpx;
    padding: 40rpx;
    
    .bike-img {
      width: 240rpx;
      height: 160rpx;
      filter: invert(1) hue-rotate(180deg) brightness(1.2);
      mix-blend-mode: screen;
    }
    
    .bike-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      .brand { font-size: 20rpx; color: $uni-text-color-grey; letter-spacing: 4rpx; }
      .name { font-size: 40rpx; font-weight: 900; }
      .status-badge {
        margin-top: 10rpx;
        font-size: 18rpx; width: fit-content;
        padding: 4rpx 16rpx; background: rgba(0, 255, 127, 0.2); 
        color: #00ff7f; border-radius: 20rpx;
      }
    }
  }
  
  .badge-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 30rpx;
    
    .badge-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16rpx;
      
      .badge-icon {
        width: 120rpx;
        height: 120rpx;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 50rpx;
      }
      
      .badge-name {
        font-size: 24rpx;
        color: $uni-text-color-grey;
      }
    }
  }
}

@keyframes slideIn {
  from { opacity: 0; transform: translateX(20rpx); }
  to { opacity: 1; transform: translateX(0); }
}

.safe-bottom {
  height: 140rpx;
}
</style>
