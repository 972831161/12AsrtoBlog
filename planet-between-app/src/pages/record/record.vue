<template>
  <view class="container">
    <view class="header">
      <text class="title pb-text-glow">MY RIDES</text>
      <text class="subtitle">历史骑行记录与生涯数据</text>
    </view>
    
    <view class="content pb-glass-card">
      <view class="empty-state">
        <text class="icon">🚴</text>
        <text class="text">暂无骑行记录</text>
        <text class="sub-text">跨上单车，开始你的第一次探索吧。</text>
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
  flex: 1;
  min-height: 500rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 40rpx;
  
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20rpx;
    opacity: 0.5;
    
    .icon {
      font-size: 80rpx;
      filter: grayscale(100%);
    }
    
    .text {
      font-size: 32rpx;
      font-weight: bold;
      color: $uni-text-color;
      letter-spacing: 4rpx;
    }
    
    .sub-text {
      font-size: 24rpx;
      color: $uni-color-paragraph;
    }
  }
}

.safe-bottom {
  height: 140rpx;
}
</style>
