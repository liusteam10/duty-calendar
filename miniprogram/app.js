const CLOUD_ENV_ID = ""; // 开通云开发环境后填入，例如 duty-prod-xxxxx

App({
  globalData: { cloudReady: false, currentUser: null },
  onLaunch() {
    if (!CLOUD_ENV_ID) {
      console.warn("CloudBase environment is not configured yet.");
      return;
    }
    if (!wx.cloud) {
      console.error("当前基础库不支持微信云开发");
      return;
    }
    wx.cloud.init({ env: CLOUD_ENV_ID, traceUser: true });
    this.globalData.cloudReady = true;
  }
});
