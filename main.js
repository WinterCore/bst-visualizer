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
            new: true
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
    y: 0
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

const renderNode = (node, parent) => {
    if (!node) return;

    ctx.save();

    ctx.lineWidth = 3;
    ctx.strokeStyle = node.extras.highlight ? "red" : "black";

    ctx.beginPath();

    if (node.extras.new) {
        node.extras.radius = 0;
        if (parent) {
            node.extras.x = parent.extras.x + (parent.left === node ? +1 : -1) * (padding + radius * 2);
            node.extras.y = parent.extras.y + padding + radius * 2;
        } else {
            node.extras.x = 0;
            node.extras.y = -(dimensions.height / 2) + padding + radius;
        }
        node.extras.new = false;
    } else {
        if (node.extras.radius < radius) {
            node.extras.radius += 1;
        }
    }

    let { x, y } = node.extras;

    const textMeasurements = ctx.measureText(node.value);

    ctx.arc(x, y, node.extras.radius, 0, Math.PI * 2);
    ctx.fillText(node.value, x - textMeasurements.width / 2, y + ctx.measureText("M").width / 2 - 2);
    ctx.stroke();
    ctx.restore();

    renderNode(node.left, node);
    renderNode(node.right, node);
};

const renderTree = () => {
    if (!tree) return;

    renderNode(tree, null);
};

const render = () => {
    const hWidth = dimensions.width / 2,
          hHeight = dimensions.height / 2;

    ctx.save();

    ctx.translate(hWidth + camera.x, hHeight + camera.y);
    ctx.clearRect(-hWidth * 10, -hHeight * 10, dimensions.width * 10, dimensions.height * 10);

    renderTree();

    ctx.restore();
    window.requestAnimationFrame(render);
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
    if (dragDistance < 8) {
        BST.push(tree, Math.round(Math.random() * 100)).then((t) => tree = t);
    }
});

window.addEventListener("mousemove", ({ clientX, clientY }) => {
    if (mouse.isDown) {
        camera.x = (clientX - mouse.downPos.x) + mouse.oldCamera.x;
        camera.y = (clientY - mouse.downPos.y) + mouse.oldCamera.y;
    }
});


resize();
window.requestAnimationFrame(render);
