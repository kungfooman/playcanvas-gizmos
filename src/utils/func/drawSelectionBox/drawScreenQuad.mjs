/**
 * 创建者: FBplus
 * 创建时间: 2022-05-16 09:46:02
 * 修改者: FBplus
 * 修改时间: 2022-07-10 15:09:10
 * 详情: 在屏幕空间绘制方片
 */
import * as pc from "playcanvas";
import fs from "../../../utils/shaders/screenQuad/ScreenQuadPS.frag.mjs";
import vs from "../../../utils/shaders/screenQuad/ScreenQuadVS.vert.mjs";
const defaultRect = new pc.Vec4(0, 0, 1, 1);
const defaultColor = pc.Color.WHITE.clone();
/** @type {pc.Shader} */ let quadShader;
/** @type {pc.Mesh} */ let quadMesh;
/** @type {pc.Color} */ let quadColor;
/** @type {pc.Material} */ let quadMaterial;
/** @type {pc.Entity} */ let quadEntity;
/** @type {pc.Layer} */ let quadLayer;
/** @type {pc.Vec4} */ let screenRect;
/**
 * 绘制框选矩形内部
 * @param {pc.Vec4} rect 矩形范围
 * @param {pc.Color} color 颜色
 * @param {pc.Layer} [layer] layer
 */
export function drawScreenQuad(rect = defaultRect, color = defaultColor, layer) {
    quadEntity ?? createQuadEntity(rect, color);
    quadEntity.enabled = true;
    if (layer && (quadLayer != layer)) {
        quadEntity.render.layers = [layer.id];
        quadLayer = layer;
    }
    if (!quadColor.equals(color)) {
        quadMaterial.setParameter("uColor", color.data);
        quadMaterial.update();
        quadColor.copy(color);
    }
    if (!screenRect.equals(rect)) {
        updateQuadMesh(rect);
        screenRect.copy(rect);
    }
}
/**
 * 清除框选矩形内部
 */
export function clearScreenQuad() {
    if (quadEntity) {
        quadEntity.enabled = false;
    }
}
/**
 * 创建框选矩形内部物体实例
 * @param {pc.Vec4} rect 矩形范围
 * @param {pc.Color} color 颜色
 * @param {pc.Layer} [layer] layer
 * @returns {pc.Entity} 框选矩形内部物体实例
 */
function createQuadEntity(rect, color, layer) {
    screenRect = new pc.Vec4().copy(rect);
    quadMesh = updateQuadMesh(screenRect);
    quadColor = new pc.Color().copy(color);
    quadShader = createQuadShader();
    quadMaterial = new pc.Material();
    quadMaterial.shader = quadShader;
    quadMaterial.blendType = pc.BLEND_NORMAL;
    quadMaterial.setParameter("uColor", quadColor.data);
    quadMaterial.update();
    const meshInstance = new pc.MeshInstance(quadMesh, quadMaterial);
    meshInstance.cull = false;
    const entity = new pc.Entity("ScreenQuad");
    entity.addComponent("render", {
        meshInstances: [meshInstance]
    });
    quadEntity = entity;
    quadLayer = layer;
    if (quadLayer) {
        entity.render.layers = [quadLayer.id];
    }
    const app = pc.Application.getApplication();
    app.root.addChild(entity);
    return entity;
}
/**
 * 创建shader
 * @returns {pc.Shader} shader
 */
function createQuadShader() {
    // shander定义
    const shaderDefinition = {
        attributes: {
            aPosition: pc.gfx.SEMANTIC_POSITION
        },
        vshader: vs,
        fshader: fs
    };
    const app = pc.Application.getApplication();
    quadShader = new pc.Shader(app.graphicsDevice, shaderDefinition);
    return quadShader;
}
/**
 * 更新框选矩形内部mesh
 * @param {pc.Vec4} rect 矩形范围
 * @returns {pc.Mesh} 更新后的mesh
 */
function updateQuadMesh(rect = new pc.Vec4(0, 0, 1, 1)) {
    const positions = [
        rect.x * 2 - 1, 1 - 2 * rect.y, 0,
        (rect.x + rect.z) * 2 - 1, 1 - 2 * rect.y, 0,
        (rect.x + rect.z) * 2 - 1, 1 - 2 * (rect.y + rect.w), 0,
        rect.x * 2 - 1, 1 - 2 * (rect.y + rect.w), 0
    ];
    /** @type {number[]} */
    const indices = new Array(1, 0, 3, 3, 2, 1);
    const normals = pc.calculateNormals(positions, indices);
    if (!quadMesh) {
        const app = pc.Application.getApplication();
        quadMesh = new pc.Mesh(app.graphicsDevice);
        quadMesh.clear(true, false);
    }
    quadMesh.setPositions(positions);
    quadMesh.setIndices(indices);
    quadMesh.setNormals(normals);
    quadMesh.update(pc.PRIMITIVE_TRIANGLES);
    return quadMesh;
}
