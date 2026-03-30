<script>
export default {
  onLaunch: function () {
    console.log('App Launch')
  },
  onShow: function () {
    console.log('App Show')
  },
  onHide: function () {
    console.log('App Hide')
  },
}
</script>

<style lang="scss">
/* 此处全局引入 uni.scss 变量，确保全局组件生效 */
@import '@/uni.scss';

/* H5 Desktop 适配：限定最大宽度并居中 */
@media screen and (min-width: 600px) {
  html, body {
    background-color: #050505 !important;
  }
  
  uni-app {
    overflow: hidden;
  }

  uni-page-body {
    max-width: 450px !important;
    margin: 0 auto !important;
    min-height: 100vh !important;
    border-left: 1px solid rgba(255, 255, 255, 0.1);
    border-right: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 0 100px rgba(0, 240, 255, 0.1);
    background: #000;
    position: relative;
  }

  /* 适配固定定位的 TabBar */
  .pb-tabbar {
    left: 50% !important;
    right: auto !important;
    transform: translateX(-50%) !important;
    width: 450px !important;
  }

  /* 适配固定投影/弹窗 */
  uni-toast, uni-modal, uni-actionsheet {
    max-width: 450px !important;
    left: 50% !important;
    transform: translateX(-50%) !important;
  }
}

page {
  /* 基础黑底白字 */
  background-color: $uni-bg-color;
  color: $uni-text-color;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  min-height: 100vh;
}

/* 通用 Cyberpunk 玻璃拟态卡片 */
.pb-glass-card {
  background: $pb-glass-bg;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid $pb-glass-border;
  border-radius: $uni-border-radius-lg;
  padding: $uni-spacing-col-lg $uni-spacing-row-lg;
}

/* Neon Text Glow Effect */
.pb-text-glow {
  color: $uni-color-primary;
  text-shadow: 0 0 8px $uni-color-primary-light, 0 0 20px $uni-color-primary-light;
}
</style>
