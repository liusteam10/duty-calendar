Page({
  data: { requests: [{ id: "R-1024", title: "互换班次 · 9月22日", detail: "陈宇希望与你交换夜班", status: "待确认" }] },
  onAccept(event) { const id = event.currentTarget.dataset.id; this.setData({ requests: this.data.requests.map(item => item.id === id ? { ...item, status: "已生效" } : item) }); wx.showToast({ title: "班表已更新", icon: "success" }); },
  onReject() { wx.showToast({ title: "已拒绝", icon: "none" }); }
});
