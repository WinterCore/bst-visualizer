const canvas = document.querySelector("#canvas");
const ctx = canvas.getContext("2d");

// Refactor start

class Node {
    constructor(value, parent = null, left = null, right = null) {
        this.value  = value;
        this.left   = left;
        this.right  = right;
        this.parent = parent;
        this.height = 0;
        this.level  = 0;

        this.extras = {
            initialized: false,
            entered: false
        };
    }
}

let delay = 100;

const sleep = ms => new Promise((r) => setTimeout(r, ms));

class BST {
    static async push(node, value, parent = null, level = 0) {
        if (!node) return new Node(value, parent);

        node.extras.highlight = true;
        await sleep(delay);
        node.extras.highlight = false;

        if (value > node.value)
            node.left = await BST.push(node.left, value, node, level + 1);
        else if (value < node.value)
            node.right = await BST.push(node.right, value, node, level + 1);

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
    zoom: 1,
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

const utils = {
    distance(x1, x2, y1, y2) {
        return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
    }
};

let radius = 20;
let padding = 20;
let fontSize = 14; // in pts
let lineWidth = 3;

let inserting = false;


const moveTree = (tree, dx = 0, dy = 0) => {
    if (dx === 0 && dy === 0) return;
    BST.breadthFirstTraverse(tree, (item) => {
        item.extras.x += dx;
        item.extras.x += dy;
    });
};

const fixCollisions = (tree, node) => {
    // const { x: x1, y: y1 } = node.extras;
    // BST.breadthFirstTraverse(tree, (item) => {
    //     if (item.value == node.value) return; // Skip if it's the same node being checked

    //     const { x: x2, y: y2 } = item.extras;
    //     const d = utils.distance(x1, x2, y1, y2);

    let parent = node.parent;
    while (parent) {
        if (node.value > parent.value && node.extras.x <= parent.extras.x) {
            moveTree(parent.left, parent.extras.x - node.extras.x + padding + radius * 2);
            BST.breadthFirstTraverse(parent.left, (item) => {
                fixCollisions(tree, item);
            });
            break;
        } else if (node.value < parent.value && node.extras.x >= parent.extras.x) {
            moveTree(parent.right, -(node.extras.x - parent.extras.x + padding + radius * 2));
            BST.breadthFirstTraverse(parent.right, (item) => {
                fixCollisions(tree, item);
            });
            break;
        }
        parent = parent.parent;
    }
    // });
};

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
        // TODO: Find a better place to call these 2 functions
        fixCollisions(tree, node);
        updateCameraBounds(tree);
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

    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = node.extras.highlight ? "red" : "black";
    ctx.font = `${fontSize}pt Arial`;


    // Draw connection
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

        // const halfLineWidth = lineWidth / 2;

        const d = utils.distance(parent.extras.x, node.extras.x, parent.extras.y, node.extras.y) - radius * 2;

        const end = {
            x: start.x + (d * node.extras.multiplier * Math.cos(angle + Math.PI)),
            y: start.y + (d * node.extras.multiplier * Math.sin(angle + Math.PI))
        };


        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();

        ctx.restore();
    }


    let { x, y } = node.extras;
    ctx.fillStyle = "white";
    ctx.beginPath();

    // Draw circle
    ctx.arc(x, y, node.extras.multiplier * radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fill();



    // Draw text

    ctx.fillStyle = "black";
    if (node.extras.entered) {
        const textMeasurements = ctx.measureText(node.value);
        ctx.fillText(node.value, x - textMeasurements.width / 2, y + ctx.measureText("M").width / 2 - 2);
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
    ctx.scale(camera.zoom, camera.zoom);

    ctx.clearRect(-hWidth * 10, -hHeight * 10, dimensions.width * 10, dimensions.height * 10);

    updateTree(tree);
    renderTree(tree);

    ctx.restore();
    window.requestAnimationFrame(render);
};

resize();
window.requestAnimationFrame(render);


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

canvas.addEventListener("mousedown", ({ clientX, clientY }) => {
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
    const dragDistance = utils.distance(clientX, mouse.downPos.x, clientY, mouse.downPos.y);
    if (!inserting && dragDistance < 2) {
        ((async () => {
            inserting = true;
            tree = await BST.push(tree, Math.round(Math.random() * 1000));
            inserting = false;
        })())
    }
});

window.addEventListener('keydown', ({ keyCode }) => {
    switch (keyCode) {
        case 38: // Up
            camera.zoom += 0.05;
            break;
        case 40: // Down
            camera.zoom -= 0.05;
            break;
    }
});

window.addEventListener("mousemove", ({ clientX, clientY }) => {
    if (mouse.isDown && tree) {
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

const $insert = document.querySelector("#insert");
const $speed = document.querySelector("#speed");

$speed.value = 10;

$insert.addEventListener("keydown", ({ keyCode }) => {
    const { value } = $insert;
    if (!inserting && keyCode === 13) { // Enter
        inserting = true;
        $insert.value = "";
        BST.push(tree, value).then((newTree) => {
            tree = newTree
            inserting = false;
        });
    }
});
