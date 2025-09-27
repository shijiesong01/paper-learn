# 论文学习平台

一个基于Node.js的学术论文管理和学习平台，帮助研究者系统化地整理、分析和学习学术论文。

## 1. 核心功能

### （一）本地论文管理
提供完整的论文信息管理系统，支持从基础信息到深度分析的全面记录。包括论文基本信息录入（标题、作者、期刊、年份等）、深度分析方法记录（问题识别、核心思想、算法细节、创新点）、实验数据管理（数据集、评估指标、结果分析、开源代码）、个人学习跟踪（复现记录、灵感收集）以及可视化支持（核心图片管理）。系统支持自动生成目录结构，便于论文分类和检索。

### （二）静态网站服务
基于纯静态文件的论文搜索平台，无需服务器即可部署到GitHub Pages。采用三栏布局设计：左侧边栏提供主页选项、更新按钮和可展开的论文目录树；上边栏包含搜索输入框和高级功能按钮；正文区域展示论文列表和详细信息。支持智能搜索功能，可实时过滤论文标题、作者、关键词，并提供完整的论文详情展示（基本信息、方法分析、实验数据、个人学习四个板块）。支持GitHub Pages部署和本地开发测试。

## 2. 使用方法

### （一）本地论文管理
**环境准备**：安装Node.js，运行`npm install`安装依赖，启动`node server.js`，访问`http://localhost:8000/offline/paper_editor.html`。

**论文录入**：输入论文ID，填写基本信息（标题、作者、期刊、年份、标签、摘要等），录入分析方法（问题描述、核心思想、算法细节、创新点），记录实验数据（数据集、评估指标、结果分析、开源代码），添加个人学习记录（复现情况、学习灵感）。

**数据管理**：支持导入现有数据、保存到`notes/total.json`、生成目录结构到`notes/structure.txt`。建议将PDF文件按分类存放在`papers/`目录下。

### （二）静态网站服务
**本地测试**：使用`python -m http.server 8000`或`npx http-server`启动服务器，访问`http://localhost:8000/offline/paper_search_static.html`。

**GitHub Pages部署**：创建GitHub仓库，启用Pages功能，选择main分支部署，访问`https://yourusername.github.io/paper-learn/offline/paper_search_static.html`。

**使用功能**：浏览论文概览卡片和目录树，搜索关键词过滤论文，查看完整论文详情（四个板块），点击更新按钮刷新数据。修改`notes/total.json`和`notes/structure.txt`后重新部署即可更新内容。

## 3. 项目结构

### （一）本地论文管理

#### 核心文件结构
```
paper-learn/
├── server.js                 # Express服务器主文件
├── package.json             # 项目依赖配置
├── notes/                   # 数据存储目录
│   ├── total.json          # 论文数据主文件
│   ├── structure.txt       # 生成的目录结构
│   └── pics/               # 论文核心图片存储
├── papers/                 # 论文PDF文件存储
│   └── AI4Math/            # 论文分类目录
│       ├── Lean/           # Lean相关论文
│       └── AlphaGeometry/  # AlphaGeometry相关论文
├── offline/                # 离线编辑器
│   ├── paper_editor.html   # 论文信息编辑界面
│   └── paper_search_static.html  # 静态论文搜索平台
├── test_upload.html        # 图片上传测试页面
└── DEPLOYMENT.md           # GitHub Pages部署指南
```

### （二）静态网站服务

#### 静态文件结构
```
paper-learn/
├── notes/                   # 数据文件（必需）
│   ├── total.json          # 论文数据文件
│   └── structure.txt       # 目录结构文件
├── offline/                # 静态网页文件
│   └── paper_search_static.html  # 纯静态搜索平台
├── papers/                 # 论文PDF文件（可选）
│   └── AI4Math/            # 论文分类目录
└── DEPLOYMENT.md           # 部署指南
```

#### 静态部署要求
- **必需文件**：`notes/total.json`、`notes/structure.txt`、`offline/paper_search_static.html`
- **可选文件**：`papers/` 目录下的PDF文件
- **部署平台**：GitHub Pages、Netlify、Vercel等静态托管服务

#### 数据模型结构
```json
{
  "papers": {
    "paper_id_0": {
      "basic": {
        "title": "论文标题",
        "authors": ["作者1", "作者2"],
        "journal_conference": "期刊/会议",
        "year": "年份",
        "month": "月份",
        "citation_count": "引用数",
        "tags": ["标签1", "标签2"],
        "file_address": "文件路径",
        "link": "论文链接",
        "abstract": "摘要"
      },
      "method": {
        "problem": "要解决的问题",
        "limitations": "现有方法局限",
        "core_idea": "核心思想",
        "core_pic": "核心图片文件名",
        "algorithm": "算法细节",
        "novelties": "创新点"
      },
      "experiments": {
        "datasets": ["数据集1", "数据集2"],
        "metrics": ["指标1", "指标2"],
        "results": "实验结果",
        "other_experiments": ["其他实验"],
        "strengths": "优势",
        "weaknesses": "局限",
        "open_source": {
          "code_available": true,
          "link": "代码链接"
        }
      },
      "my_study": {
        "reproduction": "复现情况",
        "inspiration": ["灵感1", "灵感2"]
      },
      "metadata": {
        "created_date": "创建日期",
        "last_updated": "更新日期"
      }
    }
  }
}
```

#### API接口结构
- **GET /api/total-json** - 获取所有论文数据
- **POST /api/update-total-json** - 更新或添加论文数据
- **POST /api/generate-structure** - 生成目录结构
- **POST /api/upload-core-pic** - 上传论文核心图片
- **DELETE /api/delete-core-pic/:paperId** - 删除论文核心图片

#### 技术栈
- **后端**：Node.js + Express.js
- **前端**：HTML5 + Tailwind CSS + JavaScript
- **文件处理**：Multer（文件上传）
- **数据存储**：JSON文件
- **跨域支持**：CORS中间件

#### 开发环境配置
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "multer": "^1.4.5-lts.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
```

#### 启动命令
- 开发模式：`npm run dev`（使用nodemon自动重启）
- 生产模式：`npm start`
- 服务器端口：8000
- 访问地址：
  - 论文编辑器：`http://localhost:8000/offline/paper_editor.html`
  - 静态搜索平台：`http://localhost:8000/offline/paper_search_static.html`

#### 静态网站访问
- **本地测试**：`http://localhost:8000/offline/paper_search_static.html`
- **GitHub Pages**：`https://yourusername.github.io/paper-learn/offline/paper_search_static.html`
