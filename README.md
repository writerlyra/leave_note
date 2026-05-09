# Leave Note

`leave_note` 是一个给 Cyberboss 使用者的接入包。
- `Cyberboss` 的项目地址：`https://github.com/WenXiaoWendy/cyberboss`

它解决的问题不是“怎么多发消息”，而是：

- 有一句话值得留给对方
- 但此刻不一定适合直接打扰
- 与其直接 `silent`，不如留下一张之后会被看到的小纸条

它不是一个独立服务，也不是一个单独跑起来的 note 应用。  
它的目标是让别的 Cyberboss 使用者拿到之后，可以直接把“小纸条”接到自己的 Cyberboss 项目里。

功能本体刻意不依赖 `soft_message`、`must_message` 之类项目专有机制。  
核心只需要三种决策：

- `send_message`
- `leave_note`
- `silent`

## 目标

- 让“小纸条”成为一个独立能力，而不是聊天回复的附庸
- 让它和日记、正常对话分工清楚
- 让不同项目能按自己的调度机制接入

## 不承诺的事

- 不保证所有模型都会同样主动
- 不保证所有模型都能写出同样有关系感的小纸条
- 不保证它能把保守模型调成高主动模型

分享的是“接入能力”，不是“同款人格体验”。

## 包含内容

- [SPEC.md](./SPEC.md)
  `leave_note` 的产品定义与边界
- [PROMPTS.md](./PROMPTS.md)
  可移植的提示词原则
- [DATA-SCHEMA.md](./DATA-SCHEMA.md)
  建议存储格式
- [INTEGRATION-CYBERBOSS.md](./INTEGRATION-CYBERBOSS.md)
  Cyberboss 主项目接法，包含真实文件清单
- [INTEGRATION-DASHBOARD.md](./INTEGRATION-DASHBOARD.md)
  dashboard 展示层接法，包含真实文件清单
- [CODE-OVERVIEW.md](./CODE-OVERVIEW.md)
  哪些代码可以直接拷走，哪些只建议手动 merge
- [examples/good-notes.md](./examples/good-notes.md)
  正例
- [examples/anti-patterns.md](./examples/anti-patterns.md)
  反例

## 代码也带上了

这份分享包现在不只有说明书，也包含已经实现好的代码。

- `code/`
  放可直接复用的实现文件
- `snippets/`
  放需要手动接到宿主项目的大文件片段

这样做的目的不是一键安装，而是：

- 避免别人重复手写你已经实现好的 note server / storage / route
- 同时避免整文件覆盖掉别人改过的 Cyberboss 本体

## 最小决策模型

功能本体只需要这三个判断：

1. `send_message`
   现在就该去找她
2. `leave_note`
   现在不一定该打扰，但这句值得留给她
3. `silent`
   现在既不该打扰，也没有值得留下的话

## 适合接入的场景

- 随机 check-in
- 非紧急状态更新
- 关系型陪伴
- 轻提醒
- “想到她了，但不必现在打过去”的时刻

## 不适合接入的场景

- 强时效提醒
- 明确的 must-message 事件
- 安全风险
- 需要即时往返确认的问题

## 这个包适合谁

- 已经在用 Cyberboss
- 想把“小纸条 / leave_note”接进自己的分支
- 不想从零读你整个项目才知道要改哪里

## 不是什么

- 不是独立 note server
- 不是通用聊天应用
- 不是一键把任何模型都调成很会留纸条

## 对接入者的建议

- 先把 Cyberboss 主项目接通，再调风格
- 先把 `leave_note` 和 `diary` 分开，再追求“写得动人”
- 把“生成成功”和“展示成功”分开记录
- 如果模型偏保守，不要只怪提示词，通常还需要调度层帮它创造机会
