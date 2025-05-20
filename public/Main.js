import { RectangleManager } from './区块.js';
import { InteractionManager } from './区块鼠键操作.js';
import { ZoomManager } from './缩放.js';
import { PanManager } from './背景平移.js';

export class DualScreenApp {
    constructor() {
        // Core properties
        this.rectangles = [];
        this.selectedRectangle = null;
        this.isDragging = false;
        this.isResizing = false;
        this.dragOffset = { x: 0, y: 0 };
        this.resizeData = { handle: '', startX: 0, startY: 0, startWidth: 0, startHeight: 0, startLeft: 0, startTop: 0 };
        this.editingRectangle = null;

        this.screenA = document.getElementById('screenA');
        this.screenB = document.getElementById('screenB');

        this.scaleA = 1;
        this.scaleB = 1;
        this.scaleStep = 0.1;

        this.isPanning = false;
        this.panStart = { x: 0, y: 0 };
        this.panOffsetA = { x: 0, y: 0 };
        this.panOffsetB = { x: 0, y: 0 };

        // Initialize managers
        this.rectangleManager = new RectangleManager(this);
        this.interactionManager = new InteractionManager(this);
        this.zoomManager = new ZoomManager(this);
        this.panManager = new PanManager(this);

        this.init();
    }

    async init() {
        this.interactionManager.注册快捷键();
        await this.rectangleManager.读档();
        this.rectangleManager.绘制所有区块();
        this.zoomManager.initZoom();
        this.panManager.initPan();
    }
}