let loader2D;
let lpsDims2D;
let worldbb2D;
const colors = {
    red: 0xff0000,
    darkGrey: 0x353535,
};

const r1 = {
    domId: 'sliceX',
    slider: '.index-x',
    domElement: null,
    renderer: null,
    color: 0x121212,
    sliceOrientation: 'sagittal',
    sliceColor: 0xff1744,
    targetID: 1,
    camera: null,
    controls: null,
    scene: null,
    light: null,
    stackHelper: null,
    localizerHelper: null,
    localizerScene: null,
};

const r2 = {
    domId: 'sliceY',
    slider: '.index-y',
    domElement: null,
    renderer: null,
    color: 0x121212,
    sliceOrientation: 'coronal',
    sliceColor: 0xff1744,
    targetID: 1,
    camera: null,
    controls: null,
    scene: null,
    light: null,
    stackHelper: null,
    localizerHelper: null,
    localizerScene: null,
};

const r3 = {
    domId: 'sliceZ',
    slider: '.index-z',
    domElement: null,
    renderer: null,
    color: 0x121212,
    sliceOrientation: 'axial',
    sliceColor: 0xff1744,
    targetID: 1,
    camera: null,
    controls: null,
    scene: null,
    light: null,
    stackHelper: null,
    localizerHelper: null,
    localizerScene: null,
};

function init2D() {
    /**
     * Called on each animation frame
     */
    function animate() {
        render2D();

        // request new frame
        requestAnimationFrame(function() {
            animate();
        });
    }
    // renderers
    initRenderer2D(r1);
    initRenderer2D(r2);
    initRenderer2D(r3);

    // start rendering loop
    animate();
}

function initRenderer2D(object) {
    // Setup renderer2D
    object.domElement = document.getElementById(object.domId);
    object.renderer = new THREE.WebGLRenderer({
        antialias: true,
    });
    object.renderer.setSize(object.domElement.clientWidth, object.domElement.clientHeight);
    object.renderer.setClearColor(0x121212, 1);
    object.renderer.setPixelRatio(window.devicePixelRatio);
    object.domElement.appendChild(object.renderer.domElement);

    object.scene = new THREE.Scene();

    object.camera = new AMI.OrthographicCamera(
        object.domElement.clientWidth / -2,
        object.domElement.clientWidth / 2,
        object.domElement.clientHeight / 2,
        object.domElement.clientHeight / -2,
        1,
        10000
    );

    // Setup controls2D
    object.controls = new AMI.TrackballOrthoControl(object.camera, object.domElement);
    object.controls.staticMoving = true;
    object.controls.noRotate = true;
    object.camera.controls = object.controls;
}

function initHelpersStack(object, stack) {
    object.stackHelper = new AMI.StackHelper(stack);
    object.stackHelper.bbox.visible = false;
    object.stackHelper.border.color = object.sliceColor;
    object.scene.add(object.stackHelper);

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
        width: object.domElement.clientWidth,
        height: object.domElement.clientHeight,
    };

    object.camera.directions = [stack.xCosine, stack.yCosine, stack.zCosine];
    object.camera.box = box2D;
    object.camera.canvas = canvas2D;
    object.camera.orientation = object.sliceOrientation;
    object.camera.invertRows = false;
    object.camera.invertColumns = false;
    object.camera.rotate45 = false;
    object.camera.rotate = 0;
    object.camera.update();
    object.camera.fitBox(2);
    object.stackHelper.orientation = object.camera.stackOrientation;
    object.stackHelper.index = Math.floor(object.stackHelper.orientationMaxIndex / 2);
    object.scene.add(object.stackHelper);
}

function render2D() {

    r1.controls.update();
    r2.controls.update();
    r3.controls.update();
    // r1 //
    r1.renderer.clear();
    r1.renderer.render(r1.scene, r1.camera);
    // r2 //
    r2.renderer.clear();
    r2.renderer.render(r2.scene, r2.camera);
    // r3
    r3.renderer.clear();
    r3.renderer.render(r3.scene, r3.camera);
}

function ray2D(stack) {

    init2D();

    loader2D = new AMI.VolumeLoader();

    loader2D.free();

    initHelpersStack(r1, stack);
    initHelpersStack(r2, stack);
    initHelpersStack(r3, stack);

    $(r1.slider).attr({
        'min': 0,
        'max': r1.stackHelper.stack.dimensionsIJK.z - 1,
        'value': r1.stackHelper.index
    }).next().html(r1.stackHelper.index);

    $(r2.slider).attr({
        'min': 0,
        'max': r2.stackHelper.stack.dimensionsIJK.z - 1,
        'value': r2.stackHelper.index
    }).next().html(r2.stackHelper.index);

    $(r3.slider).attr({
        'min': 0,
        'max': r3.stackHelper.stack.dimensionsIJK.z - 1,
        'value': r3.stackHelper.index
    }).next().html(r3.stackHelper.index);

    render2D();

    function windowResize2D(object) {
        object.camera.canvas = {
            width: object.domElement.clientWidth,
            height: object.domElement.clientHeight,
        };
        object.camera.fitBox(2, 1);
        object.renderer.setSize(
            object.domElement.clientWidth,
            object.domElement.clientHeight
        );

        // update info to draw borders properly
        object.stackHelper.slice.canvasWidth = object.domElement.clientWidth;
        object.stackHelper.slice.canvasHeight = object.domElement.clientHeight;
    }

    function onWindowResize2D() {
        // update 2d
        windowResize2D(r1);
        windowResize2D(r2);
        windowResize2D(r3);
    };
    window.addEventListener('resize', onWindowResize2D, false);

}