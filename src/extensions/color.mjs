/**
 * 创建者: FBplus
 * 创建时间: 2022-04-22 09:33:08
 * 修改者: FBplus
 * 修改时间: 2022-07-21 16:47:44
 * 详情: 扩展Color类
 */

import * as pc from "playcanvas";

export class Color_EX extends pc.Color {
    /**
     * @private
     * @type {Float32Array}
     */
    _shaderData;
    /**
     * 用于传入shader的数据
     */
    get shaderData() {
        this._shaderData = this._shaderData || new Float32Array(4);
        this._shaderData[0] = this.r;
        this._shaderData[1] = this.g;
        this._shaderData[2] = this.b;
        this._shaderData[3] = this.a;

        return this._shaderData;
    }
}
