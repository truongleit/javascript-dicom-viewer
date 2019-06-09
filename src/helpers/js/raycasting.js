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
    camera = new THREE.PerspectiveCamera(45, threeD.offsetWidth / threeD.offsetHeight, 0.1, 100000);
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
    // notify puppeteer to take screenshot
    const puppetDiv = document.createElement('div');
    puppetDiv.setAttribute('id', 'puppeteer');
    document.body.appendChild(puppetDiv);

};