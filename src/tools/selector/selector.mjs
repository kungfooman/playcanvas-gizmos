/**
 * 创建者: FBplus
 * 创建时间: 2022-06-08 15:04:27
 * 修改者: FBplus
 * 修改时间: 2022-08-09 16:48:24
 * 详情: 点选模型
 */
import * as pc from "playcanvas";
import { findEntityForModelGraphNode } from "./findEntityForModelGraphNode.mjs";
// import type { InputEventsMap } from "../utils/common/InputEventsMap";
/**
 * 模型点选事件-回调表
 * @typedef {Object} SelectorEventsMap
 * @property {(selectedNode: pc.GraphNode, preSelectedNode: pc.GraphNode) => any} select
 */
/**
 * 模型点选选项
 * @typedef {object} SelectorOptions
 * @property {Tool<any, InputEventsMap>} [inputHandler]
 * @property {pc.CameraComponent} [pickCamera]
 * @property {number} [pickAreaScale]
 * @property {string} [pickTag]
 * @property {boolean} [pickNull]
 * @property {boolean} [pickSame]
 * @property {boolean} [downSelect]
 * @property {function} [pickCondition]
 * @property {pc.Layer[]} [excludeLayers]
 */
export class Selector extends pc.EventHandler { // extends Tool/*<SelectorOptions, SelectorEventsMap>*/
    // 默认选项
    /** @type {SelectorOptions} */
    toolOptionsDefault = {
        //inputHandler: this.app.touch ? use("TouchInputer") : use("MouseInputer"),
        pickCamera: this.app.systems.camera.cameras[0],
        pickAreaScale: 0.25,
        pickTag: null,
        pickNull: true,
        pickSame: true,
        downSelect: false,
        pickCondition: null,
        excludeLayers: null,
    };
    get app() {
        return pc.Application.getApplication();
    }
    /**
     * @private
     * @type {pc.Picker}
     */
    picker;
    /**
     * @private
     * @type {pc.Layer[]}
     */
    pickLayers;
    /**
     * @private
     * @type {pc.GraphNode}
     */
    preSelectedNode;
    /**
     * 创建模型点选器
     * @param {SelectorOptions} options 模型点选设置
     */
    constructor(options) {
        super();
        this.toolOptions = {
            ...this.toolOptionsDefault,
            ...options,
        };
        this.picker = new pc.Picker(this.app, 0, 0);
        this.setOptions(options);
        this.onEnable();
    }
    /**
     * 设置模型点选器
     * @override
     * @param {SelectorOptions} option 模型点选设置
     */
    setOptions(options) {
        // this.toolOptions.inputHandler = this.toolOptions.inputHandler || use("MouseInputer");
        this.pickLayers = this.toolOptions.excludeLayers
            ? this.app.scene.layers.layerList.filter((layer/*: pc.Layer*/) => !this.toolOptions.excludeLayers.includes(layer))
            : this.app.scene.layers.layerList;
    }
    /**
     * 点选模型
     * @param {pc.MouseEvent} event - 输入事件
     * @param {number} event.x - 输入事件屏幕x坐标
     * @param {number} event.y - 输入事件屏幕y坐标
     * @param {boolean} event.ctrlKey - Toggle
     */
    pick(event) {
        console.log("toggle", event.ctrlKey);
        const options = this.toolOptions;
        if (options.pickCondition && !options.pickCondition()) {
            return;
        }
        const canvas = this.app.graphicsDevice.canvas;
        const canvasWidth = canvas.clientWidth;
        const canvasHeight = canvas.clientHeight;
        this.picker.resize(canvasWidth * options.pickAreaScale, canvasHeight * options.pickAreaScale);
        this.picker.prepare(options.pickCamera, this.app.scene, this.pickLayers);
        const selected = this.picker.getSelection(event.x * options.pickAreaScale, event.y * options.pickAreaScale);
        if (selected.length > 0 && selected[0]?.node) {
            const firstPick = findEntityForModelGraphNode(selected[0].node);
            if (!options.pickTag || options.pickTag.length <= 0) {
                if (!options.pickSame && this.preSelectedNode === firstPick) {
                    return;
                }
                this.fire("select", firstPick, this.preSelectedNode);
                this.preSelectedNode = firstPick;
            } else {
                const selectedNode = this.getModelHasTag(firstPick, options.pickTag);
                if (!options.pickSame && this.preSelectedNode === selectedNode) {
                    return;
                }
                this.fire("select", selectedNode, this.preSelectedNode);
                this.preSelectedNode = selectedNode;
            }
        } else if (options.pickNull) {
            this.fire("select", null, this.preSelectedNode);
            this.preSelectedNode = null;
        }
    }
    /**
     * 从下至上找到含有某个标签的模型对象
     * @param {pc.GraphNode} model 模型
     * @param {string} tag 标签
     * @returns {pc.Entity} 包含标签的模型对象
     */
    getModelHasTag(model, tag) {
        let node = model;
        while (node && !node.tags.has(tag)) {
            node = node.parent;
        }
        return node;
    }
    onEnable() {
        if (this.toolOptions.downSelect) {
            this.toolOptions.inputHandler.on("down", this.pick, this);
        } else {
            this.toolOptions.inputHandler.on("click", this.pick, this);
        }
    }
    onDisable() {
        this.toolOptions.inputHandler.off("down", this.pick, this);
        this.toolOptions.inputHandler.off("click", this.pick, this);
    }
}
