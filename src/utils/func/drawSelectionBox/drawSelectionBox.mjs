/**
 * 创建者: FBplus
 * 创建时间: 2022-06-08 18:37:08
 * 修改者: FBplus
 * 修改时间: 2022-07-10 15:10:29
 * 详情: 根据鼠标位置在屏幕上绘制多选框
 */

import * as pc from "playcanvas";
import { clearScreenQuad, drawScreenQuad } from "./drawScreenQuad.mjs";
import { clearScreenRect, drawScreenRect } from "./drawScreenRect.mjs";

let drawRect = new pc.Vec4();
let divRect = new pc.Vec4();
let rectColor = pc.Color.WHITE.clone();
let quadColor = new pc.Color(1, 1, 1, 0.15);

/**
 * 绘制框选矩形
 * @param {{ x: number, y: number }} startPoint 开始点
 * @param {{ x: number, y: number }} endPoint 移动点
 * @param {pc.Layer} boxLayer
 * @returns {pc.Vec4} 框选矩形范围
 */
export function drawSelectionBox(startPoint, endPoint, boxLayer) {
    const app = pc.Application.getApplication();
    const canvas = app.graphicsDevice.canvas;
    const canvasWidth = canvas.clientWidth;
    const canvasHeight = canvas.clientHeight;

    let minX, minY, maxX, maxY;
    if (startPoint.x > endPoint.x) {
        maxX = startPoint.x;
        minX = endPoint.x;
    }
    else {
        maxX = endPoint.x;
        minX = startPoint.x;
    }

    if (startPoint.y > endPoint.y) {
        maxY = startPoint.y;
        minY = endPoint.y;
    }
    else {
        maxY = endPoint.y;
        minY = startPoint.y;
    }

    drawRect.set(minX, minY, maxX - minX, maxY - minY);
    divRect.set(canvasWidth, canvasHeight, canvasWidth, canvasHeight);

    drawRect.div(divRect);

    drawScreenRect(drawRect, rectColor, boxLayer);
    drawScreenQuad(drawRect, quadColor, boxLayer);

    return drawRect.mul(divRect);
}

/**
 * 清除框选矩形
 */
export function clearSelectionBox() {
    clearScreenRect();
    clearScreenQuad();
}
