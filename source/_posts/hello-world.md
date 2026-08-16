---
title: roxcia的博客搭建完成
date: 2026-08-16 00:00:00
categories:
  - 博客
tags:
  - Hexo
  - GitHub Pages
  - Butterfly
---

这个博客已经基于 Hexo 和 Butterfly 主题搭建完成，站点名字也更新为 roxcia的博客。后续只需要在 `source/_posts` 目录里继续写 Markdown 文章，就可以通过 GitHub Pages 自动发布。

## 写作

新建文章：

```bash
npm exec hexo new "文章标题"
```

文章生成后会出现在 `source/_posts`，保存后执行构建即可预览。

## 本地预览

```bash
npm run server
```

打开终端输出里的本地地址，就能看到博客页面。

## 发布

把项目推送到 GitHub 后，仓库里的 GitHub Actions 会自动构建并部署到 GitHub Pages。

```bash
git add .
git commit -m "Initialize Hexo blog"
git branch -M main
git remote add origin https://github.com/USERNAME/blog.git
git push -u origin main
```
