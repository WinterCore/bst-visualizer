const canvas = document.querySelector("#canvas");
const ctx = canvas.getContext("2d");

// Refactor start

class Node {
    constructor(value, left = null, right = null) {
        this.value  = value;
        this.left   = left;
        this.right  = right;
        this.height = 0;
        this.level  = 0;

        this.extras = {
            initialized: false,
            entered: false
        };
    }
}

let delay = 500;

const sleep = ms => new Promise((r) => setTimeout(r, ms));

class BST {
    static async push(node, value, level = 0) {
        if (!node) return new Node(value);

        node.extras.highlight = true;
        await sleep(delay);
        node.extras.highlight = false;

        if (value > node.value)
            node.left = await BST.push(node.left, value, level + 1);
        else if (value < node.value)
            node.right = await BST.push(node.right, value, level + 1);

        node.height = Math.max(BST.height(node.left), BST.height(node.right)) + 1;
        node.level  = level;

        return node;
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

let tree = null;

// Refactor end

let mouse = {
    downPos: {
        x: 0,
        y: 0
    },
    oldCamera: {
        x: 0,
        y: 0
    },
    isDown: false
};

const camera = {
    x: 0,
    y: 0,
    bounds: {
        minX: Infinity,
        maxX: -Infinity,
        minY: Infinity,
        maxY: -Infinity
    }
};

const dimensions = {
    width: window.innerWidth,
    height: window.innerHeight
};

const resize = () => {
    dimensions.width  = window.innerWidth;
    dimensions.height = window.innerHeight;

    canvas.width  = dimensions.width;
    canvas.height = dimensions.height;
};

const radius = 20;
const padding = 20;

const calculateNodePosition = (node, parent) => {
    return parent
        ? {
            x: parent.extras.x + (parent.left === node ? +1 : -1) * (padding + radius * 2),
            y: parent.extras.y + padding + radius * 2
        } : {
            x: 0,
            y: -(dimensions.height / 2) + padding + radius
        };
};

const updateNode = (node, parent = null) => {
    if (!node) return;

    if (!node.extras.initialized) {
        node.extras.multiplier = 0;
        const {x, y} = calculateNodePosition(node, parent);
        node.extras.x = x;
        node.extras.y = y;
        updateCameraBounds(tree); // TODO: Find a better way to do this
        node.extras.initialized = true;
    } else {
        if (!node.extras.entered) {
            node.extras.multiplier += 0.03;
            if (node.extras.multiplier > 1) node.extras.entered = true;
        }
    }

    updateNode(node.left, node);
    updateNode(node.right, node);
};

const renderNode = (node, parent = null) => {
    if (!node) return;

    ctx.save();

    ctx.lineWidth = 3;
    ctx.strokeStyle = node.extras.highlight ? "red" : "black";

    ctx.beginPath();


    let { x, y } = node.extras;

    const textMeasurements = ctx.measureText(node.value);

    ctx.arc(x, y, node.extras.multiplier * radius, 0, Math.PI * 2);
    ctx.fillText(node.value, x - textMeasurements.width / 2, y + ctx.measureText("M").width / 2 - 2);
    ctx.stroke();


    if (parent) {
        ctx.save();

        ctx.strokeStyle = "black";

        const dx = (parent.extras.x - node.extras.x)
              dy = (parent.extras.y - node.extras.y);


        const angle = Math.atan2(dy, dx);
        const start = {
            x: parent.extras.x - radius * Math.cos(angle),
            y: parent.extras.y - radius * Math.sin(angle)
        };

        const d = Math.sqrt(Math.pow(dx, 2), Math.pow(dy, 2)) - radius;

        const end = {
            x: node.extras.x - (radius + (d - d * node.extras.multiplier)) * Math.cos(angle + Math.PI),
            y: node.extras.y - (radius + (d - d * node.extras.multiplier)) * Math.sin(angle + Math.PI)
        };

        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();

        ctx.restore();
    }

    ctx.restore();

    renderNode(node.left, node);
    renderNode(node.right, node);
};

const updateTree = (tree) => {
    updateNode(tree);
};

const renderTree = (tree) => {
    renderNode(tree);
};


const render = () => {
    const hWidth = dimensions.width / 2,
          hHeight = dimensions.height / 2;

    ctx.save();

    ctx.translate(hWidth + camera.x, hHeight + camera.y);
    ctx.clearRect(-hWidth * 10, -hHeight * 10, dimensions.width * 10, dimensions.height * 10);

    updateTree(tree);
    renderTree(tree);

    ctx.restore();
    window.requestAnimationFrame(render);
};


const updateCameraBounds = (tree) => {
    BST.breadthFirstTraverse(tree, (item) => {
        camera.bounds.minX = Math.min(item.extras.x, camera.bounds.minX);
        camera.bounds.minY = Math.min(item.extras.y, camera.bounds.minY);
        camera.bounds.maxX = Math.max(item.extras.x, camera.bounds.maxX);
        camera.bounds.maxY = Math.max(item.extras.y, camera.bounds.maxY);
    });
};

window.addEventListener("resize", () => {
    resize();
});

window.addEventListener("mousedown", ({ clientX, clientY }) => {
    mouse.downPos.x = clientX;
    mouse.downPos.y = clientY;

    mouse.oldCamera.x = camera.x;
    mouse.oldCamera.y = camera.y;

    mouse.isDown = true;
    canvas.style.cursor = "grabbing";
});

window.addEventListener("mouseup", ({ clientX, clientY }) => {
    mouse.isDown = false;
    canvas.style.cursor = "grab";

    // This is temporary
    const dragDistance = Math.sqrt(Math.pow(clientX - mouse.downPos.x, 2), Math.pow(clientY - mouse.downPos.y, 2));
    if (dragDistance < 2) {
        ((async () => {
            tree = await BST.push(tree, Math.round(Math.random() * 100));
        })())
    }
});

window.addEventListener("mousemove", ({ clientX, clientY }) => {
    if (mouse.isDown) {
        const newX = (clientX - mouse.downPos.x) + mouse.oldCamera.x,
              newY = (clientY - mouse.downPos.y) + mouse.oldCamera.y;

        // I have no idea how this even works. it just does
        const halfWidth = dimensions.width / 2,
              halfHeight = dimensions.height / 2,
              bxa = newX + halfWidth + camera.bounds.maxX,
              bxb = newX - halfWidth + camera.bounds.minX,
              bya = newY + halfHeight + camera.bounds.maxY,
              byb = newY - halfHeight + camera.bounds.minY;

        if (bxa < 0) camera.x = -halfWidth - camera.bounds.maxX;
        else if (bxb > 0) camera.x = halfWidth - camera.bounds.minX;
        else camera.x = newX;

        if (bya < 0) camera.y = -halfHeight - camera.bounds.maxY;
        else if (byb > 0) camera.y = halfHeight - camera.bounds.minY;
        else camera.y = newY;
    }
});


resize();
window.requestAnimationFrame(render);
