import BST from "./bst";

export default function initHtml(visualizer) {     
    const $insert       = document.querySelector("#insert"),
          $delay        = document.querySelector("#delay"),
          $random       = document.querySelector("#random"),
          $help         = document.querySelector("#help"),
          $downloadLink = document.querySelector("#download-link");

    $delay.value = visualizer.delay;


    const resize = () => {
        const { dimensions, canvas } = visualizer;
        dimensions.width  = window.innerWidth;
        dimensions.height = window.innerHeight;

        canvas.width  = dimensions.width;
        canvas.height = dimensions.height;
    };

    
    window.addEventListener("resize", resize);
    resize();

    canvas.addEventListener("mousedown", ({ clientX, clientY }) => {
        const { mouse, camera, canvas } = visualizer;

        mouse.downPos.x = clientX;
        mouse.downPos.y = clientY;

        mouse.oldCamera.x = camera.x;
        mouse.oldCamera.y = camera.y;

        mouse.isDown = true;
        canvas.style.cursor = "grabbing";
    });

    window.addEventListener("mouseup", () => {
        const { mouse, canvas } = visualizer;
        mouse.isDown = false;
        canvas.style.cursor = "grab";
    });

    window.addEventListener('keydown', ({ key }) => {
        const { camera } = visualizer;
        switch (key) {
            case "ArrowUp": // Up
                camera.zoom += 0.05;
                break;
            case "ArrowDown": // Down
                camera.zoom = Math.max(camera.zoom - 0.05, 0);
                break;
        }
    });

    window.addEventListener("mousemove", ({ clientX, clientY }) => {
        const { mouse, tree, camera } = visualizer;

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

    $insert.parentNode.querySelector("button").addEventListener("click", () => {
        const { value } = $insert;
        if (visualizer.inserting) return;
        if (!value.length || Number.isNaN(+value)) return;

        visualizer.inserting = true;
        $insert.value = "";
        BST.push(visualizer, visualizer.tree, +value).then((newTree) => {
            visualizer.tree = newTree
            visualizer.inserting = false;
        });
    });

    $delay.parentNode.querySelector("button").addEventListener("click", () => {
        const { value } = $delay;
        if (!value.length || Number.isNaN(+value)) return;

        visualizer.delay = +value;
    });


    $random.addEventListener("click", () => {
        if (visualizer.inserting) return;
        visualizer.inserting = true;
        BST.push(visualizer, visualizer.tree, Math.floor(Math.random() * 1000)).then((newTree) => {
            visualizer.tree = newTree
            visualizer.inserting = false;
        }).catch(console.error);
    });

    document.querySelector("#close-help").addEventListener("click", () => {
        $help.style.display = "none";
    });

    document.querySelector("#open-help").addEventListener("click", () => {
        $help.style.display = "block";
    });

    document.querySelector("#download").addEventListener("click", () => {
        if (!visualizer.tree) return;
        const { camera, radius, padding, dimensions, canvas } = visualizer;

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

}