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

function buildGUI() {
    let gui = new dat.GUI({
        autoPlace: false,
    });

    let customContainer = document.getElementById('my-gui-container');
    customContainer.appendChild(gui.domElement);

    let stackFolder = gui.addFolder('Settings');
    let algorithmUpdate = stackFolder.add(myStack, 'algorithm', ['ray marching', 'mip']);
    algorithmUpdate.onChange(function(value) {
        vrHelper.algorithm = value === 'mip' ? 1 : 0;
        modified = true;
    });

    let lutUpdate = stackFolder.add(myStack, 'lut', lut.lutsAvailable());
    lutUpdate.onChange(function(value) {
        lut.lut = value;
        vrHelper.uniforms.uTextureLUT.value.dispose();
        vrHelper.uniforms.uTextureLUT.value = lut.texture;
        modified = true;
    });
    // init LUT
    lut.lut = myStack.lut;
    vrHelper.uniforms.uTextureLUT.value.dispose();
    vrHelper.uniforms.uTextureLUT.value = lut.texture;

    let opacityUpdate = stackFolder.add(myStack, 'opacity', lut.lutsAvailable('opacity'));
    opacityUpdate.onChange(function(value) {
        lut.lutO = value;
        vrHelper.uniforms.uTextureLUT.value.dispose();
        vrHelper.uniforms.uTextureLUT.value = lut.texture;
        modified = true;
    });

    let stepsUpdate = stackFolder.add(myStack, 'steps', 0, 512).step(1);
    stepsUpdate.onChange(function(value) {
        if (vrHelper.uniforms) {
            vrHelper.uniforms.uSteps.value = value;
            modified = true;
        }
    });

    let alphaCorrrectionUpdate = stackFolder.add(myStack, 'alphaCorrection', 0, 1).step(0.01);
    alphaCorrrectionUpdate.onChange(function(value) {
        if (vrHelper.uniforms) {
            vrHelper.uniforms.uAlphaCorrection.value = value;
            modified = true;
        }
    });

    let interpolationUpdate = stackFolder.add(vrHelper, 'interpolation', 0, 1).step(1);
    interpolationUpdate.onChange(function(value) {
        if (vrHelper.uniforms) {
            modified = true;
        }
    });

    let shadingUpdate = stackFolder.add(vrHelper, 'shading', 0, 1).step(1);
    shadingUpdate.onChange(function(value) {
        if (vrHelper.uniforms) {
            modified = true;
        }
    });

    let shininessUpdate = stackFolder.add(vrHelper, 'shininess', 0, 20).step(0.1);
    shininessUpdate.onChange(function(value) {
        if (vrHelper.uniforms) {
            modified = true;
        }
    });

    stackFolder.open();
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

window.onload = function() {
    // init threeJS
    init();
    let t1 = ['53320924', '53321068', '53322843', '53322987', '53323131',
        '53323275', '53323419', '53323563', '53323707', '53323851',
        '53323995', '53324139', '53324283', '53325471', '53325615',
        '53325759', '53325903', '53320940', '53321084', '53322859',
        '53323003', '53323147', '53323291', '53323435', '53323579',
        '53323723', '53323867', '53324011', '53324155', '53324299',
        '53325487', '53325631', '53325775', '53325919', '53320956',
        '53322731', '53322875', '53323019', '53323163', '53323307',
        '53323451', '53323595', '53323739', '53323883', '53324027',
        '53324171', '53324315', '53325503', '53325647', '53325791',
        '53325935', '53320972', '53322747', '53322891', '53323035',
        '53323179', '53323323', '53323467', '53323611', '53323755',
        '53323899', '53324043', '53324187', '53325375', '53325519',
        '53325663', '53325807', '53325951', '53320988', '53322763',
        '53322907', '53323051', '53323195', '53323339', '53323483',
        '53323627', '53323771', '53323915', '53324059', '53324203',
        '53325391', '53325535', '53325679', '53325823', '53321004',
        '53322779', '53322923', '53323067', '53323211', '53323355',
        '53323499', '53323643', '53323787', '53323931', '53324075',
        '53324219', '53325407', '53325551', '53325695', '53325839',
        '53321020', '53322795', '53322939', '53323083', '53323227',
        '53323371', '53323515', '53323659', '53323803', '53323947',
        '53324091', '53324235', '53325423', '53325567', '53325711',
        '53325855', '53321036', '53322811', '53322955', '53323099',
        '53323243', '53323387', '53323531', '53323675', '53323819',
        '53323963', '53324107', '53324251', '53325439', '53325583',
        '53325727', '53325871', '53321052', '53322827', '53322971',
        '53323115', '53323259', '53323403', '53323547', '53323691',
        '53323835', '53323979', '53324123', '53324267', '53325455',
        '53325599', '53325743', '53325887'
    ];
    let t2 = [
        '36444280',
        '36444294',
        '36444308',
        '36444322',
        '36444336',
        '36444350',
        '36444364',
        '36444378',
        '36444392',
        '36444406',
        '36748256',
        '36444434',
        '36444448',
        '36444462',
        '36444476',
        '36444490',
        '36444504',
        '36444518',
        '36444532',
        '36746856',
        '36746870',
        '36746884',
        '36746898',
        '36746912',
        '36746926',
        '36746940',
        '36746954',
        '36746968',
        '36746982',
        '36746996',
        '36747010',
        '36747024',
        '36748200',
        '36748214',
        '36748228',
        '36748270',
        '36748284',
        '36748298',
        '36748312',
        '36748326',
        '36748340',
        '36748354',
        '36748368',
        '36748382',
        '36748396',
        '36748410',
        '36748424',
        '36748438',
        '36748452',
        '36748466',
        '36748480',
        '36748494',
        '36748508',
        '36748522',
        '36748242',
    ];

    let files = t2.map(function(v) {
        return 'https://cdn.rawgit.com/FNNDSC/data/master/dicom/adi_brain/' + v;
    });

    // let files = t1.map(function(v) {
    //     return 'http://x.babymri.org/?' + v;
    // });

    // load sequence for each file
    // instantiate the loader
    let loader = new AMI.VolumeLoader(threeD);
    loader
        .load(files)
        .then(() => {
            let series = loader.data[0].mergeSeries(loader.data)[0];
            loader.free();
            loader = null;
            // get first stack from series
            let stack = series.stack[0];

            vrHelper = new AMI.VolumeRenderingHelper(stack);
            // scene
            scene.add(vrHelper);

            // CREATE LUT
            lut = new AMI.LutHelper('my-lut-canvases');
            lut.luts = AMI.LutHelper.presetLuts();
            lut.lutsO = AMI.LutHelper.presetLutsO();
            // update related uniforms
            vrHelper.uniforms.uTextureLUT.value = lut.texture;
            vrHelper.uniforms.uLut.value = 1;

            // update camrea's and interactor's target
            let centerLPS = stack.worldCenter();
            camera.lookAt(centerLPS.x, centerLPS.y, centerLPS.z);
            camera.updateProjectionMatrix();
            controls.target.set(centerLPS.x, centerLPS.y, centerLPS.z);

            console.log(vrHelper);
            // create GUI
            buildGUI();

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
            // notify puppeteer to take screenshot
            const puppetDiv = document.createElement('div');
            puppetDiv.setAttribute('id', 'puppeteer');
            document.body.appendChild(puppetDiv);
        })
        .catch(error => window.console.log(error));
};