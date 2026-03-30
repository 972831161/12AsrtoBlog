<template>
  <view class="container">
    <view class="header">
      <text class="title pb-text-glow">MY RIDES</text>
      <text class="subtitle">历史骑行记录与生涯数据</text>
    </view>
    
    <view class="content">
      <view class="record-card pb-glass-card" v-for="i in 2" :key="i">
        <view class="record-header">
          <text class="date">2026.03.30 14:23</text>
          <text class="type">城市巡航</text>
        </view>
        <view class="record-body">
          <view class="record-stats">
            <view class="s-item">
              <text class="val">12.4</text>
              <text class="lab">KM</text>
            </view>
            <view class="s-item">
              <text class="val">42</text>
              <text class="lab">MIN</text>
            </view>
            <view class="s-item">
              <text class="val">18.5</text>
              <text class="lab">AVG</text>
            </view>
          </view>
          <image src="../../static/images/road_book_1.png" mode="aspectFill" class="record-map"></image>
        </view>
      </view>
    </view>
    
    <!-- 全局防遮挡占位 -->
    <view class="safe-bottom"></view>
    <pb-tabbar currentPath="/pages/record/record" />
  </view>
</template>

<script setup>
import PbTabbar from '@/components/pb-tabbar.vue'
</script>

<style lang="scss">
.container {
  padding: 40rpx;
  display: flex;
  flex-direction: column;
  gap: 40rpx;
}

.header {
  display: flex;
  flex-direction: column;
  margin-top: 40rpx;
  
  .title {
    font-size: 48rpx;
    font-weight: 900;
    letter-spacing: 4rpx;
  }
  
  .subtitle {
    font-size: 24rpx;
    color: $uni-text-color-grey;
    margin-top: 12rpx;
    letter-spacing: 2rpx;
  }
}

.content {
  display: flex;
  flex-direction: column;
  gap: 30rpx;
  
  .record-card {
    padding: 30rpx;
    display: flex;
    flex-direction: column;
    gap: 20rpx;
    
    .record-header {
      display: flex;
      justify-content: space-between;
      .date { font-size: 22rpx; color: $uni-text-color-grey; }
      .type { font-size: 22rpx; color: $uni-color-primary; font-weight: bold; }
    }
    
    .record-body {
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      .record-stats {
        display: flex;
        gap: 30rpx;
        .s-item {
          display: flex;
          flex-direction: column;
          .val { font-size: 36rpx; font-weight: bold; color: #fff; }
          .lab { font-size: 18rpx; color: $uni-text-color-grey; }
        }
      }
      
      .record-map {
        width: 140rpx;
        height: 140rpx;
        border-radius: 12rpx;
        background: rgba(255,255,255,0.05);
      }
    }
  }
}

.safe-bottom {
  height: 140rpx;
}
</style>
