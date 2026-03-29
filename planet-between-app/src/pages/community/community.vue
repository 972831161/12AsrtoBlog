<template>
  <view class="container">
    <!-- Header with Tabs -->
    <view class="header">
      <view class="tab-list">
        <text 
          class="tab" 
          :class="{ active: currentTab === 0 }" 
          @click="currentTab = 0"
        >探索</text>
        <text 
          class="tab" 
          :class="{ active: currentTab === 1 }" 
          @click="currentTab = 1"
        >路书</text>
      </view>
    </view>
    
    <!-- 探索 Feed (Explore) -->
    <scroll-view scroll-y class="feed-scroll" v-if="currentTab === 0">
      <view class="feed-grid">
        <view class="feed-card pb-glass-card" v-for="i in 4" :key="i">
          <view class="image-placeholder">
            <text class="icon">📸</text>
          </view>
          <view class="feed-info">
            <text class="feed-title">周末山路折叠打卡！</text>
            <view class="feed-meta">
              <view class="author">
                <text class="avatar">👨‍🚀</text>
                <text class="name">宇宙探索者</text>
              </view>
              <text class="likes">❤️ 128</text>
            </view>
          </view>
        </view>
      </view>
      <view class="safe-bottom"></view>
    </scroll-view>

    <!-- 路书 (Routes) -->
    <scroll-view scroll-y class="route-scroll" v-if="currentTab === 1">
      <view class="route-list">
        <view class="route-card pb-glass-card" v-for="i in 3" :key="'r'+i">
          <view class="route-cover">
            <text class="cover-tag">OFFICIAL</text>
          </view>
          <view class="route-details">
            <text class="route-name pb-text-glow">玄武湖 30KM 巡航路线</text>
            <view class="route-stats">
              <text class="stat">📍 30.2 km</text>
              <text class="stat">⛰️ 120 m</text>
              <text class="stat">⏱️ 1h 15m</text>
            </view>
            <view class="action-btn">
              <text>下载离线路书</text>
            </view>
          </view>
        </view>
      </view>
      <view class="safe-bottom"></view>
    </scroll-view>

    <pb-tabbar currentPath="/pages/community/community" />
  </view>
</template>

<script setup>
import { ref } from 'vue'
import PbTabbar from '@/components/pb-tabbar.vue'

// 0 = 探索(Explore), 1 = 路书(Routes)
const currentTab = ref(1)
</script>

<style lang="scss">
.container {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.header {
  padding: 40rpx 40rpx 20rpx;
  display: flex;
  justify-content: center;
  
  .tab-list {
    display: flex;
    gap: 60rpx;
    
    .tab {
      font-size: 32rpx;
      color: $uni-text-color-grey;
      font-weight: 600;
      transition: all 0.3s ease;
      position: relative;
      
      &.active {
        color: $uni-color-primary;
        text-shadow: 0 0 10px $uni-color-primary-light;
        transform: scale(1.1);
        
        &::after {
          content: '';
          position: absolute;
          bottom: -10rpx;
          left: 50%;
          transform: translateX(-50%);
          width: 20rpx;
          height: 6rpx;
          background-color: $uni-color-primary;
          border-radius: 4rpx;
          box-shadow: 0 0 8px $uni-color-primary;
        }
      }
    }
  }
}

.feed-scroll, .route-scroll {
  flex: 1;
  overflow: hidden;
}

/* 探索瀑布流样式 */
.feed-grid {
  padding: 20rpx;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20rpx;
  
  .feed-card {
    padding: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    
    .image-placeholder {
      height: 300rpx;
      background: rgba(255, 255, 255, 0.05);
      display: flex;
      align-items: center;
      justify-content: center;
      
      .icon {
        font-size: 60rpx;
        opacity: 0.3;
      }
    }
    
    .feed-info {
      padding: 20rpx;
      
      .feed-title {
        font-size: 26rpx;
        font-weight: bold;
        line-height: 1.4;
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
        line-clamp: 2;
        overflow: hidden;
      }
      
      .feed-meta {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 16rpx;
        
        .author {
          display: flex;
          align-items: center;
          gap: 8rpx;
          
          .avatar { font-size: 24rpx; }
          .name {
            font-size: 20rpx;
            color: $uni-text-color-grey;
          }
        }
        
        .likes {
          font-size: 20rpx;
          color: $uni-text-color-grey;
        }
      }
    }
  }
}

/* 路书列表样式 */
.route-list {
  padding: 20rpx 40rpx;
  display: flex;
  flex-direction: column;
  gap: 30rpx;
  
  .route-card {
    padding: 0;
    overflow: hidden;
    position: relative;
    
    .route-cover {
      height: 240rpx;
      background: linear-gradient(135deg, rgba(0,240,255,0.1), rgba(13,13,13,1));
      position: relative;
      
      .cover-tag {
        position: absolute;
        top: 20rpx;
        left: 20rpx;
        background: $uni-color-primary;
        color: #000;
        font-size: 18rpx;
        font-weight: 800;
        padding: 4rpx 12rpx;
        border-radius: 4rpx;
      }
    }
    
    .route-details {
      padding: 30rpx;
      
      .route-name {
        font-size: 32rpx;
        font-weight: bold;
      }
      
      .route-stats {
        display: flex;
        gap: 30rpx;
        margin-top: 20rpx;
        
        .stat {
          font-size: 22rpx;
          color: $uni-text-color-grey;
        }
      }
      
      .action-btn {
        margin-top: 30rpx;
        background: rgba(0, 240, 255, 0.1);
        border: 1px solid $uni-color-primary;
        color: $uni-color-primary;
        text-align: center;
        padding: 16rpx 0;
        border-radius: 8rpx;
        font-size: 24rpx;
        font-weight: bold;
        letter-spacing: 2rpx;
        
        &:active {
          background: rgba(0, 240, 255, 0.3);
        }
      }
    }
  }
}

.safe-bottom {
  height: 160rpx;
}
</style>
