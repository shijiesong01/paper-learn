# GitHub Pages 部署指南

## 静态部署说明

本项目支持完全静态部署到GitHub Pages，无需服务器，只需要将文件上传到GitHub仓库即可。

### 文件结构要求

确保您的项目包含以下文件结构：

```
paper-learn/
├── notes/
│   ├── total.json          # 论文数据文件
│   └── structure.txt       # 目录结构文件
├── offline/
│   └── paper_search_static.html  # 论文搜索平台（纯静态）
└── README.md
```

### 部署步骤

1. **创建GitHub仓库**
   - 在GitHub上创建一个新的仓库
   - 将项目文件上传到仓库

2. **启用GitHub Pages**
   - 进入仓库的 Settings 页面
   - 滚动到 "Pages" 部分
   - 在 "Source" 下选择 "Deploy from a branch"
   - 选择 "main" 分支和 "/ (root)" 文件夹
   - 点击 "Save"

3. **访问您的网站**
   - GitHub Pages 会自动生成一个 URL
   - 格式通常为：`https://yourusername.github.io/paper-learn/`
   - 访问：`https://yourusername.github.io/paper-learn/offline/paper_search_static.html`

### 使用说明

#### 论文搜索平台（纯静态版本）

- **访问地址**：`https://yourusername.github.io/paper-learn/offline/paper_search_static.html`
- **功能**：
  - 浏览所有论文
  - 搜索论文（标题、作者、关键词）
  - 查看论文详细信息
  - 基于目录结构的导航

#### 数据更新

要更新论文数据，您需要：

1. 修改 `notes/total.json` 文件
2. 修改 `notes/structure.txt` 文件
3. 提交更改到GitHub仓库
4. GitHub Pages 会自动重新部署

### 注意事项

1. **文件路径**：确保 `notes/` 文件夹和其中的文件存在
2. **相对路径**：静态页面使用 `../notes/` 路径访问数据文件
3. **缓存**：GitHub Pages 有缓存机制，更新后可能需要等待几分钟

### 本地开发

如果您想在本地测试静态版本：

1. 使用简单的HTTP服务器：
   ```bash
   # Python 3
   python -m http.server 8000
   
   # Node.js
   npx http-server
   ```

2. 访问：`http://localhost:8000/offline/paper_search_static.html`

### 故障排除

如果页面无法加载数据：

1. 检查浏览器控制台是否有错误信息
2. 确认 `notes/total.json` 和 `notes/structure.txt` 文件存在
3. 检查文件路径是否正确（使用 `../notes/` 相对路径）
4. 确认文件格式正确（JSON格式、UTF-8编码）

### 自定义域名

如果您有自己的域名，可以：

1. 在仓库根目录创建 `CNAME` 文件
2. 在文件中写入您的域名
3. 在域名DNS设置中添加CNAME记录指向GitHub Pages

这样您就可以使用自己的域名访问论文搜索平台了！

