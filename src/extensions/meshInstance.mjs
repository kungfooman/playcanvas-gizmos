/**
 * 创建者: FBplus
 * 创建时间: 2022-06-07 14:40:45
 * 修改者: FBplus
 * 修改时间: 2022-07-21 16:48:33
 * 详情: 扩展MeshInstance类
 */

import * as pc from "playcanvas";

/**
 * 相交信息
 */
/**
 * @typedef {object} intersect
 * @property {number} index - 相交三角形索引
 * @property {number} distance - 相交三角形和相机的距离
 * @property {pc.Vec3} point - 交点世界坐标
 * @property {pc.Vec3} localPoint - 交点本地坐标
 * @property {pc.Vec3} normal - 相交三角形法线
 * @property {[pc.Vec3, pc.Vec3, pc.Vec3]} vertices - 相交三角形三个点的坐标
 * @property {pc.MeshInstance} meshInstance - 相交三角形所处的meshInstance
 */

const localRay = new pc.Ray();
const distance = new pc.Vec3();
const aabb = new pc.BoundingBox();

const points = [new pc.Vec3(), new pc.Vec3(), new pc.Vec3()];

const edge1 = new pc.Vec3();
const edge2 = new pc.Vec3();
const normal = new pc.Vec3();

const localTransform = new pc.Mat4();
const worldTransform = new pc.Mat4();

const localCoord = new pc.Vec3();
const worldCoord = new pc.Vec3();

/**
 * 相交检测
 * @param {pc.MeshInstance} meshInstance 三角形所在meshInstance
 * @param {number} i 三角形索引
 * @param {pc.Ray} worldRay 世界射线
 * @param {pc.Vec3} a 三角形a点坐标
 * @param {pc.Vec3} b 三角形b点坐标
 * @param {pc.Vec3} c 三角形c点坐标
 * @param {pc.Vec3} [point] 交点坐标（不传则创建新的向量）
 * @returns 相交信息
 */
function checkIntersection(meshInstance, i, worldRay, a, b, c, point) {
    const backfaceCulling = (
        meshInstance.material.cull === pc.CULLFACE_BACK ||
        meshInstance.material.cull === pc.CULLFACE_FRONTANDBACK
    );

    let intersect;

    if (meshInstance.skinInstance) {
        intersect = worldRay.intersectTriangle(a, b, c, backfaceCulling, point);
    } else {
        intersect = localRay.intersectTriangle(a, b, c, backfaceCulling, point);
    }

    if (intersect === null) return null;

    edge1.sub2(b, a);
    edge2.sub2(c, a);
    normal.cross(edge1, edge2);
    localCoord.copy(intersect);
    worldCoord.copy(intersect);

    if (meshInstance.skinInstance) {
        localTransform.transformPoint(localCoord, localCoord);
    } else {
        worldTransform.transformPoint(worldCoord, worldCoord);
        worldTransform.transformPoint(a, a);
        worldTransform.transformPoint(b, b);
        worldTransform.transformPoint(c, c);
        worldTransform.transformVector(normal, normal);
        normal.normalize();
    }

    distance.sub2(worldCoord, worldRay.origin);

    return {
        index: i,
        distance: distance.length(),
        point: worldCoord.clone(),
        localPoint: localCoord.clone(),
        normal: normal.clone(),
        vertices: [a.clone(), b.clone(), c.clone()],
        meshInstance: meshInstance
    };
}

//@extendClass(pc.MeshInstance)
export class MeshInstance_EX extends pc.MeshInstance {
    /**
     * 检测射线与此meshInstance的交点
     * @param {pc.Ray} worldRay 要求交的射线
     * @param {Array<intersect>} [intersects] 交点集合（不传则创建新的数组）
     * @returns {Array<intersect>} 交点集合
     */
    intersectsRay(worldRay, intersects) {
        aabb.copy(this.aabb);
        if (aabb.intersectsRay(worldRay) === false)
            return null;

        const vertexBuffer = this.mesh.vertexBuffer;
        const indexBuffer = this.mesh.indexBuffer[0];
        const base = this.mesh.primitive[0].base;
        const count = this.mesh.primitive[0].count;
        const dataF = new Float32Array(vertexBuffer.lock());
        const data8 = new Uint8Array(vertexBuffer.lock());
        const indices  = indexBuffer.bytesPerIndex === 2 ? new Uint16Array(indexBuffer.lock()) : new Uint32Array(indexBuffer.lock());
        const elems    = vertexBuffer.format.elements;
        const numVerts = vertexBuffer.numVertices;
        const vertSize = vertexBuffer.format.size;
        let i, j, k, index;

        let offsetP = 0;
        let offsetI = 0;
        let offsetW = 0;
        let intersect = null;

        for (i = 0; i < elems.length; i++) {
            if (elems[i].name === pc.SEMANTIC_POSITION) {
                offsetP = elems[i].offset;
            } else if (elems[i].name === pc.SEMANTIC_BLENDINDICES) {
                offsetI = elems[i].offset;
            } else if (elems[i].name === pc.SEMANTIC_BLENDWEIGHT) {
                offsetW = elems[i].offset;
            }
        }

        const offsetPF = offsetP / 4;
        const offsetWF = offsetW / 4;
        const vertSizeF = vertSize / 4;

        intersects = intersects ?? [];

        localRay.origin.copy(worldRay.origin);
        localRay.direction.copy(worldRay.direction);

        worldTransform.copy(this.node.getWorldTransform());
        localTransform.copy(worldTransform).invert();

        localTransform.transformPoint(localRay.origin, localRay.origin);
        localTransform.transformVector(localRay.direction, localRay.direction);


        if (this.skinInstance) {
            let boneIndices = [0, 0, 0, 0];
            let boneWeights = [0, 0, 0, 0];
            let boneMatrices = this.skinInstance.matrices;
            let boneWeightVertices = [new pc.Vec3(), new pc.Vec3(), new pc.Vec3(), new pc.Vec3()];

            for (i = base; i < base + count; i += 3) {
                for (j = 0; j < 3; j++) {

                    index = indices[i + j];

                    for (k = 0; k < 4; k++) {
                        boneIndices[k] = data8[index * vertSize + offsetI + k];
                        boneWeights[k] = dataF[index * vertSizeF + offsetPF + offsetWF + k];
                    }

                    index = index * vertSizeF + offsetPF;
                    points[j].set(dataF[index], dataF[index + 1], dataF[index + 2]);

                    for (k = 0; k < 4; k++) {
                        boneMatrices[boneIndices[k]].transformPoint(points[j], boneWeightVertices[k]);
                        boneWeightVertices[k].mulScalar(boneWeights[k]);
                    }

                    points[j].copy(boneWeightVertices[0]).add(boneWeightVertices[1]).add(boneWeightVertices[2]).add(boneWeightVertices[3]);
                }

                intersect = checkIntersection(this, i, worldRay, points[0], points[1], points[2]);

                if (intersect) {
                    intersects.push(intersect);
                }
            }

        } else {
            for (i = base; i < base + count; i += 3) {

                for (j = 0; j < 3; j++) {
                    index = indices[i + j] * vertSizeF + offsetPF;
                    points[j].set(dataF[index], dataF[index + 1], dataF[index + 2]);
                }

                intersect = checkIntersection(this, i, worldRay, points[0], points[1], points[2]);

                if (intersect) {
                    intersects.push(intersect);
                }
            }
        }

        vertexBuffer.unlock();
        indexBuffer.unlock();

        return intersects.length > 0 ? intersects : null;
    }
}
