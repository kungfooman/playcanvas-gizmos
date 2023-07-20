/**
 * 创建者: FBplus
 * 创建时间: 2022-04-22 09:33:08
 * 修改者: FBplus
 * 修改时间: 2022-07-21 16:48:40
 * 详情: 扩展Quat类
 */

import * as pc from "playcanvas";
const _lookMat = new pc.Mat4();
export class Quat_EX extends pc.Quat {
    /**
     * 根据朝向关系设置rotation
     * @param {pc.Vec3} position 起点
     * @param {pc.Vec3} target 目标点
     * @param {pc.Vec3} [up] 上方向
     * @returns {pc.Quat} 朝向rotation
     */
    setLookRotation(position, target, up) {
        _lookMat.setLookAt(position, target, up || pc.Vec3.UP);
        return this.setFromMat4(_lookMat);
    }
}
