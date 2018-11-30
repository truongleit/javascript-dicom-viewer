var files = [];
var _dataArray = [];
var _filenames = [];
var counter;
var reader;
var v;
var sliceX, sliceY, sliceZ;
var threeD;

$(document).ready(function() {

    $(".z-change").bind('keyup mousemove', function() {
        var value = $(this).val();
        var slideValue = value + " %";
        volume.indexZ = parseInt(value);
    });

    $(".x-change").bind('keyup mousemove', function() {
        var value = $(this).val();
        var slideValue = value + " %";
        volume.indexY = parseInt(value);
    });

    $(".y-change").bind('keyup mousemove', function() {
        var value = $(this).val();
        var slideValue = value + " %";
        volume.indexX = parseInt(value);
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

        // open the viewer 
        $('.viewer').css('transform', 'scale(1)');
        $('.viewer').addClass('opened');
        //
        // get input files 
        files = document.getElementById("file_inp").files;
        //
        // render list of DICOM thumbnails
        var total = files.length;
        renderThumbnails(total, files);
        //
        initTexturebasedRendering();

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
        volume = new X.volume();
        volume.file = _filenames;
        volume.filedata = _dataArray;
        texturebasedRendering(volume);

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
        volume.lowerThreshold = 80;
        volume.opacity = 0.3;
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