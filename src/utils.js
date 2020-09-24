import BST from "./bst";

export const sleep = ms => new Promise((r) => setTimeout(r, ms));
export const distance = (x1, x2, y1, y2) => Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
export const angle = (x1, x2, y1, y2) => Math.atan2(y1 - y2, x1 - x2);


export const updateCameraBounds = (visualizer) => {
    const { camera, tree } = visualizer;
    
    BST.breadthFirstTraverse(tree, (item) => {
        camera.bounds.minX = Math.min(item.extras.x, camera.bounds.minX);
        camera.bounds.minY = Math.min(item.extras.y, camera.bounds.minY);
        camera.bounds.maxX = Math.max(item.extras.x, camera.bounds.maxX);
        camera.bounds.maxY = Math.max(item.extras.y, camera.bounds.maxY);
    });
};