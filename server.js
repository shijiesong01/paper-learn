const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');
const multer = require('multer');

const app = express();
const PORT = 8000;

// 中间件
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// 设置静态文件目录
app.use(express.static(path.join(__dirname)));

// 提供structure.txt文件的访问
app.get('/notes/structure.txt', async (req, res) => {
    try {
        const structurePath = path.join(__dirname, 'notes', 'structure.txt');
        const data = await fs.readFile(structurePath, 'utf-8');
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.send(data);
    } catch (error) {
        console.error('读取structure.txt失败:', error);
        res.status(500).json({ error: '读取文件失败', details: error.message });
    }
});

// 配置multer用于文件上传
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const picsDir = path.join(__dirname, 'notes', 'pics');
        try {
            // 确保pics目录存在
            await fs.mkdir(picsDir, { recursive: true });
            cb(null, picsDir);
        } catch (error) {
            cb(error);
        }
    },
    filename: (req, file, cb) => {
        // 从请求参数中获取paperId
        const paperId = req.body.paperId || req.query.paperId;
        
        if (!paperId) {
            return cb(new Error('缺少paperId参数'));
        }
        
        // 获取文件扩展名
        const ext = path.extname(file.originalname).toLowerCase();
        
        // 只允许jpg和png格式
        if (ext !== '.jpg' && ext !== '.jpeg' && ext !== '.png') {
            return cb(new Error('只支持jpg和png格式的图片'));
        }
        
        // 使用paperId和原始扩展名作为文件名
        cb(null, `${paperId}${ext}`);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB大小限制
    }
});

// API端点：获取total.json文件内容
app.get('/api/total-json', async (req, res) => {
    try {
        const totalJsonPath = path.join(__dirname, 'notes', 'total.json');
        const data = await fs.readFile(totalJsonPath, 'utf-8');
        res.json(JSON.parse(data));
    } catch (error) {
        console.error('读取total.json失败:', error);
        res.status(500).json({ error: '读取文件失败', details: error.message });
    }
});

// API端点：更新total.json文件
app.post('/api/update-total-json', async (req, res) => {
    try {
        console.log('接收到更新请求:', req.body);
        
        const { paperId, paperData } = req.body;
        
        if (!paperId || !paperData) {
            console.log('缺少必要参数:', { paperId: !!paperId, paperData: !!paperData });
            return res.status(400).json({ error: '缺少必要参数：paperId或paperData' });
        }
        
        console.log('开始更新论文ID:', paperId);
        
        const totalJsonPath = path.join(__dirname, 'notes', 'total.json');
        
        // 读取现有文件
        let existingData = {};
        try {
            const fileContent = await fs.readFile(totalJsonPath, 'utf-8');
            existingData = JSON.parse(fileContent);
            console.log('成功读取total.json，现有论文数量:', Object.keys(existingData.papers || {}).length);
        } catch (error) {
            console.warn('total.json不存在或格式错误，将创建新文件:', error);
            existingData = { "papers": {} };
        }
        
        // 确保papers对象存在
        if (!existingData.papers) {
            existingData.papers = {};
        }
        
        // 更新或添加论文数据
        existingData.papers[paperId] = paperData;
        console.log('更新后论文数量:', Object.keys(existingData.papers).length);
        
        // 确保notes目录存在
        const notesDir = path.join(__dirname, 'notes');
        try {
            await fs.mkdir(notesDir, { recursive: true });
        } catch (mkdirError) {
            console.error('创建notes目录失败:', mkdirError);
            throw mkdirError;
        }
        
        // 写入文件
        await fs.writeFile(totalJsonPath, JSON.stringify(existingData, null, 2), 'utf-8');
        console.log('成功写入total.json文件');
        
        res.json({
            success: true,
            message: `论文数据已成功更新到total.json`,
            paperId: paperId
        });
    } catch (error) {
        console.error('更新total.json失败:', error);
        res.status(500).json({ error: '写入文件失败', details: error.message });
    }
});

// API端点：生成目录结构并保存到structure.txt
app.post('/api/generate-structure', async (req, res) => {
    try {
        const totalJsonPath = path.join(__dirname, 'notes', 'total.json');
        const structureTxtPath = path.join(__dirname, 'notes', 'structure.txt');
        
        // 读取请求参数
        const { includePlaceholder = false } = req.body;
        
        // 读取total.json文件
        let totalData = {};
        try {
            const fileContent = await fs.readFile(totalJsonPath, 'utf-8');
            totalData = JSON.parse(fileContent);
        } catch (error) {
            console.error('读取total.json失败:', error);
            return res.status(500).json({ error: '读取total.json失败', details: error.message });
        }
        
        // 确保papers对象存在
        if (!totalData.papers || typeof totalData.papers !== 'object') {
            return res.status(400).json({ error: 'total.json格式错误，缺少papers对象' });
        }
        
        // 生成目录结构
        const structureText = generateDirectoryStructureText(totalData.papers, includePlaceholder);
        
        // 保存到structure.txt文件（覆盖形式）
        await fs.writeFile(structureTxtPath, structureText, 'utf-8');
        
        res.json({
            success: true,
            message: `目录结构已成功生成并保存到structure.txt`,
            structureText: structureText
        });
    } catch (error) {
        console.error('生成目录结构失败:', error);
        res.status(500).json({ error: '生成目录结构失败', details: error.message });
    }
});

// 生成目录结构的辅助函数 - 文本格式版
function generateDirectoryStructureText(papers, includePlaceholder = false) {
    // 创建一个中间结构来存储目录和文件关系
    const directoryStructure = {};
    
    // 遍历所有论文
    Object.keys(papers).forEach(paperId => {
        const paper = papers[paperId];
        
        // 跳过空的论文条目
        if (!paper || typeof paper !== 'object') {
            return;
        }
        
        // 确保basic字段存在并且包含file_address和title
        if (!paper.basic || !paper.basic.file_address || !paper.basic.title) {
            return;
        }
        
        // 忽略paper_id为"样例"的项
        if (paperId === '样例') {
            return;
        }
        
        const fileAddress = paper.basic.file_address.trim();
        const paperTitle = paper.basic.title.trim();
        
        // 跳过未填写的条目（除非明确要求包含）
        if (!includePlaceholder && (!fileAddress || fileAddress.includes('请输入') || !paperTitle || paperTitle.includes('请输入'))) {
            return;
        }
        
        // 直接从file_address的根目录开始解析路径，不做任何前缀处理
        const cleanPath = fileAddress;
        
        // 构建目录路径，确保不遗漏任何一级目录
        const pathParts = cleanPath.split('\\').filter(part => part.trim() !== '');
        
        // 获取目录部分和文件名
        let dirParts = [];
        let fileName = paperTitle; // 使用论文标题作为文件名
        
        if (pathParts.length > 1) {
            dirParts = pathParts.slice(0, -1);
        }
        
        // 根据目录路径构建嵌套结构
        let currentLevel = directoryStructure;
        
        dirParts.forEach(part => {
            if (!currentLevel[part]) {
                currentLevel[part] = { __files: [] };
            } else if (!currentLevel[part].__files) {
                currentLevel[part].__files = [];
            }
            currentLevel = currentLevel[part];
        });
        
        // 将论文添加到当前目录的文件列表中
        if (!currentLevel.__files) {
            currentLevel.__files = [];
        }
        
        // 添加论文标题到文件列表
        currentLevel.__files.push(fileName);
    });
    
    // 将目录结构转换为文本格式
    function structureToText(structure, indentLevel = 0) {
        let result = '';
        const indent = ' '.repeat(2 * indentLevel); // 使用两个空格作为缩进单位
        
        Object.keys(structure).forEach(key => {
            if (key === '__files') {
                // 处理文件列表
                structure[key].forEach(file => {
                    result += `${indent}${file}\n`;
                });
            } else {
                // 处理目录
                result += `${indent}${key}\n`;
                // 递归处理子目录
                result += structureToText(structure[key], indentLevel + 1);
            }
        });
        
        return result;
    }
    
    return structureToText(directoryStructure);
}

// API端点：上传论文核心图片
app.post('/api/upload-core-pic', upload.single('core_pic'), async (req, res) => {
    try {
        console.log('接收到图片上传请求');
        
        // 获取paperId和上传的文件信息
        const paperId = req.body.paperId;
        const file = req.file;
        
        if (!paperId) {
            return res.status(400).json({ error: '缺少paperId参数' });
        }
        
        if (!file) {
            return res.status(400).json({ error: '未上传图片文件' });
        }
        
        console.log('图片上传成功:', file.originalname, '保存为:', file.filename);
        
        // 更新total.json中的core_pic字段
        const totalJsonPath = path.join(__dirname, 'notes', 'total.json');
        let totalData = {};
        
        try {
            const fileContent = await fs.readFile(totalJsonPath, 'utf-8');
            totalData = JSON.parse(fileContent);
        } catch (error) {
            console.error('读取total.json失败:', error);
            return res.status(500).json({ error: '读取total.json失败', details: error.message });
        }
        
        // 确保papers对象存在
        if (!totalData.papers || typeof totalData.papers !== 'object') {
            return res.status(400).json({ error: 'total.json格式错误，缺少papers对象' });
        }
        
        // 确保论文存在
        if (!totalData.papers[paperId]) {
            return res.status(404).json({ error: `未找到ID为${paperId}的论文` });
        }
        
        // 确保method对象存在
        if (!totalData.papers[paperId].method) {
            totalData.papers[paperId].method = {};
        }
        
        // 更新core_pic字段为文件名（只存储文件名，不包含路径）
        totalData.papers[paperId].method.core_pic = file.filename;
        
        // 写入更新后的total.json文件
        await fs.writeFile(totalJsonPath, JSON.stringify(totalData, null, 2), 'utf-8');
        console.log('成功更新total.json中的core_pic字段');
        
        res.json({
            success: true,
            message: '图片上传成功并已更新到论文信息中',
            fileName: file.filename,
            filePath: file.path
        });
    } catch (error) {
        console.error('上传图片失败:', error);
        res.status(500).json({ error: '上传图片失败', details: error.message });
    }
});

// API端点：删除论文核心图片
app.delete('/api/delete-core-pic/:paperId', async (req, res) => {
    try {
        const { paperId } = req.params;
        
        if (!paperId) {
            return res.status(400).json({ error: '缺少paperId参数' });
        }
        
        // 读取total.json文件
        const totalJsonPath = path.join(__dirname, 'notes', 'total.json');
        let totalData = {};
        
        try {
            const fileContent = await fs.readFile(totalJsonPath, 'utf-8');
            totalData = JSON.parse(fileContent);
        } catch (error) {
            console.error('读取total.json失败:', error);
            return res.status(500).json({ error: '读取total.json失败', details: error.message });
        }
        
        // 确保论文存在
        if (!totalData.papers || !totalData.papers[paperId]) {
            return res.status(404).json({ error: `未找到ID为${paperId}的论文` });
        }
        
        // 获取当前的core_pic文件名
        const currentCorePic = totalData.papers[paperId].method?.core_pic;
        
        if (currentCorePic) {
            // 构建图片文件路径
            const picPath = path.join(__dirname, 'notes', 'pics', currentCorePic);
            
            // 尝试删除图片文件
            try {
                await fs.unlink(picPath);
                console.log('成功删除图片文件:', currentCorePic);
            } catch (unlinkError) {
                console.warn('删除图片文件失败:', unlinkError);
                // 继续执行，不中断流程
            }
            
            // 从total.json中移除core_pic字段
            delete totalData.papers[paperId].method.core_pic;
            
            // 写入更新后的total.json文件
            await fs.writeFile(totalJsonPath, JSON.stringify(totalData, null, 2), 'utf-8');
            console.log('成功从total.json中移除core_pic字段');
        }
        
        res.json({
            success: true,
            message: '论文核心图片已成功删除（如有）'
        });
    } catch (error) {
        console.error('删除图片失败:', error);
        res.status(500).json({ error: '删除图片失败', details: error.message });
    }
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
    console.log('可用API：');
    console.log('GET  /api/total-json - 获取total.json文件内容');
    console.log('POST /api/update-total-json - 更新total.json文件中的论文数据');
    console.log('POST /api/generate-structure - 生成目录结构并保存到structure.txt');
    console.log('POST /api/upload-core-pic - 上传论文核心图片');
    console.log('DELETE /api/delete-core-pic/:paperId - 删除论文核心图片');
    console.log('GET  /notes/structure.txt - 获取目录结构文件');
    console.log('静态文件访问：');
    console.log('- 论文编辑器：http://localhost:8000/offline/paper_editor.html');
    console.log('- 论文搜索平台：http://localhost:8000/offline/paper_search_static.html');
});