/**
 * 创建者: FBplus
 * 创建时间: 2022-03-18 15:41:45
 * 修改者: FBplus
 * 修改时间: 2022-07-08 16:52:15
 * 详情: 批量控制材质
 */
import * as pc from "playcanvas";
/**
 * 存储材质表，用于模型批量恢复
 * @type {Record<string, pc.StandardMaterial>}
 */
let meshMatMap = {};
/**
 * 递归处理实例上的所有子节点
 * @param {pc.Entity | pc.GraphNode} node 物体实例
 * @param {(childNode: pc.Entity | pc.GraphNode) => void} [childNodeCallback] 节点回调
 */
function processDeep(node, childNodeCallback) {
    // 空值处理
    if (!node || !childNodeCallback) {
        return;
    }
    // 递归处理子节点
    if (node.children && node.children.length > 0) {
        node.children.forEach((child/*: pc.Entity | pc.GraphNode*/) => {
            processDeep(child, childNodeCallback);
        });
    }
    // 节点回调
    if (childNodeCallback) {
        childNodeCallback(node);
    }
}
export class MaterialController {
    /**
     * 递归处理实例上的所有模型和meshInstance
     * @param {pc.Entity | pc.GraphNode} node 物体实例
     * @param {(childNode: pc.Entity | pc.GraphNode) => void} [childNodeCallback] 节点回调
     * @param {(model: pc.ModelComponent | pc.RenderComponent) => void} [modelCallback] 模型回调
     * @param {(meshInstance: pc.MeshInstance, index: number) => void} [meshInstanceCallback] meshInstance回调
     */
    static processNodeDeep(node, childNodeCallback, modelCallback, meshInstanceCallback) {
        processDeep(node, childNode => {
            const childEntity = childNode;
            /** @type {pc.RenderComponent | pc.ModelComponent} */
            let model;
            if (childEntity.model) {
                model = childEntity.model;
            } else {
                model = childEntity.render /*as pc.RenderComponent*/;
            }
            if (!model) {
                return;
            }
            // 节点回调
            if (childNodeCallback && childEntity) {
                childNodeCallback(childEntity);
            }
            // 模型回调
            if (modelCallback && model) {
                modelCallback(model);
            }
            // meshInstances回调
            if (meshInstanceCallback && model) {
                const meshInstances = model.meshInstances;
                meshInstances.forEach((mi, index) => {
                    meshInstanceCallback(mi, index);
                });
            }
        });
    }
    /**
    * 递归设置所有节点的材质或添加batchGroup
    * @param {pc.Entity | pc.GraphNode} node 节点
    * @param {pc.Material} mat 材质
    * @param {string} [batchGroupId] batchGroup的Id
    */
    static setMatsDeep(node, mat, batchGroupId) {
        MaterialController.processNodeDeep(node, undefined,
            (model) => {
                if (batchGroupId) {
                    model.batchGroupId = batchGroupId;
                }
            },
            meshInstance => {
                meshInstance.material = mat;
            });
    }
    /**
    * 递归改变材质chunks或设置batchGroupId
    * @param {pc.Entity | pc.GraphNode} node 节点
    * @param {{ [index: string]: string }} chunks chunk描述
    * @param {string} [batchGroupId] batchGroup的Id
    */
    static setChunksDeep(node, chunks, batchGroupId) {
        // 遍历所有模型和材质
        MaterialController.processNodeDeep(node, undefined,
            (model) => {
                if (batchGroupId) {
                    model.batchGroupId = batchGroupId;
                }
            },
            meshInstance => {
                Object.keys(chunks).forEach(key => {
                    const { material } = meshInstance;
                    if (material instanceof pc.StandardMaterial) {
                        material.chunks[key] = chunks[key];
                    } else {
                        console.warn("setChunksDeep> not a pc.StandardMaterial");
                    }
                });
            });
    }
    /**
    * 开关模型网格显示模式
    * @param {pc.Entity | pc.GraphNode} node 节点
    * @param {boolean} state 启用状态
    */
    static toggleWireFrame(node, state) {
        MaterialController.processNodeDeep(node, undefined, model => {
            if (model instanceof pc.ModelComponent) {
                if (state) {
                    model.model.generateWireframe();
                }
                model.meshInstances.forEach(mi => {
                    mi.renderStyle = state ? pc.RENDERSTYLE_WIREFRAME : pc.RENDERSTYLE_SOLID;
                });
            } else {
                model.renderStyle = state ? pc.RENDERSTYLE_WIREFRAME : pc.RENDERSTYLE_SOLID;
            }
        });
    }
    /**
    * 保存所有原有材质
    * @param {pc.Entity | pc.GraphNode} node 节点
    */
    static saveAllMats(node) {
        meshMatMap = {};
        MaterialController.processNodeDeep(node, undefined, undefined, (mi, index) => {
            meshMatMap[mi.node.getGuid() + "_" + index] = mi.material;
        });
    }
    /**
    * 尝试恢复所有材质
    * @param {pc.Entity | pc.GraphNode} node 节点
    */
    static recoverAllMats(node) {
        if (Object.keys(meshMatMap).length <= 0) {
            return;
        }
        MaterialController.processNodeDeep(node, undefined, undefined, (mi, index) => {
            const id = mi.node.getGuid() + "_" + index;
            if (meshMatMap[id]) {
                mi.material = meshMatMap[id];
            }
        });
    }
}
