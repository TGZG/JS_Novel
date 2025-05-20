import { fetchRectangles, createRectangle, updateRectangle, deleteRectangle } from './api.js';

export class RectangleManager {
    constructor(app) {
        this.app = app;
    }

    async 读档() {
        try {
            const data = await fetchRectangles();
            this.app.rectangles = data.rectangles || [];
        } catch (error) {
            console.error('Failed to load rectangles:', error);
            this.app.rectangles = [];
        }
    }

    async 创建区块(event, screen) {
        if (event.target.classList.contains('rectangle')) return;

        const rect = screen === 'A' ? this.app.screenA.getBoundingClientRect() : this.app.screenB.getBoundingClientRect();
        const scale = screen === 'A' ? this.app.scaleA : this.app.scaleB;

        // 考虑缩放因素计算实际位置
        const x = (event.clientX - rect.left) / scale;
        const y = (event.clientY - rect.top) / scale;

        const newRectangle = {
            x: x,
            y: y,
            width: 100,
            height: 60,
            text: '',
            screenA_x: x,
            screenA_y: y,
            screenB_x: x,
            screenB_y: y
        };

        try {
            const result = await createRectangle(newRectangle);
            if (result.success) {
                this.app.rectangles.push(result.rectangle);
                this.绘制所有区块();
            }
        } catch (error) {
            console.error('Failed to create rectangle:', error);
        }
    }

    绘制所有区块() {
        const existingRects = document.querySelectorAll('.rectangle');
        existingRects.forEach(rect => rect.remove());
        this.app.rectangles.forEach(rectData => {
            this.绘制区块(rectData, 'A');
            this.绘制区块(rectData, 'B');
        });
    }

    绘制区块(rectData, screen) {
        const rectangle = document.createElement('div');
        rectangle.className = `rectangle ${screen === 'B' ? 'screenB' : ''}`;
        rectangle.dataset.id = rectData.id;
        rectangle.dataset.screen = screen;

        const scale = screen === 'A' ? this.app.scaleA : this.app.scaleB;
        const x = screen === 'A' ? rectData.screenA_x : rectData.screenB_x;
        const y = screen === 'A' ? rectData.screenA_y : rectData.screenB_y;

        rectangle.style.left = `${x * scale}px`;
        rectangle.style.top = `${y * scale}px`;
        rectangle.style.width = `${rectData.width}px`;
        rectangle.style.height = `${rectData.height}px`;
        rectangle.style.transform = `scale(${scale})`;
        rectangle.style.transformOrigin = 'top left';

        const textElement = document.createElement('div');
        textElement.className = 'rectangle-text';
        textElement.textContent = rectData.text;
        rectangle.appendChild(textElement);

        this.app.interactionManager.添加边缘缩放点(rectangle, rectData, screen);

        rectangle.addEventListener('click', (e) => {
            e.stopPropagation();
            this.app.interactionManager.选中区块(rectData);
        });

        rectangle.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            if (screen === 'A') {
                this.编辑区块(rectData, rectangle);
            }
        });

        rectangle.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            if (!e.target.classList.contains('resize-handle')) {
                this.app.interactionManager.开始拖动(e, rectData, screen);
            }
        });

        const targetScreen = screen === 'A' ? this.app.screenA : this.app.screenB;
        targetScreen.appendChild(rectangle);
    }

    async 删除区块(id) {
        try {
            const result = await deleteRectangle(id);
            if (result.success) {
                this.app.rectangles = this.app.rectangles.filter(rect => rect.id !== id);
                this.app.selectedRectangle = null;
                this.绘制所有区块();
            }
        } catch (error) {
            console.error('Failed to delete rectangle:', error);
        }
    }

    编辑区块(rectData, rectangleElement) {
        if (this.app.editingRectangle || this.app.selectedRectangles.size > 0) return;

        this.app.editingRectangle = rectData;
        const rect = rectangleElement.getBoundingClientRect();
        const screenRect = this.app.screenA.getBoundingClientRect();

        const input = document.createElement('textarea');
        input.className = 'text-input';
        input.value = rectData.text;
        input.style.left = `${rect.left - screenRect.left}px`;
        input.style.top = `${rect.top - screenRect.top}px`;
        input.style.width = `${Math.max(150, rect.width)}px`;
        input.style.height = `${Math.max(40, rect.height)}px`;

        this.app.screenA.appendChild(input);
        input.focus();
        input.select();

        const finishEditing = async () => {
            const newText = input.value;
            if (newText !== rectData.text) {
                await this.更新区块文本(rectData.id, newText);
            }
            input.remove();
            this.app.editingRectangle = null;
        };

        input.addEventListener('blur', finishEditing);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                finishEditing();
            } else if (e.key === 'Escape') {
                input.remove();
                this.app.editingRectangle = null;
            }
        });
    }

    async 更新区块文本(id, newText) {
        try {
            const result = await updateRectangle(id, { text: newText });
            if (result.success) {
                const rectIndex = this.app.rectangles.findIndex(rect => rect.id === id);
                if (rectIndex !== -1) {
                    this.app.rectangles[rectIndex] = result.rectangle;
                    this.绘制所有区块();
                }
            }
        } catch (error) {
            console.error('Failed to update rectangle text:', error);
        }
    }
}