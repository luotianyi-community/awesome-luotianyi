# 贡献指南（CONTRIBUTING）

本仓库是洛天依（Luo Tianyi）开源生态的**非官方社区索引**。我们只做三件事：发现相关仓库、判定是否收录、把收录结果生成可读清单。所有贡献都围绕这三件事发生。

README.md / README_EN.md 由脚本从 `data/` 下的数据文件生成，**不承载规则**。规则以本目录文档为准。

## 目录

- [1. 先理解名单制度](#1-先理解名单制度)
- [2. 六种贡献方式](#2-六种贡献方式)
- [3. 提交新条目](#3-提交新条目)
- [4. 修正条目](#4-修正条目)
- [5. 报告失效链接](#5-报告失效链接)
- [6. 直接提交 PR 修改数据文件](#6-直接提交-pr-修改数据文件)
- [7. 本地校验](#7-本地校验)
- [8. 提交信息规范](#8-提交信息规范)
- [9. Issue 评论命令](#9-issue-评论命令)
- [10. 不该做的事](#10-不该做的事)
- [11. 免责与授权](#11-免责与授权)

---

## 1. 先理解名单制度

名单共四种状态，决定了你的贡献会走哪条路：

| 状态 | 含义 | 存储位置 |
| --- | --- | --- |
| `listed` | 已收录，出现在 README | `data/entries/listed.json` |
| `excluded` | 技术性排除（archived / 空仓库 / fork / 无相关内容信号） | `data/entries/excluded.json` |
| `rejected` | 人工否决，永久 | `data/entries/rejected.json` |
| `candidate` | 候选，等待裁决 | `data/candidates/queue.json` |

两条必须记住的规则：

1. **主键是 GitHub 仓库数字 id**，`full_name` 只用于展示。仓库改名或转移不会重复入册，旧名进入 `aliases`。
2. **一旦仓库进入 `listed` / `excluded` / `rejected`，自动化永不再提该仓库。** 反复建 Issue、重复提 PR 不会让它重新进入扫描流程；推翻结论只能走人工复审（见 [GOVERNANCE.md](./GOVERNANCE.md)）。

分类共 9 个，id 原样使用，不要自造：

| id | 中文名 |
| --- | --- |
| `desktop-pet` | 桌面宠物与看板娘 |
| `live2d` | Live2D 模型与网页插件 |
| `tts-ai` | 语音合成与对话 AI |
| `theme-skin` | 主题·美化·壁纸 |
| `data-tools` | 数据·知识库·工具链 |
| `game-mod` | 游戏·模组·硬件二创 |
| `audio-assets` | 音频·乐谱·创作素材 |
| `community-site` | 社区站点与周边服务 |
| `docs` | 教程与文档 |

## 2. 六种贡献方式

| 方式 | 适合场景 | 入口 | 是否需要人工裁决 |
| --- | --- | --- | --- |
| 提交新条目 | 你发现了一个不在名单里的相关仓库 | `add-repo.yml` Issue 表单 | 需要，用 `/approve` 等命令裁决 |
| 修正条目 | 分类、描述写错 | `report-correction.yml` Issue 表单 | 需要 |
| 报告失效链接 | 条目 404 / 已归档 / 已迁移 | `report-correction.yml`，问题类型选“链接失效”或“已归档” | 需要 |
| 直接改数据文件的 PR | 你有明确的字段改动，且本地跑通了校验 | Pull Request | PR 合并即生效 |
| 改生成脚本 | 你发现问题在 `scripts/` | Pull Request | Code Review |
| 改规则文档 | 你认为标准或流程有缺陷 | Pull Request 改 `docs/` | Lead 复核 |

**新手优先走 Issue 表单**：自动化会把 Issue 转成候选队列，你不必懂 JSON 结构，也不必在本地跑脚本。

## 3. 提交新条目

### 3.1 流程

1. 打开 Issues，选择 **收录新仓库** 模板。
2. 填写仓库地址（形如 `https://github.com/owner/repo`，必须是公开仓库的仓库页地址，不要填组织页、Release 页或镜像站）。
3. 选择最合适的分类（一个仓库只能归一类；拿不准就在“为什么相关”里说明候选分类）。
4. 填写“为什么相关”，并逐条给出**可核验的证据**。
5. 提交后等待自动化与维护者处理，不要重复提交同一个仓库。

### 3.2 什么算证据

证据必须是别人点开仓库就能看到的东西，例如：

- README 中的一句话原文，如 `基于洛天依 Live2D 模型的网页看板娘`；
- 具体文件路径 + 内容，如 `assets/luotianyi.model3.json`、`res/天依/01_vocaloid.wav`；
- 仓库描述（About）原文；
- 代码中的常量或配置，如 `const SINGER = "luotianyi"`。

不算证据：

- “感觉像”、“朋友说是”、“应该是同人组做的”；
- 只有 owner 名字叫 `luotianyi`，或者 URL 里出现了 `luotianyi.vc`；
- 一张外站截图（我们无法核验截图与仓库的对应关系）。

### 3.3 提交之后会发生什么

1. 自动化把仓库压入 `data/candidates/queue.json`，状态 `candidate`。
2. 维护者用 Issue 命令裁决：`/approve <category-id>`、`/reject <reason>`、`/exclude <reason>`。
3. 裁决结果写入对应数据文件，并追加一行到 `data/state/changelog.jsonl`。
4. 若收录，README 会在下一次生成时出现该条目；`desc` 可能被维护者改写为更朴素的一句话。

## 4. 修正条目

1. 找到条目的仓库地址（README 中每个条目都链接到仓库，而非仓库镜像）。
2. 选择 **报告条目问题** 模板。
3. 问题类型选“分类错误”“描述错误”或“应移除”，说明中写清**当前值**和**应改为的值**，并给出依据（例如仓库现在的主功能是 TTS，不是 Live2D；或者 README 已删除“洛天依”字样）。

分类移动不需要你决定目标 id：写清理由即可，维护者会用 `/approve <new-id>` 重收录（这会同时更新分类）。

## 5. 报告失效链接

链接失效有三种常见情形，处理方式不同：

| 情形 | 表现 | 处理 |
| --- | --- | --- |
| 仓库已归档 | 页面顶部 “This repository has been archived” | 状态改为 `excluded`，理由 `archived` |
| 仓库已删除或转私有 | 404 / 需要登录 | 状态改为 `excluded`，理由 `deleted or private` |
| 仓库改名或转移 | 旧地址 301 跳转到新地址 | **不是失效**，只需刷新 `full_name` 并把旧名加入 `aliases` |

报告时请附上你打开时的页面现象（是否 301、是否归档横幅），这能省掉维护者一次手工核实。

## 6. 直接提交 PR 修改数据文件

适合已经读过本文、能本地跑通校验的贡献者。**数据文件是事实来源，PR 合并即生效**，所以请比 Issue 更谨慎。

### 6.1 你会改到哪些文件

| 文件 | 用途 | 典型改动 |
| --- | --- | --- |
| `data/entries/listed.json` | 已收录条目 | 新增条目、改 `category`、改 `desc`、`refresh` 更新 `stars` / `pushed_at` |
| `data/entries/excluded.json` | 技术性排除记录 | 新增排除、标注理由 |
| `data/entries/rejected.json` | 人工否决记录 | 仅在复审推翻后才会删除或迁移 |
| `data/candidates/queue.json` | 候选队列 | 一般由自动化写入，**人工 PR 通常不改** |
| `data/taxonomy/categories.json` | 9 个分类的定义与显示名 | 改分类体系属于破坏性变更，需要单独讨论 |
| `data/state/changelog.jsonl` | 变更审计流，只追加 | 每行一条 JSON，禁止改写历史行 |
| `README.md` / `README_EN.md` | 自动生成的清单 | **不要手改**，见 6.3 |

### 6.2 条目字段含义

每个条目对象包含以下字段（顺序不影响校验，但请保持与现有文件一致）：

| 字段 | 类型 | 必填 | 含义 |
| --- | --- | --- | --- |
| `id` | number | 是 | GitHub 仓库数字 id，主键。不接受 `full_name` 当主键 |
| `full_name` | string | 是 | 当前展示名 `owner/repo`；改名时更新，旧名进 `aliases` |
| `category` | string | 是 | 9 个分类 id 之一，必须小写连字符 |
| `desc` | string | 是 | 一句话中文描述，不超过 80 字，写“它做什么”，不写“很棒/神器” |
| `stars` | number | 否 | 最近一次抓取的 star 数，不手填猜测值 |
| `language` | string \| null | 否 | GitHub 判定的主语言 |
| `pushed_at` | string | 否 | 最近一次 push 时间，ISO 8601 UTC，形如 `2026-10-02T11:20:00Z` |
| `added_at` | string | 是 | 入册日期，`YYYY-MM-DD` |
| `source` | string | 是 | 入册渠道：`issue-command` / `auto-scan` / `maintainer` |
| `evidence` | string | 是 | 相关性证据，写具体位置与原文，例如 `README: “洛天依 Live2D 加载器”` |
| `aliases` | string[] | 否 | 历史 `full_name`，仅改名/转移时出现 |

示例：

```json
{
  "id": 458221975,
  "full_name": "example-org/luotianyi-live2d-kit",
  "category": "live2d",
  "desc": "把洛天依 Live2D 模型接入网页的轻量加载器与示例页",
  "stars": 42,
  "language": "TypeScript",
  "pushed_at": "2026-10-02T11:20:00Z",
  "added_at": "2026-11-08",
  "source": "issue-command",
  "evidence": "README: \"洛天依 Live2D 模型加载器\"；assets/luotianyi.model3.json"
}
```

`desc` 的具体写法：

- 好：`在 VSCode 状态栏显示洛天依像素看板娘，支持自定义台词`
- 差：`超可爱的天依酱看板娘，强烈推荐！！！`（无信息量、带营销语气）

### 6.3 为什么不要手改 README

`README.md` 与 `README_EN.md` 由脚本按分类、按 star 数排序生成。手改会在下一次生成时被覆盖，并且会让 `validate.mjs` 报错。要改展示内容，改 `data/` 下的数据。

### 6.4 PR 流程

1. Fork 并新建分支，分支名形如 `catalog/add-owner-repo`。
2. 改数据文件（+ 必要时追加 `changelog.jsonl` 一行）。
3. 依次运行：

```bash
node scripts/validate.mjs
node --test tests/
```

4. 提交并开 PR，按 `.github/PULL_REQUEST_TEMPLATE.md` 勾选清单。
5. 在 PR 描述里贴出 `evidence` 对应内容的截图或链接锚点，方便复核。

## 7. 本地校验

环境：Node.js >= 20，无需安装第三方依赖，克隆后即可运行。

| 命令 | 作用 | 何时跑 |
| --- | --- | --- |
| `node scripts/add-entry.mjs add <owner/repo> --category <id> [--desc "..."]` | 收录一个仓库（写 `listed.json`） | 本地补条目时 |
| `node scripts/add-entry.mjs reject <owner/repo> --reason "..."` | 永久否决（写 `rejected.json`） | 本地记录否决时 |
| `node scripts/add-entry.mjs exclude <owner/repo> --reason "..."` | 技术性排除（写 `excluded.json`） | 本地记录排除时 |
| `node scripts/add-entry.mjs refresh` | 刷新已收录条目元数据（stars / pushed_at / language） | 批量更新前 |
| `node scripts/validate.mjs` | 校验数据文件合法性、字段完整性、与 README 一致性 | **每次 PR 前必跑** |
| `node --test tests/` | 跑单元测试 | 每次 PR 前必跑 |

所有脚本支持 `--dry-run`，只打印将要发生的变更而不写文件。首次尝试新操作时请先 `--dry-run`：

```bash
node scripts/add-entry.mjs add owner/repo --category tts-ai --dry-run
```

`validate.mjs` 常见失败与含义：

| 报错关键词 | 含义 | 修法 |
| --- | --- | --- |
| `duplicate id` | 同一仓库数字 id 出现在多个文件 | 按状态机只保留一处 |
| `unknown category` | 用了不在 9 类里的 id | 换成合法 id |
| `missing evidence` | 条目没有可核验证据 | 补 `evidence` |
| `readme out of sync` | README 与数据不一致 | 重新生成 README，不要手改 |

## 8. 提交信息规范

遵循 [Conventional Commits](https://www.conventionalcommits.org/)，一个提交做一件事：

| 前缀 | 用途 | 示例 |
| --- | --- | --- |
| `feat(catalog)` | 新增收录条目 | `feat(catalog): add owner/repo` |
| `fix(catalog)` | 修正条目字段 / 分类 | `fix(catalog): move owner/repo to tts-ai` |
| `feat(criteria)` | 调整收录标准 | `feat(criteria): require evidence in candidate issues` |
| `feat(automation)` | 抓取 / 裁决 / 生成脚本变更 | `feat(automation): cap issues at 20 per run` |
| `chore(data)` | 元数据刷新、格式整理 | `chore(data): refresh stars for 12 entries` |
| `docs` | 文档 | `docs: clarify aliases handling` |
| `test` | 测试 | `test: cover archived repo exclusion` |

标题不超过 72 字符，用祈使语气，不加句号。不要在提交信息里写“update”或“fix bug”这类无信息内容。

## 9. Issue 评论命令

裁决通过 Issue 评论命令完成。**只有对该仓库拥有 write 或 admin 权限的用户发表的评论才会被执行**，其他人评论仅作讨论。

| 命令 | 作用 | 必填参数 | 示例 |
| --- | --- | --- | --- |
| `/approve <category-id>` | 收录到指定分类，状态 `candidate` -> `listed` | 分类 id（9 选 1） | `/approve live2d` |
| `/reject <reason>` | 永久否决，状态 -> `rejected` | 理由，**必填** | `/reject 无洛天依内容，仅是通用 OCR 工具` |
| `/exclude <reason>` | 技术性排除，状态 -> `excluded` | 理由，**必填** | `/exclude 仓库已 archived` |

注意事项：

- 一条评论只写一条命令，便于审计与回溯。
- 理由要写事实，不写情绪：`archived 2025-06` 好过 `这仓库不行`。
- 命令一旦执行即写入数据文件；`listed` / `excluded` / `rejected` 三态之后，自动化不会再为该仓库建 Issue，想改判必须走复审（见 GOVERNANCE.md）。
- 拿不准时先 `/exclude` 而非 `/reject`：排除是技术性判断，可以因仓库复活而复审翻案；否决是人工意志，翻案成本更高。

## 10. 不该做的事

- 不要为了让自己的仓库上榜而伪造证据（截断 README、临时改 About）。一旦发现按 `reject` 处理并记录理由。
- 不要提交同一仓库的不同 URL 变体（`/tree/main`、镜像站、fork 地址）来重复入册。
- 不要在 PR 里夹带 README 手改、格式化整份 JSON、调换字段顺序等噪音变更。
- 不要收录以分发盗版素材（模型、贴图、音源）为主要内容的仓库，见 [NOTICE.md](../NOTICE.md)。
- 不要在 Issue 里贴大段外站转载内容；只贴链接与定位即可。

## 11. 免责与授权

洛天依是上海禾念信息科技有限公司（Vsinger）旗下虚拟歌手。本项目是**非官方社区索引**，与官方无隶属关系、未获官方背书，不使用官方美术素材。

- 条目信息（名称、描述、star、语言等）来自 GitHub 公开 API 与仓库自身内容；
- 每个仓库的代码与资源以其**自身许可证**为准，本项目不代替上游授权；
- 本项目自身的代码与数据文件以 MIT 许可证发布，范围见 [NOTICE.md](../NOTICE.md)。

如你是权利人并认为某条目构成侵权，请按 `docs/SECURITY.md` 与 `NOTICE.md` 的渠道通知我们，我们会在核实后移除条目。
