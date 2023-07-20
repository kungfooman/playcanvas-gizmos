/**
 * 创建者: FBplus
 * 创建时间: 2022-06-07 10:19:52
 * 修改者: FBplus
 * 修改时间: 2022-07-27 16:44:13
 * 详情: 扩展CameraComponent类
 */

import * as pc from "playcanvas";
import { MeshInstance_EX } from "../extensions/meshInstance.mjs";
// import type { intersect } from "./meshInstance.mjs";

export class CameraComponent_EX extends pc.CameraComponent {
    /**
    * 跟随另一个相机（与另一相机的几何信息保持相同）
    * @param {pc.CameraComponent} camera 要跟随的相机
    * @returns {void}
    */
    follow(camera) {
        const viewMatrix = this.viewMatrix;
        const projectionMatrix = this.projectionMatrix;
        /**
         * 
         * @param {pc.Mat4} transformMatrix 
         * @param {number} view 
         * @returns 
         */
        this.calculateTransform = function (transformMatrix, view)
        {
            this.horizontalFov = camera.horizontalFov;
            this.fov = camera.fov;
            return viewMatrix;
        }
        /**
         * @param {pc.Mat4} transformMatrix 
         * @param {number} view 
         * @returns 
         */
        this.calculateProjection = function (transformMatrix, view)
        {
            this.horizontalFov = camera.horizontalFov;
            return projectionMatrix;
        }
    }

    /**
     * 从此相机发射射线，检测一系列mesh的交点
     * @param {pc.Ray} ray 要检测的射线
     * @param {MeshInstance_EX[]} meshInstances 要检测的meshInstance集合
     * @returns {Array<intersect>|null} 交点集合
     */
    raycastMeshInstances(ray, meshInstances) {
        /** @type {intersect[]} */
        let intersects = [];

        for (let i = 0; i < meshInstances.length; i++) {
            meshInstances[i].intersectsRay(ray, intersects);
        }

        if (intersects.length === 0) {
            return null;
        }

        return intersects.sort(function (a, b) { return a.distance - b.distance; });
    }
}
