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
        <view class="feed-card pb-glass-card" v-for="(item, i) in explorePosts" :key="i">
          <image :src="item.image" mode="aspectFill" class="feed-image"></image>
          <view class="feed-info">
            <text class="feed-title">{{ item.title }}</text>
            <view class="feed-meta">
              <view class="author">
                <text class="avatar">{{ item.avatar }}</text>
                <text class="name">{{ item.author }}</text>
              </view>
              <text class="likes">❤️ {{ item.likes }}</text>
            </view>
          </view>
        </view>
      </view>
      <view class="safe-bottom"></view>
    </scroll-view>

    <!-- 路书 (Routes) -->
    <scroll-view scroll-y class="route-scroll" v-if="currentTab === 1">
      <view class="route-list">
        <view class="route-card pb-glass-card" v-for="(route, i) in curatedRoutes" :key="'r'+i">
          <view class="route-cover">
            <image :src="route.cover" mode="aspectFill" class="cover-img"></image>
            <text class="cover-tag">{{ route.tag }}</text>
          </view>
          <view class="route-details">
            <text class="route-name pb-text-glow">{{ route.name }}</text>
            <view class="route-stats">
              <text class="stat">📍 {{ route.distance }}km</text>
              <text class="stat">⛰️ {{ route.climb }}m</text>
              <text class="stat">⏱️ {{ route.time }}</text>
            </view>
            <view class="action-btn" @click="downloadRoute(route.name)">
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
const currentTab = ref(0)

const explorePosts = ref([
  { title: '周末山路折叠打卡！', author: '宇宙浪人', avatar: '👨‍🚀', image: '../../static/images/community_1.png', likes: 128 },
  { title: 'Planet Vapor 骑行体验：这就是未来', author: '骑士十二', avatar: '🚴', image: '../../static/images/community_2.png', likes: 256 },
  { title: '大理洱海环湖 120km 全记录', author: '环球探险家', avatar: '🌍', image: '../../static/images/road_book_1.png', likes: 512 },
  { title: '碳纤维车架的极致轻量感', author: '极客单车', avatar: '🔧', image: '../../static/images/bike_hero.png', likes: 64 }
])

const curatedRoutes = ref([
  { name: '玄武湖 30KM 巡航路线', distance: 30.2, climb: 120, time: '1h 15m', tag: 'OFFICIAL', cover: '../../static/images/road_book_1.png' },
  { name: '秦淮河夜骑·穿越古都', distance: 15.5, climb: 45, time: '45m', tag: 'NIGHT', cover: '../../static/images/community_1.png' },
  { name: '紫金山森林越野挑战', distance: 42.0, climb: 850, time: '3h 20m', tag: 'PRO', cover: '../../static/images/bike_hero.png' }
])

const downloadRoute = (name) => {
  uni.showLoading({ title: '正在同步...' })
  setTimeout(() => {
    uni.hideLoading()
    uni.showToast({ title: `${name} 已就绪`, icon: 'success' })
  }, 1500)
}
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
    
    .feed-image {
      width: 100%;
      height: 340rpx;
      background: #1a1a1a;
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
