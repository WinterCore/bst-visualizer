import { renderNode, renderHeadsup, updateHeadsup, updateNode } from "./render";
import initHtml from "./html";



const visualizer = {
    canvas: document.querySelector("#canvas"),
    ctx: canvas.getContext("2d"),

    headsup: {
        curPos: {},
        nextPos: {},
        transitioned: true,
        initialized: false,
        multiplier: 0,
    },
    delay: 2000,
    highlightedNode: null,
    info: "",

    dimensions: {
        width: window.innerWidth,
        height: window.innerHeight
    },

    tree: null,

    mouse: {
        downPos: {
            x: 0,
            y: 0
        },
        oldCamera: {
            x: 0,
            y: 0
        },
        isDown: false
    },
    camera: {
        x: 0,
        y: 0,
        zoom: 1,
        bounds: {
            minX: Infinity,
            maxX: -Infinity,
            minY: Infinity,
            maxY: -Infinity
        }
    },

    colors: {
        nodeBorder: "black",
        nodeText: "black",
        nodeBorderHighlight: "red",
        nodeTextHighlight: "red",
        nodeBackground: "white",
        connector: "black",

        headsupBackground: "white",
        headsupColor: "red"
    },

    radius: 30,
    padding: 20,
    fontSize: 14, // in pts
    lineWidth: 5,

    inserting: false,
};

const render = () => {
    const {
        dimensions: { width, height },
        camera,
        highlightedNode,
        headsup,
        ctx
    } = visualizer;

    const hWidth = width / 2,
          hHeight = height / 2;

    ctx.save();
    ctx.translate(hWidth + camera.x, hHeight + camera.y);
    ctx.scale(camera.zoom, camera.zoom);

    ctx.clearRect(-hWidth * 100, -hHeight * 100, width * 200, height * 200);

    updateNode(visualizer, visualizer.tree);
    renderNode(visualizer, visualizer.tree);

    if (highlightedNode) {
        updateHeadsup(visualizer);
        renderHeadsup(visualizer);
    } else {
        headsup.initialized = false;
    }

    ctx.restore();
    window.requestAnimationFrame(render);
};

initHtml(visualizer);
window.requestAnimationFrame(render);

