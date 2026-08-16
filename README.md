# roxcia的博客

基于 Hexo 8 和 Butterfly 主题的个人博客，已配置 GitHub Pages 自动部署。

## 本地使用

```bash
npm install
npm run server
```

## 构建

```bash
npm run build
```

## 发布到 GitHub Pages

1. 在 GitHub 创建仓库 `blog`。
2. 在仓库 Settings -> Pages 中选择 GitHub Actions。
3. 推送到 `main` 分支。

```bash
git init
git add .
git commit -m "Initialize Hexo blog"
git branch -M main
git remote add origin https://github.com/roxcia/roxcia.github.io.git
git push -u origin main
```
