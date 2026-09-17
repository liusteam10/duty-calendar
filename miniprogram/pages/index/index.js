Page({
  data: { monthTitle: "2026年9月", selectedDate: "2026-09-18", currentUser: "林晓晨", calendar: [] },
  onLoad() {
    // Production: load the published month from GET /api/me/schedule.
    this.setData({ calendar: buildDemoCalendar() });
  },
  onDateTap(event) { this.setData({ selectedDate: event.currentTarget.dataset.date }); },
  onPullDownRefresh() { wx.stopPullDownRefresh(); }
});

function buildDemoCalendar() {
  return Array.from({ length: 30 }, (_, i) => ({ date: `2026-09-${String(i + 1).padStart(2, "0")}`, day: i + 1, dayCount: 2, nightCount: 2, leaderCount: 1 }));
}
