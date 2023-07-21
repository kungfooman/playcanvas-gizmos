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
const drawRect = new pc.Vec4();
const divRect = new pc.Vec4();
const rectColor = pc.Color.WHITE.clone();
const quadColor = new pc.Color(1, 1, 1, 0.15);
/**
 * 绘制框选矩形
 * @param {number} start_x 开始点
 * @param {number} start_y 开始点
 * @param {number} end_x 移动点
 * @param {number} end_y 移动点
 * @param {pc.Layer} boxLayer
 * @returns {pc.Vec4} 框选矩形范围
 */
export function drawSelectionBox(start_x, start_y, end_x, end_y, boxLayer) {
    const app = pc.Application.getApplication();
    const canvas = app.graphicsDevice.canvas;
    const canvasWidth = canvas.clientWidth;
    const canvasHeight = canvas.clientHeight;
    let minX, minY, maxX, maxY;
    if (start_x > end_x) {
        maxX = start_x;
        minX = end_x;
    } else {
        maxX = end_x;
        minX = start_x;
    }
    if (start_y > end_y) {
        maxY = start_y;
        minY = end_y;
    } else {
        maxY = end_y;
        minY = start_y;
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
