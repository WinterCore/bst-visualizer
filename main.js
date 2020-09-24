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


const headsup = {
    curPos: {},
    nextPos: {},
    transitioned: true,
    initialized: false,
    multiplier: 0,
};

let delay = 2000;
let highlightedNode = null;
let info = "";

const sleep = ms => new Promise((r) => setTimeout(r, ms));

class BST {
    static async push(node, value, parent = null, level = 0) {
        if (!node) {
            info = "";
            highlightedNode = null;
            return new Node(value, parent);
        }

        if (value > node.value) {
            highlightedNode = node;
            info = `Inserting ${value} | ${value} is bigger than ${node.value} so we go right!`;
            await sleep(delay);

            node.right = await BST.push(node.right, value, node, level + 1);
        } else if (value < node.value) {
            highlightedNode = node;
            info = `Inserting ${value} | ${value} is less than ${node.value} so we go left!`;
            await sleep(delay);

            node.left = await BST.push(node.left, value, node, level + 1);
        } else {
            highlightedNode = null;
            info = "";
        }

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
    },
    angle(x1, x2, y1, y2) {
        return Math.atan2(y1 - y2, x1 - x2);
    }
};

let radius = 30;
let padding = 20;
let fontSize = 14; // in pts
let lineWidth = 5;

let inserting = false;


const moveTree = (tree, dx = 0, dy = 0) => {
    if (dx === 0 && dy === 0) return;
    BST.breadthFirstTraverse(tree, (item) => {
        item.extras.x += dx;
        item.extras.x += dy;
    });
};

const fixCollisions = (tree, node) => {

    let parent = node.parent;
    while (parent) {
        if (node.value > parent.value && node.extras.x <= parent.extras.x) {
            moveTree(parent.right, (parent.extras.x - node.extras.x + padding + radius * 2));
            BST.breadthFirstTraverse(parent.right, (item) => {
                fixCollisions(tree, item);
            });
            break;
        } else if (node.value < parent.value && node.extras.x >= parent.extras.x) {
            moveTree(parent.left, -(node.extras.x - parent.extras.x + padding + radius * 2));
            BST.breadthFirstTraverse(parent.left, (item) => {
                fixCollisions(tree, item);
            });
            break;
        }
        parent = parent.parent;
    }
};

const calculateNodePosition = (node, parent) => {
    return parent
        ? {
            x: parent.extras.x + (parent.left === node ? -1 : +1) * (padding + radius * 2),
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
    ctx.strokeStyle = node === highlightedNode ? "red" : "black";
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

const renderHeadsup = (headsup) => {
    const { nextPos: { x: nx, y: ny }, curPos : { x: cx, y: cy } } = headsup;
    const distance = utils.distance(nx, cx, ny, cy) * headsup.multiplier;
    const angle = utils.angle(nx, cx, ny, cy);

    const x = distance * Math.cos(angle), y = distance * Math.sin(angle);

    ctx.font = `${fontSize * 0.8}pt Arial`;
    ctx.save();

    const { width } = ctx.measureText(info);
    const { width: height } = ctx.measureText('M');

    const padding = 10, lineLength = 50;


    ctx.fillStyle = "white";
    ctx.fillRect(cx + x + radius + padding, cy + y - height / 2 - padding, width + padding * 2, height + padding);

    ctx.fillStyle = "red";
    ctx.fillText(info, cx + x + radius + padding * 2, cy + y);


    ctx.strokeStyle = "red";
    ctx.lineWidth = lineWidth;

    const ax = cx + x, ay = cy + y - radius - padding * 2;

    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(ax, ay - lineLength);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(ax, ay + 10);
    ctx.lineTo(ax - 10, ay - 5);
    ctx.lineTo(ax + 10, ay - 5);
    ctx.fill();

    ctx.restore();
};

const updateHeadsup = (headsup, highlightedNode) => {
    const { x: nx, y: ny } = highlightedNode.extras;

    if (!headsup.initialized) {
        headsup.curPos = { x: nx, y: ny };
        headsup.nextPos = { x: nx, y: ny };
        headsup.initialized  = true;
        headsup.transitioned = true;
        return;
    }

    if (headsup.transitioned) {
        headsup.nextPos = { x: nx, y: ny };
        headsup.transitioned = false;
        headsup.multiplier = 0;
    } else {
        if (headsup.multiplier > 1) {
            headsup.curPos = {...headsup.nextPos};
            headsup.transitioned = true;
        }
        headsup.multiplier += 0.05;
    }
};


const render = () => {
    const hWidth = dimensions.width / 2,
          hHeight = dimensions.height / 2;

    ctx.save();
    ctx.translate(hWidth + camera.x, hHeight + camera.y);
    ctx.scale(camera.zoom, camera.zoom);

    ctx.clearRect(-hWidth * 100, -hHeight * 100, dimensions.width * 200, dimensions.height * 200);

    updateTree(tree);
    renderTree(tree);

    if (highlightedNode) {
        updateHeadsup(headsup, highlightedNode);
        renderHeadsup(headsup, highlightedNode);
    } else {
        headsup.initialized = false;
    }

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

window.addEventListener("mouseup", () => {
    mouse.isDown = false;
    canvas.style.cursor = "grab";
});

window.addEventListener('keydown', ({ keyCode }) => {
    switch (keyCode) {
        case 38: // Up
            camera.zoom += 0.05;
            break;
        case 40: // Down
            camera.zoom = Math.max(camera.zoom - 0.05, 0);
            break;
    }
});

window.addEventListener("mousemove", ({ clientX, clientY }) => {
    if (mouse.isDown && tree) {
        const newX = (clientX - mouse.downPos.x) + mouse.oldCamera.x,
              newY = (clientY - mouse.downPos.y) + mouse.oldCamera.y;

        // I have no idea how this even works. it just does
        // const halfWidth = dimensions.width / 2,
        //       halfHeight = dimensions.height / 2,
        //       bxa = newX + halfWidth + camera.bounds.maxX,
        //       bxb = newX - halfWidth + camera.bounds.minX,
        //       bya = newY + halfHeight + camera.bounds.maxY,
        //       byb = newY - halfHeight + camera.bounds.minY;

        // if (bxa < 0) camera.x = -halfWidth - camera.bounds.maxX;
        // else if (bxb > 0) camera.x = halfWidth - camera.bounds.minX;
        // else camera.x = newX;

        // if (bya < 0) camera.y = -halfHeight - camera.bounds.maxY;
        // else if (byb > 0) camera.y = halfHeight - camera.bounds.minY;
        // else camera.y = newY;

        // Disable camera bounds because it does not play well with the zooming functionality.
        camera.x = newX;
        camera.y = newY;
    }
});

const $insert       = document.querySelector("#insert"),
      $delay        = document.querySelector("#delay"),
      $random       = document.querySelector("#random"),
      $help         = document.querySelector("#help"),
      $downloadLink = document.querySelector("#download-link");

$delay.value = delay;

$insert.parentNode.querySelector("button").addEventListener("click", () => {
    const { value } = $insert;
    if (inserting) return;
    if (!value.length || Number.isNaN(+value)) return;

    inserting = true;
    $insert.value = "";
    BST.push(tree, +value).then((newTree) => {
        tree = newTree
        inserting = false;
    });
});

$delay.parentNode.querySelector("button").addEventListener("click", () => {
    const { value } = $delay;
    if (!value.length || Number.isNaN(+value)) return;

    delay = +value;
});


$random.addEventListener("click", () => {
    if (inserting) return;
    inserting = true;
    BST.push(tree, Math.floor(Math.random() * 1000)).then((newTree) => {
        tree = newTree
        inserting = false;
    });
});

document.querySelector("#close-help").addEventListener("click", () => {
    $help.style.display = "none";
});

document.querySelector("#open-help").addEventListener("click", () => {
    $help.style.display = "block";
});

document.querySelector("#download").addEventListener("click", () => {
    const zoom = camera.zoom;
    const oldCam = { x: camera.x, y: camera.y };
    const spacing = (radius + padding) * 2;
    camera.zoom = 1;
    camera.x = -camera.bounds.minX - dimensions.width / 2 + spacing / 2;
    camera.y = -camera.bounds.minY - dimensions.height / 2 + spacing / 2;
    canvas.width = camera.bounds.maxX - camera.bounds.minX + spacing;
    canvas.height = camera.bounds.maxY - camera.bounds.minY + spacing;
    setTimeout(() => {
        const data = canvas.toDataURL("image/png"),
              filename = `bst_${Date.now()}.png`;

        $downloadLink.href = data;
        $downloadLink.download = filename;
        $downloadLink.click();
        camera.zoom = zoom;
        canvas.width = dimensions.width;
        canvas.height = dimensions.height;
        camera.x = oldCam.x;
        camera.y = oldCam.y;
    }, 100);
});
