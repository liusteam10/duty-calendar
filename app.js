const DAY_NAMES = ["日", "一", "二", "三", "四", "五", "六"];
const MONTH_NAMES = ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"];
const STORAGE_KEY = "duty-calendar-demo-v1";
const today = new Date(2026, 8, 18);

const state = {
  mode: "calendar",
  year: 2026,
  month: 8,
  calendarView: "month",
  selectedDate: null,
  modal: null,
  requestType: "swap",
  currentUser: "林晓晨",
  adminEditing: false,
  ...loadState(),
};

const femaleNames = ["林晓晨", "周岚", "陈思雨", "叶舒", "许婧", "沈宁", "唐悦", "赵琳", "苏妍", "蒋欣", "方怡", "邱月", "何静", "宋佳", "罗倩", "顾清", "夏安", "孟瑶", "梁茜", "许媛", "林婉", "陆晴", "胡玥", "韩雪", "丁宁", "周婉", "魏然", "傅颖", "贺敏", "谢璇"];
const maleNames = ["陈宇", "王磊", "赵明", "刘洋", "张凯", "黄伟", "李强", "徐锋", "周浩", "吴昊", "郑博", "孙晨", "何涛", "杨帆", "郭鹏", "宋杰", "胡斌", "高远", "冯超", "朱旭", "蒋峰", "彭飞", "马骏", "沈阳", "唐军", "罗晨", "丁磊", "潘越", "邓凯", "顾航", "梁栋", "严勇", "许峰", "魏东"];
const leaderNames = ["李卫国", "周建军", "陈立新", "王海宁", "赵宏远", "孙志强", "黄建华", "吴晓峰", "郑永安", "刘德明"];
const holidays = { "2026-09-03": "纪念日", "2026-09-15": "调休" };

function loadState() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); } catch { return {}; }
}
function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify({ assignments: state.assignments, publishedAssignments: state.publishedAssignments, requests: state.requests, published: state.published })); }
function pad(n) { return String(n).padStart(2, "0"); }
function dateKey(y, m, d) { return `${y}-${pad(m + 1)}-${pad(d)}`; }
function dayLabel(key) { const [y, m, d] = key.split("-").map(Number); return `${y}年${m}月${d}日 星期${DAY_NAMES[new Date(y, m - 1, d).getDay()]}`; }

function createAssignments() {
  const result = {};
  const days = new Date(2026, 9, 0).getDate();
  for (let d = 1; d <= days; d++) {
    const key = dateKey(2026, 8, d);
    result[key] = {
      leader: [leaderNames[(d + 3) % leaderNames.length]],
      day: [femaleNames[(d * 2) % femaleNames.length], femaleNames[(d * 2 + 9) % femaleNames.length]],
      night: [maleNames[(d + 5) % maleNames.length], maleNames[(d + 17) % maleNames.length]],
    };
  }
  return result;
}
if (!state.assignments) state.assignments = createAssignments();
if (!state.publishedAssignments) state.publishedAssignments = JSON.parse(JSON.stringify(state.assignments));
if (!state.requests) state.requests = [
  { id: "R-1024", type: "swap", status: "pending", from: "苏妍", to: "林晓晨", date: "2026-09-15", detail: "白班 ↔ 白班", direction: "待你确认" },
  { id: "R-1019", type: "cover", status: "open", from: "夏安", to: "公开征集", date: "2026-09-27", detail: "白班 · 09:00—18:00", direction: "2人正在查看" },
  { id: "R-1008", type: "swap", status: "accepted", from: "林晓晨", to: "沈宁", date: "2026-09-12", detail: "白班 ↔ 白班", direction: "已生效" },
];
if (typeof state.published !== "boolean") state.published = true;

function personRole(name) {
  if (leaderNames.includes(name)) return "leader";
  if (femaleNames.includes(name)) return "day";
  return "night";
}
function activeAssignments() {
  return state.adminEditing || state.published || state.mode === "admin" ? state.assignments : state.publishedAssignments;
}
function roleLabel(role) { return role === "leader" ? "带班" : role === "day" ? "白班" : "夜班"; }
function isMyName(name) { return name === state.currentUser; }
function monthDates(y, m) {
  const first = new Date(y, m, 1).getDay();
  const total = new Date(y, m + 1, 0).getDate();
  const prev = new Date(y, m, 0).getDate();
  const cells = [];
  for (let i = first - 1; i >= 0; i--) cells.push({ day: prev - i, outside: true, key: dateKey(y, m - 1, prev - i) });
  for (let d = 1; d <= total; d++) cells.push({ day: d, key: dateKey(y, m, d) });
  let next = 1; while (cells.length < 42) cells.push({ day: next, outside: true, key: dateKey(y, m + 1, next++) });
  return cells;
}

function render() {
  const app = document.querySelector("#app");
  app.innerHTML = `<div class="shell">
    ${renderTopbar()}
    <main class="page fade">${state.mode === "admin" ? renderAdmin() : state.mode === "requests" ? renderRequests() : state.mode === "my" ? renderMy() : renderCalendar()}</main>
    ${renderMobileNav()}
    ${state.modal ? renderModal() : ""}
  </div>`;
  bindEvents();
}

function renderTopbar() {
  const active = state.mode === "admin" ? "admin" : state.mode === "requests" ? "requests" : "calendar";
  return `<header class="topbar"><div class="brand"><div class="brand-mark">值</div><div><div class="brand-name">值班中枢</div><div class="brand-sub">单位值班协同平台</div></div></div>
    <nav class="topnav"><button data-mode="calendar" class="${active === "calendar" ? "active" : ""}">公开月历</button><button data-mode="my" class="${active === "my" ? "active" : ""}">我的值班</button><button data-mode="requests" class="${active === "requests" ? "active" : ""}">换班中心 <sup>${pendingCount()}</sup></button><button data-mode="admin" class="${active === "admin" ? "active" : ""}">管理后台</button></nav>
    <div class="top-actions"><span class="status-pill">● 数据已同步</span><div class="avatar">林</div></div></header>`;
}

function renderMobileNav() {
  const active = state.mode === "admin" ? "admin" : state.mode === "requests" ? "requests" : state.mode === "my" ? "my" : "calendar";
  return `<nav class="mobile-nav"><button data-mode="calendar" class="${active === "calendar" ? "active" : ""}"><span class="nav-icon">▦</span>值班</button><button data-mode="my" class="${active === "my" ? "active" : ""}"><span class="nav-icon">◷</span>我的</button><button data-mode="requests" class="${active === "requests" ? "active" : ""}"><span class="nav-icon">⇄</span>换班${pendingCount() ? ` · ${pendingCount()}` : ""}</button><button data-mode="admin" class="${active === "admin" ? "active" : ""}"><span class="nav-icon">⌘</span>管理</button></nav>`;
}

function renderCalendar() {
  const title = `${state.year}年 ${MONTH_NAMES[state.month]}`;
  const cells = monthDates(state.year, state.month);
  const editMode = state.adminEditing;
  return `${editMode ? `<div class="admin-banner"><span>● 正在编辑 9 月班表草稿。已发布版本仍对员工可见，修改完成后请回到管理后台发布。</span><button class="btn small mint" data-publish="publish">发布草稿</button></div>` : ""}<div class="hero"><div><div class="eyebrow"><span></span> DUTY OPERATIONS / 2026</div><h1>${editMode ? "编辑 9 月值班表。" : "把每一次值班，<br><em>排得更清楚。</em>"}</h1><p class="hero-copy">${editMode ? "点击日期编辑岗位人员，系统会校验性别、资格和重复值班。" : "公开月历 · 个人值班 · 换班协同，所有变更都有记录。"}</p></div><div class="hero-actions">${editMode ? `<button class="btn" data-mode="admin">返回管理后台</button>` : `<button class="btn" data-open="binding">绑定微信身份</button><button class="btn primary" data-open="request">发起换班</button>`}</div></div>
    <div class="layout"><section class="panel calendar-panel"><div class="calendar-head"><div class="month-title"><div><h2>${title}</h2><p>${state.published ? "已发布 · 最后更新 09-01 08:30" : "草稿 · 仅管理员可见"}</p></div><div class="month-arrows"><button class="icon-btn" data-month="prev" aria-label="上个月">←</button><button class="icon-btn" data-month="next" aria-label="下个月">→</button></div></div><div class="calendar-tools"><button class="btn small" data-month="today">回到今天</button><div class="view-switch"><button class="active">月历</button><button data-mode="my">我的</button></div></div></div><div class="legend"><span class="legend-item"><i class="dot leader"></i>带班领导 1人</span><span class="legend-item"><i class="dot day"></i>白班 2人</span><span class="legend-item"><i class="dot night"></i>夜班 2人</span><span class="legend-item">点击日期查看详情</span></div><div class="calendar-grid"><div class="weekday weekend">日</div><div class="weekday">一</div><div class="weekday">二</div><div class="weekday">三</div><div class="weekday">四</div><div class="weekday">五</div><div class="weekday weekend">六</div>${cells.map(renderCell).join("")}</div></section><aside class="sidebar">${renderNextCard()}${renderSidebarStats()}${renderNotices()}${renderRules()}</aside></div>`;
}

function renderCell(cell) {
  const record = activeAssignments()[cell.key];
  const d = new Date(cell.key);
  const todayFlag = cell.key === dateKey(today.getFullYear(), today.getMonth(), today.getDate());
  const weekend = d.getDay() === 0 || d.getDay() === 6;
  if (cell.outside) return `<div class="calendar-cell muted no-data"><div class="date-line"><span class="date-number">${cell.day}</span></div></div>`;
  return `<div class="calendar-cell ${todayFlag ? "today" : ""} ${state.adminEditing ? "editable" : ""}" data-date="${cell.key}"><div class="date-line"><span class="date-number">${cell.day}</span>${todayFlag ? `<span class="today-label">TODAY</span>` : holidays[cell.key] ? `<span class="holiday">${holidays[cell.key]}</span>` : weekend ? `<span class="holiday">周末</span>` : ""}</div>${record ? ["leader", "day", "night"].map(role => `<div class="shift-line"><span class="shift-tag ${role}">${roleLabel(role)}</span><span class="names">${record[role].map(name => isMyName(name) ? `<b class="my-name">${name}</b>` : name).join(" · ")}</span></div>`).join("") : `<div class="empty-state">未发布</div>`}${state.adminEditing ? `<span class="edit-hint">编辑</span>` : ""}</div>`;
}

function renderNextCard() {
  const upcoming = findUpcoming();
  return `<section class="panel side-card next-card"><div class="side-heading"><h3>我的下一次值班</h3><a data-mode="my">查看全部 →</a></div>${upcoming ? `<div class="next-date">${dayLabel(upcoming.date)}</div><div class="next-title">${roleLabel(upcoming.role)} · ${upcoming.role === "night" ? "18:00—次日09:00" : upcoming.role === "day" ? "09:00—18:00" : "全天带班"}</div><div class="next-meta"><span class="mini-chip">${upcoming.role === "leader" ? "带班领导" : "岗位人员"} <b>${state.currentUser}</b></span><span class="mini-chip">距今 ${daysUntil(upcoming.date)} 天</span></div>` : `<div class="next-title">本月暂无值班</div>`}</section>`;
}
function renderSidebarStats() { const mine = myAssignments(); return `<section class="panel side-card"><div class="side-heading"><h3>我的值班统计</h3><a data-mode="my">详情 →</a></div><div class="stat-row"><div class="stat"><strong>${mine.length}</strong><span>本月班次</span></div><div class="stat"><strong>${mine.filter(x => x.role === "night").length}</strong><span>夜班</span></div><div class="stat"><strong>${mine.filter(x => x.weekend).length}</strong><span>周末</span></div></div></section>`; }
function renderNotices() { return `<section class="panel side-card"><div class="side-heading"><h3>最新动态</h3><a data-mode="requests">全部 →</a></div><div class="notice"><div class="notice-icon">⇄</div><div class="notice-copy"><b>有一条换班申请待确认</b><span>陈宇希望与你交换 09-22 夜班</span></div></div><div class="notice"><div class="notice-icon">✓</div><div class="notice-copy"><b>班表已发布</b><span>9月值班表已于 09-01 更新</span></div></div></section>`; }
function renderRules() { return `<section class="panel side-card"><div class="side-heading"><h3>本单位值班规则</h3></div><div class="rule-list"><div class="rule"><span>白班</span><span class="rule-value">09:00—18:00 · 2女</span></div><div class="rule"><span>夜班</span><span class="rule-value">18:00—09:00 · 2男</span></div><div class="rule"><span>带班</span><span class="rule-value">全天 · 1领导</span></div><div class="rule"><span>变更截止</span><b>班次开始前</b></div></div></section>`; }

function renderMy() {
  const mine = myAssignments();
  return `<div class="hero"><div><div class="eyebrow"><span></span> PERSONAL DESK</div><h1>你好，${state.currentUser}。</h1><p class="hero-copy">这是你的值班清单和最近的协同动态。</p></div><div class="hero-actions"><button class="btn primary" data-open="request">发起换班</button></div></div><div class="layout"><section class="panel side-card"><div class="side-heading"><h3>我的 9 月值班</h3><span class="badge blue">${mine.length} 次</span></div><div class="request-list">${mine.map(x => `<div class="request-item"><div class="request-top"><div><div class="request-title">${dayLabel(x.date)}</div><div class="request-meta"><span class="shift-tag ${x.role}">${roleLabel(x.role)}</span>　${x.role === "night" ? "18:00—次日09:00" : x.role === "day" ? "09:00—18:00" : "全天带班"}</div></div><button class="btn small" data-date="${x.date}">查看当天</button></div></div>`).join("")}</div></section><aside class="sidebar">${renderNextCard()}${renderSidebarStats()}${renderRules()}</aside></div>`;
}

function renderRequests() {
  const pending = state.requests.filter(x => x.status === "pending" || x.status === "open");
  const history = state.requests.filter(x => x.status !== "pending" && x.status !== "open");
  return `<div class="hero"><div><div class="eyebrow"><span></span> REQUEST CENTER</div><h1>换班中心</h1><p class="hero-copy">申请、确认、撤销，所有变化都在这里留痕。</p></div><div class="hero-actions"><button class="btn primary" data-open="request">发起新申请</button></div></div><div class="layout"><section class="panel side-card"><div class="side-heading"><h3>待处理 · ${pending.length}</h3><span class="badge amber">需要关注</span></div>${pending.length ? pending.map(renderRequestItem).join("") : `<div class="empty-state">暂无待处理申请</div>`}<div class="side-heading" style="margin-top:28px"><h3>历史记录</h3></div>${history.map(renderRequestItem).join("")}</section><aside class="sidebar">${renderNotices()}${renderRules()}${renderSidebarStats()}</aside></div>`;
}
function renderRequestItem(item) {
  const actionable = item.status === "pending" || item.status === "open";
  return `<div class="request-item"><div class="request-top"><div><div class="request-title">${item.type === "swap" ? "互换班次" : "公开代班"} · ${item.date}</div><div class="request-meta">${item.from} → ${item.to} · ${item.detail}<br>${item.direction}</div></div><span class="badge ${item.status === "accepted" ? "green" : item.status === "open" ? "blue" : item.status === "pending" ? "amber" : "blue"}">${item.status === "pending" ? "待确认" : item.status === "open" ? "公开中" : item.status === "accepted" ? "已生效" : "已完成"}</span></div>${actionable ? `<div class="request-actions">${item.status === "pending" ? `<button class="btn small mint" data-request-action="accept" data-request-id="${item.id}">接受申请</button><button class="btn small" data-request-action="decline" data-request-id="${item.id}">拒绝</button>` : `<button class="btn small mint" data-request-action="cover" data-request-id="${item.id}">我要代班</button>`}<button class="btn small ghost" data-request-action="cancel" data-request-id="${item.id}">取消</button></div>` : ""}</div>`;
}

function renderAdmin() {
  const stats = [...femaleNames.slice(0, 5), ...maleNames.slice(0, 3), ...leaderNames.slice(0, 2)].map((name, i) => ({ name, count: 2 + (i % 5), role: personRole(name) }));
  return `<div class="hero"><div><div class="eyebrow"><span></span> ADMIN CONSOLE</div><h1>管理后台</h1><p class="hero-copy">编辑草稿、发布班表、查看变更与人员统计。</p></div><div class="hero-actions"><button class="btn" data-open="binding">人员绑定</button><button class="btn mint" data-publish="${state.published ? "start" : "publish"}">${state.published ? "已发布 · 创建编辑草稿" : "发布 9 月班表"}</button></div></div>${state.published ? `<div class="admin-banner"><span>✓ 当前 9 月班表已发布，员工端可见。创建编辑草稿后，已发布版本继续保持不变。</span><button class="btn small" data-publish="start">创建编辑草稿</button></div>` : `<div class="admin-banner"><span>● 当前处于草稿状态，修改完成后发布才会对外生效。</span><button class="btn small mint" data-publish="publish">发布草稿</button></div>`}<div class="admin-grid"><section class="panel admin-card"><h3>9 月班表草稿</h3><table class="table"><thead><tr><th>日期</th><th>带班领导</th><th>白班</th><th>夜班</th><th>校验</th><th>操作</th></tr></thead><tbody>${Object.keys(state.assignments).slice(0, 9).map(key => `<tr><td>${key.slice(5)}</td><td>${state.assignments[key].leader[0]}</td><td>${state.assignments[key].day.join("、")}</td><td>${state.assignments[key].night.join("、")}</td><td><span class="badge green">通过</span></td><td><button class="btn small" data-edit-date="${key}">编辑</button></td></tr>`).join("")}</tbody></table><button class="btn small" style="margin-top:14px" data-start-edit="true">打开完整月历编辑</button></section><section class="panel admin-card"><h3>本月值班次数</h3>${stats.map(x => `<div class="rule" style="margin:12px 0"><span><b>${x.name}</b> <small style="color:var(--muted)">${roleLabel(x.role)}</small></span><span style="display:flex;align-items:center;gap:7px"><div class="progress" style="width:65px"><i style="width:${x.count * 15}%"></i></div><b>${x.count}</b></span></div>`).join("")}</section><section class="panel admin-card"><h3>最近操作日志</h3>${["林晓晨接受了 09-12 白班互换", "9月班表由管理员发布", "陈宇发起 09-22 夜班互换"].map((x, i) => `<div class="notice"><div class="notice-icon">${i + 1}</div><div class="notice-copy"><b>${x}</b><span>${i + 1} 小时前 · 已记录</span></div></div>`).join("")}</section><section class="panel admin-card"><h3>发布前检查</h3><div class="rule-list"><div class="rule"><span>岗位完整</span><span class="badge green">通过</span></div><div class="rule"><span>性别资格</span><span class="badge green">通过</span></div><div class="rule"><span>领导资格</span><span class="badge green">通过</span></div><div class="rule"><span>时间冲突</span><span class="badge green">无冲突</span></div></div></section></div>`;
}

function renderModal() {
  if (state.modal === "binding") return `<div class="modal-backdrop" data-close="true"><div class="modal" onclick="event.stopPropagation()"><div class="modal-head"><div><h2>绑定微信身份</h2><p>演示环境 · 实际接入 wx.login 后由服务端完成绑定</p></div><button class="icon-btn" data-close="true">×</button></div><div class="modal-body"><div class="form-grid"><div class="form-field"><label>单位注册口令</label><input id="invite-code" placeholder="输入管理员发放的口令" value="DUTY-2026" /></div><div class="form-field"><label>绑定人员档案</label><select id="person-select"><option>林晓晨 · 女 · 白班资格</option><option>陈宇 · 男 · 夜班资格</option><option>李卫国 · 领导 · 带班资格</option></select></div></div><div class="modal-actions"><button class="btn" data-close="true">取消</button><button class="btn primary" data-bind="true">确认绑定</button></div></div></div></div>`;
  if (state.modal === "detail") return renderDetailModal();
  if (state.modal === "request") return renderRequestModal();
  if (state.modal === "edit") return renderEditModal();
  return "";
}
function renderDetailModal() {
  const record = activeAssignments()[state.selectedDate];
  return `<div class="modal-backdrop" data-close="true"><div class="modal" onclick="event.stopPropagation()"><div class="modal-head"><div><h2>${dayLabel(state.selectedDate)}</h2><p>当天值班安排 · 点击岗位可发起调整</p></div><button class="icon-btn" data-close="true">×</button></div><div class="modal-body"><div class="detail-shifts">${["leader", "day", "night"].map(role => `<div class="detail-shift"><span class="shift-tag ${role}">${roleLabel(role)}</span><div class="detail-copy"><b>${record[role].join("、")}</b><span>${role === "leader" ? "全天带班" : role === "day" ? "09:00—18:00" : "18:00—次日09:00"}</span></div>${record[role].includes(state.currentUser) ? `<button class="btn small" data-open="request" data-request-role="${role}">调整</button>` : ""}</div>`).join("")}</div><div class="modal-actions"><button class="btn" data-close="true">关闭</button></div></div></div></div>`;
}
function renderRequestModal() {
  const mine = myAssignments();
  const currentRole = personRole(state.currentUser);
  const eligible = currentRole === "leader" ? leaderNames : currentRole === "day" ? femaleNames : maleNames;
  return `<div class="modal-backdrop" data-close="true"><div class="modal" onclick="event.stopPropagation()"><div class="modal-head"><div><h2>发起换班</h2><p>变更将在对方接受后生效，班次开始后自动锁定</p></div><button class="icon-btn" data-close="true">×</button></div><div class="modal-body"><div class="request-type"><button class="type-card ${state.requestType === "swap" ? "active" : ""}" data-request-type="swap"><b>互换班次</b><span>双方各接对方的一次值班</span></button><button class="type-card ${state.requestType === "cover" ? "active" : ""}" data-request-type="cover"><b>找人代班</b><span>点名邀请或公开征集</span></button></div><div class="form-grid"><div class="form-field"><label>我的待调整班次</label><select id="my-shift">${mine.map(x => `<option value="${x.date}|${x.role}">${dayLabel(x.date)} · ${roleLabel(x.role)}</option>`).join("")}</select></div>${state.requestType === "swap" ? `<div class="form-field"><label>希望邀请的同类人员</label><select id="target-person">${eligible.filter(x => x !== state.currentUser).slice(0, 9).map(x => `<option>${x}</option>`).join("")}</select></div><div class="form-field"><label>对方可交换的班次日期</label><input value="2026-09-22" /></div>` : `<div class="form-field"><label>代班方式</label><select><option>公开征集同类合格人员</option><option>点名邀请指定人员</option></select></div>`}</div><div class="modal-actions"><button class="btn" data-close="true">取消</button><button class="btn primary" data-submit-request="true">提交申请</button></div></div></div></div>`;
}
function renderEditModal() {
  const record = state.assignments[state.selectedDate] || { leader: [leaderNames[0]], day: [femaleNames[0], femaleNames[1]], night: [maleNames[0], maleNames[1]] };
  const select = (id, label, options, value, role) => `<div class="form-field"><label>${label}</label><select id="${id}" data-edit-role="${role}">${options.map(name => `<option ${name === value ? "selected" : ""}>${name}</option>`).join("")}</select></div>`;
  return `<div class="modal-backdrop" data-close="true"><div class="modal" onclick="event.stopPropagation()"><div class="modal-head"><div><h2>编辑 ${dayLabel(state.selectedDate)}</h2><p>保存后写入当前草稿，不会立即覆盖已发布版本</p></div><button class="icon-btn" data-close="true">×</button></div><div class="modal-body"><div class="form-grid">${select("edit-leader", "带班领导 · 1人", leaderNames, record.leader[0], "leader")}${select("edit-day-1", "白班 · 第1席", femaleNames, record.day[0], "day")}${select("edit-day-2", "白班 · 第2席", femaleNames, record.day[1], "day")}${select("edit-night-1", "夜班 · 第1席", maleNames, record.night[0], "night")}${select("edit-night-2", "夜班 · 第2席", maleNames, record.night[1], "night")}</div><div class="modal-actions"><button class="btn" data-close="true">取消</button><button class="btn primary" data-save-edit="true">保存这一天</button></div></div></div></div>`;
}

function findUpcoming() { return myAssignments().find(x => x.date >= dateKey(today.getFullYear(), today.getMonth(), today.getDate())); }
function daysUntil(key) { return Math.max(0, Math.round((new Date(key) - today) / 86400000)); }
function myAssignments() { const result = []; Object.entries(activeAssignments()).forEach(([date, record]) => ["leader", "day", "night"].forEach(role => record[role].forEach(name => { if (name === state.currentUser) { const d = new Date(date); result.push({ date, role, weekend: d.getDay() === 0 || d.getDay() === 6 }); } }))); return result.sort((a, b) => a.date.localeCompare(b.date)); }
function pendingCount() { return state.requests.filter(x => x.status === "pending" || x.status === "open").length; }
function showToast(message) { const toast = document.querySelector("#toast"); toast.textContent = message; toast.classList.add("show"); clearTimeout(showToast.timer); showToast.timer = setTimeout(() => toast.classList.remove("show"), 2400); }

function bindEvents() {
  document.querySelectorAll("[data-mode]").forEach(el => el.addEventListener("click", () => { state.mode = el.dataset.mode; state.adminEditing = false; state.modal = null; render(); }));
  document.querySelectorAll("[data-month]").forEach(el => el.addEventListener("click", () => { if (el.dataset.month === "today") { state.year = today.getFullYear(); state.month = today.getMonth(); } else if (el.dataset.month === "prev") { state.month--; if (state.month < 0) { state.month = 11; state.year--; } } else { state.month++; if (state.month > 11) { state.month = 0; state.year++; } } render(); }));
  document.querySelectorAll("[data-date]").forEach(el => el.addEventListener("click", () => { state.selectedDate = el.dataset.date; state.modal = state.adminEditing ? "edit" : "detail"; render(); }));
  document.querySelectorAll("[data-edit-date]").forEach(el => el.addEventListener("click", () => { state.selectedDate = el.dataset.editDate; state.adminEditing = true; state.modal = "edit"; render(); }));
  document.querySelectorAll("[data-open]").forEach(el => el.addEventListener("click", () => { state.modal = el.dataset.open; if (el.dataset.requestRole) state.requestType = "swap"; render(); }));
  document.querySelectorAll("[data-close]").forEach(el => el.addEventListener("click", () => { state.modal = null; render(); }));
  document.querySelectorAll("[data-request-type]").forEach(el => el.addEventListener("click", () => { state.requestType = el.dataset.requestType; render(); }));
  document.querySelectorAll("[data-request-action]").forEach(el => el.addEventListener("click", () => handleRequestAction(el.dataset.requestAction, el.dataset.requestId)));
  document.querySelectorAll("[data-bind]").forEach(el => el.addEventListener("click", () => { const code = document.querySelector("#invite-code")?.value.trim(); if (code !== "DUTY-2026") return showToast("注册口令不正确"); state.modal = null; showToast("演示绑定成功，已关联：林晓晨"); render(); }));
  document.querySelectorAll("[data-submit-request]").forEach(el => el.addEventListener("click", submitRequest));
  document.querySelectorAll("[data-publish]").forEach(el => el.addEventListener("click", () => { const action = el.dataset.publish; if (action === "publish") { state.publishedAssignments = JSON.parse(JSON.stringify(state.assignments)); state.published = true; state.adminEditing = false; state.mode = "admin"; showToast("9 月班表已发布，员工端已同步"); } else { state.published = false; state.adminEditing = true; state.mode = "calendar"; showToast("已创建编辑草稿，当前发布版本仍保持不变"); } saveState(); render(); }));
  document.querySelectorAll("[data-start-edit]").forEach(el => el.addEventListener("click", () => { state.published = false; state.adminEditing = true; state.mode = "calendar"; state.modal = null; saveState(); showToast("已进入班表编辑模式"); render(); }));
  document.querySelectorAll("[data-save-edit]").forEach(el => el.addEventListener("click", saveEditedDay));
}
function saveEditedDay() {
  const leader = document.querySelector("#edit-leader")?.value;
  const day = [document.querySelector("#edit-day-1")?.value, document.querySelector("#edit-day-2")?.value];
  const night = [document.querySelector("#edit-night-1")?.value, document.querySelector("#edit-night-2")?.value];
  if (!leader || day.some(Boolean) === false || night.some(Boolean) === false) return showToast("请完整填写当天岗位");
  if (new Set(day).size !== 2 || new Set(night).size !== 2) return showToast("同一班次不能重复安排同一人");
  state.assignments[state.selectedDate] = { leader: [leader], day, night };
  state.modal = null; saveState(); showToast(`${state.selectedDate.slice(5)} 已保存到草稿`); render();
}
function submitRequest() {
  const selected = document.querySelector("#my-shift")?.value || "2026-09-22|night";
  const [date, role] = selected.split("|");
  const time = role === "night" ? "18:00—次日09:00" : role === "day" ? "09:00—18:00" : "全天带班";
  state.requests.unshift({ id: `R-${Date.now().toString().slice(-4)}`, type: state.requestType, status: state.requestType === "cover" ? "open" : "pending", from: state.currentUser, to: state.requestType === "cover" ? "公开征集" : (document.querySelector("#target-person")?.value || "待确认"), date, detail: state.requestType === "cover" ? `${roleLabel(role)} · ${time}` : `${roleLabel(role)} ↔ ${roleLabel(role)}`, direction: state.requestType === "cover" ? "符合资格的人员可接受" : "等待对方确认" });
  state.modal = null; saveState(); showToast("申请已提交，已生成站内通知"); render();
}
function handleRequestAction(action, id) { const item = state.requests.find(x => x.id === id); if (!item) return; if (action === "accept" || action === "cover") { item.status = "accepted"; item.direction = "已生效"; showToast(action === "cover" ? "代班成功，班表已更新" : "已接受，班表已更新"); } else if (action === "decline") { item.status = "declined"; item.direction = "已拒绝"; showToast("已拒绝申请"); } else { item.status = "cancelled"; item.direction = "已取消"; showToast("申请已取消"); } saveState(); render(); }

render();
