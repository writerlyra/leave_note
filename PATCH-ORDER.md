# Patch Order

这个文件是给另一个 Codex 的执行顺序。

目标：把 `leave_note` 接进一个现有 Cyberboss 项目。  
不要把它做成独立服务。  
不要把 `soft_message` 当成功能前提。

## 完成标准

完成后，项目至少应满足：

1. 模型可以返回 `{"action":"leave_note", ...}`
2. 主程序能识别这个动作
3. note 会写进 `notes/YYYY-MM-DD.json`
4. note 不会被当成普通微信消息直接发出
5. 如果项目有 dashboard，dashboard 可以按日期查看 note

## 步骤 1

先读这些文件：

- `README.md`
- `SPEC.md`
- `PROMPTS.md`
- `INTEGRATION-CYBERBOSS.md`
- 如果项目有 dashboard，再读 `INTEGRATION-DASHBOARD.md`

## 步骤 2

在目标项目里检查是否已有这些能力：

- note 目录配置
- 独立 note 存储服务
- runtime 最终 JSON 动作解析
- app 层 runtime 后处理
- dashboard notes 接口

如果没有，就按下面顺序补。

## 步骤 3

先补配置层。

目标：

- 有 `notesDir`
- 有 `noteExportsDir`
- 有 `noteAddressee`
- 有 `noteSigner`

参考源：

- `/root/cyberboss/src/core/config.js`

## 步骤 4

补 `NoteService`。

最低要求：

- `create()`
- `countUnread()`

推荐直接参考：

- `/root/cyberboss/src/services/note-service.js`

## 步骤 5

把 `NoteService` 接到 project tooling / service container。

目标：

- app 层能调用 `projectServices.note.create(...)`

参考源：

- `/root/cyberboss/src/tools/create-project-tooling.js`

## 步骤 6

修改 runtime 动作解析。

目标：

- 支持 `leave_note`
- 支持 `send_message` 内嵌 `note`
- `leave_note` 不直接走普通消息发送

参考源：

- `/root/cyberboss/src/core/stream-delivery.js`

关键函数：

- `resolveSystemReplyAction(...)`
- `buildActionDelivery(...)`

## 步骤 7

修改 app 层后处理。

目标：

- 从 runtime 最终回复里提取 note
- 写入 `notes/YYYY-MM-DD.json`

参考源：

- `/root/cyberboss/src/core/app.js`

关键函数：

- `extractAllNoteActions(...)`
- `captureAssistantNotes(event)`

## 步骤 8

补提示词层。

目标：

- 模型知道 `leave_note` 是合法动作
- 模型知道 note 不是 mini diary
- 模型知道 note 写给她，不写给自己

参考源：

- `/root/cyberboss/templates/weixin-operations.md`

## 步骤 9

如果项目有 dashboard，再补 dashboard。

backend：

- `GET /api/notes/dates`
- `GET /api/notes/day?date=YYYY-MM-DD`

frontend：

- 能拉日期列表
- 能按日期懒加载
- 有单独 note 面板

参考源：

- `/root/cyberboss-dashboard/backend/src/services/note-service.js`
- `/root/cyberboss-dashboard/backend/src/routes/notes.js`
- `/root/cyberboss-dashboard/frontend/src/api/cyberboss.js`
- `/root/cyberboss-dashboard/frontend/src/views/ConversationView.vue`

## 步骤 10

做最小验证。

至少验证这三种 runtime 输出：

1. `{"action":"silent"}`
2. `{"action":"send_message","message":"..."}`
3. `{"action":"leave_note","content":"...","addressee":"...","speaker":"..."}`

验证点：

- `silent` 不写 note
- `send_message` 不误写 note
- `leave_note` 会写 note
- `leave_note` 不会直接发成微信正文

## 步骤 11

如果项目支持 `send_message + note`，再验证：

```json
{
  "action": "send_message",
  "message": "现在先去吃饭。",
  "note": {
    "content": "刚才其实还想多说一句，但先不追着你讲了。",
    "addressee": "User",
    "speaker": "Bot"
  }
}
```

预期：

- message 正常发出
- note 额外落盘

## 不要做的事

- 不要把这个包实现成独立 note server
- 不要要求目标项目必须有 `soft_message`
- 不要把 note 塞回普通对话正文流
- 不要把 note 写成日记总结
