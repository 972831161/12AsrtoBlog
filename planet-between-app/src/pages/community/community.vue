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
          <view class="route-header">
            <image :src="route.cover" mode="aspectFill" class="route-image"></image>
            <view class="route-overlay">
              <text class="tag">{{ route.tag }}</text>
            </view>
          </view>
          <view class="route-info">
            <text class="route-title pb-text-glow">{{ route.name }}</text>
            <text class="route-summary">{{ route.desc }}</text>
            <view class="route-metrics">
              <view class="m-item">
                <text class="m-label">距离</text>
                <text class="m-val">{{ route.distance }}km</text>
              </view>
              <view class="m-item">
                <text class="m-label">爬升</text>
                <text class="m-val">{{ route.climb }}m</text>
              </view>
              <view class="m-item">
                <text class="m-label">耗时</text>
                <text class="m-val">{{ route.time }}</text>
              </view>
            </view>
            <view class="action-btn" @click="downloadRoute(route.name)">
              下载离线路书
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
  { title: '周末山路折叠打卡！', author: '宇宙浪人', avatar: '👨‍🚀', image: '../../static/images/explore_1.webp', likes: 128 },
  { title: 'Planet Vapor 骑行体验：这就是未来', author: '骑士十二', avatar: '🚴', image: '../../static/images/explore_2.webp', likes: 256 },
  { title: '大理洱海环湖 120km 全记录', author: '环球探险家', avatar: '🌍', image: '../../static/images/route_xuanwu.webp', likes: 512 },
  { title: '碳纤维车架的极致轻量感', author: '极客单车', avatar: '🔧', image: '../../static/images/bike_hero.webp', likes: 64 }
])

const curatedRoutes = ref([
  { name: '玄武湖 30KM 巡航路线', desc: '在这里体验南京冬日的温婉与柔情。', distance: 30.2, climb: 120, time: '1h 15m', tag: 'OFFICIAL', cover: '../../static/images/route_xuanwu.webp' },
  { name: '秦淮河夜骑·穿越古都', desc: '十里秦淮，灯影阑珊。骑行在古老的南京。', distance: 15.5, climb: 45, time: '45m', tag: 'NIGHT', cover: '../../static/images/route_qinhuai.webp' },
  { name: '紫金山森林越野挑战', desc: '感受密林中的晨曦，挑战极限山地路线。', distance: 42.0, climb: 850, time: '3h 20m', tag: 'PRO', cover: '../../static/images/route_zijin.webp' }
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

.route-list {
  padding: 30rpx;
  display: flex;
  flex-direction: column;
  gap: 40rpx;
  
  .route-card {
    padding: 0 !important;
    overflow: hidden !important;
    display: flex !important;
    flex-direction: column !important;
    border-radius: 24rpx;
    
    .route-header {
      width: 100%;
      height: 320rpx;
      position: relative;
      
      .route-image {
        width: 100%;
        height: 100%;
      }
      
      .route-overlay {
        position: absolute;
        inset: 0;
        background: linear-gradient(to bottom, rgba(0,0,0,0.4), transparent);
        padding: 20rpx;
        
        .tag {
          background: $uni-color-primary;
          color: #000;
          font-size: 20rpx;
          font-weight: 900;
          padding: 6rpx 16rpx;
          border-radius: 8rpx;
        }
      }
    }
    
    .route-info {
      padding: 30rpx;
      display: flex;
      flex-direction: column;
      gap: 16rpx;
      
      .route-title {
        font-size: 36rpx;
        font-weight: bold;
      }
      
      .route-summary {
        font-size: 24rpx;
        color: #aaa;
        line-height: 1.6;
      }
      
      .route-metrics {
        display: flex;
        justify-content: space-between;
        margin: 10rpx 0;
        
        .m-item {
          display: flex;
          flex-direction: column;
          gap: 4rpx;
          
          .m-label { font-size: 18rpx; color: #666; letter-spacing: 2rpx; }
          .m-val { font-size: 28rpx; font-weight: bold; color: #fff; }
        }
      }
      
      .action-btn {
        margin-top: 10rpx;
        width: 100%;
        height: 80rpx;
        border: 1px solid $uni-color-primary;
        color: $uni-color-primary;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24rpx;
        font-weight: bold;
        border-radius: 12rpx;
        background: rgba(0, 240, 255, 0.05);
        
        &:active {
          background: rgba(0, 240, 255, 0.2);
        }
      }
    }
  }
}

.safe-bottom {
  height: 160rpx;
}
</style>
