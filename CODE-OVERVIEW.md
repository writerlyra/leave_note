# Code Overview

这个分享包现在分成两类内容：

## 1. `code/`

这里放的是可以直接参考或直接拷走的实现代码。

适合直接复用的文件：

- `code/cyberboss/src/services/note-service.js`
- `code/cyberboss/src/services/text-input.js`
- `code/cyberboss/test/note-service.test.js`
- `code/cyberboss/test/stream-delivery-note.test.js`
- `code/cyberboss-dashboard/backend/src/services/note-service.js`
- `code/cyberboss-dashboard/backend/src/routes/notes.js`

这些文件之所以适合直接带走，是因为：

- 职责边界清楚
- 对宿主项目的耦合相对有限
- 不需要整份覆盖对方的大型核心文件

## 2. `snippets/`

这里放的是“接线片段”，不是完整文件。

适合只提供片段、不建议整文件覆盖的宿主文件：

- `cyberboss/src/core/config.js`
- `cyberboss/src/tools/create-project-tooling.js`
- `cyberboss/src/core/stream-delivery.js`
- `cyberboss/src/core/app.js`
- `cyberboss/templates/weixin-operations.md`
- `cyberboss-dashboard/backend/src/core/config.js`
- `cyberboss-dashboard/backend/src/index.js`

这些文件通常已经被各个使用者改过。  
如果把整文件直接覆盖过去，风险很大，所以这里保留成“最小必要改动片段”。

## 推荐接入方式

1. 先复制 `code/` 里的独立文件。
2. 再按 `snippets/` 里的片段手动接到自己的宿主项目。
3. 最后按 `PATCH-ORDER.md` 做最小验证。

## 这个包的目标

这个包不是一键安装器。  
它的目标是：

- 避免别人重复手写你已经实现好的 server / storage / route 代码
- 同时避免粗暴覆盖别人已经改过的 Cyberboss 本体
