/**
 * 创建者: FBplus
 * 创建时间: 2022-06-07 17:01:01
 * 修改者: FBplus
 * 修改时间: 2022-08-09 15:24:08
 * 详情: 鼠标操作
 */
import * as pc from "playcanvas";
//import { InputEventsMap } from "../../utils/common/InputEventsMap";
/**
 * 鼠标输入选项
 * @typedef {object} TouchInputOptions
 * @property {number} clickError
 */
export class TouchInputer extends pc.EventHandler /*Tool<TouchInputOptions, InputEventsMap>*/ {
    /**
     * 默认选项
     * @type {TouchInputOptions}
     */
    toolOptionsDefault = {
        clickError: 1,
    };
    pinchMidPoint = new pc.Vec2();
    lastTouchPoint = new pc.Vec2();
    touchDownPoint = new pc.Vec2();
    touchUpPoint = new pc.Vec2();
    lastPinchMidPoint = new pc.Vec2();
    isDragging = false;
    lastPinchDistance = 0;
    /**
     * @param {TouchInputOptions} options
     */
    constructor(options) {
        super();
        this.toolOptions = {
            ...this.toolOptionsDefault,
            ...options,
        };
        this.onEnable();
    }
    /**
    * 触屏操作开始事件回调
    * @param {pc.TouchEvent} event 触屏开始事件
    */
    onTouchStart(event) {
        var touches = event.touches;
        if (touches.length == 1) {
            this.isDragging = true;
            this.touchDownPoint.set(touches[0].x, touches[0].y);
            this.lastTouchPoint.set(touches[0].x, touches[0].y);
            this.fire("down", {
                x: touches[0].x,
                y: touches[0].y
            });
        } else if (touches.length == 2) {
            this.lastPinchDistance = this.getPinchDistance(touches[0], touches[1]);
            this.calcMidPoint(touches[0], touches[1], this.lastPinchMidPoint);
        }
    }
    /**
    * 触屏操作结束，取消事件回调
    * @param {pc.TouchEvent} event 触屏结束，取消事件
    */
    onTouchEndCancel(event) {
        var touches = event.touches;
        if (touches.length <= 0) {
            this.touchUpPoint.copy(this.lastTouchPoint);
            if (this.touchUpPoint.distance(this.touchDownPoint) < this.toolOptions.clickError) {
                this.fire("click", {
                    x: this.touchUpPoint.x,
                    y: this.touchUpPoint.y
                });
            }
            this.fire("up", {
                x: this.touchUpPoint.x,
                y: this.touchUpPoint.y
            });
            if (this.isDragging) {
                this.fire("dragEnd", {
                    x: this.touchUpPoint.x,
                    y: this.touchUpPoint.y
                });
            }
            this.isDragging = false;
        }
        if (touches.length == 1) {
            this.lastTouchPoint.set(touches[0].x, touches[0].y);
        } else if (touches.length == 2) {
            this.lastPinchDistance = this.getPinchDistance(touches[0], touches[1]);
            this.calcMidPoint(touches[0], touches[1], this.lastPinchMidPoint);
        }
    }
    /**
     * 触屏移动事件回调
     * @param {pc.TouchEvent} event 触屏移动事件
     */
    onTouchMove(event) {
        var touches = event.touches;
        if (touches.length == 1) {
            const touch = touches[0];
            this.fire("move", {
                x: touch.x,
                y: touch.y,
                dx: touch.x - this.lastTouchPoint.x,
                dy: touch.y - this.lastTouchPoint.y
            });
            if (this.isDragging) {
                this.fire("dragging", {
                    x: touch.x,
                    y: touch.y,
                    dx: touch.x - this.lastTouchPoint.x,
                    dy: touch.y - this.lastTouchPoint.y,
                    ox: this.touchDownPoint.x,
                    oy: this.touchDownPoint.y
                });
            }
            this.lastTouchPoint.set(touch.x, touch.y);
        } else if (touches.length == 2) {
            const currentPinchDistance = this.getPinchDistance(touches[0], touches[1]);
            const diffInPinchDistance = currentPinchDistance - this.lastPinchDistance;
            this.lastPinchDistance = currentPinchDistance;
            this.fire("pinch", { delta: diffInPinchDistance, event: event.event });
            this.calcMidPoint(touches[0], touches[1], this.pinchMidPoint);
            this.lastPinchMidPoint.copy(this.pinchMidPoint);
        }
    }
    /**
     * 计算中点
     * @param {{ x: number, y: number }} pointA 起点
     * @param {{ x: number, y: number }} pointB 终点
     * @param {pc.Vec2} result 中心点
     */
    calcMidPoint(pointA, pointB, result) {
        result.set(pointB.x - pointA.x, pointB.y - pointA.y);
        result.mulScalar(0.5);
        result.x += pointA.x;
        result.y += pointA.y;
    };
    /**
     * 获得两点距离
     * @param {{ x: number, y: number }} pointA 原始点
     * @param {{ x: number, y: number }} pointB 目标点
     * @returns {number} 两点距离
     */
    getPinchDistance(pointA, pointB) {
        const dx = pointA.x - pointB.x;
        const dy = pointA.y - pointB.y;
        return Math.sqrt((dx * dx) + (dy * dy));
    }
    onEnable() {
        this.app.touch.on(pc.EVENT_TOUCHSTART, this.onTouchStart, this);
        this.app.touch.on(pc.EVENT_TOUCHEND, this.onTouchEndCancel, this);
        this.app.touch.on(pc.EVENT_TOUCHCANCEL, this.onTouchEndCancel, this);
        this.app.touch.on(pc.EVENT_TOUCHMOVE, this.onTouchMove, this);
    }
    onDisable() {
        this.app.touch.off(pc.EVENT_TOUCHSTART, this.onTouchStart, this);
        this.app.touch.off(pc.EVENT_TOUCHEND, this.onTouchEndCancel, this);
        this.app.touch.off(pc.EVENT_TOUCHCANCEL, this.onTouchEndCancel, this);
        this.app.touch.off(pc.EVENT_TOUCHMOVE, this.onTouchMove, this);
    }
}
