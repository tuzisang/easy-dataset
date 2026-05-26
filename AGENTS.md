# Easy Dataset Agent 指南

## 项目概述

Easy Dataset 是一个专为大型语言模型（LLM）微调数据集创建而设计的应用程序。它提供完整的workflow，从文档处理到数据集导出，支持多种文件格式和AI模型。

## 技术栈

- **前端**: Next.js 14 (App Router), React 18, Material-UI v5
- **后端**: Node.js, Prisma ORM, SQLite
- **AI集成**: OpenAI API, Ollama, 智谱AI, OpenRouter
- **桌面应用**: Electron
- **国际化**: i18next
- **构建工具**: npm/pnpm, Electron Builder

## 核心架构

### 1. 数据流架构

```
文档上传 → 文本分割 → 问题生成 → 答案生成 → 数据集导出
    ↓           ↓          ↓          ↓          ↓
文件处理    智能分块    LLM生成    LLM生成    格式转换
```

### 2. 模块结构

```
lib/
├── api/          # API接口层
├── db/           # 数据访问层
├── file/         # 文件处理模块
├── llm/          # AI模型集成
├── services/     # 业务逻辑层
└── util/         # 工具函数
```

## 开发指南

### 环境设置

```bash
# 安装依赖
npm install

# 数据库初始化
npm run db:push

# 开发模式
npm run dev

# 构建
npm run build
```

### 代码规范

- 使用ES6+语法
- 模块化开发
- 异步操作使用async/await
- 错误处理使用try/catch
- 注释使用JSDoc格式

### 重要文件路径

- **主入口**: `app/page.js`
- **项目路由**: `app/projects/[projectId]/`
- **API路由**: `app/api/`
- **LLM核心**: `lib/llm/core/index.js`
- **任务处理**: `lib/services/tasks/`

## 功能模块详解

### 1. 文档处理模块 (`lib/file/`)

- **支持的格式**: PDF, Markdown, DOCX, EPUB, TXT
- **核心功能**:
  - 智能文本分割
  - 目录结构提取
  - 自定义分隔符分块
  - 多语言支持

### 2. AI模型集成 (`lib/llm/`)

- **支持的提供商**:
  - OpenAI (GPT系列)
  - Ollama (本地模型)
  - 智谱AI (GLM系列)
  - OpenRouter (多模型聚合)
- **功能特性**:
  - 统一API接口
  - 流式输出支持
  - 多语言提示词
  - 错误重试机制

### 3. 任务系统 (`lib/services/tasks/`)

- **任务类型**:
  - 文件处理任务
  - 问题生成任务
  - 答案生成任务
  - 数据清洗任务
- **状态管理**: 待处理、处理中、完成、失败

### 4. 数据管理 (`lib/db/`)

- **数据模型**:
  - Project (项目)
  - Text/Chunk (文本块)
  - Question (问题)
  - Dataset (数据集)
  - Tag (标签)

## 常用开发任务

### 添加新的AI模型提供商

1. 在 `lib/llm/core/providers/` 创建新的provider文件
2. 实现基础接口 (generate, streamGenerate)
3. 在 `lib/llm/core/index.js` 中注册provider
4. 更新配置文件和UI界面

### 添加新的文件格式支持

1. 在 `lib/file/file-process/` 创建格式处理器
2. 实现内容提取和文本转换逻辑
3. 更新文件类型检测和验证
4. 添加相应的UI组件

### 自定义提示词模板

1. 在 `lib/llm/prompts/` 创建新的提示词文件
2. 使用i18n支持多语言
3. 在设置界面添加配置选项
4. 测试不同模型的效果

### 添加新的导出格式

1. 在 `components/export/` 创建新的导出组件
2. 实现数据格式转换逻辑
3. 更新导出对话框界面
4. 添加格式验证和错误处理

## 调试技巧

### 1. 数据库调试

```bash
# 打开Prisma Studio
npm run db:studio

# 查看数据库文件
sqlite3 prisma/db.sqlite
```

### 2. LLM API调试

```javascript
// 在lib/llm/core/index.js中添加日志
console.log('LLM Request:', { provider, model, prompt });
console.log('LLM Response:', response);
```

### 3. 文件处理调试

```javascript
// 在lib/file/中添加调试信息
console.log('File processing:', fileName, fileType);
console.log('Text chunks:', chunks.length, chunks[0]);
```

## 性能优化建议

### 1. 文件处理优化

- 大文件分片处理
- 异步并发处理
- 内存使用监控
- 进度条显示

### 2. LLM调用优化

- 请求缓存机制
- 批量处理请求
- 重试策略优化
- 并发数控制

### 3. 前端性能优化

- 组件懒加载
- 虚拟滚动列表
- 图片懒加载
- 代码分割

## 常见问题解决

### 1. 数据库相关问题

- **问题**: 数据库连接失败
- **解决**: 检查prisma配置，确保数据库文件存在

### 2. LLM API相关问题

- **问题**: API调用超时
- **解决**: 调整超时时间，检查网络连接，增加重试机制

### 3. 文件处理问题

- **问题**: 大文件处理内存溢出
- **解决**: 使用流式处理，分块读取，增加内存限制

### 4. Electron打包问题

- **问题**: 打包后应用无法启动
- **解决**: 检查依赖项配置，确保native模块正确打包

## 部署指南

### Docker部署

```bash
# 构建镜像
docker build -t easy-dataset .

# 运行容器
docker run -d -p 1717:1717 -v ./local-db:/app/local-db easy-dataset
```

### 桌面应用构建

```bash
# 构建各平台安装包
npm run electron-build-mac    # macOS
npm run electron-build-win    # Windows
npm run electron-build-linux  # Linux
```

## 贡献指南

### 提交规范

- 使用conventional commits格式
- 提交前运行lint检查
- 更新相关文档
- 添加测试用例

### 分支策略

- `main`: 主分支，稳定版本
- `dev`: 开发分支，集成新功能
- `feature/*`: 功能分支
- `fix/*`: 修复分支

---

<!-- gitnexus:start -->

# GitNexus — Code Intelligence

This project is indexed by GitNexus as **easy-dataset** (3777 symbols, 8120 relationships, 293 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> If any GitNexus tool warns the index is stale, run `npx gitnexus analyze` in terminal first.

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `gitnexus_impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `gitnexus_detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `gitnexus_query({query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `gitnexus_context({name: "symbolName"})`.

## When Debugging

1. `gitnexus_query({query: "<error or symptom>"})` — find execution flows related to the issue
2. `gitnexus_context({name: "<suspect function>"})` — see all callers, callees, and process participation
3. `READ gitnexus://repo/easy-dataset/process/{processName}` — trace the full execution flow step by step
4. For regressions: `gitnexus_detect_changes({scope: "compare", base_ref: "main"})` — see what your branch changed

## When Refactoring

- **Renaming**: MUST use `gitnexus_rename({symbol_name: "old", new_name: "new", dry_run: true})` first. Review the preview — graph edits are safe, text_search edits need manual review. Then run with `dry_run: false`.
- **Extracting/Splitting**: MUST run `gitnexus_context({name: "target"})` to see all incoming/outgoing refs, then `gitnexus_impact({target: "target", direction: "upstream"})` to find all external callers before moving code.
- After any refactor: run `gitnexus_detect_changes({scope: "all"})` to verify only expected files changed.

## Never Do

- NEVER edit a function, class, or method without first running `gitnexus_impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `gitnexus_rename` which understands the call graph.
- NEVER commit changes without running `gitnexus_detect_changes()` to check affected scope.

## Tools Quick Reference

| Tool             | When to use                   | Command                                                                 |
| ---------------- | ----------------------------- | ----------------------------------------------------------------------- |
| `query`          | Find code by concept          | `gitnexus_query({query: "auth validation"})`                            |
| `context`        | 360-degree view of one symbol | `gitnexus_context({name: "validateUser"})`                              |
| `impact`         | Blast radius before editing   | `gitnexus_impact({target: "X", direction: "upstream"})`                 |
| `detect_changes` | Pre-commit scope check        | `gitnexus_detect_changes({scope: "staged"})`                            |
| `rename`         | Safe multi-file rename        | `gitnexus_rename({symbol_name: "old", new_name: "new", dry_run: true})` |
| `cypher`         | Custom graph queries          | `gitnexus_cypher({query: "MATCH ..."})`                                 |

## Impact Risk Levels

| Depth | Meaning                               | Action                |
| ----- | ------------------------------------- | --------------------- |
| d=1   | WILL BREAK — direct callers/importers | MUST update these     |
| d=2   | LIKELY AFFECTED — indirect deps       | Should test           |
| d=3   | MAY NEED TESTING — transitive         | Test if critical path |

## Resources

| Resource                                      | Use for                                  |
| --------------------------------------------- | ---------------------------------------- |
| `gitnexus://repo/easy-dataset/context`        | Codebase overview, check index freshness |
| `gitnexus://repo/easy-dataset/clusters`       | All functional areas                     |
| `gitnexus://repo/easy-dataset/processes`      | All execution flows                      |
| `gitnexus://repo/easy-dataset/process/{name}` | Step-by-step execution trace             |

## Self-Check Before Finishing

Before completing any code modification task, verify:

1. `gitnexus_impact` was run for all modified symbols
2. No HIGH/CRITICAL risk warnings were ignored
3. `gitnexus_detect_changes()` confirms changes match expected scope
4. All d=1 (WILL BREAK) dependents were updated

## Keeping the Index Fresh

After committing code changes, the GitNexus index becomes stale. Re-run analyze to update it:

```bash
npx gitnexus analyze
```

If the index previously included embeddings, preserve them by adding `--embeddings`:

```bash
npx gitnexus analyze --embeddings
```

To check whether embeddings exist, inspect `.gitnexus/meta.json` — the `stats.embeddings` field shows the count (0 means no embeddings). **Running analyze without `--embeddings` will delete any previously generated embeddings.**

> Claude Code users: A PostToolUse hook handles this automatically after `git commit` and `git merge`.

## CLI

| Task                                         | Read this skill file                                        |
| -------------------------------------------- | ----------------------------------------------------------- |
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md`       |
| Blast radius / "What breaks if I change X?"  | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?"             | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md`       |
| Rename / extract / split / refactor          | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md`     |
| Tools, resources, schema reference           | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md`           |
| Index, status, clean, wiki CLI commands      | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md`             |

<!-- gitnexus:end -->
