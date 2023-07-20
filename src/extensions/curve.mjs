/**
 * 创建者: FBplus
 * 创建时间: 2022-06-07 10:31:59
 * 修改者: FBplus
 * 修改时间: 2022-07-21 16:47:52
 * 详情: 扩展Curve类
 */

import * as pc from "playcanvas";

const epsilon = 1e-10;

export class Curve_EX extends pc.Curve {
    /**
     * 获得曲线在此处的切线斜率
     * @param {number} percent 在曲线上的百分比位置
     * @returns {number} 切线斜率
     */
    getTangent(percent) {
        percent = Math.min(1 - epsilon, percent);
        const y1 = this.value(percent);
        const y2 = this.value(percent + epsilon);
        return (y2 - y1) / epsilon;
    }

    /**
     * 获得曲线在此处的法线斜率
     * @param {number} percent 在曲线上的百分比位置
     * @returns {number} 法线斜率
     */
    getNormal(percent) {
        const k = this.getTangent(percent);
        return k === 0 ? 0 : -1 / k;
    }
}
