var files = [];
var _dataArray = [];
var _filenames = [];
var counter;
var reader;
var v;
var sliceX, sliceY, sliceZ;
var threeD;
var check = 0;
////
// standard global letiables
var controls;
var threeDee;
var renderer;
var stats;
var camera;
var scene;
var vrHelper;
var lut;
var ready = false;

var myStack = {
    lut: 'random',
    opacity: 'random',
    steps: 256,
    alphaCorrection: 0.5,
    interpolation: 1
};
///////

$(document).ready(function() {

    $(".z-change").bind('keyup mousemove', function() {
        var value = $(this).val();
        var slideValue = value + " %";
        volume.indexZ = parseInt(value);
    });

    $(".x-change").bind('keyup mousemove', function() {
        var value = $(this).val();
        var slideValue = value + " %";
        volume.indexX = parseInt(value);
    });

    $(".y-change").bind('keyup mousemove', function() {
        var value = $(this).val();
        var slideValue = value + " %";
        volume.indexY = parseInt(value);
    });

    $('.slider').slick({
        infinite: true,
        slidesToShow: 1,
        autoplay: true,
        autoplaySpeed: 5000
    });
    $('.upload-button').click(function() {
        $('#file_inp').trigger('click');
    });

    $("#file_inp").change(function() {


        // get input files 
        files = document.getElementById("file_inp").files;
        //
        // render list of DICOM thumbnails
        var total = files.length;
        renderThumbnails(total, files);
        //
        setTimeout(function() {
            // open the viewer 
            $('.viewer').css('transform', 'scale(1)');
            $('.viewer').addClass('opened');
            //
        }, 1000);

        if (check == 1) {
            initTexturebasedRendering();
        } else {
            init();
        }

        counter = files.length;
        reader = new FileReader();

        recursiveLoading(0);

    });
});


function recursiveLoading(idx) {
    if (counter > 0) {
        reader.onload = function(file) {
            var arrayBuffer = reader.result;
            var byteArray = new Uint8Array(arrayBuffer);
            _filenames[idx] = file.name + ".DCM";
            _dataArray[idx] = arrayBuffer;
            counter--;
            recursiveLoading(idx + 1);
        };
        reader.readAsArrayBuffer(files[idx]);
    } else {
        //
        // Texture-base Volume Rendering
        //
        if (check == 1) {
            volume = new X.volume();
            volume.file = _filenames;
            console.log(volume.file);
            volume.filedata = _dataArray;
            console.log(volume.filedata);
            texturebasedRendering(volume);
        } else {
            const filenames = [
                '53320924', '53321068', '53322843', '53322987', '53323131',
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
            const files = filenames.map(filename => {
                return `http://x.babymri.org/?${filename}`;
            });
            rayCastingRendering(files);
        }
    }
};

function renderThumbnails(amount, file) {
    var divData = [];
    for (let i = 0; i < amount; i++) {
        $('.files-bar').append('<div id="dicomImage' + (i + 1) + '" class="file"></div>');
        var divName = '#dicomImage' + (i + 1);
        var element = $(divName).get(0);
        $(divName).append('<div class="slice-number">' + (i + 1) + '</div>')
        cornerstone.enable(element);
        divData.push(element);
    }
    for (let i = 0; i < amount; i++) {
        var file = files[i];
        var index = cornerstoneFileImageLoader.addFile(file);
        var imageId = "dicomfile://" + index;
        cornerstone.loadImage(imageId).then(function(image) {
            cornerstone.displayImage(divData[i], image);
        });
    }
}

function initTexturebasedRendering() {
    // try to create the 3D renderer
    _webGLFriendly = true;
    try {
        // try to create and initialize a 3D renderer
        threeD = new X.renderer3D();
        threeD.container = '3d';
        threeD.init();
        threeD.camera.position = [0, 400, 0];
    } catch (Exception) {
        // no webgl on this machine
        _webGLFriendly = false;
    }
    // create the 2D renderers
    // .. for the X orientation
    sliceX = new X.renderer2D();
    sliceX.container = 'sliceX';
    sliceX.orientation = 'SAGITTAL';
    sliceX.init();
    // .. for Y
    sliceY = new X.renderer2D();
    sliceY.container = 'sliceY';
    sliceY.orientation = 'CORONAL';
    sliceY.init();
    // .. and for Z
    sliceZ = new X.renderer2D();
    sliceZ.container = 'sliceZ';
    sliceZ.orientation = 'AXIAL';
    sliceZ.init();
    // we create the X.volume container and attach all DICOM files
    v = new X.volume();
}

function texturebasedRendering(volume) {
    if (_webGLFriendly) {
        volume.volumeRendering = true;
        volume.opacity = 0.3;
        volume.windowHigh = 1506;
        volume.lowerThreshold = 200;
        threeD.add(volume);
        threeD.render();
    }
    threeD.onShowtime = function() {
        //
        // add the volume to the other 3 renderers
        //
        sliceX.add(volume);
        sliceX.render();
        sliceY.add(volume);
        sliceY.render();
        sliceZ.add(volume);
        sliceZ.render();
        //
        // now the real GUI
        var gui = new dat.GUI({ autoPlace: false });
        $('.render-container').append(gui.domElement);
        // the following configures the gui for interacting with the X.volume
        var volumegui = gui.addFolder('Volume');
        // now we can configure controllers which..
        // .. switch between slicing and volume rendering
        var vrController = volumegui.add(volume, 'volumeRendering');
        // .. configure the volume rendering opacity
        var opacityController = volumegui.add(volume, 'opacity', 0, 1);
        // .. and the threshold in the min..max range
        var lowerThresholdController = volumegui.add(volume, 'lowerThreshold',
            volume.min, volume.max);
        var upperThresholdController = volumegui.add(volume, 'upperThreshold',
            volume.min, volume.max);
        var lowerWindowController = volumegui.add(volume, 'windowLow', volume.min,
            volume.max);
        var upperWindowController = volumegui.add(volume, 'windowHigh', volume.min,
            volume.max);
        // the indexX,Y,Z are the currently displayed slice indices in the range
        // 0..dimensions-1
        var sliceXController = volumegui.add(volume, 'indexX', 0,
            volume.dimensions[0] - 1);
        var sliceYController = volumegui.add(volume, 'indexY', 0,
            volume.dimensions[1] - 1);
        var sliceZController = volumegui.add(volume, 'indexZ', 0,
            volume.dimensions[2] - 1);
        $('.z-change').attr({
            'max': (volume.dimensions[2] - 1),
            'value': volume.indexZ
        });
        $('.y-change').attr({
            'max': (volume.dimensions[1] - 1),
            'value': volume.indexY
        });
        $('.x-change').attr({
            'max': (volume.dimensions[0] - 1),
            'value': volume.indexX
        });
        volumegui.open();
    };
}

/**
 * Handle mouse down event
 */
function onMouseDown() {
    if (vrHelper && vrHelper.uniforms) {
        vrHelper.uniforms.uSteps.value = Math.floor(myStack.steps / 2);
        vrHelper.interpolation = 0;
    }
}

/**
 * Handle mouse up event
 */
function onMouseUp() {
    if (vrHelper && vrHelper.uniforms) {
        vrHelper.uniforms.uSteps.value = myStack.steps;
        vrHelper.interpolation = myStack.interpolation;
    }
}

/**
 * Handle window resize event
 */
function onWindowResize() {
    // update the camera
    camera.aspect = threeDee.offsetWidth / threeDee.offsetHeight;
    camera.updateProjectionMatrix();

    // notify the renderer of the size change
    renderer.setSize(threeDee.offsetWidth, threeDee.offsetHeight);
}

/**
 * Build GUI
 */
function buildGUI() {
    var gui = new dat.GUI({
        autoPlace: false
    });

    var customContainer = document.getElementById('my-gui-container');
    customContainer.appendChild(gui.domElement);

    var stackFolder = gui.addFolder('Settings');
    // var lutUpdate = stackFolder.add(myStack, 'lut', lut.lutsAvailable());
    // lutUpdate.onChange(function(value) {
    //     lut.lut = value;
    //     vrHelper.uniforms.uTextureLUT.value.dispose();
    //     vrHelper.uniforms.uTextureLUT.value = lut.texture;
    // });
    // init LUT
    // lut.lut = myStack.lut;
    // vrHelper.uniforms.uTextureLUT.value.dispose();
    // vrHelper.uniforms.uTextureLUT.value = lut.texture;

    // var opacityUpdate = stackFolder.add(myStack, 'opacity', lut.lutsAvailable('opacity'));
    // opacityUpdate.onChange(function(value) {
    //     lut.lutO = value;
    //     vrHelper.uniforms.uTextureLUT.value.dispose();
    //     vrHelper.uniforms.uTextureLUT.value = lut.texture;
    // });

    var stepsUpdate = stackFolder.add(myStack, 'steps', 0, 512).step(1);
    stepsUpdate.onChange(function(value) {
        if (vrHelper.uniforms) {
            vrHelper.uniforms.uSteps.value = value;
        }
    });

    var alphaCorrrectionUpdate = stackFolder.add(myStack, 'alphaCorrection', 0, 1).step(0.01);
    alphaCorrrectionUpdate.onChange(function(value) {
        if (vrHelper.uniforms) {
            vrHelper.uniforms.uAlphaCorrection.value = value;
        }
    });

    stackFolder.add(vrHelper, 'interpolation', 0, 1).step(1);

    stackFolder.open();
}

/**
 * Init the scene
 */
function init() {
    /**
     * Rendering loop
     */
    function animate() {
        // render
        controls.update();

        if (ready) {
            renderer.render(scene, camera);
        }

        stats.update();

        // request new frame
        requestAnimationFrame(function() {
            animate();
        });
    }

    // renderer
    threeDee = document.getElementById('3d');
    renderer = new THREE.WebGLRenderer({
        alpha: true
    });
    renderer.setSize(threeDee.offsetWidth, threeDee.offsetHeight);
    threeDee.appendChild(renderer.domElement);

    // stats
    stats = new Stats();
    threeDee.appendChild(stats.domElement);

    // scene
    scene = new THREE.Scene();

    // camera
    camera = new THREE.PerspectiveCamera(45, threeDee.offsetWidth / threeDee.offsetHeight, 0.1, 100000);
    camera.position.x = 150;
    camera.position.y = 400;
    camera.position.z = -350;
    camera.up.set(-0.42, 0.86, 0.26);

    // controls
    controls = new AMI.TrackballControl(camera, threeDee);
    controls.rotateSpeed = 5.5;
    controls.zoomSpeed = 1.2;
    controls.panSpeed = 0.8;
    controls.staticMoving = true;
    controls.dynamicDampingFactor = 0.3;

    threeDee.addEventListener('mousedown', onMouseDown, false);
    threeDee.addEventListener('mouseup', onMouseUp, false);
    window.addEventListener('resize', onWindowResize, false);

    // start rendering loop
    animate();
}

function rayCastingRendering(files) {
    var loader = new AMI.VolumeLoader(threeDee);
    loader.load(files).then(function() {
        var series = loader.data[0].mergeSeries(loader.data)[0];
        loader.free();
        loader = null;
        // get first stack from series
        var stack = series.stack[0];

        vrHelper = new AMI.VolumeRenderingHelper(stack);
        // scene
        scene.add(vrHelper);

        // CREATE LUT
        // lut = new AMI.LutHelper('my-tf');
        // lut.luts = AMI.LutHelper.presetLuts();
        // lut.lutsO = AMI.LutHelper.presetLutsO();
        // update related uniforms
        // vrHelper.uniforms.uTextureLUT.value = lut.texture;
        // vrHelper.uniforms.uLut.value = 1;

        // update camrea's and interactor's target
        var centerLPS = stack.worldCenter();
        camera.lookAt(centerLPS.x, centerLPS.y, centerLPS.z);
        camera.updateProjectionMatrix();
        controls.target.set(centerLPS.x, centerLPS.y, centerLPS.z);

        // create GUI
        buildGUI();

        ready = true;
    });
}