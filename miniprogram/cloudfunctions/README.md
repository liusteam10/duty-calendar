# CloudBase 云函数

当前包含 `health` 健康检查函数，用于确认小程序已经成功连接到 CloudBase 环境。

在微信开发者工具中：

1. 打开“云开发”，创建或选择生产环境。
2. 右键 `health` 云函数，选择“上传并部署：云端安装依赖”。
3. 在小程序中调用 `wx.cloud.callFunction({ name: 'health' })` 验证部署。

后续业务函数按相同结构添加：

- `bindPerson`：微信身份与人员档案绑定
- `getMonthSchedule`：读取已发布月历
- `createChangeRequest`：互换/代班申请
- `respondChangeRequest`：接受、拒绝、撤销
- `adminSaveDraft`：管理员保存草稿
- `adminPublish`：发布班表并写入审计记录

所有人员资格和换班规则必须在云函数中校验，不能只依赖小程序页面。
