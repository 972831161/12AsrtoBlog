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
    
    <view class="menu-list">
      <view class="menu-item pb-glass-card">
        <text class="icon">🚲</text>
        <text class="label">我的车库 (1)</text>
      </view>
      <view class="menu-item pb-glass-card">
        <text class="icon">🏆</text>
        <text class="label">成就徽章 (4)</text>
      </view>
      <view class="menu-item pb-glass-card">
        <text class="icon">🗺️</text>
        <text class="label">我的路书</text>
      </view>
      <view class="menu-item pb-glass-card">
        <text class="icon">🛠️</text>
        <text class="label">服务与支持</text>
      </view>
      <view class="menu-item pb-glass-card">
        <text class="icon">⚙️</text>
        <text class="label">系统设置</text>
      </view>
    </view>
    
    <view class="safe-bottom"></view>
    <pb-tabbar currentPath="/pages/mine/mine" />
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
    
    &:active {
      transform: scale(0.98);
      background: $uni-color-primary-light;
    }
  }
}

.safe-bottom {
  height: 140rpx;
}
</style>
