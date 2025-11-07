# 📤 推送到 GitHub 指南

## 🚀 快速推送

按照以下步骤操作：

### 步骤1：在 GitHub 创建仓库

1. 访问 https://github.com/new
2. 仓库名建议：`auto-learning-helper` 或 `learning-platform-auto-helper`
3. 描述：`🎓 自动学习助手 - Chrome浏览器扩展，支持自动播放课程、跳过已完成、自动翻页等功能`
4. 选择 **Public** 或 **Private**
5. **不要**勾选 "Add a README file"
6. 点击 "Create repository"

### 步骤2：初始化本地仓库

在项目目录打开终端/PowerShell，运行：

```bash
# 初始化 Git 仓库
git init

# 添加所有文件
git add .

# 查看将要提交的文件
git status

# 提交
git commit -m "🎉 初始提交：自动学习助手浏览器插件

主要功能：
- ✅ 自动播放课程
- ✅ 跳过已完成课程（100%进度）
- ✅ 自动翻页
- ✅ 倍速播放
- ✅ 在当前标签页打开（不开新标签）
- ✅ 精准的视频完成检测（vjs-ended类）
- ✅ 防止连续点击多个课程
- ✅ 详细的Console日志
- ✅ 进度保存与恢复

技术栈：Chrome Extension Manifest V3, Content Scripts, Storage API"
```

### 步骤3：连接到 GitHub

```bash
# 添加远程仓库（替换成你的GitHub用户名）
git remote add origin https://github.com/你的用户名/auto-learning-helper.git

# 或使用 SSH（如果配置了SSH密钥）
git remote add origin git@github.com:你的用户名/auto-learning-helper.git

# 查看远程仓库
git remote -v
```

### 步骤4：推送到 GitHub

```bash
# 推送到 main 分支
git branch -M main
git push -u origin main
```

---

## 📝 后续更新

以后修改代码后，使用以下命令推送：

```bash
# 查看修改
git status

# 添加修改的文件
git add .

# 提交
git commit -m "描述你的修改"

# 推送
git push
```

---

## 🏷️ 推荐的 Git 标签

### 功能标签

```bash
# 添加标签
git tag -a v1.0.0 -m "🎉 首个正式版本

功能列表：
- 自动播放课程
- 跳过已完成课程
- 自动翻页
- 倍速播放
- 视频完成检测
- 防止重复点击"

# 推送标签
git push origin v1.0.0
```

### 建议的版本号

- `v1.0.0` - 首个正式版本
- `v1.1.0` - 添加新功能
- `v1.0.1` - 修复Bug

---

## 📋 推荐的 GitHub Topics

创建仓库后，添加以下 topics：

```
chrome-extension
browser-extension
automation
learning
education
javascript
video-player
auto-learning
productivity
study-tool
```

---

## 🖼️ 添加封面图片（可选）

在 GitHub 仓库页面：
1. 点击 "Settings"
2. 滚动到 "Social preview"
3. 点击 "Edit" 上传封面图片
4. 推荐尺寸：1280x640px

---

## 📄 添加 License（可选）

在 GitHub 仓库页面：
1. 点击 "Add file" → "Create new file"
2. 文件名输入：`LICENSE`
3. 点击右侧的 "Choose a license template"
4. 选择 "MIT License"
5. 填写年份和姓名
6. 点击 "Review and submit"
7. 提交

---

## ✅ 完成后的仓库结构

```
你的仓库
├── 📄 README_GITHUB.md (重命名为 README.md)
├── 📄 LICENSE
├── 📁 icons/
├── 📄 manifest.json
├── 📄 content.js
├── 📄 background.js
├── 📄 popup.html/js/css
├── 📁 docs/（文档文件）
└── 📁 tools/（测试脚本）
```

---

## 🎯 推送后的检查清单

- [ ] 代码已成功推送到GitHub
- [ ] README.md 显示正常
- [ ] 添加了合适的 Topics
- [ ] 仓库描述清晰
- [ ] 添加了 License
- [ ] 测试克隆仓库是否正常工作

---

## 💡 优化建议

### 1. 整理文档结构

```bash
# 创建 docs 文件夹
mkdir docs
git mv *说明.md docs/
git mv *指南.md docs/
git commit -m "📝 整理文档结构"
git push
```

### 2. 整理测试脚本

```bash
# 创建 tools 文件夹
mkdir tools
git mv 测试脚本-*.js tools/
git mv 调试工具.html tools/
git mv 生成图标.html tools/
git commit -m "🔧 整理工具文件"
git push
```

### 3. 添加 GitHub Actions（自动检查）

创建 `.github/workflows/check.yml`：

```yaml
name: Check Extension

on: [push, pull_request]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Check manifest
        run: |
          if [ ! -f manifest.json ]; then
            echo "manifest.json not found!"
            exit 1
          fi
      - name: Check required files
        run: |
          required_files=("background.js" "content.js" "popup.html")
          for file in "${required_files[@]}"; do
            if [ ! -f "$file" ]; then
              echo "$file not found!"
              exit 1
            fi
          done
```

---

## 📞 遇到问题？

### 常见错误

**错误1：`remote: Repository not found`**
- 检查仓库URL是否正确
- 检查是否有权限访问该仓库

**错误2：`! [rejected] main -> main (fetch first)`**
- 先运行：`git pull origin main --rebase`
- 再推送：`git push`

**错误3：`Permission denied (publickey)`**
- 使用 HTTPS URL 而不是 SSH
- 或配置 SSH 密钥

---

**祝推送顺利！🎉**

