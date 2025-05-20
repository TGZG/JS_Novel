export class ZoomManager {
    constructor(app) {
        this.app = app;
    }

    initZoom() {
        // 为左屏添加滚轮事件
        this.app.screenA.addEventListener('wheel', (e) => {
            e.preventDefault();
            this.handleZoom(e, 'A');
        });

        // 为右屏添加滚轮事件
        this.app.screenB.addEventListener('wheel', (e) => {
            e.preventDefault();
            this.handleZoom(e, 'B');
        });
    }

    handleZoom(event, screen) {
        const delta = event.deltaY > 0 ? -this.app.scaleStep : this.app.scaleStep;
        const currentScale = screen === 'A' ? this.app.scaleA : this.app.scaleB;
        const newScale = Math.max(0.1, Math.min(3, currentScale + delta)); // Add limits

        if (screen === 'A') {
            this.app.scaleA = newScale;
            this.applyZoom('A');
        } else {
            this.app.scaleB = newScale;
            this.applyZoom('B');
        }
    }

    applyZoom(screen) {
        const scale = screen === 'A' ? this.app.scaleA : this.app.scaleB;
        const screenElement = screen === 'A' ? this.app.screenA : this.app.screenB;

        // 获取所有矩形
        const rectangles = screenElement.querySelectorAll('.rectangle');

        rectangles.forEach(rect => {
            const rectData = this.app.rectangles.find(r => r.id === rect.dataset.id);
            if (rectData) {
                // 计算缩放后的位置和大小
                const x = screen === 'A' ? rectData.screenA_x : rectData.screenB_x;
                const y = screen === 'A' ? rectData.screenA_y : rectData.screenB_y;

                rect.style.transform = `scale(${scale})`;
                rect.style.transformOrigin = 'top left';

                // 调整位置以适应缩放
                rect.style.left = `${x * scale}px`;
                rect.style.top = `${y * scale}px`;
            }
        });
    }
}