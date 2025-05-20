import { updateRectangle } from './api.js';

export class InteractionManager {
    constructor(app) {
        this.app = app;
    }

    注册快捷键() {
        this.app.screenA.addEventListener('dblclick', (e) => this.app.rectangleManager.创建区块(e, 'A'));
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Delete' && this.app.selectedRectangle) {
                this.app.rectangleManager.删除区块(this.app.selectedRectangle.id);
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
        document.querySelectorAll('.rectangle.selected').forEach(rect => {
            rect.classList.remove('selected');
        });

        this.app.selectedRectangle = rectData;

        if (rectData) {
            document.querySelectorAll(`[data-id="${rectData.id}"]`).forEach(rect => {
                rect.classList.add('selected');
            });
        }
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
        if (this.app.isResizing) return;

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

        rectangle.style.zIndex = '1000';
        rectangle.style.cursor = 'grabbing';

        const handleMouseMove = (e) => {
            if (!this.app.isDragging || this.app.isResizing) return;
            e.preventDefault();

            const newX = (e.clientX - screenRect.left) / scale - this.app.dragOffset.x;
            const newY = (e.clientY - screenRect.top) / scale - this.app.dragOffset.y;

            const screenWidth = screenElement.clientWidth / scale;
            const screenHeight = screenElement.clientHeight / scale;
            const rectWidth = rectangle.offsetWidth / scale;
            const rectHeight = rectangle.offsetHeight / scale;

            const constrainedX = Math.max(0, Math.min(newX, screenWidth - rectWidth));
            const constrainedY = Math.max(0, Math.min(newY, screenHeight - rectHeight));

            rectangle.style.left = `${constrainedX * scale}px`;
            rectangle.style.top = `${constrainedY * scale}px`;
        };

        const handleMouseUp = async (e) => {
            if (!this.app.isDragging) return;
            e.preventDefault();

            this.app.isDragging = false;
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);

            rectangle.style.zIndex = '';
            rectangle.style.cursor = 'move';

            const newX = parseInt(rectangle.style.left) / scale;
            const newY = parseInt(rectangle.style.top) / scale;

            const updates = {};
            if (screen === 'A') {
                updates.screenA_x = newX;
                updates.screenA_y = newY;
            } else {
                updates.screenB_x = newX;
                updates.screenB_y = newY;
            }

            try {
                const result = await updateRectangle(rectData.id, updates);
                if (result.success) {
                    const rectIndex = this.app.rectangles.findIndex(rect => rect.id === rectData.id);
                    if (rectIndex !== -1) {
                        this.app.rectangles[rectIndex] = result.rectangle;
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