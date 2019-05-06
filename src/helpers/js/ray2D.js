let container2D;
let renderer2D;
let camera2D;
let controls2D;
let scene2D;
let loader2D;
let lpsDims2D;
let stackHelper2D;
let worldbb2D;
const colors = {
    red: 0xff0000,
    darkGrey: 0x353535,
};

function ray2D(dom, stack, orientation) {
    // Setup renderer2D
    container2D = document.getElementById(dom);
    renderer2D = new THREE.WebGLRenderer({
        antialias: true,
    });
    renderer2D.setSize(container2D.offsetWidth, container2D.offsetHeight);
    renderer2D.setClearColor(colors.darkGrey, 1);
    renderer2D.setPixelRatio(window.devicePixelRatio);
    container2D.appendChild(renderer2D.domElement);

    scene2D = new THREE.Scene();

    camera2D = new AMI.OrthographicCamera(
        container2D.clientWidth / -2,
        container2D.clientWidth / 2,
        container2D.clientHeight / 2,
        container2D.clientHeight / -2,
        0.1,
        10000
    );

    // Setup controls2D
    controls2D = new AMI.TrackballOrthoControl(camera2D, container2D);
    controls2D.staticMoving = true;
    controls2D.noRotate = true;
    camera2D.controls = controls2D;

    const onWindowResize2D = () => {
        camera2D.canvas2D = {
            width: container2D.offsetWidth,
            height: container2D.offsetHeight,
        };
        camera2D.fitBox(2);

        renderer2D.setSize(container2D.offsetWidth, container2D.offsetHeight);
    };
    window.addEventListener('resize', onWindowResize2D, false);

    loader2D = new AMI.VolumeLoader(container2D);

    loader2D.free();

    stackHelper2D = new AMI.StackHelper(stack);
    stackHelper2D.bbox.visible = false;
    stackHelper2D.border.color = colors.red;
    scene2D.add(stackHelper2D);

    // center camera2D and interactor to center of bouding box2D
    // for nicer experience
    // set camera2D
    worldbb2D = stack.worldBoundingBox();
    lpsDims2D = new THREE.Vector3(
        worldbb2D[1] - worldbb2D[0],
        worldbb2D[3] - worldbb2D[2],
        worldbb2D[5] - worldbb2D[4]
    );

    const box2D = {
        center: stack.worldCenter().clone(),
        halfDimensions: new THREE.Vector3(lpsDims2D.x + 10, lpsDims2D.y + 10, lpsDims2D.z + 10),
    };

    // init and zoom
    const canvas2D = {
        width: container2D.clientWidth,
        height: container2D.clientHeight,
    };

    camera2D.directions = [stack.xCosine, stack.yCosine, stack.zCosine];
    camera2D.box = box2D;
    camera2D.canvas = canvas2D;
    camera2D.orientation = orientation;
    camera2D.invertRows = false;
    camera2D.invertColumns = false;
    camera2D.rotate45 = false;
    camera2D.rotate = 0;
    camera2D.update();
    camera2D.fitBox(2);
    stackHelper2D.orientation = camera2D.stackOrientation;
    gui(stackHelper2D);

    animate2D = () => {
        controls2D.update();
        renderer2D.render(scene2D, camera2D);

        requestAnimationFrame(function() {
            animate2D();
        });
    };

    animate2D();
}


function gui() {
    const gui = new dat.GUI({
        autoPlace: false,
    });

    const customContainer = document.getElementById('my-gui-container');
    customContainer.appendChild(gui.domElement);
    const camUtils = {
        invertRows: false,
        invertColumns: false,
        rotate45: false,
        rotate: 0,
        orientation: 'default',
        convention: 'radio',
    };

    // camera2D
    const cameraFolder = gui.addFolder('camera2D');
    const invertRows = cameraFolder.add(camUtils, 'invertRows');
    invertRows.onChange(() => {
        camera2D.invertRows();
    });

    const invertColumns = cameraFolder.add(camUtils, 'invertColumns');
    invertColumns.onChange(() => {
        camera2D.invertColumns();
    });

    const rotate45 = cameraFolder.add(camUtils, 'rotate45');
    rotate45.onChange(() => {
        camera2D.rotate();
    });

    cameraFolder
        .add(camera2D, 'angle', 0, 360)
        .step(1)
        .listen();

    const orientationUpdate = cameraFolder.add(camUtils, 'orientation', [
        'default',
        'axial',
        'coronal',
        'sagittal',
    ]);
    orientationUpdate.onChange(value => {
        camera2D.orientation = value;
        camera2D.update();
        camera2D.fitBox(2);
        stackHelper2D.orientation = camera2D.stackOrientation;
    });

    const conventionUpdate = cameraFolder.add(camUtils, 'convention', ['radio', 'neuro']);
    conventionUpdate.onChange(value => {
        camera2D.convention = value;
        camera2D.update();
        camera2D.fitBox(2);
    });

    cameraFolder.open();

    const stackFolder = gui.addFolder('stacks2D');
    stackFolder
        .add(stackHelper2D, 'index', 0, stackHelper2D.stack.dimensionsIJK.z - 1)
        .step(1)
        .listen();
    stackFolder
        .add(stackHelper2D.slice, 'interpolation', 0, 1)
        .step(1)
        .listen();
    stackFolder.open();
};