/**
 * 创建者: FBplus
 * 创建时间: 2022-05-18 15:35:26
 * 修改者: FBplus
 * 修改时间: 2022-07-13 14:36:51
 * 详情: 描边相机
 */
import * as pc from "playcanvas";
import { MaterialController } from "../../utils/func/materialController.mjs";
import { PostEffectOutline } from "../../utils/postEffects/posteffectOutline.mjs";
import { CameraComponent_EX } from '../../extensions/cameraComponent.mjs';
/**
 * LayerId
 * @typedef {number} LayerId
 */
/**
 * 外边框相机选项
 * @typedef outlineCameraOptions
 * @property {pc.CameraComponent} [mainCamera]
 * @property {string} [outlineLayerName]
 * @property {pc.Color} [outlineColor]
 * @property {number} [outlineThickness]
 */
/**
 * 存储每个render对应的layer组
 * @type {Map<pc.RenderComponent | pc.ModelComponent, LayerId[]>}
 */
const layerMap = new Map();
export class OutlineCamera {
    // 默认选项
    /** @type {outlineCameraOptions} */
    toolOptionsDefault = {
        mainCamera: this.app.systems.camera.cameras[0],
        outlineLayerName: "OutlineLayer",
        outlineColor: pc.Color.WHITE,
        outlineThickness: 2
    };
    get app() {
        return pc.Application.getApplication();
    }
    /** @type {pc.Layer} */ outlineLayer;
    /** @type {PostEffectOutline} */ outlineEffect;
    /** @type {pc.CameraComponent} */ outlineCamera;
    /**
     * @param {outlineCameraOptions} [options] 
     */
    constructor(options) {
        this.toolOptions = {
            ...this.toolOptionsDefault,
            ...options,
        };
        // 重置特效
        this.initEffect({
            color: this.toolOptions.outlineColor,
            thickness: this.toolOptions.outlineThickness,
        });
        this.onEnable();
    }
    /**
     * @param {number} dt 
     */
    update(dt) {
        this.outlineCamera.fov           = this.toolOptions.mainCamera.fov;
        this.outlineCamera.horizontalFov = this.toolOptions.mainCamera.horizontalFov;
    }
    /**
     * 设置外边框相机选项
     * @param {outlineCameraOptions} options 外边框相机选项
     */
    setOptions(options) {
        throw "todo remove"
    }
    /**
    * 更新外边框相机选项
    * @param {outlineCameraOptions} options 外边框相机选项
    */
    updateOptions(options) {
        // 重置特效
        this.initEffect({
            color    : options.outlineColor,
            thickness: options.outlineThickness,
        });
    }
    /**
    * 开启或关闭描边特效
    * @param {pc.Entity} entity 节点
    * @param {boolean} state 开关状态
    */
    toggleOutline(entity, isOn) {
        const outLineLayerId = this.app.scene.layers.getLayerByName(this.toolOptions.outlineLayerName).id;
        MaterialController.processNodeDeep(entity, null, model => {
            const renderComponent = model;
            if (renderComponent.layers) {
                !layerMap.get(renderComponent) && layerMap.set(renderComponent, [...renderComponent.layers]);
                const preLayers = layerMap.get(renderComponent);
                renderComponent.layers = isOn ? [...preLayers, outLineLayerId] : preLayers;
            }
            const modelComponent = model;
            if (modelComponent.layers) {
                !layerMap.get(modelComponent) && layerMap.set(modelComponent, [...modelComponent.layers]);
                const preLayers = layerMap.get(modelComponent);
                modelComponent.layers = isOn ? [...preLayers, outLineLayerId] : preLayers;
            }
        });
    }
    /**
     * @param {pc.Entity} entity 
     */
    enableOutline(entity) {
        this.toggleOutline(entity, true);
    }
    /**
     * @param {pc.Entity} entity 
     */
    disableOutline(entity) {
        this.toggleOutline(entity, false);
    }
    /**
    * 初始化后期特效
    * @param {object} [option] 描边设置
    * @param {pc.Color} [option.color] 描边颜色
    * @param {number} [option.thickness] 描边粗细
    */
    initEffect(option) {
        // 创建并添加描边layer
        if (!this.outlineLayer) {
            const outlineLayer = new pc.Layer({
                name: this.toolOptions.outlineLayerName,
            });
            this.app.scene.layers.insert(outlineLayer, 0); // 将outlineLayer最先渲染
            this.outlineLayer = outlineLayer;
        }
        // 创建并添加描边相机
        if (!this.outlineCamera) {
            const outlineCameraEntity = new pc.Entity('outlineCameraEntity');
            const outlineCamera = outlineCameraEntity.addComponent("camera", {
                clearColor: new pc.Color(0.0, 0.0, 0.0, 0.0), // 透明背景色
                layers: [this.outlineLayer.id], // 只渲染outlineLayer
            });
            this.toolOptions.mainCamera?.entity.addChild(outlineCameraEntity);
            this.outlineCamera = outlineCamera;
        }
        this.outlineCamera.renderTarget = this.createRenderTarget(); // 给layer添加renderTarget;
        // 创建描边特效并添加至相机
        if (this.outlineEffect) {
            // console.log("OutlineCamera#initEffect> remove effect", this.outlineEffect);
            this.toolOptions.mainCamera.postEffects.removeEffect(this.outlineEffect); // 先清空特效
        }
        // 若传入了设置，则重新生成特效；若不传入设置，不重新生成，仅重置特效
        if (option) {
            this.outlineEffect = new PostEffectOutline(this.app.graphicsDevice, {
                color: option.color,
                thickness: option.thickness,
            });
        }
        this.outlineEffect.texture = this.outlineCamera.renderTarget.colorBuffer;
        this.toolOptions.mainCamera.postEffects.addEffect(this.outlineEffect); // 添加特效至相机
    }
    /**
     * @type {pc.Color}
     * @param {pc.Color} newColor
     */
    set outlineColor(newColor) {
        this.initEffect({
            color: newColor,
        });
    }
    /**
    * 创建大小为整个屏幕的renderTarget（用于后期）
    * @returns {pc.RenderTarget} 可以覆盖整个屏幕的renderTarget 
    */
    createRenderTarget() {
        // 创建贴图
        const colorBuffer = new pc.Texture(this.app.graphicsDevice, {
            width: this.app.graphicsDevice.width,
            height: this.app.graphicsDevice.height,
            format: pc.PIXELFORMAT_R8_G8_B8_A8,
            mipmaps: false,
            minFilter: pc.FILTER_LINEAR,
            magFilter: pc.FILTER_LINEAR,
        });
        // 返回renderTarget
        return new pc.RenderTarget({
            colorBuffer,
            depth: false,
        });
    }
    /**
     * 重设特效，一般为窗口大小改变时调用
     */
    resetEffect() {
        // 此函数不传option参数表示重设特效
        this.initEffect();
    }
    /**
     * 窗口缩放时调用
     */
    onResize() {
        this.resetEffect();
    }
    onEnable() {
        this.app?.on("update", this.update, this);
        this.app?.graphicsDevice.on("resizecanvas", this.onResize, this);
    }
    onDisable() {
        this.app?.off("update", this.update, this);
        this.app?.graphicsDevice.off("resizecanvas", this.onResize, this);
    }
}
