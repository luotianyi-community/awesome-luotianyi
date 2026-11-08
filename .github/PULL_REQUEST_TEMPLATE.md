## 这个 PR 做了什么

<!-- 一句话。例：新增 example-org/luotianyi-live2d-kit 到 live2d 分类 -->

## 改动清单

- [ ] 只改了数据/文档文件，没有手改 `README.md` / `README_EN.md`（它们是生成物）
- [ ] 没有夹带与本次改动无关的变更（无整文件格式化、无字段顺序调换）
- [ ] 若新增了 `changelog.jsonl` 记录，只追加、未改写历史行

本次涉及的文件（保留实际改动的行，删除其余）：

| 文件 | 改动类型 |
| --- | --- |
| `data/entries/listed.json` | 新增 / 修正 / 刷新 |
| `data/entries/excluded.json` | 新增排除 |
| `data/entries/rejected.json` | 新增否决 |
| `data/state/changelog.jsonl` | 追加一行审计记录 |
| `docs/` | 文档修改 |
| `scripts/` | 脚本修改 |

## 本地校验

- [ ] `node scripts/validate.mjs` 通过
- [ ] `node --test tests/` 通过
- [ ] 涉及写入数据时，先用 `--dry-run` 确认过待变更内容

```text
# 在此粘贴 node scripts/validate.mjs 的输出

# 在此粘贴 node --test tests/ 的输出
```

## 新增条目时填写（否则删除本节）

- 仓库地址：
- 仓库数字 id（`id` 字段，不是 full_name）：
- 分类 id：
  - [ ] `desktop-pet` [ ] `live2d` [ ] `tts-ai` [ ] `theme-skin` [ ] `data-tools` [ ] `game-mod` [ ] `audio-assets` [ ] `community-site` [ ] `docs`
- 证据（`evidence` 字段，写具体位置与原文）：

核对项：

- [ ] 已确认该仓库不是 archived、非空、不是无独立改动的 fork
- [ ] 已确认该仓库未出现在 `listed` / `excluded` / `rejected` 任一文件中（无重复 id）
- [ ] 若仓库是改名/转移，已更新 `full_name` 并把旧名写入 `aliases`

## 敏感信息检查

- [ ] 没有提交任何 token、密钥、webhook secret、私有地址或个人隐私信息
- [ ] 提交信息符合 Conventional Commits（如 `feat(catalog): add owner/repo`）

<!-- 提交前可自查： git diff --cached | grep -nEi "(gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|PRIVATE KEY)" -->
