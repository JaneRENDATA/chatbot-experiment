# LLM 流式链路与前后端改造说明

## 1. 总体结构与原理

- **后端（NestJS）**：/chat/stream 接口，支持规则树与 LLM（DeepSeek/OpenAI）流式输出，SSE 协议推送到前端。
- **前端（Next.js/React）**：Chatbox 组件用 fetch+ReadableStream 实现流式解析，逐 token 渲染，支持 markdown/代码块高亮与三点 loading 动画。

---

## 2. 后端流式实现要点

- 使用 Node.js 18+ 原生 fetch + response.body.getReader() 逐 chunk 读取 LLM API（如 DeepSeek/OpenAI）流式响应。
- 每收到一个 chunk 立刻 res.write + res.flush() 推送到前端，无缓存、无批量。
- 规则树命中时模拟流式输出，LLM 兜底时真实流式。
- 详细日志记录 fetch、首包、每个 chunk 到达时间，便于排查。
- 只允许 res.end() 一次，避免多次响应。

---

## 3. 前端流式与 loading 动画最佳实践

- 用 fetch + response.body.getReader() 逐 chunk 解析，收到内容就 setState 渲染。
- AI 消息用 ReactMarkdown + CodeBlock 渲染，支持 markdown/代码块高亮。
- 用户消息为纯文本。
- 三点 loading 动画（DeepSeek 风格）只在最新 AI 消息末尾显示，首包到达后自动隐藏。
- loading 状态用 showLoading 控制，handleSubmit 发起请求时设为 true，收到首个 token 后设为 false。
- 推荐 prompt 按钮、来源标签等功能与流式兼容。

---

## 4. 推荐 prompt 生成逻辑

- 规则树命中时，推荐 prompt 为本地写死。
- LLM 兜底时，后端用如下 system prompt 引导 LLM 生成：
  > Please answer the user's question in no more than 500 English characters, and provide 3 related recommended questions in English, in the following format:\nAnswer content\nSuggestion 1: xxx\nSuggestion 2: xxx\nSuggestion 3: xxx
- 后端按行拆分，第一行为主回复，后面三行为推荐 prompt。

---

## 5. 常见问题与排查建议

- **首包延迟 2~5 秒**为 LLM 推理/排队时间，非链路/代码问题。
- curl 直连 LLM API 也是几秒首包，说明链路畅通。
- 前端/后端日志时间戳对齐，说明流式链路无延迟。
- 若 markdown/代码块样式丢失，需确保 AI 消息用 ReactMarkdown + CodeBlock 渲染，loading 动画为附加元素。
- 若 loading 动画不显示，优先检查 showLoading 状态、样式、z-index、热更新。

---

## 6. 维护建议

- 任何流式链路问题，优先用 curl/日志定位是 LLM 首包慢还是链路有缓存。
- 前端如需自定义 loading、typewriter、气泡样式，建议只改渲染部分，不动流式解析主逻辑。
- 后端如需切换 LLM（如 OpenAI、Moonshot、MiniMax），只需改 fetch 的 API 地址和 model 字段，流式主逻辑不变。
- 推荐 prompt 生成逻辑可通过调整 system prompt 灵活定制。

---

如有团队成员交接或新需求，建议先阅读本文档再查阅具体代码实现。 