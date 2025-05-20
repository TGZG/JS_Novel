const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;
// 中间件
app.use(express.json());
app.use(express.static('public'));
const DATA_FILE = path.join(__dirname, 'Save.json');// 数据存储文件路径

function 读档() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const data = fs.readFileSync(DATA_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Error loading data:', error);
    }
    return { rectangles: [] };
}
function 存档(data) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving data:', error);
        return false;
    }
}

// 初始化数据
let appData = 读档();

// 获取所有矩形数据
app.get('/api/rectangles', (req, res) => {
    res.json(appData);
});

// 添加新矩形
app.post('/api/rectangles', (req, res) => {
    const { id, x, y, width, height, text, screenA_x, screenA_y, screenB_x, screenB_y } = req.body;

    const newRectangle = {
        id: id || Date.now().toString(),
        x: x || 0,
        y: y || 0,
        width: width || 100,
        height: height || 60,
        text: text || '',
        screenA_x: screenA_x !== undefined ? screenA_x : x || 0,
        screenA_y: screenA_y !== undefined ? screenA_y : y || 0,
        screenB_x: screenB_x !== undefined ? screenB_x : x || 0,
        screenB_y: screenB_y !== undefined ? screenB_y : y || 0
    };

    appData.rectangles.push(newRectangle);

    if (存档(appData)) {
        res.json({ success: true, rectangle: newRectangle });
    } else {
        res.status(500).json({ success: false, error: 'Failed to save data' });
    }
});

// 更新矩形
app.put('/api/rectangles/:id', (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    const rectangleIndex = appData.rectangles.findIndex(rect => rect.id === id);

    if (rectangleIndex === -1) {
        return res.status(404).json({ success: false, error: 'Rectangle not found' });
    }

    // 更新矩形属性
    Object.assign(appData.rectangles[rectangleIndex], updates);

    if (存档(appData)) {
        res.json({ success: true, rectangle: appData.rectangles[rectangleIndex] });
    } else {
        res.status(500).json({ success: false, error: 'Failed to save data' });
    }
});

// 删除矩形
app.delete('/api/rectangles/:id', (req, res) => {
    const { id } = req.params;

    const initialLength = appData.rectangles.length;
    appData.rectangles = appData.rectangles.filter(rect => rect.id !== id);

    if (appData.rectangles.length < initialLength) {
        if (存档(appData)) {
            res.json({ success: true });
        } else {
            res.status(500).json({ success: false, error: 'Failed to save data' });
        }
    } else {
        res.status(404).json({ success: false, error: 'Rectangle not found' });
    }
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log('双击空白位置创建矩形，双击矩形编辑文本，拖动可移动矩形，选中后按Delete删除');
});

// 优雅关闭
process.on('SIGTERM', () => {
    console.log('Server shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('Server shutting down gracefully...');
    process.exit(0);
});