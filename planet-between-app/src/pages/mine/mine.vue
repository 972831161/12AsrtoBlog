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
      <view class="garage-card pb-glass-card" v-for="(bike, index) in myBikes" :key="index">
        <image src="../../static/images/vapor_bike.webp" mode="aspectFit" class="bike-img"></image>
        <view class="bike-info">
          <view class="top-row">
            <view class="title-group">
              <text class="brand">{{ bike.brand }}</text>
              <text class="name pb-text-glow">{{ bike.model }}</text>
            </view>
            <view class="status-badge" :class="bike.status.toLowerCase()">{{ bike.status === 'ONLINE' ? '在线' : '离线' }}</view>
          </view>
          
          <view class="bike-meta">
            <view class="meta-item">
              <text class="l">昵称</text>
              <text class="v">{{ bike.nickname }}</text>
            </view>
            <view class="meta-item">
              <text class="l">陪伴时长</text>
              <text class="v highlight">{{ calculateAge(bike.purchaseDate) }} 天</text>
            </view>
          </view>
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

const myBikes = ref([
  {
    brand: 'PLANET',
    model: 'VAPOR',
    nickname: '银影侠 Silver Surfer',
    purchaseDate: '2025-11-20',
    status: 'ONLINE'
  }
])

const calculateAge = (dateStr) => {
  const purchase = new Date(dateStr)
  const today = new Date()
  const diffTime = Math.abs(today - purchase)
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

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
      gap: 20rpx;
      
      .top-row {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        
        .title-group {
          display: flex;
          flex-direction: column;
          .brand { font-size: 18rpx; color: $uni-text-color-grey; letter-spacing: 4rpx; }
          .name { font-size: 36rpx; font-weight: 900; line-height: 1; }
        }
        
        .status-badge {
          font-size: 16rpx;
          padding: 4rpx 12rpx;
          border-radius: 20rpx;
          &.online { background: rgba(0, 255, 127, 0.15); color: #00ff7f; border: 1px solid rgba(0, 255, 127, 0.2); }
          &.offline { background: rgba(255, 255, 255, 0.05); color: #999; }
        }
      }
      
      .bike-meta {
        display: flex;
        gap: 30rpx;
        padding-top: 10rpx;
        border-top: 1px solid rgba(255,255,255,0.05);
        
        .meta-item {
          display: flex;
          flex-direction: column;
          gap: 4rpx;
          .l { font-size: 18rpx; color: #444; text-transform: uppercase; letter-spacing: 1rpx; }
          .v { font-size: 24rpx; color: #fff; font-weight: 500; }
          .highlight { color: $uni-color-primary; font-weight: 700; }
        }
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
