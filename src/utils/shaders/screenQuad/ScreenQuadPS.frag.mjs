/**
 * 创建者: FBplus
 * 创建时间: 2022-04-22 13:33:49
 * 修改者: FBplus
 * 修改时间: 2022-07-08 15:07:58
 * 详情: 在屏幕空间上画矩形的shander
 */

import { frag } from "../../../utils/helpers/shaderHelper.mjs";

const ScreenQuadPS = frag`

precision mediump float;

uniform vec4 uColor; // 控制矩形显示的颜色

void main(void)
{
    gl_FragColor = uColor;
}

`;

export default ScreenQuadPS;
