/**
 * 创建者: FBplus
 * 创建时间: 2022-05-16 14:30:00
 * 修改者: FBplus
 * 修改时间: 2022-08-09 16:48:56
 * 详情: 多选模型
 */
import * as pc from "playcanvas";
import {
    clearSelectionBox, drawSelectionBox
} from "../../utils/func/drawSelectionBox/drawSelectionBox.mjs";
import { MouseInputer } from '../input/mouseInput.mjs';
// import type { InputEventsMap } from "../../utils/common/InputEventsMap";
/**
 * 模型多选事件-回调表
 */
/*
interface MultiSelectorEventMap
{
    selectStart: () => any;
    selecting: (selectedNodes: pc.GraphNode[], preSelectedNodes: pc.GraphNode[]) => any;
    selectEnd: () => any;
};
*/
/**
 * 模型多选选项
 */
/**
 * @typedef {Object} MultiSelectorOptions
 * @property {Tool<any, InputEventsMap>} [inputHandler]
 * @property {pc.CameraComponent} [pickCamera]
 * @property {number} [pickAreaScale]
 * @property {pc.Layer} [boxLayer]
 * @property {pc.Layer[]} [excludeLayers]
 * @property {() => boolean} [expectCondition] 
 */
export class MultiSelector extends pc.EventHandler /*extends Tool<MultiSelectorOptions, MultiSelectorEventMap>*/ {
    // 默认选项
    /** @type {MultiSelectorOptions} */
    toolOptionsDefault = {
        inputHandler: this.app.touch ? new TouchInputer : new MouseInputer,
        pickCamera: this.app.systems.camera.cameras[0],
        pickAreaScale: 0.25,
        boxLayer: this.app.scene.layers.getLayerByName("UI"),
        excludeLayers: [this.app.scene.layers.getLayerByName("UI")],
        expectCondition: null
    };
    get app() {
        return pc.Application.getApplication();
    }
    /** @type {pc.Picker} */
    picker;
    /** @type {pc.Layer[]} */
    pickLayers;
    /** @type {pc.Vec4} */
    pickRect;
    isSelecting = false;
    /** @type {pc.GraphNode[]} */
    pickNodes = [];
    /** 
     * @param {MultiSelectorOptions} options
     */
    constructor(options) {
        super();
        this.toolOptions = {
            ...this.toolOptionsDefault,
            ...options,
        };
        this.picker = new pc.Picker(this.app, 0, 0);
        this.pickRect = new pc.Vec4();
        this.onEnable();
    }
    /**
     * 设置多选模型选项
     * @param {MultiSelectorOptions} option 多选模型选项
     */
    publicsetOptions(options)
    {
        super.setOptions(options);
        this.pickLayers = this.toolOptions.excludeLayers
            ? this.app.scene.layers.layerList.filter((layer/*: pc.Layer*/) => !this.toolOptions.excludeLayers.includes(layer))
            : this.app.scene.layers.layerList;
    }
    /**
     * 根据框选区域选择模型
     * @param {pc.Vec4} rect 框选区域
     */
    pick(rect) {
        const options = this.toolOptions;
        const canvas = this.app.graphicsDevice.canvas;
        const canvasWidth = canvas.clientWidth;
        const canvasHeight = canvas.clientHeight;
        this.picker.resize(canvasWidth * options.pickAreaScale, canvasHeight * options.pickAreaScale);
        this.picker.prepare(options.pickCamera, this.app.scene, this.pickLayers);
        const error = 3; // TODO:查看引擎源码，找到此处判断存在误差的原因
        const selected = this.picker.getSelection(
            pc.math.clamp(rect.x, 0, canvasWidth) * options.pickAreaScale,
            pc.math.clamp(rect.y, 0, canvasHeight) * options.pickAreaScale,
            Math.min(canvasWidth - rect.x - error, rect.z) * options.pickAreaScale,
            Math.min(canvasHeight - rect.y - error, rect.w) * options.pickAreaScale
        );
        if (selected.length > 0) {
            /** @type {pc.GraphNode[]} */
            const pickNodes = [];
            selected.forEach(meshInstance =>
            {
                if (meshInstance && meshInstance.node) {
                    pickNodes.push(meshInstance.node);
                }
            });
            if (!this.isNodesEqual(this.pickNodes, pickNodes)) {
                const prePickNodes = [...this.pickNodes];
                this.fire("selecting", this.updatePickNodes(pickNodes), prePickNodes);
            }
        }
        else {
            this.fire("selecting", [], this.pickNodes);
            this.pickNodes = [];
        }
    }
    /**
     * 框选时使用增量更新
     * @param {pc.GraphNode[]} nodes 框选node集合
     * @returns {pc.GraphNode[]} 增量更新后的node集合
     */
    updatePickNodes(nodes) {
        const oriLength = this.pickNodes.length;
        const newLength = nodes.length;
        if (newLength > oriLength) {
            for (let i = 0; i < newLength; i++) {
                const e = nodes[i];
                if (!this.pickNodes.includes(e)) {
                    this.pickNodes.push(e);
                }
            }
        }
        else {
            for (let i = oriLength - 1; i >= 0; i--) {
                const e = this.pickNodes[i];
                if (!nodes.includes(e)) {
                    this.pickNodes.pop();
                }
            }
        }
        return [...this.pickNodes];
    }
    /**
     * 判断两个节点数组是否无序相等
     * @param {Array<pc.GraphNode>} arr1 数组1
     * @param {Array<pc.GraphNode>} arr2 数组2
     * @returns {boolean} 两数组是否无序相等
     */
    isNodesEqual(arr1, arr2) {
        if (arr1.length != arr2.length) {
            return false;
        }
        let isEqual = true;
        arr1.forEach(e1 =>
        {
            if (!arr2.includes(e1)) {
                isEqual = false;
            }
        });
        return isEqual;
    }
    /**
     * 按键按下事件回调
     * @param {{ x: number, y: number }} event 按键按下事件
     */
    onControlDown(event) {
        const options = this.toolOptions;
        if (!options.expectCondition || !options.expectCondition()) {
            this.isSelecting = true;
            this.fire("selectStart");
        }
    }
    /**
     * 拖拽中调用
     * @param {{ x: number, y: number, ox: number, oy: number }} event 拖拽中事件
     * @returns 
     */
    onDragging(event) {
        const options = this.toolOptions;
        if (!this.isSelecting || options.expectCondition && options.expectCondition()) { return; }
        this.pickRect.copy(drawSelectionBox({ x: event.ox, y: event.oy }, { x: event.x, y: event.y }, options.boxLayer));
        this.pick(this.pickRect);
    }
    /**
     * 拖拽结束时调用
     * @param {{ x: number, y: number }} event 拖拽结束事件
     */
    onDragEnd(event) {
        clearSelectionBox();
        this.isSelecting = false;
        this.fire("selectEnd");
    }
    onEnable() {
        const inputHandler = this.toolOptions.inputHandler;
        inputHandler.on("down", this.onControlDown, this);
        inputHandler.on("dragging", this.onDragging, this);
        inputHandler.on("dragEnd", this.onDragEnd, this);
    }
    onDisable() {
        const inputHandler = this.toolOptions.inputHandler;
        inputHandler.off("down", this.onControlDown, this);
        inputHandler.off("dragging", this.onDragging, this);
        inputHandler.off("dragEnd", this.onDragEnd, this);
    }
}
