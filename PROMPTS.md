# Prompting Notes

这里不是一份完整人格 prompt，而是 `leave_note` 这个能力本身该怎么提示。

## 最小能力提示

可直接移植的最小版本：

```text
You may choose exactly one of three actions:

1. {"action":"send_message","message":"..."}
2. {"action":"leave_note","content":"...","addressee":"...","speaker":"..."}
3. {"action":"silent"}

Use leave_note when you genuinely have something worth saying to the user, but the present moment feels slightly wrong for direct interruption.
Leave_note is not only for when the user is absent or unavailable.
Use it when you genuinely want to say something now, but choose not to interrupt right now.

A note is not a backup chat reply and not a mini diary.
Write to the user, not to yourself.
Keep it centered on one thought, one feeling, one remembered detail, one soft reminder, or one afterthought.
Do not summarize the whole day.
```

## 推荐补充约束

```text
Choose send_message when she should see it now.
Choose leave_note when it matters, but not enough to interrupt now.
Choose silent when neither interruption nor a saved note is justified.
```

## 该强调什么

- `leave_note` 是内建动作，不是外部工具
- 纸条写给她，不写给自己
- 纸条不是日记
- 纸条不是“懒得判断时的折中方案”
- 纸条不是“只有她不在才用”
- 纸条应该像一句后来想起她时留下的话

## 不该怎么写提示

不要把功能本体写成：

- “soft_message 时优先 leave_note”
- “如果系统随机唤醒你……”
- “如果 check-in poller 触发……”

这些都属于具体项目的调度层，不属于功能本体。

## 模型差异提醒

不同模型在这里差异会很大：

- 有的模型会主动把想法落成 `leave_note`
- 有的模型会滑回 `silent`
- 有的模型会把 note 写成日志

所以 prompt 的目标不是“统一人格”，而是：

- 让支持这个能力的模型有清楚边界
- 让保守模型至少知道这里不是只能 `silent`
