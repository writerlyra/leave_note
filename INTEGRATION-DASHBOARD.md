# Integrating Into Dashboard

这一章也是给别的 Cyberboss 使用者的。  
目标是让别人知道，如果她也在用 dashboard，这个小纸条要怎么接进去。

## 你项目里现成的参考实现

当前参考代码在：

- `/root/cyberboss-dashboard/backend/src/routes/notes.js`
- `/root/cyberboss-dashboard/backend/src/services/note-service.js`
- `/root/cyberboss-dashboard/frontend/src/api/cyberboss.js`
- `/root/cyberboss-dashboard/frontend/src/views/ConversationView.vue`

## 最小接入清单

1. backend 能按日期读 note
2. frontend 能拉 note 日期列表
3. frontend 能按日期懒加载 note
4. 对话页有入口打开小纸条面板

## backend 最小实现

直接参考：

- `/root/cyberboss-dashboard/backend/src/services/note-service.js`
- `/root/cyberboss-dashboard/backend/src/routes/notes.js`

至少提供：

- `GET /api/notes/dates`
- `GET /api/notes/day?date=YYYY-MM-DD`

## frontend 最小实现

直接参考：

- `/root/cyberboss-dashboard/frontend/src/api/cyberboss.js`
- `/root/cyberboss-dashboard/frontend/src/views/ConversationView.vue`

关键状态包括：

- `noteDates`
- `noteDayCache`
- `selectedNoteDate`
- `noteSheetOpen`
- `noteDateSheetOpen`

关键动作包括：

- `fetchNoteDates()`
- `fetchNotesByDate(date)`
- `ensureNotesForDate(date)`

note 应该：

- 有独立入口
- 不混进普通聊天流里
- 默认按日期查看
- 懒加载

## 推荐交互

### 入口

放在对话页顶部按钮区，用小信封图标进入。

理由：

- 和“对话”强相关
- 但不强行塞进正文流
- 不必额外开独立 tab

### 默认加载

- 默认只加载今天
- 用户切日期时再加载对应那天

不要默认加载全部，不然纸条多了会很重。

### 日期选择

- 标题默认就是当天日期
- 点击日期打开日历
- 日历沿用 dashboard 既有视觉语言

### 排序

- 同一天内默认从早到晚

### 高度

- 弹层或面板高度尽量固定

原因：

- 长短纸条切换时视觉不会一直跳
- 阅读节奏更稳

### 卡片样式

- 用 dashboard 现有卡片语言
- 不要另起一套“便签拟物风”

除非整个产品都要走更强的视觉表达。

## 不推荐的展示方式

- 直接塞进对话正文流
- 默认展示全部历史纸条
- 用“最新几张”代替日期浏览

这些都容易在纸条变多后失控。

## 如果只抄最少代码

后端抄：

- `backend/src/services/note-service.js`
- `backend/src/routes/notes.js`

前端抄：

- `frontend/src/api/cyberboss.js` 里的两个 note API
- `ConversationView.vue` 里的 note sheet 状态和面板

## 如果从零接入 dashboard

后端至少需要：

- `GET /api/notes/dates`
- `GET /api/notes/day?date=YYYY-MM-DD`

前端至少需要：

- 日期列表缓存
- 按天加载
- 当前日期默认值
- 日历选择器

## 最值得保留的 UI 元信息

- 当天纸条总数
- 当前选择日期
- 是否已读

其中“当天多少张”最有用，建议直接显示。
