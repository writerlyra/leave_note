# Integrating Into Cyberboss

这一章是给别的 Cyberboss 使用者的。  
目标不是解释概念，而是让对方知道：要把 `leave_note` 接进自己的项目，至少要改哪些文件。

## 你项目里现成的参考实现

Cyberboss 这边已经有三块基础：

- runtime 输出允许 `leave_note`
- `NoteService` 负责落盘
- dashboard 已有 notes 视图基础

主项目相关文件：

- `/root/cyberboss/src/core/stream-delivery.js`
- `/root/cyberboss/src/core/app.js`
- `/root/cyberboss/src/services/note-service.js`
- `/root/cyberboss/src/core/config.js`
- `/root/cyberboss/src/tools/create-project-tooling.js`
- `/root/cyberboss/src/core/command-registry.js`
- `/root/cyberboss/templates/weixin-operations.md`

## 最小接入清单

如果对方的 Cyberboss 还没有 note 能力，至少要补这几层：

1. 配置层
2. note 存储服务
3. runtime 动作解析
4. runtime note 落盘
5. 可选的 `/note` 指令
6. dashboard 读取与展示

## 1. 配置层

在 `src/core/config.js` 增加：

```js
notesDir: path.join(stateDir, "notes"),
noteExportsDir: path.join(stateDir, "notes", "exports"),
noteAddressee: readTextEnv("CYBERBOSS_NOTE_ADDRESSEE") || readTextEnv("CYBERBOSS_USER_NAME") || "User",
noteSigner: readTextEnv("CYBERBOSS_NOTE_SIGNER") || readTextEnv("CYBERBOSS_BOT_NAME") || "Bot",
```

## 2. NoteService

直接参考：

- `/root/cyberboss/src/services/note-service.js`

这个服务已经包含：

- `create()`
- `countUnread()`
- `listMatchingNotes()`
- `exportMarkdown()`
- `formatNoteForWeChat()`

如果对方只想最小接入，至少需要：

- `create()`
- `countUnread()`

## 3. 把 NoteService 接到 project tooling

参考：

- `/root/cyberboss/src/tools/create-project-tooling.js`

核心是把 `note` 服务挂进去：

```js
note: new NoteService({ config }),
```

## 4. 让 runtime 认识 leave_note

参考：

- `/root/cyberboss/src/core/stream-delivery.js`

关键点不是“直接发出去”，而是：

- 识别 `{"action":"leave_note", ...}`
- 把它归类成一种独立动作
- 不把它当普通微信消息发送

你当前项目里的关键逻辑在：

- `resolveSystemReplyAction(...)`
- `buildActionDelivery(...)`

对应行为是：

- `leave_note` 会被识别
- 但 delivery 阶段不会直接发微信正文

## 5. 在 app 层把 note 落盘

参考：

- `/root/cyberboss/src/core/app.js`

关键函数：

- `extractAllNoteActions(...)`
- `captureAssistantNotes(event)`

这里做的事情是：

- 从 runtime 最终 JSON 里抽出 `leave_note`
- 或者从 `send_message + note` 里的嵌入 note 抽出内容
- 调用 `projectServices.note.create(...)`
- 再发一条“收到小纸条”的系统提示

如果对方只想保留功能本体，不想保留你的“收到一张小纸条”提示，可以删掉通知，只保留写入。

## 6. 提示词层允许模型使用 leave_note

参考：

- `/root/cyberboss/templates/weixin-operations.md`

这一层要告诉模型：

- `leave_note` 是合法动作
- note 写给她，不写给自己
- note 不是迷你日记

但不要强绑定：

- `soft_message`
- `must_message`
- 随机 check-in

这些属于具体项目调度层。

## 7. 可选：补 /note 指令

如果对方想让用户手动查看或导出 note，可参考：

- `/root/cyberboss/src/core/command-registry.js`
- `/root/cyberboss/src/core/app.js`

你当前项目已经有：

- `/note`
- `/note today`
- `/note YYYY-MM-DD`
- `/note YYYY-MM`
- `/note export ...`

## 当前接法的好处

- `leave_note` 已经是独立动作
- note 不会被直接当聊天消息发出去
- note 已有单独存储

## 当前接法里属于 Cyberboss 专属的部分

这些属于项目自己的调度语言，不应外带成通用前提：

- `must_message`
- `soft_message`
- `background_only`
- 随机 check-in
- 各类系统 trigger

## 推荐别人直接抄走的部分

从你这套实现里最值得别人直接照搬的是：

- `src/services/note-service.js`
- `stream-delivery.js` 里对 `leave_note` 的动作识别
- `app.js` 里对 note 的提取与写入
- `templates/weixin-operations.md` 里对 note 口径的约束

## 接入时建议注意

### 1. 区分“生成了 note”与“写入成功”

像聊天消息一样，最好把这些状态分开：

- runtime 产出了 `leave_note`
- note 成功写入存储
- dashboard 成功读到

### 2. 给 note 记录模型来源

保留 `model` 字段，方便判断：

- 哪些模型更愿意留纸条
- 哪些模型容易全 silent

### 3. 不要把 note 当 repair channel

如果是 `must_message` 场景，不要偷换成只留 note。  
note 只能补充，不应替代即时消息。

### 4. 保留 note 的“低频感”

不要为了追求热闹，让所有 soft 场景都产出纸条。

## 如果只做最小版本

最小可运行接法是：

- `config.js` 里加 note 相关路径
- 加 `src/services/note-service.js`
- 在 `stream-delivery.js` 识别 `leave_note`
- 在 `app.js` 把 note 写入 `notes/YYYY-MM-DD.json`
- 在 prompt 层允许模型返回 `leave_note`

这样即使没有 dashboard，也已经能用了。

## 适合继续优化的点

- 增加 note 的生成成功/存储成功日志
- 后台统计不同模型的 note 频率
- 针对过度 `silent` 的模型，单独调 prompt 或调度机会
