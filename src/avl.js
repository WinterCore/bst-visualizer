class Node {
    constructor(value, parent = null, left = null, right = null) {
        this.value  = value;
        this.left   = left;
        this.right  = right;
        this.parent = parent;
        this.height = 1;
        this.level  = 0;

        this.extras = {
            initialized: false,
            entered: false,
            dirty: false
        };
    }
}


export default class AVL {
    static *push(node, value, parent = null, level = 0) {
        if (!node) {
            yield ({ info: "", highlightedNode: null });
            return new Node(value, parent);
        }

        if (value > node.value) {
            yield({
                highlightedNode: node,
                info: `Inserting ${value} | ${value} is bigger than ${node.value} so we go right!`
            });

            node.right = yield *AVL.push(node.right, value, node, level + 1);
        } else if (value < node.value) {
            yield({
                highlightedNode: node,
                info: `Inserting ${value} | ${value} is less than ${node.value} so we go left!`
            });

            node.left = yield *AVL.push(node.left, value, node, level + 1);
        } else {
            yield({
                highlightedNode: null,
                info: ""
            });
        }

        node.height = Math.max(AVL.height(node.left), AVL.height(node.right)) + 1;
        node.level  = level;

        const balance = AVL.height(node.left) - AVL.height(node.right);

        if (balance > 1 && value < node.left.value) {
            return AVL.rotateRight(node);
        }
        if (balance > 1 && value > node.left.value) {
            node.left = AVL.rotateLeft(node.left);
            return AVL.rotateRight(node);
        }
    
        if (balance < -1 && value > node.right.value) {
            return AVL.rotateLeft(node);
        }
    
        if (balance < -1 && value < node.right.value) {
            node.right = AVL.rotateRight(node.right);
            return AVL.rotateLeft(node);
        }
    

        return node;
    }

    static rotateLeft(node) {
        const y = node.right,
              z = y.left,
              rp = node.parent;
        y.left = node;
        node.right = z;
        // fix parents
        node.parent = y;
        y.parent = rp;
        if (z) z.parent = node;
    
        node.height = 1 + Math.max(AVL.height(node.left), AVL.height(node.right));
        y.height = 1 + Math.max(AVL.height(y.left), AVL.height(y.right));

        AVL.breadthFirstTraverse(y, (node) => node.extras.dirty = true);

        return y;
    }
    
    static rotateRight(node) {
        const y = node.left,
              z = y.right,
              rp = node.parent;

        y.right = node;
        node.left = z;
        
        node.parent = y;
        y.parent = rp;
        if (z) z.parent = node;
    
        node.height = 1 + Math.max(AVL.height(node.left), AVL.height(node.right));
        y.height = 1 + Math.max(AVL.height(y.left), AVL.height(y.right));

        AVL.breadthFirstTraverse(y, (node) => node.extras.dirty = true);

        return y;
    }
    

    static height(node) {
        if (!node) return 0;
        return node.height;
    }

    static breadthFirstTraverse(node, callback) {
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
}
