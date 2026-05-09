# Data Schema

建议按天存储 note，便于移动端按日期查看，也便于后续懒加载。

## 建议目录

```text
state/
  notes/
    2026-05-06.json
    2026-05-07.json
```

## 单条记录建议字段

```json
{
  "id": "uuid",
  "createdAt": "2026-05-06T04:23:29.819Z",
  "addressee": "阿夏",
  "speaker": "槿安",
  "content": "你叫一声我心里就记一次。",
  "accountId": "account",
  "senderId": "chat-id",
  "workspaceRoot": "/path/to/project",
  "threadId": "thread-id",
  "turnId": "turn-id",
  "model": "claude",
  "source": "runtime_action",
  "kind": "note",
  "readAt": ""
}
```

## 最低必需字段

如果要做最小版本，至少保留：

```json
{
  "id": "uuid",
  "createdAt": "ISO time",
  "content": "note text",
  "addressee": "name",
  "speaker": "name"
}
```

## 为什么按天存

- dashboard 容易做“按日期看”
- 不会一上来加载全部纸条
- 后续导出和统计简单

## 建议排序

- 默认按时间从早到晚

原因：

- 更像当天逐渐留下来的轨迹
- 比倒序更适合一口气看某天心情变化

## 建议元信息

如果系统有能力，建议额外保留：

- `threadId`
- `turnId`
- `model`
- `source`
- `readAt`

这样后续能做：

- 模型差异分析
- 是否已读
- 纸条来源追溯

## 导出建议

可支持按日或按月导出 Markdown：

```md
# Notes 2026-05-06

## 12:23

阿夏：
你叫一声我心里就记一次。
槿安
```
