# 洛天依开源生态索引 · Awesome Luo Tianyi

<div align="center">

**搜集与洛天依（Luo Tianyi / 洛天依 / 天依 / Vsinger 中文V家）相关的开源仓库、工具、资源与二创项目**

[![Awesome](https://awesome.re/badge.svg)](https://awesome.re)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](docs/CONTRIBUTING.md)

中文 | [English](README_EN.md)

</div>

<!-- BEGIN:STATS -->
**101 个仓库 · 9 个分类 · 构建于 2026-11-13 · 最新仓库活动 2026-11-12**

| 分类 | 仓库数 |
| --- | --- |
| 🐱 桌面宠物与看板娘 | 8 |
| 🎭 Live2D 模型与网页插件 | 8 |
| 🗣️ 语音合成与对话 AI | 11 |
| 🎨 主题·美化·壁纸 | 14 |
| 🧰 数据·知识库·工具链 | 15 |
| 🎮 游戏·模组·硬件二创 | 18 |
| 🎵 音频·乐谱·创作素材 | 5 |
| 🌐 社区站点与周边服务 | 18 |
| 📚 教程与文档 | 4 |

**主要语言**：other (31) · JavaScript (18) · Python (18) · HTML (13) · TypeScript (5) · Java (4)
<!-- END:STATS -->

## 目录

- [关于洛天依](#关于洛天依)
- [收录标准](#收录标准)
- [分类索引](#分类索引)
- [收录条目](#收录条目)
- [名单制度](#名单制度)
- [自动化工作流](#自动化工作流)
- [参与贡献](#参与贡献)
- [免责声明](#免责声明)

## 关于洛天依

洛天依是中国首位虚拟歌手，2012 年由上海禾念信息科技有限公司（Vsinger）推出，隶属 VOCALOID / 中文虚拟歌手体系。她拥有独立的声库、形象与世界观，围绕其产生的同人创作、工具链与二创项目构成了一个独特的中文开源亚文化生态。

本仓库把这些分散在 GitHub 上的项目整理成一份可检索、可维护的索引。**本项目为非官方社区索引，与 Vsinger 官方无隶属关系。**

## 收录标准

一个仓库要被收录，**必须同时满足**：

1. **主题明确相关**：仓库名、描述、README 或 topics 中明确出现 洛天依 / 乐天依 / 天依 / Luo Tianyi / Luo Tanyi / LuoTianyi / Vsinger / 天依craft 之一；
2. **有实际内容**：仓库非空（不是占位仓库），且代码或数据本身与洛天依相关，而非仅仅作者名叫 luotianyi；
3. **可访问**：仓库未归档（archived 状态会被自动排除）。

加分项：有 README、有 LICENSE、最近 12 个月有提交、star ≥ 3。

**不接受**：纯个人主页（`*.github.io` 个人博客按弱信号人工定夺）、空仓库、名称巧合（如 `LuoTianyi-arm64/printrgb` 这类 owner 名字撞车但项目无关的仓库）、仅描述里出现一次无关链接的项目。完整判定表见 [docs/CRITERIA.md](docs/CRITERIA.md)。

## 分类索引

| 分类 | id | 说明 |
| --- | --- | --- |
| 🐱 桌面宠物与看板娘 | `desktop-pet` | 桌宠、陪伴类互动程序 |
| 🎭 Live2D 模型与网页插件 | `live2d` | Live2D 模型、看板娘插件、MMD |
| 🗣️ 语音合成与对话 AI | `tts-ai` | GPT-SoVITS 声线、TTS、对话 Agent |
| 🎨 主题·美化·壁纸 | `theme-skin` | 终端/系统/Panel 主题、壁纸、表盘 |
| 🧰 数据·知识库·工具链 | `data-tools` | 数据库、歌词库、解析与统计工具 |
| 🎮 游戏·模组·硬件二创 | `game-mod` | 游戏模组、音游、PCB 等实体二创 |
| 🎵 音频·乐谱·创作素材 | `audio-assets` | 声库、乐谱、编曲工程、MIDI |
| 🌐 社区站点与周边服务 | `community-site` | 博客、站点、Bot、社区服务 |
| 📚 教程与文档 | `docs` | 教程、手册、知识整理 |

## 收录条目

> 本节由 `node scripts/render-readme.mjs` 从 [`data/entries/listed.json`](data/entries/listed.json) 自动生成，**请勿手工编辑**。要新增条目请提交 Issue 或运行 `node scripts/add-entry.mjs add <owner/repo>`。

<!-- BEGIN:ENTRIES -->
### 🐱 桌面宠物与看板娘 (8)

- [ChinaYosh007/LuoTianYi-pet](https://github.com/ChinaYosh007/LuoTianYi-pet) `★5` — New-Item -ItemType Directory -Force "$env:USERPROFILE\.codex\pets" / Out-Null
- [YYRMMAYO/xuxin-desktop-pet](https://github.com/YYRMMAYO/xuxin-desktop-pet) `★4 · Kotlin` — 安卓悬浮窗桌宠：初音未来/洛天依/乐正绫程序化角色建模、骨骼动画、语音互动与陪伴系统（Kotlin/Canvas）
- [hedanbaomi/tianyi-inspired-companion](https://github.com/hedanbaomi/tianyi-inspired-companion) `★3` — 洛天依陪伴 Skill - 日常聊天、学习陪跑、音乐讨论与轻度安慰
- [llly712/tianyi-desktop-pet](https://github.com/llly712/tianyi-desktop-pet) `★3 · Python` — 洛天依桌面AI助手 - PMX/Live2D渲染 + TTS + 本地Agent + AstrBot接入
- [StarryFirefly-Armillary/Tianyi-Claude-Pet](https://github.com/StarryFirefly-Armillary/Tianyi-Claude-Pet) `★3 · Rust` — 洛天依 Claude Code 桌宠，基于 aemeath_withclaude 修改。
- [bai111111/dsh-pet-luotianyi](https://github.com/bai111111/dsh-pet-luotianyi) `★2 · JavaScript` — 洛天依桌宠：住在 DSH 里的虚拟歌姬。可拖动可互动，台词支持预设/AI 两种模式，内置 token 用量与费用统计栏，支持换图 + AI 自动抠图与预览微调。
- [2024080911015/luotianyi_model](https://github.com/2024080911015/luotianyi_model) `★1 · HTML` — 一个可爱的洛天依桌面宠物应用，可以在Windows桌面上显示一个交互式的Q版洛天依。
- [Maitokine/luotianyipet](https://github.com/Maitokine/luotianyipet) `★1 · JavaScript` — 洛天依桌面宠物 - Windows 桌面陪伴桌宠（Electron 二创，个人自用）

### 🎭 Live2D 模型与网页插件 (8)

- [unsignedzhang/luotianyi-live2d](https://github.com/unsignedzhang/luotianyi-live2d) `★26 · JavaScript` — 为你的博客或网站添加一个洛天依live2D看板娘
- [x66ccff/lty-lv2d-v3](https://github.com/x66ccff/lty-lv2d-v3) `★18 · JavaScript` — 💙🩵LuoTianyi洛天依 v3 interactive mascot / Live2d widget for blog / 看板娘🩵💙
- [luotianyi-dev/luotianyi-wordpress-librelive2d](https://github.com/luotianyi-dev/luotianyi-wordpress-librelive2d) `★4 · PHP` — 开源的 Wordpress Live2D 插件
- [Aoi-Karlin/Luo_Tianyi_v6Accel](https://github.com/Aoi-Karlin/Luo_Tianyi_v6Accel) `★2` — 本仓库存储来自Azured的第六版洛天依人设。请自行取用。
- [fyf-buaa/luotianyi-feicuishi](https://github.com/fyf-buaa/luotianyi-feicuishi) `★2` — 洛天依「翡翠石」Live2D 模型
- [luo-tian-yi/lty_ver](https://github.com/luo-tian-yi/lty_ver) `★1 · JavaScript` — 洛天依殿下包子铺 ver2.0 · Live2D 模型文件
- [HuxiaoRoar/Poilive2dNLTY1lingshi](https://github.com/HuxiaoRoar/Poilive2dNLTY1lingshi) `JavaScript` — 新·洛天依 Live2D：WordPress 插件，支持新旧模型自由切换与后台自定义样式
- [luo-tian-yi/lty](https://github.com/luo-tian-yi/lty) — 洛天依 Live2D 模型文件（洛天依殿下的包子铺）

### 🗣️ 语音合成与对话 AI (11)

- [SheepLiu712/Agent-LuoTianyi](https://github.com/SheepLiu712/Agent-LuoTianyi) `★102 · Python` — 虚拟歌手洛天依（Luo Tianyi）智能对话Agent。
- [xdedmmc2/GPT-SoVITS-Luo-Tianyi](https://github.com/xdedmmc2/GPT-SoVITS-Luo-Tianyi) `★25` — 让天依亲口说爱你！——基于GPT-SoVITS的一款模拟洛天依声线的语音生成模型
- [qifanmaker/LuoTianyi-Agent](https://github.com/qifanmaker/LuoTianyi-Agent) `★8 · Python` — LuoTianyi-Agent with LLM, GPT-SoVITS, Live2D
- [MUKEKANN/Luo-Agent](https://github.com/MUKEKANN/Luo-Agent) `★4 · TypeScript` — 洛天依风格的本地桌面 AI Agent 实验项目
- [Kevin14827/LuoTianyi-TTS](https://github.com/Kevin14827/LuoTianyi-TTS) `★2 · Python` — 基于 GPT-SoVITS v2Pro 微调的洛天依语音合成模型，权重见 Releases
- [Abc133123/LTYAI-Agent](https://github.com/Abc133123/LTYAI-Agent) `★1 · Python` — 洛天依AI基于现代AI技术制作的脚本 让你第一时间知道怎么实现LTYAI-ASI目标
- [ourcx/luotianyi-ai-passport](https://github.com/ourcx/luotianyi-ai-passport) `★1 · C` — Tianyi Player：FoloToy AI Passport 上的洛天依主题独立音乐播放器
- [SamXiaoyiyuan/luotianyi-chatbot](https://github.com/SamXiaoyiyuan/luotianyi-chatbot) `★1 · Python` — 以 洛天依 身份陪你聊天的对话机器人： 原生 HTML / CSS / JavaScript 前端（用 axios 对接后端）+ FastAPI 后端（用 uv 管理依赖）+ DeepSeek 大模型 。
- [YiGuMoYan/lty_agent](https://github.com/YiGuMoYan/lty_agent) `★1 · Python` — 洛天依 LTY-Omni-Agent：专为洛天依 IP 打造的 Agentic RAG 对话系统，知识图谱 + Qdrant 向量库 + DeepSearch 多跳推理，支持情感陪伴／知识检索双模式、流式 TTS 与 Live2D 动作驱动
- [luotianyi712-lab/luotianyi](https://github.com/luotianyi712-lab/luotianyi) `Python` — Flask + 通义千问构建的洛天依人格对话应用，内置分层人设提示词（语言风格／性格行为），带本地记忆存储
- [xiaoluo-712/luotianyi-chat](https://github.com/xiaoluo-712/luotianyi-chat) `HTML` — 洛天依虚拟歌手聊天室（HTML 前端）

### 🎨 主题·美化·壁纸 (14)

- [LazyCreeper/LuoTianyi](https://github.com/LazyCreeper/LuoTianyi) `★32 · CSS` — 该主题基于宝塔Linux面板 8.0.4 制作。
- [1a57danc3/chrome-luotianyi-theme](https://github.com/1a57danc3/chrome-luotianyi-theme) `★13` — Chrome 擴展商店的舊版本不再更新, 我也想上傳到官方平臺， 可惜註冊費用太貴算了。。。
- [lty-hongsejinwei/dsh-luotianyi-skin](https://github.com/lty-hongsejinwei/dsh-luotianyi-skin) `★8 · JavaScript` — 洛天依主题皮肤 for DeepSeek Harness (DSH) — /洛天依和雅音宫羽 #66CCFF
- [LinusTrevian/New-Singer-Grub](https://github.com/LinusTrevian/New-Singer-Grub) `★4` — 少女乐队 GRUB 主题合集，含天依、初音等主题
- [ClF3/tianyi-grub-theme](https://github.com/ClF3/tianyi-grub-theme) `★3` — 洛天依 GRUB 主题，附背景图预览
- [ssYanhuo/LuoTianyi-Watchface](https://github.com/ssYanhuo/LuoTianyi-Watchface) `★1 · Java` — 洛天依概念表盘，适用于Wear OS by Google。A Wear OS watchface based on Vsinger official Luo Tianyi concept watch.
- [hiluoxiaohe/luo-tianyi-sddm-login](https://github.com/hiluoxiaohe/luo-tianyi-sddm-login) `QML` — Luo Tianyi theme for SDDM (Qt6)
- [HuTao71566/dsh-skin-tianyi-azure](https://github.com/HuTao71566/dsh-skin-tianyi-azure) `JavaScript` — DeepSeek Harness洛天依皮肤
- [indoly/celestial-grub](https://github.com/indoly/celestial-grub) — 洛天依 GRUB 启动菜单主题
- [J-SLY/LuoTianyi](https://github.com/J-SLY/LuoTianyi) — 洛天依概念表盘（Wear OS）
- [Karunari-luoling/LuoTianYi_GrubTheme](https://github.com/Karunari-luoling/LuoTianYi_GrubTheme) — 洛天依 GRUB 启动菜单主题（含效果预览图）
- [Yiying-P/VOCAL-Browser](https://github.com/Yiying-P/VOCAL-Browser) `HTML` — 洛天依主题的轻量级 Electron 浏览器：天依蓝 #66ccff 主题 UI，多标签／书签／下载管理，新标签页为洛天依壁纸，提供 Windows MSI 安装包
- [YuxiangWang0525/luotianyi-PCL2-Theme-Pack](https://github.com/YuxiangWang0525/luotianyi-PCL2-Theme-Pack) — 洛天依主题的 PCL2 启动器特别版主题包
- [Zenflash233/luotianyi-10th-grub-theme](https://github.com/Zenflash233/luotianyi-10th-grub-theme) — 洛天依 10 周年纪念 GRUB 主题: 光与影的对白

### 🧰 数据·知识库·工具链 (15)

- [luotianyi-dev/luotianyi-random-lyric](https://github.com/luotianyi-dev/luotianyi-random-lyric) `★11 · Python` — 此项目提供了一个 洛天依 的经典曲目歌词选段的数据库，并以此实现了一个获得随机歌词的程序。
- [luotianyi-dev/luotianyi-http-stickers](https://github.com/luotianyi-dev/luotianyi-http-stickers) `★8 · Python` — 洛天依 HTTP 状态码表情包生成
- [JingyuNankin/StatisticsOfChineseVirtualSingers](https://github.com/JingyuNankin/StatisticsOfChineseVirtualSingers) `★6` — Statistics of Chinese Virtual Singers，中文虚拟歌手调查。主要用于发布中文虚拟歌手领域有关数据。
- [Jobsecond/pigeon-pv-list](https://github.com/Jobsecond/pigeon-pv-list) `★5` — 洛天依、言和《鸽子》PV 集合索引
- [MeetWq/vocal-album-list](https://github.com/MeetWq/vocal-album-list) `★5` — 中V & SV 相关专辑列表，数据主要来自 VocaDB
- [fyf-buaa/LuoTianyi-db](https://github.com/fyf-buaa/LuoTianyi-db) `★4 · PowerShell` — 洛天依（LuoTianyi）为主，以及和其相关的中V知识。包括：音乐，创作者，演唱会，活动，人设，世界观，角色观，重要的时间和事件节点等等...
- [Luke-lujunxian/Vocaloid-files](https://github.com/Luke-lujunxian/Vocaloid-files) `★3` — 个人 Vocaloid 工程存档（XML），以洛天依 Tianyi_CHN 为主，兼含乐正绫、心华等
- [tianyi-fanclub/tianyi-covered-song-lyrics](https://github.com/tianyi-fanclub/tianyi-covered-song-lyrics) `★2` — 为 B 站上的 VOCALOID·UTAU 分区的音乐提供现成的LRC歌词文件
- [dmnkx/vsinger-rn](https://github.com/dmnkx/vsinger-rn) `TypeScript` — React Native List App
- [Dragonzhi/luotianyi-song-list](https://github.com/Dragonzhi/luotianyi-song-list) `Python` — 一份个人维护的 洛天依（Vsinger 旗下中文虚拟歌手） 历年投稿精选歌单与自动化维护工具集。
- [Fujishima-Rurino/vsinger-song-finder](https://github.com/Fujishima-Rurino/vsinger-song-finder) `JavaScript` — node.js utility to search through vsinger/tuber streams for specific songs
- [koibi2/Vocaloid-singer-name-in-VSQX](https://github.com/koibi2/Vocaloid-singer-name-in-VSQX) — Vocaloid歌手信息的对应表。vocaloid singer's name in vsqx(vocaloid3、4)。
- [sunny-luoyun/bilibili_vc](https://github.com/sunny-luoyun/bilibili_vc) `Python` — B 站中文 VOCALOID 周刊统计数据整理
- [XinChengP/Luo_Tianyi_Image](https://github.com/XinChengP/Luo_Tianyi_Image) — 这是一个用于存放洛天依相关图片的图床仓库，方便统一管理和引用素材。
- [zxt4230980/LuoTianyiVOCALOID](https://github.com/zxt4230980/LuoTianyiVOCALOID) — 洛天依 Synthesizer V 工程文件（.svip3），含《关山酒》《雪落叹余生》等

### 🎮 游戏·模组·硬件二创 (18)

- [cyjin-yl/tianyitap](https://github.com/cyjin-yl/tianyitap) `★32 · JavaScript` — TianyiTap：Mikutap 的多音源改版，支持多歌姬音源
- [Pearl-Luo/Tianyicraft](https://github.com/Pearl-Luo/Tianyicraft) `★14` — Tianyicraft 是美化 Minecraft 的洛天依主题资源包，覆盖死亡提示到界面文案
- [alsunmengy/LuoTianyi-PCB-Art](https://github.com/alsunmengy/LuoTianyi-PCB-Art) `★11` — 洛天依南北组主题沉金艺术纪念PCB票卡，嘉立创开源硬件，无电气功能纯收藏卡
- [wingtings/OuterWildsMOD-The-Singer-of-the-End-of-the-world](https://github.com/wingtings/OuterWildsMOD-The-Singer-of-the-End-of-the-world) `★9 · C#` — 《Outer Wilds》世末歌者同人剧情 MOD，洛天依作为可对话 NPC 登场，另含乐正绫
- [LonakoBc/luo-yi-ba](https://github.com/LonakoBc/luo-yi-ba) `★6 · JavaScript` — 洛一把：洛天依等 14 位歌姬的猜歌网页游戏，540 首曲库，含多人联机与曲目喜好表
- [Cartethyia-0612/Tianyicraft-Soundpack](https://github.com/Cartethyia-0612/Tianyicraft-Soundpack) `★3` — 存储Tianyicraft音乐附加包的仓库
- [llly712/pocket-tianyi](https://github.com/llly712/pocket-tianyi) `★2 · Python` — Pocket-sized Luo Tianyi vocal synthesizer based on ESP32-S3
- [jinyiwei2012/Luo-Sandbox](https://github.com/jinyiwei2012/Luo-Sandbox) `★1 · Java` — 让洛天依在 Minecraft 中生活：Agent-LuoTianyi 深度绑定的 Forge 1.20.1 服务端居民与世界集成蓝本（MIT，尚未实现）
- [Sakaki773/Vsinger_reversi](https://github.com/Sakaki773/Vsinger_reversi) `★1 · Python` — 洛天依与言和主题的翻转棋小游戏
- [Sakaki773/VsingerShudu](https://github.com/Sakaki773/VsingerShudu) `★1 · Java` — 洛天依主题 9x9 数独游戏，包含 PC Tkinter 原型和原生 Android APK 版本。主题色以洛天依应援色 66CCFF 为主，界面使用淡化/虚化背景图，尽量保证主题感和可读性平衡。
- [zb23333ww/astrbot_plugin_vsinger_gacha](https://github.com/zb23333ww/astrbot_plugin_vsinger_gacha) `★1 · Python` — B站收藏集抽卡 · AstrBot 移植版（Pillow 渲染，积分与 Azure 打卡互通）
- [zb23333ww/koishi-plugin-vsinger-gacha](https://github.com/zb23333ww/koishi-plugin-vsinger-gacha) `★1 · JavaScript` — 基于js的一套VSinger b站收藏集模拟抽卡插件
- [dajunHuang/Luotianyi_Firework_Fabric_Mod](https://github.com/dajunHuang/Luotianyi_Firework_Fabric_Mod) `Java` — Add some fireworks for Luo's 11th birthday.
- [FunnyMudTureGoPee/CK3_Vsinger_mod](https://github.com/FunnyMudTureGoPee/CK3_Vsinger_mod) — CK3（十字军之王3）Vsinger 肖像 mod
- [haufionect/tianyi-playground](https://github.com/haufionect/tianyi-playground) `JavaScript` — 洛天依主题的小游戏乐园：接马卡龙 / 节奏敲击 / 天依琴。纯前端，零依赖，音乐全部 Web Audio 现场合成。
- [memorydream/CyanStars](https://github.com/memorydream/CyanStars) `C#` — CyanStars：Vsinger 相关音乐游戏企划（Unity）
- [Vel044/vsinger-fanclub-card](https://github.com/Vel044/vsinger-fanclub-card) `Python` — Vsinger fanclub 粉丝俱乐部卡，洛天依、言和、乐正绫、乐正龙牙、墨清弦、徴羽摩柯
- [yumuq/Luo-Tianyi](https://github.com/yumuq/Luo-Tianyi) — 洛天依 Minecraft 材质包，当前包含天空材质

### 🎵 音频·乐谱·创作素材 (5)

- [luotianyi-dev/vocaloid-bilibili-stickers](https://github.com/luotianyi-dev/vocaloid-bilibili-stickers) `★18 · Python` — 哔哩哔哩 V 家表情包合集，提供 Telegram Sticker 与 CDN 分发
- [mcxianyujun/luo-tianyi-piano](https://github.com/mcxianyujun/luo-tianyi-piano) `★4 · JavaScript` — 中文 洛天依-midi-钢琴 / English luo-tianyi-midi-piano
- [Eiheir/Luo_Tianyi_Image](https://github.com/Eiheir/Luo_Tianyi_Image) `★2 · JavaScript` — 洛佬の美图：洛天依图片素材仓库
- [kkryuw/Luotianyi-Yuezhengling-Yanhe-vocaloid5-orignal-source](https://github.com/kkryuw/Luotianyi-Yuezhengling-Yanhe-vocaloid5-orignal-source) `★1` — 洛天依、乐正绫、言和的 VOCALOID5 官方声库资源整理
- [leisquid/vsinger-voicebank-packages-design](https://github.com/leisquid/vsinger-voicebank-packages-design) `★1` — Vsinger voicebank packages design

### 🌐 社区站点与周边服务 (18)

- [w8888-hh/luotianyi-running-app](https://github.com/w8888-hh/luotianyi-running-app) `★10 · HTML` — 洛天依陪跑应用 - 节拍器 + 心率监测 + 音乐播放 + 语音引导的跑步健身 Web 应用
- [tianyi-fanclub/tianyi-birthday-countdown](https://github.com/tianyi-fanclub/tianyi-birthday-countdown) `★4 · CSS` — 这是洛天依饭制 生日会倒计时🎂 网站。
- [Drigrow/120712](https://github.com/Drigrow/120712) `★2 · HTML` — A website for Luo Tianyi
- [yunmianY/luotianyi_blog](https://github.com/yunmianY/luotianyi_blog) `★2 · Vue` — 关于洛天依的fastapi，vue3,mysql的博客
- [Agnarr1800/yanhe-luotianyi-1314](https://github.com/Agnarr1800/yanhe-luotianyi-1314) `★1 · JavaScript` — 言和 13 周年 × 洛天依 14 周年生日纪念网页（1314·一生一世）：角色档案、时光轴、经典合唱曲目、生日倒计时、祝福墙与数据管理后台，纯静态零依赖
- [D-6CF-X/vmap](https://github.com/D-6CF-X/vmap) `★1 · Kotlin` — V-Map 虚拟歌姬演出城市打卡地图（洛天依·依你随行 / 初音未来·因音而遇），Kotlin + Compose 自绘中国地图
- [duoduoeeee/hbv](https://github.com/duoduoeeee/hbv) `★1 · JavaScript` — 洛天依与言和生日自动祝福脚本：在指定日期自动向网页插入生日元素，引一行 JS 即可使用
- [klovelovely/6cf-f00](https://github.com/klovelovely/6cf-f00) `★1 · HTML` — 洛天依 × 乐正绫 主题单页
- [qqwqqk/Vocaloid.github.io](https://github.com/qqwqqk/Vocaloid.github.io) `★1 · TypeScript` — vsinger music player
- [2362371984/luotianyi-website](https://github.com/2362371984/luotianyi-website) `HTML` — 洛天依主题网站页面改动方案与修改版页面（含 index.html 与修改脚本）
- [fanquanpp/mingyige](https://github.com/fanquanpp/mingyige) `TypeScript` — 鸣依阁 —— 洛天依个人站·在线访问：https://mingyige.pages.dev/
- [fzr110911G/luotianyi](https://github.com/fzr110911G/luotianyi) `HTML` — 洛天依介绍页（HTML 静态站）
- [jmgay114514/LuoTianyi](https://github.com/jmgay114514/LuoTianyi) `HTML` — Vsinger 六位角色介绍站，含洛天依、言和、乐正绫、乐正龙牙、徵羽摩柯与墨清弦分页
- [Kotokowa/luotianyiPost](https://github.com/Kotokowa/luotianyiPost) `JavaScript` — 来自瓦纳海姆 · LUOTY：天依蓝 #66ccff 主题个人站，含天依立绘素材
- [LIGHT-just/luotianyi.github.io](https://github.com/LIGHT-just/luotianyi.github.io) `HTML` — 洛天依百科：单页资料站
- [lishu620/luotianyi-wiki](https://github.com/lishu620/luotianyi-wiki) `TypeScript` — 虚拟歌手 洛天依 的资料站：介绍角色、管理她的歌，并把同好制作的页面整理成一套可以一键跳转的导航。
- [Not-the-same/luotianyi](https://github.com/Not-the-same/luotianyi) `HTML` — 洛天依 · 天依蓝档案：Next.js 搭建的天依主题站点
- [ZYZXYYDS/LuoTianYi](https://github.com/ZYZXYYDS/LuoTianYi) `HTML` — 洛天依主题前端练习页

### 📚 教程与文档 (4)

- [Abc133123/LTYAI-ASI](https://github.com/Abc133123/LTYAI-ASI) `★1 · Python` — 洛天依 超级人工智能 白皮书---高中生期待能创建ASI吗 可以的这是梦想或者幻象 能打造AIGC项目吗 没时间 能管理项目吗 这个真没能力
- [ffccyy555/-](https://github.com/ffccyy555/-) `★1` — 《洛天依：跨越维度的音乐之旅》：洛天依形象与声音的介绍文章
- [Hermite215/ACE-Vsinger-software-](https://github.com/Hermite215/ACE-Vsinger-software-) `★1` — Help more people know Vsinger
- [Arce0406/vsinger-translation](https://github.com/Arce0406/vsinger-translation) `HTML` — VSinger 相關公告、訪談與募資說明的中文翻譯，以及從海外贈送花籃（スタンド花）到日本的教學文件
<!-- END:ENTRIES -->

## 名单制度

本仓库用一套**名单制度**管理"要不要收录"，核心是：**一旦结论落定，自动化永不再提。**

| 状态 | 含义 | 存放位置 | 能否再被提出 |
| --- | --- | --- | --- |
| `listed` | 已收录 | `data/entries/listed.json` | 否 |
| `excluded` | 技术性排除（归档/空仓库/fork/无相关信号） | `data/entries/excluded.json` | 否 |
| `rejected` | 人工否决（永久，附理由与裁决人） | `data/entries/rejected.json` | 否 |
| `candidate` | 候选，等待裁决 | `data/candidates/queue.json` | 是（会开 Issue） |

规则细节：

- **主键是 GitHub 仓库数字 id**，`full_name` 只作展示。仓库改名或转移后不会重复入册，旧名进 `aliases`。
- 自动化每轮抓取"疑似相关"的仓库、近期提交与 Issue/PR，评分后与名单比对，**只对从未出现过的建 Issue**。
- 裁决在 Issue 里完成，命令三选一：
  - `/approve <category-id>` — 收录到指定分类
  - `/reject <理由>` — 永久否决（必须给理由）
  - `/exclude <理由>` — 技术性排除
- 只有对本仓库有 `write` 及以上权限的用户发命令才会被执行。
- 每轮最多开 20 个候选 Issue，同一 owner 最多 4 个，避免刷屏。
- 否决可复审：需要至少两名维护者同意（其中一名为 Lead），原否决记录保留。详见 [docs/GOVERNANCE.md](docs/GOVERNANCE.md)。

## 自动化工作流

| 工作流 | 触发 | 做什么 |
| --- | --- | --- |
| `catalog-sync` | 每 6 小时 / 手动 | 检索 GitHub 抓疑似相关仓库 → 评分 → 去重入队 → 渲染 README → 校验 → 提交 |
| `radar` | 每小时 / 手动 | 检索近期提交与 Issue/PR 反推仓库 → 入队 → 开候选 Issue |
| `triage` | Issue 评论 | 解析 `/approve` `/reject` `/exclude`，回写名单并关闭 Issue |
| `ci` | PR / push | 跑单测、校验 README 与数据一致、跑 `validate` |

本地复现：

```bash
node --test "tests/*.test.mjs"     # 单元测试（无需令牌）
node scripts/validate.mjs          # 数据与 README 一致性
node scripts/render-readme.mjs     # 重新渲染 README
node scripts/scan-catalog.mjs --dry-run --pages 1   # 需要 GITHUB_TOKEN
```

## 参与贡献

- 发现好项目：用 [新增条目 Issue 表单](../../issues/new?template=add-repo.yml) 提交，附相关证据。
- 条目有误：用 [修正 Issue 表单](../../issues/new?template=report-correction.yml)。
- 直接改数据：见 [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md)。
- 行为准则：[docs/CODE_OF_CONDUCT.md](docs/CODE_OF_CONDUCT.md)。

## 免责声明

洛天依名称、形象及相关素材的权利归上海禾念信息科技有限公司（Vsinger）所有。本仓库是**非官方社区索引**，不隶属、不代表官方，不转载任何素材，只索引指向第三方仓库的链接。各条目内容与许可证由对应仓库自行负责，详见 [NOTICE.md](NOTICE.md)。

本仓库自身的代码与数据文件以 [MIT](LICENSE) 许可发布。
