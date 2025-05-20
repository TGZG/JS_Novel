import { updateRectangle } from './api.js';

export class InteractionManager {
    constructor(app) {
        this.app = app;
    }

    注册快捷键() {
        this.app.screenA.addEventListener('dblclick', (e) => this.app.rectangleManager.创建区块(e, 'A'));
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Delete' && (this.app.selectedRectangle || this.app.selectedRectangles.size > 0)) {
                if (this.app.selectedRectangles.size > 0) {
                    // 批量删除选中的矩形
                    Array.from(this.app.selectedRectangles).forEach(id => {
                        this.app.rectangleManager.删除区块(id);
                    });
                } else {
                    this.app.rectangleManager.删除区块(this.app.selectedRectangle.id);
                }
            }
        });

        // 添加框选事件监听
        this.app.screenA.addEventListener('mousedown', (e) => {
            if (e.button === 0 && !e.target.closest('.rectangle') && !e.target.closest('.resize-handle')) {
                this.startSelection(e);
            }
        });

        document.addEventListener('click', (e) => {
            if (!e.target.closest('.rectangle')) {
                this.选中区块(null);
            }
        });
        this.app.screenA.addEventListener('mouseenter', () => this.app.screenA.classList.add('focus'));
        this.app.screenA.addEventListener('mouseleave', () => this.app.screenA.classList.remove('focus'));
        this.app.screenB.addEventListener('mouseenter', () => this.app.screenB.classList.add('focus'));
        this.app.screenB.addEventListener('mouseleave', () => this.app.screenB.classList.remove('focus'));
    }

    选中区块(rectData) {
        // 清除所有选中状态
        document.querySelectorAll('.rectangle.selected, .rectangle.multi-selected').forEach(rect => {
            rect.classList.remove('selected', 'multi-selected');
        });

        if (!rectData) {
            this.app.selectedRectangle = null;
            this.app.selectedRectangles.clear();
            return;
        }

        // 如果按住Ctrl键，则添加到多选
        if (event.ctrlKey) {
            this.app.selectedRectangles.add(rectData.id);
            this.app.selectedRectangle = null;
            document.querySelectorAll(`[data-id="${rectData.id}"]`).forEach(rect => {
                rect.classList.add('multi-selected');
            });
        } else {
            // 单选模式
            this.app.selectedRectangle = rectData;
            this.app.selectedRectangles.clear();
            document.querySelectorAll(`[data-id="${rectData.id}"]`).forEach(rect => {
                rect.classList.add('selected');
            });
        }
    }

    startSelection(event) {
        event.preventDefault();
        this.app.isSelecting = true;
        const screenRect = this.app.screenA.getBoundingClientRect();
        const scale = this.app.scaleA;

        this.app.selectionBox = {
            startX: (event.clientX - screenRect.left) / scale,
            startY: (event.clientY - screenRect.top) / scale,
            currentX: (event.clientX - screenRect.left) / scale,
            currentY: (event.clientY - screenRect.top) / scale
        };

        // 创建选择框元素
        const selectionBox = document.createElement('div');
        selectionBox.className = 'selection-box';
        this.app.screenA.appendChild(selectionBox);

        const handleMouseMove = (e) => {
            if (!this.app.isSelecting) return;
            e.preventDefault();

            this.app.selectionBox.currentX = (e.clientX - screenRect.left) / scale;
            this.app.selectionBox.currentY = (e.clientY - screenRect.top) / scale;

            // 更新选择框位置和大小
            const left = Math.min(this.app.selectionBox.startX, this.app.selectionBox.currentX);
            const top = Math.min(this.app.selectionBox.startY, this.app.selectionBox.currentY);
            const width = Math.abs(this.app.selectionBox.currentX - this.app.selectionBox.startX);
            const height = Math.abs(this.app.selectionBox.currentY - this.app.selectionBox.startY);

            selectionBox.style.left = `${left * scale}px`;
            selectionBox.style.top = `${top * scale}px`;
            selectionBox.style.width = `${width * scale}px`;
            selectionBox.style.height = `${height * scale}px`;

            // 检查矩形是否在选择框内
            this.checkRectanglesInSelection(left, top, width, height);
        };

        const handleMouseUp = () => {
            this.app.isSelecting = false;
            selectionBox.remove();
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }

    checkRectanglesInSelection(left, top, width, height) {
        const scale = this.app.scaleA;
        this.app.rectangles.forEach(rectData => {
            const rect = document.querySelector(`[data-id="${rectData.id}"][data-screen="A"]`);
            if (!rect) return;

            const rectLeft = parseInt(rect.style.left) / scale;
            const rectTop = parseInt(rect.style.top) / scale;
            const rectWidth = rect.offsetWidth / scale;
            const rectHeight = rect.offsetHeight / scale;

            // 检查矩形是否与选择框相交
            if (this.isIntersecting(
                left, top, width, height,
                rectLeft, rectTop, rectWidth, rectHeight
            )) {
                this.app.selectedRectangles.add(rectData.id);
                rect.classList.add('multi-selected');
            } else if (!event.ctrlKey) {
                this.app.selectedRectangles.delete(rectData.id);
                rect.classList.remove('multi-selected');
            }
        });
    }

    isIntersecting(r1Left, r1Top, r1Width, r1Height, r2Left, r2Top, r2Width, r2Height) {
        return !(r1Left + r1Width < r2Left ||
            r2Left + r2Width < r1Left ||
            r1Top + r1Height < r2Top ||
            r2Top + r2Height < r1Top);
    }

    添加边缘缩放点(rectangle, rectData, screen) {
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
        this.app.isResizing = true;
        this.选中区块(rectData);

        const rectangle = event.currentTarget.parentElement;
        const screenElement = screen === 'A' ? this.app.screenA : this.app.screenB;
        const scale = screen === 'A' ? this.app.scaleA : this.app.scaleB;

        this.app.resizeData = {
            handle: handle,
            startX: event.clientX,
            startY: event.clientY,
            startWidth: rectData.width,
            startHeight: rectData.height,
            startLeft: parseInt(rectangle.style.left) / scale || 0,
            startTop: parseInt(rectangle.style.top) / scale || 0
        };

        const handleMouseMove = (e) => {
            if (!this.app.isResizing) return;
            e.preventDefault();

            const deltaX = (e.clientX - this.app.resizeData.startX) / scale;
            const deltaY = (e.clientY - this.app.resizeData.startY) / scale;

            let newWidth = this.app.resizeData.startWidth;
            let newHeight = this.app.resizeData.startHeight;
            let newLeft = this.app.resizeData.startLeft;
            let newTop = this.app.resizeData.startTop;

            switch (handle) {
                case 'se':
                    newWidth = Math.max(100, this.app.resizeData.startWidth + deltaX);
                    newHeight = Math.max(60, this.app.resizeData.startHeight + deltaY);
                    break;
                case 'sw':
                    newWidth = Math.max(100, this.app.resizeData.startWidth - deltaX);
                    newHeight = Math.max(60, this.app.resizeData.startHeight + deltaY);
                    newLeft = this.app.resizeData.startLeft + (this.app.resizeData.startWidth - newWidth);
                    break;
                case 'ne':
                    newWidth = Math.max(100, this.app.resizeData.startWidth + deltaX);
                    newHeight = Math.max(60, this.app.resizeData.startHeight - deltaY);
                    newTop = this.app.resizeData.startTop + (this.app.resizeData.startHeight - newHeight);
                    break;
                case 'nw':
                    newWidth = Math.max(100, this.app.resizeData.startWidth - deltaX);
                    newHeight = Math.max(60, this.app.resizeData.startHeight - deltaY);
                    newLeft = this.app.resizeData.startLeft + (this.app.resizeData.startWidth - newWidth);
                    newTop = this.app.resizeData.startTop + (this.app.resizeData.startHeight - newHeight);
                    break;
                case 'n':
                    newHeight = Math.max(60, this.app.resizeData.startHeight - deltaY);
                    newTop = this.app.resizeData.startTop + (this.app.resizeData.startHeight - newHeight);
                    break;
                case 's':
                    newHeight = Math.max(60, this.app.resizeData.startHeight + deltaY);
                    break;
                case 'e':
                    newWidth = Math.max(100, this.app.resizeData.startWidth + deltaX);
                    break;
                case 'w':
                    newWidth = Math.max(100, this.app.resizeData.startWidth - deltaX);
                    newLeft = this.app.resizeData.startLeft + (this.app.resizeData.startWidth - newWidth);
                    break;
            }

            const screenWidth = screenElement.clientWidth / scale;
            const screenHeight = screenElement.clientHeight / scale;

            newLeft = Math.max(0, Math.min(newLeft, screenWidth - newWidth));
            newTop = Math.max(0, Math.min(newTop, screenHeight - newHeight));
            newWidth = Math.min(newWidth, screenWidth - newLeft);
            newHeight = Math.min(newHeight, screenHeight - newTop);

            rectangle.style.width = `${newWidth}px`;
            rectangle.style.height = `${newHeight}px`;
            rectangle.style.left = `${newLeft * scale}px`;
            rectangle.style.top = `${newTop * scale}px`;
        };

        const handleMouseUp = async () => {
            if (!this.app.isResizing) return;

            this.app.isResizing = false;
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);

            const newWidth = parseInt(rectangle.style.width);
            const newHeight = parseInt(rectangle.style.height);
            const newLeft = parseInt(rectangle.style.left) / scale;
            const newTop = parseInt(rectangle.style.top) / scale;

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
                const result = await updateRectangle(rectData.id, updates);
                if (result.success) {
                    const rectIndex = this.app.rectangles.findIndex(rect => rect.id === rectData.id);
                    if (rectIndex !== -1) {
                        this.app.rectangles[rectIndex] = result.rectangle;
                        this.app.rectangleManager.绘制所有区块();
                    }
                }
            } catch (error) {
                console.error('Failed to update rectangle size:', error);
            }
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }

    开始拖动(event, rectData, screen) {
        if (this.app.isResizing || this.app.isSelecting) return;

        event.preventDefault();
        event.stopPropagation();

        this.app.isDragging = true;
        this.选中区块(rectData);

        const rectangle = event.currentTarget;
        const screenElement = screen === 'A' ? this.app.screenA : this.app.screenB;
        const scale = screen === 'A' ? this.app.scaleA : this.app.scaleB;
        const screenRect = screenElement.getBoundingClientRect();

        const rectRect = rectangle.getBoundingClientRect();
        this.app.dragOffset.x = (event.clientX - rectRect.left) / scale;
        this.app.dragOffset.y = (event.clientY - rectRect.top) / scale;

        // 记录所有选中矩形的初始位置
        const selectedRects = this.app.selectedRectangles.size > 0
            ? Array.from(this.app.selectedRectangles).map(id => ({
                id,
                element: document.querySelector(`[data-id="${id}"][data-screen="${screen}"]`),
                initialLeft: parseInt(document.querySelector(`[data-id="${id}"][data-screen="${screen}"]`).style.left) / scale,
                initialTop: parseInt(document.querySelector(`[data-id="${id}"][data-screen="${screen}"]`).style.top) / scale
            }))
            : [{
                id: rectData.id,
                element: rectangle,
                initialLeft: parseInt(rectangle.style.left) / scale,
                initialTop: parseInt(rectangle.style.top) / scale
            }];

        selectedRects.forEach(rect => {
            rect.element.style.zIndex = '1000';
            rect.element.style.cursor = 'grabbing';
        });

        const handleMouseMove = (e) => {
            if (!this.app.isDragging || this.app.isResizing) return;
            e.preventDefault();

            const newX = (e.clientX - screenRect.left) / scale - this.app.dragOffset.x;
            const newY = (e.clientY - screenRect.top) / scale - this.app.dragOffset.y;

            const screenWidth = screenElement.clientWidth / scale;
            const screenHeight = screenElement.clientHeight / scale;

            selectedRects.forEach(rect => {
                const rectWidth = rect.element.offsetWidth / scale;
                const rectHeight = rect.element.offsetHeight / scale;

                const deltaX = newX - selectedRects[0].initialLeft;
                const deltaY = newY - selectedRects[0].initialTop;

                const newLeft = rect.initialLeft + deltaX;
                const newTop = rect.initialTop + deltaY;

                const constrainedX = Math.max(0, Math.min(newLeft, screenWidth - rectWidth));
                const constrainedY = Math.max(0, Math.min(newTop, screenHeight - rectHeight));

                rect.element.style.left = `${constrainedX * scale}px`;
                rect.element.style.top = `${constrainedY * scale}px`;
            });
        };

        const handleMouseUp = async (e) => {
            if (!this.app.isDragging) return;
            e.preventDefault();

            this.app.isDragging = false;
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);

            selectedRects.forEach(rect => {
                rect.element.style.zIndex = '';
                rect.element.style.cursor = 'move';
            });

            // 更新所有选中矩形的位置
            const updates = selectedRects.map(rect => {
                const newX = parseInt(rect.element.style.left) / scale;
                const newY = parseInt(rect.element.style.top) / scale;
                return {
                    id: rect.id,
                    updates: screen === 'A' ? {
                        screenA_x: newX,
                        screenA_y: newY
                    } : {
                        screenB_x: newX,
                        screenB_y: newY
                    }
                };
            });

            // 批量更新位置
            for (const update of updates) {
                try {
                    const result = await updateRectangle(update.id, update.updates);
                    if (result.success) {
                        const rectIndex = this.app.rectangles.findIndex(rect => rect.id === update.id);
                        if (rectIndex !== -1) {
                            this.app.rectangles[rectIndex] = result.rectangle;
                        }
                    }
                } catch (error) {
                    console.error('Failed to update rectangle position:', error);
                }
            }
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }
}