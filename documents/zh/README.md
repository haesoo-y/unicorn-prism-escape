# Unicorn Prism Escape

[🇺🇸 English](../../README.md) | [🇰🇷 한국어](../ko/README.md) | [🇯🇵 日本語](../ja/README.md) | [🇨🇳 简体中文](README.md)

**js13kGames 2026 参赛作品——仅用13,309字节容纳的完整游戏。**

**[在js13kGames上游玩](https://js13kgames.com/2026/games/unicorn-prism-escape)**

提交ZIP：**13,309 / 13,312字节**。

<img src="../../artwork/submission/cover-800x500.png" alt="Unicorn Prism Escape" width="480">

这是一款以云端天空为舞台的多彩生存游戏。操控拥有彩虹鬃毛的独角兽，躲开追赶的恶魔，在每个关卡收集全部七色棱镜，再从彩虹传送门逃脱。

完成全部10个关卡即可获胜。总时间会跨关卡和重试累计，但在选择升级时暂停。

## 操作方式

- **移动：** WASD或方向键。触屏设备上，按住左下角摇杆并拖动。
- **开始：** Space、Enter或点击标题画面。
- **攻击：** 解锁后按Space或攻击按钮。
- **选择升级：** 用WASD或方向键选择，按Space确认。使用触屏或鼠标时，选中项目后再次点击即可确认。
- **重试：** 失败后按R或点击画面。通关后按R或点击可开始新的一局。
- **切换静音：** M。

## 升级

在关卡之间选择一项升级。每一行按顺序解锁。

- **地图：** Gate Map显示自己的位置和传送门；Prism Map增加剩余棱镜的位置；Enemy Sense增加敌人的位置。
- **攻击：** Rainbow Horn攻击前方；Rainbow Bolt自动向四个方向发射闪电；Rainbow Wave在收集棱镜时击退周围敌人并清除附近敌弹。
- **能力：** Speed Up提高移动速度；Prism Magnet吸引附近的棱镜；Slow Aura减慢周围敌人及其子弹。

## 开发文档

- [架构](ARCHITECTURE.md) — 介绍ECS结构与游戏循环。
- [实现技术](TECHNIQUES.md) — 介绍如何将素材、动画、音频、敌人追踪和关卡装进13KB。
