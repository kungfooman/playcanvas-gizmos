/**
 * 创建者: FBplus
 * 创建时间: 2022-06-07 17:01:01
 * 修改者: FBplus
 * 修改时间: 2022-08-09 14:02:34
 * 详情: 鼠标操作
 */
import * as pc from "playcanvas";
// import type { InputEventsMap } from "../../utils/common/InputEventsMap";
/**
 * 鼠标输入选项
 */
/**
 * @typedef {object} MouseInputOptions
 * @property {number} clickError
 */
export class MouseInputer extends pc.EventHandler //extends Tool<MouseInputOptions, InputEventsMap>
{
    // 默认选项
    /** @type {MouseInputOptions} */
    toolOptionsDefault = {
        clickError: 1
    };
    get app() {
        return pc.Application.getApplication();
    }
    mouseDownVec = new pc.Vec2();
    mouseMoveVec = new pc.Vec2();
    mouseUpVec = new pc.Vec2();
    isDragging = false;
    /**
     * @param {MouseInputOptions} [options]
     */
    constructor(options) {
        super();
        this.toolOptions = {
            ...this.toolOptionsDefault,
            ...options,
        };
        this.mouseDownVec = new pc.Vec2();
        this.mouseMoveVec = new pc.Vec2();
        this.mouseUpVec = new pc.Vec2();
    }
    /**
     * 
     * @param {pc.MouseEvent} event 
     */
    onMouseDown(event)
    {
        this.isDragging = true;
        this.mouseDownVec.set(event.x, event.y);
        this.mouseMoveVec.set(event.x, event.y);
        this.fire("down", {
            x: this.mouseDownVec.x,
            y: this.mouseDownVec.y
        });
    }
    /**
     * 
     * @param {pc.MouseEvent} event 
     */
    onMouseMove(event) {
        const dx = event.x - this.mouseMoveVec.x;
        const dy = event.y - this.mouseMoveVec.y;
        this.mouseMoveVec.set(event.x, event.y);
        this.fire("move", {
            x: this.mouseMoveVec.x,
            y: this.mouseMoveVec.y,
            dx: dx,
            dy: dy
        });
        if (this.isDragging) {
            this.fire("dragging", {
                x: this.mouseMoveVec.x,
                y: this.mouseMoveVec.y,
                dx: dx,
                dy: dy,
                ox: this.mouseDownVec.x,
                oy: this.mouseDownVec.y
            });
        }
    }
    /**
     * @param {pc.MouseEvent} event 
     */
    onMouseUp(event) {
        this.mouseUpVec.set(event.x, event.y);
        if (this.mouseUpVec.distance(this.mouseDownVec) < this.toolOptions.clickError) {
            this.fire("click", {
                x: this.mouseUpVec.x,
                y: this.mouseUpVec.y
            });
        }
        this.fire("up", {
            x: this.mouseUpVec.x,
            y: this.mouseUpVec.y
        });
        if (this.isDragging) {
            this.fire("dragEnd", {
                x: this.mouseUpVec.x,
                y: this.mouseUpVec.y
            });
        }
        this.isDragging = false;
    }
    /**
     * @param {pc.MouseEvent} event 
     */
    onMouseWheel(event) {
        this.fire("pinch", {
            delta: event.wheelDelta,
            event: event.event,
        });
    }
    /**
     * @override
     */
    onEnable() {
        this.app.mouse.on(pc.EVENT_MOUSEDOWN, this.onMouseDown, this);
        this.app.mouse.on(pc.EVENT_MOUSEWHEEL, this.onMouseWheel, this);
        this.app.mouse.on(pc.EVENT_MOUSEMOVE, this.onMouseMove, this);
        this.app.mouse.on(pc.EVENT_MOUSEUP, this.onMouseUp, this);
    }
    /**
     * @override
     */
    onDisable() {
        this.app.mouse.off(pc.EVENT_MOUSEDOWN, this.onMouseDown, this);
        this.app.mouse.off(pc.EVENT_MOUSEWHEEL, this.onMouseWheel, this);
        this.app.mouse.off(pc.EVENT_MOUSEMOVE, this.onMouseMove, this);
        this.app.mouse.off(pc.EVENT_MOUSEUP, this.onMouseUp, this);
    }
}
