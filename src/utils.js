import BST from "./bst";

export const sleep = ms => new Promise((r) => setTimeout(r, ms));
export const distance = (x1, x2, y1, y2) => Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
export const angle = (x1, x2, y1, y2) => Math.atan2(y1 - y2, x1 - x2);

export const breadthFirstTraverse = (node, callback) => {
    if (!node) return;
    const deque = [];

    deque.push(node);

    while (deque.length) {
        const current = deque.shift();
        callback(current);
        if (current.left) deque.push(current.left);
        if (current.right) deque.push(current.right);
    }
}


export const updateCameraBounds = (visualizer) => {
    const { camera, tree } = visualizer;
    
    breadthFirstTraverse(tree, (item) => {
        camera.bounds.minX = Math.min(item.extras.x, camera.bounds.minX);
        camera.bounds.minY = Math.min(item.extras.y, camera.bounds.minY);
        camera.bounds.maxX = Math.max(item.extras.x, camera.bounds.maxX);
        camera.bounds.maxY = Math.max(item.extras.y, camera.bounds.maxY);
    });
};