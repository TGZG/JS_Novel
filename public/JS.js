class DualScreenApp {
    constructor() {
        this.rectangles = [];
        this.selectedRectangle = null;
        this.isDragging = false;
        this.isResizing = false;
        this.dragOffset = { x: 0, y: 0 };
        this.resizeData = { handle: '', startX: 0, startY: 0, startWidth: 0, startHeight: 0, startLeft: 0, startTop: 0 };
        this.editingRectangle = null;

        this.screenA = document.getElementById('screenA');
        this.screenB = document.getElementById('screenB');

        this.init();
    }
    async init() {
        this.注册快捷键();
        await this.读档();
        this.绘制所有区块();
    }
    注册快捷键() {
        this.screenA.addEventListener('dblclick', (e) => this.创建区块(e, 'A'));//新建区块
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Delete' && this.selectedRectangle) {
                this.删除区块(this.selectedRectangle.id);
            }
        });//删除区块
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.rectangle')) {
                this.选中区块(null);
            }
        });//选择区块
        this.screenA.addEventListener('mouseenter', () => this.screenA.classList.add('focus'));//悬浮区块
        this.screenA.addEventListener('mouseleave', () => this.screenA.classList.remove('focus'));
        this.screenB.addEventListener('mouseenter', () => this.screenB.classList.add('focus'));
        this.screenB.addEventListener('mouseleave', () => this.screenB.classList.remove('focus'));
    }
    async 读档() {
        try {
            const response = await fetch('/api/rectangles');
            const data = await response.json();
            this.rectangles = data.rectangles || [];
        } catch (error) {
            console.error('Failed to load rectangles:', error);
            this.rectangles = [];
        }
    }
    async 创建区块(event, screen) {
        if (event.target.classList.contains('rectangle')) return;

        const rect = screen === 'A' ? this.screenA.getBoundingClientRect() : this.screenB.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

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
            const response = await fetch('/api/rectangles', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newRectangle)
            });

            const result = await response.json();
            if (result.success) {
                this.rectangles.push(result.rectangle);
                this.绘制所有区块();
            }
        } catch (error) {
            console.error('Failed to create rectangle:', error);
        }
    }
    绘制所有区块() {
        const existingRects = document.querySelectorAll('.rectangle');
        existingRects.forEach(rect => rect.remove());//如果有，那么先清除存在的区块
        this.rectangles.forEach(rectData => { //绘制区块
            this.绘制区块(rectData, 'A');
            this.绘制区块(rectData, 'B');
        });
    }
    绘制区块(rectData, screen) {
        const rectangle = document.createElement('div');
        rectangle.className = `rectangle ${screen === 'B' ? 'screenB' : ''}`;
        rectangle.dataset.id = rectData.id;
        rectangle.dataset.screen = screen;

        const x = screen === 'A' ? rectData.screenA_x : rectData.screenB_x;
        const y = screen === 'A' ? rectData.screenA_y : rectData.screenB_y;

        rectangle.style.left = `${x}px`;
        rectangle.style.top = `${y}px`;
        rectangle.style.width = `${rectData.width}px`;
        rectangle.style.height = `${rectData.height}px`;

        const textElement = document.createElement('div');
        textElement.className = 'rectangle-text';
        textElement.textContent = rectData.text;
        rectangle.appendChild(textElement);

        this.addResizeHandles(rectangle, rectData, screen);

        rectangle.addEventListener('click', (e) => {
            e.stopPropagation();
            this.选中区块(rectData);
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
                this.开始拖动(e, rectData, screen);
            }
        });

        const targetScreen = screen === 'A' ? this.screenA : this.screenB;
        targetScreen.appendChild(rectangle);
    }

    addResizeHandles(rectangle, rectData, screen) {
        const handles = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];

        handles.forEach(handle => {
            const handleElement = document.createElement('div');
            handleElement.className = `resize-handle ${handle}`;

            handleElement.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                this.startResize(e, rectData, screen, handle);
            });

            rectangle.appendChild(handleElement);
        });
    }

    startResize(event, rectData, screen, handle) {
        event.preventDefault();
        this.isResizing = true;
        this.选中区块(rectData);

        const rectangle = event.currentTarget.parentElement;
        const screenElement = screen === 'A' ? this.screenA : this.screenB;

        this.resizeData = {
            handle: handle,
            startX: event.clientX,
            startY: event.clientY,
            startWidth: rectData.width,
            startHeight: rectData.height,
            startLeft: parseInt(rectangle.style.left) || 0,
            startTop: parseInt(rectangle.style.top) || 0
        };

        const handleMouseMove = (e) => {
            if (!this.isResizing) return;
            e.preventDefault();

            const deltaX = e.clientX - this.resizeData.startX;
            const deltaY = e.clientY - this.resizeData.startY;

            let newWidth = this.resizeData.startWidth;
            let newHeight = this.resizeData.startHeight;
            let newLeft = this.resizeData.startLeft;
            let newTop = this.resizeData.startTop;

            switch (handle) {
                case 'se':
                    newWidth = Math.max(100, this.resizeData.startWidth + deltaX);
                    newHeight = Math.max(60, this.resizeData.startHeight + deltaY);
                    break;
                case 'sw':
                    newWidth = Math.max(100, this.resizeData.startWidth - deltaX);
                    newHeight = Math.max(60, this.resizeData.startHeight + deltaY);
                    newLeft = this.resizeData.startLeft + (this.resizeData.startWidth - newWidth);
                    break;
                case 'ne':
                    newWidth = Math.max(100, this.resizeData.startWidth + deltaX);
                    newHeight = Math.max(60, this.resizeData.startHeight - deltaY);
                    newTop = this.resizeData.startTop + (this.resizeData.startHeight - newHeight);
                    break;
                case 'nw':
                    newWidth = Math.max(100, this.resizeData.startWidth - deltaX);
                    newHeight = Math.max(60, this.resizeData.startHeight - deltaY);
                    newLeft = this.resizeData.startLeft + (this.resizeData.startWidth - newWidth);
                    newTop = this.resizeData.startTop + (this.resizeData.startHeight - newHeight);
                    break;
                case 'n':
                    newHeight = Math.max(60, this.resizeData.startHeight - deltaY);
                    newTop = this.resizeData.startTop + (this.resizeData.startHeight - newHeight);
                    break;
                case 's':
                    newHeight = Math.max(60, this.resizeData.startHeight + deltaY);
                    break;
                case 'e':
                    newWidth = Math.max(100, this.resizeData.startWidth + deltaX);
                    break;
                case 'w':
                    newWidth = Math.max(100, this.resizeData.startWidth - deltaX);
                    newLeft = this.resizeData.startLeft + (this.resizeData.startWidth - newWidth);
                    break;
            }

            const screenWidth = screenElement.clientWidth;
            const screenHeight = screenElement.clientHeight;

            newLeft = Math.max(0, Math.min(newLeft, screenWidth - newWidth));
            newTop = Math.max(0, Math.min(newTop, screenHeight - newHeight));
            newWidth = Math.min(newWidth, screenWidth - newLeft);
            newHeight = Math.min(newHeight, screenHeight - newTop);

            rectangle.style.width = `${newWidth}px`;
            rectangle.style.height = `${newHeight}px`;
            rectangle.style.left = `${newLeft}px`;
            rectangle.style.top = `${newTop}px`;
        };

        const handleMouseUp = async () => {
            if (!this.isResizing) return;

            this.isResizing = false;
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);

            const newWidth = parseInt(rectangle.style.width);
            const newHeight = parseInt(rectangle.style.height);
            const newLeft = parseInt(rectangle.style.left);
            const newTop = parseInt(rectangle.style.top);

            const updates = {
                width: newWidth,
                height: newHeight
            };

            if (screen === 'A') {
                updates.screenA_x = newLeft;
                updates.screenA_y = newTop;
            } else {
                updates.screenB_x = newLeft;
                updates.screenB_y = newTop;
            }

            try {
                const response = await fetch(`/api/rectangles/${rectData.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(updates)
                });

                const result = await response.json();
                if (result.success) {
                    const rectIndex = this.rectangles.findIndex(rect => rect.id === rectData.id);
                    if (rectIndex !== -1) {
                        this.rectangles[rectIndex] = result.rectangle;
                        this.绘制所有区块();
                    }
                }
            } catch (error) {
                console.error('Failed to update rectangle size:', error);
            }
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }

    选中区块(rectData) {
        document.querySelectorAll('.rectangle.selected').forEach(rect => {
            rect.classList.remove('selected');
        });

        this.selectedRectangle = rectData;

        if (rectData) {
            document.querySelectorAll(`[data-id="${rectData.id}"]`).forEach(rect => {
                rect.classList.add('selected');
            });
        }
    }

    async 删除区块(id) {
        try {
            const response = await fetch(`/api/rectangles/${id}`, {
                method: 'DELETE'
            });

            const result = await response.json();
            if (result.success) {
                this.rectangles = this.rectangles.filter(rect => rect.id !== id);
                this.selectedRectangle = null;
                this.绘制所有区块();
            }
        } catch (error) {
            console.error('Failed to delete rectangle:', error);
        }
    }

    编辑区块(rectData, rectangleElement) {
        if (this.editingRectangle) return;

        this.editingRectangle = rectData;
        const rect = rectangleElement.getBoundingClientRect();
        const screenRect = this.screenA.getBoundingClientRect();

        const input = document.createElement('textarea');
        input.className = 'text-input';
        input.value = rectData.text;
        input.style.left = `${rect.left - screenRect.left}px`;
        input.style.top = `${rect.top - screenRect.top}px`;
        input.style.width = `${Math.max(150, rect.width)}px`;
        input.style.height = `${Math.max(40, rect.height)}px`;

        this.screenA.appendChild(input);
        input.focus();
        input.select();

        const finishEditing = async () => {
            const newText = input.value;
            if (newText !== rectData.text) {
                await this.更新区块文本(rectData.id, newText);
            }
            input.remove();
            this.editingRectangle = null;
        };

        input.addEventListener('blur', finishEditing);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                finishEditing();
            } else if (e.key === 'Escape') {
                input.remove();
                this.editingRectangle = null;
            }
        });
    }

    async 更新区块文本(id, newText) {
        try {
            const response = await fetch(`/api/rectangles/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text: newText })
            });

            const result = await response.json();
            if (result.success) {
                const rectIndex = this.rectangles.findIndex(rect => rect.id === id);
                if (rectIndex !== -1) {
                    this.rectangles[rectIndex] = result.rectangle;
                    this.绘制所有区块();
                }
            }
        } catch (error) {
            console.error('Failed to update rectangle text:', error);
        }
    }

    开始拖动(event, rectData, screen) {
        if (this.isResizing) return;

        event.preventDefault();
        event.stopPropagation();

        this.isDragging = true;
        this.选中区块(rectData);

        const rectangle = event.currentTarget;
        const screenElement = screen === 'A' ? this.screenA : this.screenB;
        const screenRect = screenElement.getBoundingClientRect();

        const rectRect = rectangle.getBoundingClientRect();
        this.dragOffset.x = event.clientX - rectRect.left;
        this.dragOffset.y = event.clientY - rectRect.top;

        rectangle.style.zIndex = '1000';
        rectangle.style.cursor = 'grabbing';

        const handleMouseMove = (e) => {
            if (!this.isDragging || this.isResizing) return;
            e.preventDefault();

            const newX = e.clientX - screenRect.left - this.dragOffset.x;
            const newY = e.clientY - screenRect.top - this.dragOffset.y;

            const screenWidth = screenElement.clientWidth;
            const screenHeight = screenElement.clientHeight;
            const rectWidth = rectangle.offsetWidth;
            const rectHeight = rectangle.offsetHeight;

            const constrainedX = Math.max(0, Math.min(newX, screenWidth - rectWidth));
            const constrainedY = Math.max(0, Math.min(newY, screenHeight - rectHeight));

            rectangle.style.left = `${constrainedX}px`;
            rectangle.style.top = `${constrainedY}px`;
        };

        const handleMouseUp = async (e) => {
            if (!this.isDragging) return;
            e.preventDefault();

            this.isDragging = false;
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);

            rectangle.style.zIndex = '';
            rectangle.style.cursor = 'move';

            const newX = parseInt(rectangle.style.left) || 0;
            const newY = parseInt(rectangle.style.top) || 0;

            const updates = {};
            if (screen === 'A') {
                updates.screenA_x = newX;
                updates.screenA_y = newY;
            } else {
                updates.screenB_x = newX;
                updates.screenB_y = newY;
            }

            try {
                const response = await fetch(`/api/rectangles/${rectData.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(updates)
                });

                const result = await response.json();
                if (result.success) {
                    const rectIndex = this.rectangles.findIndex(rect => rect.id === rectData.id);
                    if (rectIndex !== -1) {
                        this.rectangles[rectIndex] = result.rectangle;
                    }
                }
            } catch (error) {
                console.error('Failed to update rectangle position:', error);
            }
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }
}

window.addEventListener('DOMContentLoaded', () => {
    new DualScreenApp();
});