export class PanManager {
    constructor(app) {
        this.app = app;
    }

    initPan() {
        // 为左右屏添加右键拖动事件
        [this.app.screenA, this.app.screenB].forEach(screen => {
            screen.addEventListener('contextmenu', (e) => e.preventDefault());
            screen.addEventListener('mousedown', (e) => {
                if (e.button === 2) { // 右键
                    this.startPan(e, screen);
                }
            });
        });
    }

    startPan(event, screen) {
        event.preventDefault();
        this.app.isPanning = true;
        this.app.panStart = { x: event.clientX, y: event.clientY };

        const panOffset = screen === this.app.screenA ? this.app.panOffsetA : this.app.panOffsetB;
        const screenElement = screen;

        const handleMouseMove = (e) => {
            if (!this.app.isPanning) return;

            const deltaX = e.clientX - this.app.panStart.x;
            const deltaY = e.clientY - this.app.panStart.y;

            panOffset.x += deltaX;
            panOffset.y += deltaY;

            this.app.panStart = { x: e.clientX, y: e.clientY };

            // 更新所有矩形的位置
            const rectangles = screenElement.querySelectorAll('.rectangle');
            rectangles.forEach(rect => {
                const currentLeft = parseFloat(rect.style.left) || 0;
                const currentTop = parseFloat(rect.style.top) || 0;
                rect.style.left = `${currentLeft + deltaX}px`;
                rect.style.top = `${currentTop + deltaY}px`;
            });
        };

        const handleMouseUp = () => {
            this.app.isPanning = false;
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }
}