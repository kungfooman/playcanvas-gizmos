/**
 * 创建者: FBplus
 * 创建时间: 2022-06-07 16:06:56
 * 修改者: FBplus
 * 修改时间: 2022-07-08 16:08:53
 * 详情: 描边特效
 */
import * as pc from "playcanvas";
/**
 * 描边特效参数
 * @typedef {Object} OutlineEffectOption
 * @property {pc.Layer} outlineLayer
 * @property {pc.Color} color
 * @property {Number} thickness 
 */
// 描边特效
export class PostEffectOutline extends pc.PostEffect {
    /** @type {pc.Texture} */
    texture;
    /** @type {Float32Array} */
    colorData;
    /** @type {pc.Layer} */
    outlineLayer;
    /**
     * 创建描边特效
     * @param {pc.GraphicsDevice} graphicsDevice 当前app的graphicsDevice
     * @param {object} option 描边设置
     * @param {pc.Layer} option.outlineLayer 描边Layer，用于从中读取描边相机的内容
     * @param {pc.Color} option.color 描边颜色
     * @param {number} option.thickness 描边粗细
     */
    constructor(graphicsDevice, option) {
        super(graphicsDevice);
        const vshader = [
            "attribute vec2 aPosition;",
            "",
            "varying vec2 vUv0;",
            "",
            "void main(void)",
            "{",
            "    gl_Position = vec4(aPosition, 0.0, 1.0);",
            "    vUv0 = (aPosition.xy + 1.0) * 0.5;",
            "}"
        ].join("\n");
        const fshader = [
            "precision " + graphicsDevice.precision + " float;",
            "",
            "#define THICKNESS " + (option.thickness ? option.thickness.toFixed(0) : 1),
            "uniform float uWidth;",
            "uniform float uHeight;",
            "uniform vec4 uOutlineCol;",
            "uniform sampler2D uColorBuffer;",
            "uniform sampler2D uOutlineTex;",
            "",
            "varying vec2 vUv0;",
            "",
            "void main(void)",
            "{",
            "    vec4 texel1 = texture2D(uColorBuffer, vUv0);",
            "    float sample0 = texture2D(uOutlineTex, vUv0).a;",
            "    float outline = 0.0;",
            "    if (sample0==0.0)",
            "    {",
            "        for (int x=-THICKNESS;x<=THICKNESS;x++)",
            "        {",
            "            for (int y=-THICKNESS;y<=THICKNESS;y++)",
            "            {    ",
            "                float sample=texture2D(uOutlineTex, vUv0+vec2(float(x)/uWidth, float(y)/uHeight)).a;",
            "                if (sample>0.0)",
            "                {",
            "                    outline=1.0;",
            "                }",
            "            }",
            "        } ",
            "    }",
            "    gl_FragColor = mix(texel1, uOutlineCol, outline * uOutlineCol.a);",
            "}"
        ].join("\n");
        this.shader = new pc.Shader(graphicsDevice, {
            attributes: {
                aPosition: pc.SEMANTIC_POSITION
            },
            vshader,
            fshader,
        });
        this.colorData = new Float32Array([option.color.r, option.color.g, option.color.b, option.color.a]);
        this.texture = option.outlineLayer.renderTarget.colorBuffer;
        this.outlineLayer = option.outlineLayer;
    }
    /**
     * 渲染函数，由引擎自动每帧调用
     * @param {pc.RenderTarget} inputTarget 引擎输入renderTaget，为当前的渲染画面
     * @param {pc.RenderTarget} outputTarget 引擎输出的renderTarget，即经过后期处理之后的画面
     * @param {pc.Vec4} rect 引擎传入的矩形，用来表示整个屏幕的范围
     */
    render(inputTarget, outputTarget, rect) {
        const { device } = this;
        const { scope  } = device;
        scope.resolve("uWidth").setValue(inputTarget.width); // 设置uWidth为整个屏幕的宽
        scope.resolve("uHeight").setValue(inputTarget.height); // 设置uHeight为整个屏幕的高
        scope.resolve("uOutlineCol").setValue(this.colorData); // 设置uOutlineCol为描边颜色
        scope.resolve("uColorBuffer").setValue(inputTarget.colorBuffer); // 设置uColorBuffer为相机的colorBuffer
        scope.resolve("uOutlineTex").setValue(this.texture); // 设置uOutlineTex，此处应将只渲染描边layer的相机的内容传入
        pc.drawFullscreenQuad(device, outputTarget, /*this.vertexBuffer*/undefined, this.shader, rect); // 用渲染结果覆盖整个屏幕，实现后期效果
    }
    /**
     * 刷新特效，一般用于窗口尺寸改变时
     */
    refresh() {
        console.log("REFRESH");
        this.texture = this.outlineLayer.renderTarget.colorBuffer;
    }
}
