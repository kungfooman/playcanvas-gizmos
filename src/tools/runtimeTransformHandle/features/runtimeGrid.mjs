import * as pc from "playcanvas";
import { noAmbientEndPS } from "../utils/handleShader.mjs";

/**
 * @typedef {Object} RuntimeGridOptions
 * @property {pc.CameraComponent} mainCamera
 * @property {pc.Vec2} range
 */

//@tool("RTH_RuntimeGrid")
export class RTH_RuntimeGrid {
    /** @type {pc.Layer} */
    static _layer;
    static get layer() {
        return this._layer || (this._layer = new pc.Layer({ name: "RTH_Grid" })); // grid layer
    }
    get app() {
        return pc.Application.getApplication();
    }
    /**
     * 默认选项
     * @protected
     * @type {RuntimeGridOptions}
     */
    toolOptionsDefault = {
        mainCamera: this.app.systems.camera.cameras[0],
        range: new pc.Vec2(30, 30)
    };

    /**
     * @private
     * @type {pc.Entity}
     */
    grid;

    /**
     * @param {RuntimeGridOptions} options 
     */
    constructor(options) {
        this.toolOptions = {
            ...this.toolOptionsDefault,
            ...options,
        };
        this.setOptions(options);

        // 添加layer到场景
        if (!this.app.scene.layers.getLayerById(RTH_RuntimeGrid.layer.id)) {
            const worldLayerIndex = this.app.scene.layers.getOpaqueIndex(this.app.scene.layers.getLayerByName("World"));
            this.app.scene.layers.insert(RTH_RuntimeGrid.layer, worldLayerIndex);
        }
    }

    /**
     * @public
     * 设置RuntimeGrid选项
     * @param {RuntimeGridOptions} options - The RuntimeGrid options.
     * @returns {void}
     */
    setOptions(options) {
        const toolOptions = this.toolOptions;
        toolOptions.mainCamera.layers = toolOptions.mainCamera.layers.concat(RTH_RuntimeGrid.layer.id); // 相机添加layer
        this.grid && this.grid.destroy();
        this.grid = new pc.Entity("RTH_Grid");
        const range = toolOptions.range;
        const grid1 = this.createGrid(range.x, range.y, range.x / 5, range.y / 5, pc.Color.BLACK);
        const grid2 = this.createGrid(range.x, range.y, range.x, range.y, pc.Color.GRAY);
        this.grid.addChild(grid1);
        this.grid.addChild(grid2);
        this.app.root.addChild(this.grid);
    }

    /**
     * @private
     * @param {number} w - The grid width.
     * @param {number} h - The grid height.
     * @param {number} wd - The grid width dimension.
     * @param {number} hd - The grid height dimension.
     * @param {pc.Color} color 
     * @returns {pc.Entity} The grid entity.
     */
    createGrid(w, h, wd = w, hd = h, color = pc.Color.BLACK) {
        const points = new Float32Array(3 * (wd + hd + 2) * 2);
        const dw = w / wd;
        const dh = h / hd;

        let index = 0;
        for (let z = 0; z <= hd; z++) {
            points[index * 6] = w / -2;
            points[index * 6 + 1] = 0;
            points[index * 6 + 2] = h / -2 + z * dh;
            points[index * 6 + 3] = w / 2;
            points[index * 6 + 4] = 0;
            points[index * 6 + 5] = h / -2 + z * dh;

            index++;
        }

        for (let x = 0; x <= wd; x++) {
            points[index * 6] = w / -2 + x * dw;
            points[index * 6 + 1] = 0;
            points[index * 6 + 2] = h / -2;
            points[index * 6 + 3] = w / -2 + x * dw;
            points[index * 6 + 4] = 0;
            points[index * 6 + 5] = h / 2;

            index++;
        }

        const mesh = new pc.Mesh(this.app.graphicsDevice);
        mesh.clear(false, false);
        mesh.setPositions(points);
        mesh.update(pc.PRIMITIVE_LINES);

        const mat = new pc.StandardMaterial();
        mat.chunks.endPS = noAmbientEndPS;
        mat.useLighting = false;
        mat.useSkybox = false;
        mat.emissive.copy(color);
        const mi = new pc.MeshInstance(mesh, mat);
        const grid = new pc.Entity();
        grid.addComponent("render", {
            meshInstances: [mi],
        });
        grid.render.layers = [RTH_RuntimeGrid.layer.id];

        return grid;
    }

    /**
     * @protected
     * @override
     * @returns {void}
     */
    onDisable() {
        this.grid && this.grid.destroy();
    }
}
