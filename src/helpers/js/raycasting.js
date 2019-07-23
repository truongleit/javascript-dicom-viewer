/* globals Stats, dat*/

// standard global letiables
let controls;
let threeD;
let renderer;
let stats;
let camera;
let scene;
let vrHelper;
let lut;
let ready = false;
let modified = false;
let wheel = null;
let wheelTO = null;
let seriesContainer = [];
let loader = new AMI.VolumeLoader(threeD);

let myStack = {
    algorithm: 'ray marching',
    lut: 'random',
    opacity: 'random',
    steps: 128,
    alphaCorrection: 0.5,
    frequence: 0,
    amplitude: 0,
    interpolation: 1,
};

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

function readMultipleFiles(files) {
    /**
     * Load sequence
     */
    function loadSequence(index, files) {
        return (
            Promise.resolve()
            // load the file
            .then(function() {
                return new Promise(function(resolve, reject) {
                    let myReader = new FileReader();
                    // should handle errors too...
                    myReader.addEventListener('load', function(e) {
                        resolve(e.target.result);
                    });
                    myReader.readAsArrayBuffer(files[index]);
                });
            })
            .then(function(buffer) {
                return loader.parse({ url: files[index].name, buffer });
            })
            .then(function(series) {
                seriesContainer.push(series);
            })
            .catch(function(error) {
                window.console.log('oops... something went wrong...');
                window.console.log(error);
            })
        );
    }

    /**
     * Load group sequence
     */
    function loadSequenceGroup(files) {
        const fetchSequence = [];

        for (let i = 0; i < files.length; i++) {
            fetchSequence.push(
                new Promise((resolve, reject) => {
                    const myReader = new FileReader();
                    // should handle errors too...
                    myReader.addEventListener('load', function(e) {
                        resolve(e.target.result);
                    });
                    myReader.readAsArrayBuffer(files[i].file);
                }).then(function(buffer) {
                    return { url: files[i].file.name, buffer };
                })
            );
        }

        return Promise.all(fetchSequence)
            .then(rawdata => {
                return loader.parse(rawdata);
            })
            .then(function(series) {
                seriesContainer.push(series);
            })
            .catch(function(error) {
                window.console.log('oops... something went wrong...');
                window.console.log(error);
            });
    }

    const loadSequenceContainer = [];

    const data = [];
    const dataGroups = [];
    // convert object into array
    for (let i = 0; i < files.length; i++) {
        let dataUrl = new AMI.UtilsCore.parseUrl(files[i].name);
        if (
            dataUrl.extension.toUpperCase() === 'MHD' ||
            dataUrl.extension.toUpperCase() === 'RAW' ||
            dataUrl.extension.toUpperCase() === 'ZRAW'
        ) {
            dataGroups.push({
                file: files[i],
                extension: dataUrl.extension.toUpperCase(),
            });
        } else {
            data.push(files[i]);
        }
    }

    // check if some files must be loaded together
    if (dataGroups.length === 2) {
        // if raw/mhd pair
        const mhdFile = dataGroups.filter(_filterByExtension.bind(null, 'MHD'));
        const rawFile = dataGroups.filter(_filterByExtension.bind(null, 'RAW'));
        const zrawFile = dataGroups.filter(_filterByExtension.bind(null, 'ZRAW'));
        if (mhdFile.length === 1 && (rawFile.length === 1 || zrawFile.length === 1)) {
            loadSequenceContainer.push(loadSequenceGroup(dataGroups));
        }
    }

    // load the rest of the files
    for (let i = 0; i < data.length; i++) {
        loadSequenceContainer.push(loadSequence(i, data));
    }

    // run the load sequence
    // load sequence for all files
    Promise.all(loadSequenceContainer)
        .then(function() {
            setTimeout(function() {
                rayCasting(seriesContainer);
            }, 1000);
        })
        .catch(function(error) {
            window.console.log('oops... something went wrong...');
            window.console.log(error);
        });
}

function onStart(event) {
    if (vrHelper && vrHelper.uniforms && !wheel) {
        renderer.setPixelRatio(0.1 * window.devicePixelRatio);
        renderer.setSize(threeD.offsetWidth, threeD.offsetHeight);
        modified = true;
    }
}

function onEnd(event) {
    if (vrHelper && vrHelper.uniforms && !wheel) {
        renderer.setPixelRatio(0.5 * window.devicePixelRatio);
        renderer.setSize(threeD.offsetWidth, threeD.offsetHeight);
        modified = true;

        setTimeout(function() {
            renderer.setPixelRatio(window.devicePixelRatio);
            renderer.setSize(threeD.offsetWidth, threeD.offsetHeight);
            modified = true;
        }, 100);
    }
}

function onWheel() {
    if (!wheel) {
        renderer.setPixelRatio(0.1 * window.devicePixelRatio);
        renderer.setSize(threeD.offsetWidth, threeD.offsetHeight);
        wheel = Date.now();
    }

    if (Date.now() - wheel < 300) {
        clearTimeout(wheelTO);
        wheelTO = setTimeout(function() {
            renderer.setPixelRatio(0.5 * window.devicePixelRatio);
            renderer.setSize(threeD.offsetWidth, threeD.offsetHeight);
            modified = true;

            setTimeout(function() {
                renderer.setPixelRatio(window.devicePixelRatio);
                renderer.setSize(threeD.offsetWidth, threeD.offsetHeight);
                wheel = null;
                modified = true;
            }, 100);
        }, 300);
    }

    modified = true;
}

function onWindowResize() {
    // update the camera
    camera.aspect = threeD.offsetWidth / threeD.offsetHeight;
    camera.updateProjectionMatrix();

    // notify the renderer of the size change
    renderer.setSize(threeD.offsetWidth, threeD.offsetHeight);
    modified = true;
}

function render() {
    // render
    controls.update();

    if (ready && modified) {
        renderer.render(scene, camera);
        modified = false;
    }

    stats.update();
}

function init() {
    // this function is executed on each animation frame
    function animate() {
        render();

        // request new frame
        requestAnimationFrame(function() {
            animate();
        });
    }

    // renderer
    threeD = document.getElementById('3d');
    renderer = new THREE.WebGLRenderer({
        alpha: true,
    });
    renderer.setSize(threeD.offsetWidth, threeD.offsetHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    threeD.appendChild(renderer.domElement);

    // scene
    scene = new THREE.Scene();

    // stats
    stats = new Stats();
    stats.domElement.className = 'statistics';
    threeD.appendChild(stats.domElement);

    // camera
    camera = new THREE.PerspectiveCamera(25, threeD.offsetWidth / threeD.offsetHeight, 0.1, 100000);
    camera.position.x = 166;
    camera.position.y = -471;
    camera.position.z = 153;
    camera.up.set(-0.42, 0.86, 0.26);

    // controls
    controls = new AMI.TrackballControl(camera, threeD);
    controls.rotateSpeed = 5.5;
    controls.zoomSpeed = 1.2;
    controls.panSpeed = 0.8;
    controls.staticMoving = true;
    controls.dynamicDampingFactor = 0.3;
    controls.addEventListener('change', () => {
        modified = true;
    });
    controls.addEventListener('start', onStart);
    controls.addEventListener('end', onEnd);

    window.addEventListener('resize', onWindowResize, false);
    renderer.domElement.addEventListener('wheel', onWheel);
    // start rendering loop
    animate();
}

// window.onload = function() {
function rayCasting(files) {
    // init threeJS
    init();
    // load sequence for each file
    let stack = seriesContainer[0].mergeSeries(seriesContainer)[0].stack[0];
    vrHelper = new AMI.VolumeRenderingHelper(stack);
    // scene
    scene.add(vrHelper);

    // CREATE LUT
    lut = new AMI.LutHelper('my-lut-canvases');
    lut.luts = AMI.LutHelper.presetLuts();
    lut.lutsO = AMI.LutHelper.presetLutsO();

    let lutList = lut.lutsAvailable().sort();
    for (i = 0; i < lutList.length; i++) {
        let lutTitle = lutList[i].replace(/_/g, ' ').capitalize();
        let lutOption = lutList[i] == 'default' ? '<option selected value="' + lutList[i] + '">' + lutTitle + '</option>' : '<option value="' + lutList[i] + '">' + lutTitle + '</option>';
        $('.ray-lut select').append(lutOption).formSelect();
    }

    let opacityList = lut.lutsAvailable('opacity');
    for (i = 0; i < opacityList.length; i++) {
        let opacityTitle = opacityList[i].replace(/_/g, ' ').capitalize();
        let opacityOption = opacityList[i] == 'linear_full' ? '<option selected value="' + opacityList[i] + '">' + opacityTitle + '</option>' : '<option value="' + opacityList[i] + '">' + opacityTitle + '</option>';
        $('.ray-opacity select').append(opacityOption).formSelect();
    }

    // update related uniforms
    vrHelper.uniforms.uTextureLUT.value = lut.texture;
    vrHelper.uniforms.uLut.value = 1;
    // update camrea's and interactor's target
    let centerLPS = stack.worldCenter();
    camera.lookAt(centerLPS.x, centerLPS.y, centerLPS.z);
    camera.updateProjectionMatrix();
    controls.target.set(centerLPS.x, centerLPS.y, centerLPS.z);
    // create GUI
    // buildGUI();

    $('.ray-setting').removeClass('hidden');
    // screenshot experiment
    let screenshotElt = document.getElementById('screenshot');
    screenshotElt.addEventListener('click', function() {
        controls.update();

        if (ready) {
            renderer.render(scene, camera);
        }

        let screenshot = renderer.domElement.toDataURL();
        screenshotElt.download = 'AMI-' + Date.now() + '.png';
        screenshotElt.href = screenshot;
    });

    // good to go
    ready = true;
    modified = true;

    // force first render
    render();
    ray2D(stack);

    $('.loading-render').addClass('animated fadeOutDown');
    var t1 = performance.now();
    console.log("Call to doSomething took " + (t1 - t0) + " milliseconds.")
        // notify puppeteer to take screenshot
    const puppetDiv = document.createElement('div');
    puppetDiv.setAttribute('id', 'puppeteer');
    document.body.appendChild(puppetDiv);

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