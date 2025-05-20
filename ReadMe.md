# 小说多线大纲设计工具  

## 项目结构

```
JS_Novel/
├── server.js          # Express服务器（后端）
├── package.json       # 项目配置
├── Save.json          # 数据存储文件（自动生成）
└── public/
    └── index.html     # 前端界面
```

## 安装和运行

1. 拷贝本仓库到你的某个路径，例如 D:/Desktop/JS_Novel

2. 启动CMD，然后在其中CD到本路径，例如：
```bash
D:
cd D:/Desktop/JS_Novel
```

3. 安装依赖：
```bash
npm install
```

4. 启动应用：
```bash
npm start
```

5. 在浏览器中访问：
```
http://localhost:3000
```

## 功能说明

### 基本功能
1. **创建矩形**：在左屏双击空白位置创建矩形
2. **编辑文本**：双击左屏的矩形可以编辑文本内容
3. **同步显示**：左屏的矩形会自动在右屏同步显示
4. **独立移动**：左屏和右屏的矩形可以独立拖动，位置不同步
5. **同步缩放**：拖动矩形边角或边缘可以缩放大小，两屏同步
6. **删除矩形**：在左屏单击选中矩形，按Delete键删除
7. **数据持久化**：程序会自动保存状态，重启后可以恢复

### 操作说明
- **双击空白**：创建新矩形
- **双击矩形**：编辑文本（仅左屏）
- **拖动矩形**：移动矩形位置（位置独立）
- **拖动边角/边缘**：缩放矩形大小（大小同步）
- **单击矩形**：选中矩形（红色边框显示缩放手柄）
- **Delete键**：删除选中的矩形
- **Enter键**：完成文本编辑

### 技术特性
- **前后端分离**：Express后端 + HTML前端
- **RESTful API**：标准的增删改查接口
- **实时同步**：左屏操作实时反映到右屏
- **文件存储**：使用JSON文件持久化数据
- **响应式界面**：现代化的用户界面设计

## API接口

- `GET /api/rectangles` - 获取所有矩形
- `POST /api/rectangles` - 创建新矩形
- `PUT /api/rectangles/:id` - 更新矩形
- `DELETE /api/rectangles/:id` - 删除矩形

## 数据结构

```javascript
{
  id: string,           // 唯一标识
  width: number,        // 宽度
  height: number,       // 高度
  text: string,         // 文本内容
  screenA_x: number,    // 左屏X坐标
  screenA_y: number,    // 左屏Y坐标
  screenB_x: number,    // 右屏X坐标
  screenB_y: number     // 右屏Y坐标
}
```

## 开发模式

如果需要开发模式（自动重启），可以安装nodemon：

```bash
npm install -g nodemon
npm run dev
```

这样当代码改动时服务器会自动重启。

## Todo
- 复制矩形
- 缩放
- 批量移动
- 自动对齐
- cursor集成  