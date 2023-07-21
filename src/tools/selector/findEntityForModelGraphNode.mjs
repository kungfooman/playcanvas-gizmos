import * as pc from 'playcanvas';
/**
 * @param {pc.GraphNode|pc.Entity} entity 
 * @returns {pc.GraphNode|pc.Entity}
 */
export function findEntityForModelGraphNode(entity) {
    if (entity instanceof pc.GraphNode) {
        if (entity.parent?.c?.model) {
            // console.log("findEntityForModelGraphNode> looks like you wanted to select the entity of ", entity);
            return entity.parent;
        }
    }
    return entity;
}
