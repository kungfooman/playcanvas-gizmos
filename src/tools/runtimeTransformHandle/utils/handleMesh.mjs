/**
 * 创建者: FBplus
 * 创建时间: 2022-04-22 10:00:25
 * 修改者: FBplus
 * 修改时间: 2022-07-13 15:16:48
 * 详情: runtime transform handle的mesh生成
 */
import * as pc from "playcanvas";
import {
    axisXMat, axisYMat, axisZMat, halfTransMat, planeEdgeXMat, planeEdgeYMat, planeEdgeZMat,
    planXMat, planYMat, planZMat, transparentMat
} from "./handleShader.mjs";
import { MeshRaycaster } from "./meshRaycaster.mjs";
// 选中类别
export const SelectType = {
    AxisX: "AxisX",
    AxisY: "AxisY",
    AxisZ: "AxisZ",
    AllAxis: "AllAxis",
    PlaneX: "PlaneX",
    PlaneY: "PlaneY",
    PlaneZ: "PlaneZ",
}
// 添加layer
/** @type {pc.Layer} */
let _RTHLayer;
export const RTHLayer = () => { return _RTHLayer || (_RTHLayer = new pc.Layer({ name: "RuntimeTransformHandle" })) };
// handle对应的选中类别
/** @type {{ [index: string]: SelectType }} */
export let HandleMap = {};
// 坐标轴枚举
export const Axis = {
    X: "X",
    Y: "Y",
    Z: "Z",
    All: "All",
};
// 坐标轴材质列表
const axisMaterialMap = {
    [Axis.X  ]: axisXMat,
    [Axis.Y  ]: axisYMat,
    [Axis.Z  ]: axisZMat,
    [Axis.All]: halfTransMat,
};
// 坐标平面材质列表
const planeMaterialMap = {
    [Axis.X  ]: planXMat,
    [Axis.Y  ]: planYMat,
    [Axis.Z  ]: planZMat,
    [Axis.All]: halfTransMat,
};
// 坐标平面边框材质列表
const planeEdgeMaterialMap = {
    [Axis.X]: planeEdgeXMat,
    [Axis.Y]: planeEdgeYMat,
    [Axis.Z]: planeEdgeZMat,
    [Axis.All]: halfTransMat
}
// 坐标轴旋转矩阵
const axisRotationMat = {
    [Axis.X]: new pc.Mat4().setFromEulerAngles(0, 0, -90),
    [Axis.Y]: new pc.Mat4(),
    [Axis.Z]: new pc.Mat4().setFromEulerAngles(90, 0, 0),
    [Axis.All]: new pc.Mat4()
}
// 坐标平面变换集合
const planeTransforms = {
    [Axis.X]: [new pc.Mat4().setFromEulerAngles(0, 0, -90)],
    [Axis.Y]: [new pc.Mat4()],
    [Axis.Z]: [new pc.Mat4().setFromEulerAngles(90, 0, 0)],
    [Axis.All]: [new pc.Mat4()]
}
// 坐标平面边框变换集合
const planeEdgeTransforms = {
    [Axis.X]: [[new pc.Mat4().setFromEulerAngles(90, 0, 0)], [new pc.Mat4()]],
    [Axis.Y]: [[new pc.Mat4().setFromEulerAngles(0, 0, 90)], [new pc.Mat4().setFromEulerAngles(90, 0, 0)]],
    [Axis.Z]: [[new pc.Mat4()], [new pc.Mat4().setFromEulerAngles(0, 0, 90)]],
    [Axis.All]: [[new pc.Mat4()]]
}
// 缓存
const tempPoint = new pc.Vec3();
/**
 * 生成位移handle组，包含x，y，z轴
 * @returns {pc.Entity} 位移handle物体
 */
export function generateTranslationHandle() {
    const xHandle = generateTranslationAxis(Axis.X);
    const yHandle = generateTranslationAxis(Axis.Y);
    const zHandle = generateTranslationAxis(Axis.Z);
    const translationHandle = new pc.Entity("translationHandle");
    translationHandle.addChild(xHandle);
    translationHandle.addChild(yHandle);
    translationHandle.addChild(zHandle);
    return translationHandle;
}
/**
 * 生成旋转handle组，包含x，y，z轴
 * @returns {pc.Entity} 旋转handle物体
 */
export function generateRotatioHandle() {
    // TODO: 美化旋转轴，添加标明旋转状态的mesh和shader
    const xHandle = generateRotationAxis(Axis.X);
    const yHandle = generateRotationAxis(Axis.Y);
    const zHandle = generateRotationAxis(Axis.Z);
    const rotationHandle = new pc.Entity("rotationHandle");
    rotationHandle.addChild(xHandle);
    rotationHandle.addChild(yHandle);
    rotationHandle.addChild(zHandle);
    return rotationHandle;
}
/**
 * 生成缩放handle组，包含x，y，z轴
 * @returns {pc.Entity} 缩放handle物体
 */
export function generateScaleHandle() {
    // TODO: 将放缩handle的头和尾的mesh分开，实现放缩时尾部伸缩的效果
    const xHandle = generateScaleAxis(Axis.X);
    const yHandle = generateScaleAxis(Axis.Y);
    const zHandle = generateScaleAxis(Axis.Z);
    const centerHandle = generateScaleCenter();
    const scaleHandle = new pc.Entity("scaleHandle");
    scaleHandle.addChild(xHandle);
    scaleHandle.addChild(yHandle);
    scaleHandle.addChild(zHandle);
    scaleHandle.addChild(centerHandle);
    return scaleHandle;
}
/**
 * 生成位移handle坐标轴
 * @param {keyof Axis} axis
 * @returns {pc.Entity} 位移handle坐标轴物体
 */
function generateTranslationAxis(axis) {
    const app = pc.Application.getApplication();
    const device = app.graphicsDevice;
    const headMesh = pc.createCone(device, { baseRadius: 0.6, peakRadius: 0, height: 2 });
    const tailMesh = pc.createCylinder(device, { radius: 0.05, height: 8 });
    const transformMat = axisRotationMat[axis];
    transformMeshPoint(headMesh, [new pc.Vec3(0, 9, 0), transformMat]);
    transformMeshPoint(tailMesh, [new pc.Vec3(0, 4, 0), transformMat]);
    const mesh = combineMesh([headMesh, tailMesh]);
    const mat = axisMaterialMap[axis];
    const mi = new pc.MeshInstance(mesh, mat);
    const axisEntity = new pc.Entity('axisEntity');
    axisEntity.addComponent("render", {
        meshInstances: [mi]
    });
    mi.cull = false;
    axisEntity.render.layers = [RTHLayer().id];
    const collisionMesh = pc.createBox(device, { halfExtents: new pc.Vec3(0.6, 3.5, 0.6) });
    transformMeshPoint(collisionMesh, [new pc.Vec3(0, 6.5, 0), transformMat]);
    const collisionMI = new pc.MeshInstance(collisionMesh, transparentMat);
    const collisionEntity = new pc.Entity(`translationCollision_${axis}`);
    collisionEntity.addComponent("render", {
        meshInstances: [collisionMI]
    });
    collisionMI.cull = false;
    collisionEntity.render.layers = [RTHLayer().id];
    HandleMap[collisionEntity._guid] = getSelectAxis(axis);
    MeshRaycaster.addMeshInstances(collisionMI);
    const planeMesh = pc.createPlane(device, { halfExtents: new pc.Vec2(1.5, 1.5) });
    const edge1Mesh = pc.createCylinder(device, { radius: 0.05, height: 3 });
    const edge2Mesh = pc.createCylinder(device, { radius: 0.05, height: 3 });
    transformMeshPoint(planeMesh, planeTransforms[axis]);
    transformMeshPoint(edge1Mesh, planeEdgeTransforms[axis][0]);
    transformMeshPoint(edge2Mesh, planeEdgeTransforms[axis][1]);
    const planeMI = new pc.MeshInstance(planeMesh, planeMaterialMap[axis]);
    const edge1MI = new pc.MeshInstance(edge1Mesh, planeEdgeMaterialMap[axis]);
    const edge2MI = new pc.MeshInstance(edge2Mesh, planeEdgeMaterialMap[axis]);
    const planeEntity = new pc.Entity(`plane ${axis.toString()}`);
    planeEntity.addComponent("render", {
        meshInstances: [planeMI]
    });
    const edge1Entity = new pc.Entity(`edge1 ${axis.toString()}`);
    edge1Entity.addComponent("render", {
        meshInstances: [edge1MI]
    });
    const edge2Entity = new pc.Entity(`edge2 ${axis.toString()}`);
    edge2Entity.addComponent("render", {
        meshInstances: [edge2MI]
    });
    planeMI.cull = false;
    edge1MI.cull = false;
    edge2MI.cull = false;
    planeEntity.render.layers = [RTHLayer().id];
    edge1Entity.render.layers = [RTHLayer().id];
    edge2Entity.render.layers = [RTHLayer().id];
    HandleMap[planeEntity._guid] = getSelectPlane(axis);
    MeshRaycaster.addMeshInstances(planeMI);
    const combineEntity = new pc.Entity('combineEntity');
    combineEntity.addChild(axisEntity);
    combineEntity.addChild(collisionEntity);
    combineEntity.addChild(planeEntity);
    combineEntity.addChild(edge1Entity);
    combineEntity.addChild(edge2Entity);
    return combineEntity;
}
/**
 * 生成旋转handle坐标轴
 * @param {Axis} axis
 * @returns {pc.Entity} 旋转handle坐标轴物体
 */
function generateRotationAxis(axis) {
    const app = pc.Application.getApplication();
    const device = app.graphicsDevice;
    const handleMesh = pc.createTorus(device, { tubeRadius: 0.05, ringRadius: 10, segments: 72 });
    const transformMat = axisRotationMat[axis];
    transformMeshPoint(handleMesh, [transformMat]);
    // 取mesh
    /** @type {number[]} */
    const meshPositions = [];
    /** @type {number[]} */
    const meshIndices = [];
    handleMesh.getPositions(meshPositions);
    handleMesh.getIndices(meshIndices);
    const handleMeshInstance = new pc.MeshInstance(handleMesh, axisMaterialMap[axis]);
    const handleEntity = new pc.Entity('handleEntity');
    handleEntity.addComponent("render", {
        meshInstances: [handleMeshInstance]
    });
    handleMeshInstance.cull = false;
    handleEntity.render.layers = [RTHLayer().id];
    const collisionMesh = pc.createTorus(device, { tubeRadius: 0.6, ringRadius: 10 });
    transformMeshPoint(collisionMesh, [transformMat]);
    const collisionMI = new pc.MeshInstance(collisionMesh, transparentMat);
    const collisionEntity = new pc.Entity(`rotationCollision_${axis}`);
    collisionEntity.addComponent("render", {
        meshInstances: [collisionMI]
    });
    collisionMI.cull = false;
    collisionEntity.render.layers = [RTHLayer().id];
    HandleMap[collisionEntity._guid] = getSelectAxis(axis);
    MeshRaycaster.addMeshInstances(collisionMI);
    const combineEntity = new pc.Entity('generateRotationAxis-combineEntity');
    combineEntity.addChild(handleEntity);
    combineEntity.addChild(collisionEntity);
    return combineEntity;
}
/**
 * 生成缩放handle坐标轴
 * @param {Axis} axis
 * @returns {pc.Entity} 缩放handle坐标轴物体
 */
function generateScaleAxis(axis) {
    const app = pc.Application.getApplication();
    const device = app.graphicsDevice;
    const headMesh = pc.createBox(device, {
        halfExtents: new pc.Vec3(0.6, 0.6, 0.6),
    });
    const tailMesh = pc.createCylinder(device, {
        radius: 0.05,
        height: 8,
    });
    const transformMat = axisRotationMat[axis];
    transformMeshPoint(headMesh, [new pc.Vec3(0, 9.4, 0), transformMat]);
    transformMeshPoint(tailMesh, [new pc.Vec3(0, 4.8, 0), transformMat]);
    const mesh = combineMesh([headMesh, tailMesh]);
    const mat = axisMaterialMap[axis];
    const mi = new pc.MeshInstance(mesh, mat);
    const axisEntity = new pc.Entity('generateScaleAxis-axisEntity');
    axisEntity.addComponent("render", {
        meshInstances: [mi]
    });
    mi.cull = false;
    axisEntity.render.layers = [RTHLayer().id];
    const collisionMesh = pc.createBox(device, {
        halfExtents: new pc.Vec3(0.6, 4.6, 0.6),
    });
    transformMeshPoint(collisionMesh, [new pc.Vec3(0, 5.4, 0), transformMat]);
    const collisionMI = new pc.MeshInstance(collisionMesh, transparentMat);
    const collisionEntity = new pc.Entity(`scaleCollision_${axis}`);
    collisionEntity.addComponent("render", {
        meshInstances: [collisionMI],
    });
    collisionMI.cull = false;
    collisionEntity.render.layers = [RTHLayer().id];
    HandleMap[collisionEntity._guid] = getSelectAxis(axis);
    MeshRaycaster.addMeshInstances(collisionMI);
    const combineEntity = new pc.Entity('generateScaleAxis-combineEntity');
    combineEntity.addChild(axisEntity);
    combineEntity.addChild(collisionEntity);
    return combineEntity;
}
/**
 * @returns {pc.Entity}
 */
function generateScaleCenter() {
    const app = pc.Application.getApplication();
    const device = app.graphicsDevice;
    const mesh = pc.createBox(device, {
        halfExtents: new pc.Vec3(0.8, 0.8, 0.8),
    });
    const mat = halfTransMat;
    const mi = new pc.MeshInstance(mesh, mat);
    const entity = new pc.Entity('generateScaleCenter');
    entity.addComponent("render", {
        meshInstances: [mi],
    });
    mi.cull = false;
    entity.render.layers = [RTHLayer().id];
    HandleMap[entity._guid] = getSelectAxis(Axis.All);
    MeshRaycaster.addMeshInstances(mi);
    return entity;
}
/**
 * 对mesh的每一个顶点进行集合变换
 * @param {pc.Mesh} mesh mesh
 * @param {Array<pc.Mat4 | pc.Vec3>} transforms 变换集合
 */
function transformMeshPoint(mesh, transforms) {
    /** @type {number[]} */
    let positions = [];
    /** @type {number[]} */
    let indices = [];
    /** @type {number[]} */
    let normals = [];
    mesh.getPositions(positions);
    mesh.getIndices(indices);
    for (let i = 0; i < positions.length; i += 3) {
        tempPoint.set(positions[i], positions[i + 1], positions[i + 2]);
        transforms.forEach(transform => {
            if (transform instanceof pc.Vec3) {
                tempPoint.add(transform);
            } else if (transform instanceof pc.Mat4) {
                transform.transformPoint(tempPoint, tempPoint);
            }
        });
        positions[i    ] = tempPoint.x;
        positions[i + 1] = tempPoint.y;
        positions[i + 2] = tempPoint.z;
    }
    normals = pc.calculateNormals(positions, indices);
    mesh.clear(false, false);
    mesh.setPositions(positions);
    mesh.setIndices(indices);
    mesh.setNormals(normals);
    mesh.update(pc.PRIMITIVE_TRIANGLES);
}
/**
 * 将一组mesh拼接起来
 * @param {pc.Mesh[]} meshes mesh集合
 * @returns {pc.Mesh} 拼接完成的新mesh
 */
function combineMesh(meshes) {
    /** @type {number[]} */
    let positions = [];
    /** @type {number[]} */
    let newPositions = [];
    /** @type {number[]} */
    let indices = [];
    /** @type {number[]} */
    let newIndices = [];
    /** @type {number[]} */
    let normals = [];
    /** @type {number[]} */
    let newNormals = [];
    for (let i = 0; i < meshes.length; i++) {
        const mesh = meshes[i];
        mesh.getPositions(positions);
        mesh.getIndices(indices);
        mesh.getNormals(normals);
        const startIndex = newPositions.length / 3;
        indices.forEach((indice, index) =>
        {
            indices[index] = indice + startIndex;
        });
        newPositions = newPositions.concat(positions);
        newIndices = newIndices.concat(indices);
        newNormals = newNormals.concat(normals);
    }
    const app = pc.Application.getApplication();
    const newMesh = new pc.Mesh(app.graphicsDevice);
    newMesh.clear(false, false);
    newMesh.setPositions(newPositions);
    newMesh.setIndices(newIndices);
    newMesh.setNormals(newNormals);
    newMesh.update(pc.PRIMITIVE_TRIANGLES);
    return newMesh;
}
/**
 * 根据坐标轴获取选中类型轴
 * @param {keyof Axis} axis 坐标轴
 * @returns {string | keyof SelectType} 对应的选中坐标轴
 */
function getSelectAxis(axis) {
    switch (axis) {
        case Axis.X:
            return SelectType.AxisX;
        case Axis.Y:
            return SelectType.AxisY;
        case Axis.Z:
            return SelectType.AxisZ;
        case Axis.All:
            return SelectType.AllAxis;
    }
    throw "invalid enum";
}
/**
 * 根据坐标轴获取选中类型平面
 * @param {keyof Axis} axis 坐标轴
 * @returns {string | keyof SelectType} 对应的选中平面
 */
function getSelectPlane(axis) {
    switch (axis) {
        case Axis.X:
            return SelectType.PlaneX;
        case Axis.Y:
            return SelectType.PlaneY;
        case Axis.Z:
            return SelectType.PlaneZ;
    }
    throw "invalid enum";
}
