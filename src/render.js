import BST from "./bst";
import * as utils from "./utils";

export const moveTree = (tree, dx = 0, dy = 0) => {
    if (dx === 0 && dy === 0) return;
    utils.breadthFirstTraverse(tree, (item) => {
        item.extras.dx += dx;
        item.extras.dy += dy;
        item.extras.transitioned = false;
        item.extras.moveMultiplier = 0;
    });
};

export const fixCollisions = (visualizer, node) => {
    let parent = node.parent;
    const { padding, radius } = visualizer;
    // TODO: Make this better
    while (parent) {
        if (node.value > parent.value && node.extras.dx <= parent.extras.dx) {
            moveTree(parent.right, (parent.extras.dx - node.extras.dx + padding + radius * 2));
            utils.breadthFirstTraverse(parent.right, (item) => {
                fixCollisions(visualizer, item);
            });
            break;
        } else if (node.value < parent.value && node.extras.dx >= parent.extras.dx) {
            moveTree(parent.left, -(node.extras.dx - parent.extras.dx + padding + radius * 2));
            utils.breadthFirstTraverse(parent.left, (item) => {
                fixCollisions(visualizer, item);
            });
            break;
        }
        parent = parent.parent;
    }
};

export const calculateNodePosition = (visualizer, node, parent) => {
    const { radius, padding, dimensions } = visualizer;
    return parent
        ? {
            x: parent.extras.dx + (parent.left === node ? -1 : +1) * (padding + radius * 2),
            y: parent.extras.dy + padding + radius * 2
        } : {
            x: 0,
            y: -(dimensions.height / 2) + padding + radius
        };
};

export const updateNode = (visualizer, node, parent = null) => {
    if (!node) return;
    if (node.extras.dirty) {
        const {x, y} = calculateNodePosition(visualizer, node, parent);
        node.extras.moveMultiplier = 0;
        node.extras.dx = x;
        node.extras.dy = y;
        node.extras.transitioned = false;
        node.extras.dirty = false;
    }

    if (!node.extras.initialized) {
        node.extras.multiplier = 0;
        const {x, y} = calculateNodePosition(visualizer, node, parent);

        node.extras.sx             = x;
        node.extras.sy             = y;
        node.extras.x              = x;
        node.extras.y              = y;
        node.extras.dx             = x;
        node.extras.dy             = y;
        node.extras.transitioned   = true;
        node.extras.moveMultiplier = 0;
        node.extras.initialized = true;
    } else {
        if (!node.extras.entered) {
            node.extras.multiplier += 0.06;
            if (node.extras.multiplier > 1) node.extras.entered = true;
        }

        if (!node.extras.transitioned) {
            const { sx, sy, dx, dy, moveMultiplier } = node.extras;
            if (moveMultiplier >= 1) {
                node.extras.transitioned = true;
                node.extras.sx = dx;
                node.extras.sy = dy;
                node.extras.x = dx;
                node.extras.y = dy;
                node.moveMultiplier = 0;
                return;
            }
            const distance = utils.distance(sx, dx, sy, dy) * moveMultiplier;
            const angle = utils.angle(dx, sx, dy, sy);
            
            node.extras.x = node.extras.sx + distance * Math.cos(angle);
            node.extras.y = node.extras.sy + distance * Math.sin(angle);
            
            node.extras.moveMultiplier += 0.06;
        }
    }

    updateNode(visualizer, node.left, node);
    updateNode(visualizer, node.right, node);
};

export const renderNode = (visualizer, node, parent = null) => {
    if (!node) return;

    const { lineWidth, radius, fontSize, highlightedNode, ctx, colors } = visualizer;

    ctx.save();

    ctx.lineWidth = lineWidth;
    ctx.font = `${fontSize}pt Arial`;


    // Draw connection
    if (parent) {
        ctx.save();

        ctx.strokeStyle = colors.connector;

        const dx = (parent.extras.x - node.extras.x),
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


    // Draw circle
    let { x, y } = node.extras;
    ctx.fillStyle = colors.nodeBackground;
    ctx.strokeStyle = node === highlightedNode ? colors.nodeBorderHighlight  : colors.nodeBorder;
    ctx.beginPath();
    ctx.arc(x, y, node.extras.multiplier * radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fill();



    // Draw text

    ctx.fillStyle = node === highlightedNode ? colors.nodeTextHighlight : colors.nodeText;
    if (node.extras.entered) {
        const textMeasurements = ctx.measureText(node.value);
        ctx.fillText(node.value, x - textMeasurements.width / 2, y + ctx.measureText("M").width / 2 - 2);
    }


    ctx.restore();

    renderNode(visualizer, node.left, node);
    renderNode(visualizer, node.right, node);
};



export const renderHeadsup = (visualizer) => {
    const { radius, headsup, fontSize, ctx, info, lineWidth, colors } = visualizer;

    const { nextPos: { x: nx, y: ny }, curPos : { x: cx, y: cy } } = headsup;
    const distance = utils.distance(nx, cx, ny, cy) * headsup.multiplier;
    const angle = utils.angle(nx, cx, ny, cy);

    const x = distance * Math.cos(angle), y = distance * Math.sin(angle);

    ctx.font = `${fontSize * 0.8}pt Arial`;
    ctx.save();

    const { width } = ctx.measureText(info);
    const { width: height } = ctx.measureText("M");

    const spacing = 10, lineLength = 50;


    ctx.fillStyle = colors.headsupBackground;
    ctx.fillRect(cx + x + radius + spacing, cy + y - height / 2 - spacing, width + spacing * 2, height + spacing);

    ctx.fillStyle = colors.headsupColor;
    ctx.fillText(info, cx + x + radius + spacing * 2, cy + y);


    ctx.strokeStyle = colors.headsupColor;
    ctx.lineWidth = lineWidth;

    const ax = cx + x, ay = cy + y - radius - spacing * 2;

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

export const updateHeadsup = (visualizer) => {
    const { highlightedNode, headsup } = visualizer;
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
        if (headsup.multiplier >= 1) {
            headsup.curPos = {...headsup.nextPos};
            headsup.transitioned = true;
        }
        headsup.multiplier = Math.min(headsup.multiplier + 0.1, 1);
    }
};
