/**
 * 创建者: FBplus
 * 创建时间: 2022-06-08 15:04:27
 * 修改者: FBplus
 * 修改时间: 2022-08-09 16:48:24
 * 详情: 点选模型
 */
import * as pc from "playcanvas";
import { findEntityForModelGraphNode } from "./findEntityForModelGraphNode.mjs";
import { arrayCopy } from "../../utils/func/array.mjs";
// import type { InputEventsMap } from "../utils/common/InputEventsMap";
/**
 * @typedef {import("../../utils/common/InputEventsMap.js").InputEventsMap} InputEventsMap
 */
/**
 * 模型点选事件-回调表
 * @typedef {object} SelectorEventsMap
 * @property {(selectedNode: pc.GraphNode, previousEntities: pc.GraphNode) => any} select
 */
/**
 * @typedef {object} TypedEventHandler
 * @todo Actually implement this.
 * @property {A} a
 * @property {B} b
 * @template A
 * @template B
 */
/**
 * 模型点选选项
 * @todo create inputHandler if not given and remove if()'s
 * @typedef {object} SelectorOptions
 * @property {TypedEventHandler<any, InputEventsMap>|null} [inputHandler]
 * @property {pc.CameraComponent} [pickCamera]
 * @property {number} [pickAreaScale]
 * @property {string|null} [pickTag]
 * @property {boolean} [pickNull]
 * @property {boolean} [pickSame]
 * @property {boolean} [downSelect]
 * @property {function|null} [pickCondition]
 * @property {pc.Layer[]|null} [excludeLayers]
*/
export class Selector extends pc.EventHandler { // extends Tool/*<SelectorOptions, SelectorEventsMap>*/
    /**
     * 默认选项
     * @type {Required<SelectorOptions>}
     */
    toolOptionsDefault = {
        inputHandler: null, //this.app.touch ? use("TouchInputer") : use("MouseInputer"),
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
    /** @type {pc.Layer[]} */
    _pickLayers;
    /**
     * @type {Array<pc.GraphNode|pc.Entity>}
     */
    previousEntities = [];
    /**
     * Used for type system simplification and prevention of GC
     * @type {Array<pc.GraphNode|pc.Entity>}
     */
    pickedEntities = [];
    /**
     * 创建模型点选器
     * @param {SelectorOptions} options 模型点选设置
     */
    constructor(options) {
        super();
        /** @type {Required<SelectorOptions>} */
        this.toolOptions = {
            ...this.toolOptionsDefault,
            ...options,
        };
        this.picker = new pc.Picker(this.app, 0, 0);
        this._pickLayers = this.toolOptions.excludeLayers
            ? this.app.scene.layers.layerList.filter((layer) => !this.toolOptions.excludeLayers.includes(layer))
            : this.app.scene.layers.layerList;
        this.onEnable();
    }
    /**
     * 设置模型点选器
     * @override
     * @param {SelectorOptions} option 模型点选设置
     */
    setOptions(options) {
        // this.toolOptions.inputHandler = this.toolOptions.inputHandler || use("MouseInputer");
    }
    /**
     * 点选模型
     * @param {pc.MouseEvent} event - 输入事件
     * @param {number} event.x - 输入事件屏幕x坐标
     * @param {number} event.y - 输入事件屏幕y坐标
     * @param {boolean} event.ctrlKey - Toggle
     */
    pick(event) {
        const { app } = this;
        if (!app) {
            console.warn("Selector#pick> no app");
            return;
        }
        const toggle = event.ctrlKey;
        const { pickSame, pickTag, pickNull, pickCondition, pickAreaScale, pickCamera } = this.toolOptions;
        if (pickCondition && !pickCondition()) {
            return;
        }
        const canvas = app.graphicsDevice.canvas;
        const canvasWidth = canvas.clientWidth;
        const canvasHeight = canvas.clientHeight;
        this.picker.resize(canvasWidth * pickAreaScale, canvasHeight * pickAreaScale);
        this.picker.prepare(pickCamera, app.scene, this._pickLayers);
        const selected = this.picker.getSelection(event.x * pickAreaScale, event.y * pickAreaScale);
        this.pickedEntities.length = 0;
        const fire = () => {
            this.fire("select", this.pickedEntities, this.previousEntities, toggle);
            arrayCopy(this.previousEntities, this.pickedEntities);
        }
        if (selected.length > 0 && selected[0]?.node) {
            const firstPick = findEntityForModelGraphNode(selected[0].node);
            if (!pickTag || !pickTag.length) {
                if (!pickSame && this.previousEntities.includes(firstPick)) {
                    return;
                }
                this.pickedEntities.push(firstPick);
                fire();
            } else {
                const selectedNode = this.getModelHasTag(firstPick, pickTag);
                if (!pickSame && this.previousEntities.includes(selectedNode)) {
                    return;
                }
                this.pickedEntities.push(selectedNode);
                fire();
            }
        } else if (pickNull) {
            fire();
        }
    }
    /**
     * 从下至上找到含有某个标签的模型对象
     * @param {pc.GraphNode} model 模型
     * @param {string} tag 标签
     * @returns {pc.GraphNode|pc.Entity} 包含标签的模型对象
     */
    getModelHasTag(model, tag) {
        let node = model;
        while (node && !node.tags.has(tag)) {
            node = node.parent;
        }
        return node;
    }
    onEnable() {
        const { downSelect, inputHandler } = this.toolOptions;
        if (!inputHandler) {
            return;
        }
        if (downSelect) {
            inputHandler.on("down", this.pick, this);
        } else {
            inputHandler.on("click", this.pick, this);
        }
    }
    onDisable() {
        const { inputHandler } = this.toolOptions;
        if (!inputHandler) {
            return;
        }
        this.toolOptions.inputHandler.off("down", this.pick, this);
        this.toolOptions.inputHandler.off("click", this.pick, this);
    }
}
