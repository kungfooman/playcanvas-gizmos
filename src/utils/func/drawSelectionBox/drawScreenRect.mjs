/**
 * 创建者: FBplus
 * 创建时间: 2022-05-16 13:41:42
 * 修改者: FBplus
 * 修改时间: 2022-07-10 15:09:41
 * 详情: 在屏幕空间绘制矩形
 */
import * as pc from "playcanvas";
import fs from "../../../utils/shaders/screenQuad/ScreenQuadPS.frag.mjs";
import vs from "../../../utils/shaders/screenQuad/ScreenQuadVS.vert.mjs";
const defaultRect = new pc.Vec4(0, 0, 1, 1);
const defaultColor = pc.Color.WHITE.clone();
/** @type {pc.Shader} */ let rectShader;
/** @type {pc.Mesh} */ let rectMesh;
/** @type {pc.Color} */ let rectColor;
/** @type {pc.Material} */ let rectMaterial;
/** @type {pc.Entity} */ let rectEntity;
/** @type {pc.Layer} */ let rectLayer;
/** @type {pc.Vec4} */ let screenRect;
/**
 * 绘制框选矩形边框
 * @param {pc.Vec4} rect 矩形范围
 * @param {pc.Color} color 颜色
 * @param {pc.Layer} layer layer
 */
export function drawScreenRect(rect = defaultRect, color = defaultColor, layer) {
    rectEntity ?? createRectEntity(rect, color);
    rectEntity.enabled = true;
    if (layer && (rectLayer != layer)) {
        rectEntity.render.layers = [layer.id];
        rectLayer = layer;
    }
    if (!rectColor.equals(color)) {
        rectMaterial.setParameter("uColor", color.data);
        rectMaterial.update();
        rectColor.copy(color);
    }
    if (!screenRect.equals(rect)) {
        updateRectMesh(rect);
        screenRect.copy(rect);
    }
}
/**
 * 清除框选矩形边框
 */
export function clearScreenRect() {
    if (rectEntity) {
        rectEntity.enabled = false;
    }
}
/**
 * 创建框选矩形边框物体实例
 * @param {pc.Vec4} rect 矩形范围
 * @param {pc.Color} color 颜色
 * @param {pc.Layer} [layer] layer
 * @returns {pc.Entity} 框选矩形边框物体实例
 */
function createRectEntity(rect, color, layer) {
    screenRect = new pc.Vec4().copy(rect);
    rectMesh = updateRectMesh(screenRect);
    rectColor = new pc.Color().copy(color);
    rectShader = createRectShader();
    rectMaterial = new pc.Material();
    rectMaterial.shader = rectShader;
    rectMaterial.blendType = pc.BLEND_NORMAL;
    rectMaterial.setParameter("uColor", rectColor.data);
    rectMaterial.update();
    const meshInstance = new pc.MeshInstance(rectMesh, rectMaterial);
    meshInstance.cull = false;
    const entity = new pc.Entity("ScreenQuad");
    entity.addComponent("render", {
        meshInstances: [meshInstance]
    });
    rectEntity = entity;
    rectLayer = layer;
    if (rectLayer) {
        entity.render.layers = [rectLayer.id];
    }
    const app = pc.Application.getApplication();
    app.root.addChild(entity);
    return entity;
}
/**
 * 创建shader
 * @returns {pc.Shader} shader
 */
function createRectShader() {
    // shander定义
    const shaderDefinition = {
        attributes: {
            aPosition: pc.gfx.SEMANTIC_POSITION
        },
        vshader: vs,
        fshader: fs
    };
    const app = pc.Application.getApplication();
    rectShader = new pc.Shader(app.graphicsDevice, shaderDefinition);
    return rectShader;
}
/**
 * 更新框选矩形边框mesh
 * @param {pc.Vec4} rect 矩形范围
 * @returns {pc.Mesh} 更新后的mesh
 */
function updateRectMesh(rect = new pc.Vec4(0, 0, 1, 1)) {
    const positions = [
        rect.x * 2 - 1, 1 - 2 * rect.y, 0,
        (rect.x + rect.z) * 2 - 1, 1 - 2 * rect.y, 0,
        (rect.x + rect.z) * 2 - 1, 1 - 2 * (rect.y + rect.w), 0,
        rect.x * 2 - 1, 1 - 2 * (rect.y + rect.w), 0
    ];
    if (!rectMesh) {
        const app = pc.Application.getApplication();
        rectMesh = new pc.Mesh(app.graphicsDevice);
        rectMesh.clear(true, false);
    }
    rectMesh.setPositions(positions);
    rectMesh.update(pc.PRIMITIVE_LINELOOP);
    return rectMesh;
}
