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
    $('.minimize').click(function() {
        $('.viewer').removeClass('open');
        $('.viewer').addClass('close');
    });

    $("#file_inp").change(function() {

        $('.viewer').removeClass('close');
        $('.viewer').addClass('open');

        // Get input files 
        files = document.getElementById("file_inp").files;
        //
        // render list of DICOM thumbnails
        //
        var total = files.length;
        var divData = [];
        // This loop for creating div-s works fine
        for (let i = 0; i < total; i++) {
            $('.files-bar').append('<div id="dicomImage' + (i + 1) + '" class="file"></div>');
            var divName = '#dicomImage' + (i + 1);
            var element = $(divName).get(0);
            $(divName).append('<div class="slice-number">' + (i + 1) + '</div>')
            cornerstone.enable(element);
            divData.push(element);
        }
        for (let i = 0; i < total; i++) {
            var file = files[i];
            var index = cornerstoneFileImageLoader.addFile(file);
            var imageId = "dicomfile://" + index;
            cornerstone.loadImage(imageId).then(function(image) {
                cornerstone.displayImage(divData[i], image);
            });
        }
        //
        //
        // try to create the 3D renderer
        //
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
        //
        // create the 2D renderers
        // .. for the X orientation
        sliceX = new X.renderer2D();
        sliceX.container = 'sliceX';
        sliceX.orientation = 'AXIAL';
        sliceX.init();
        // .. for Y
        sliceY = new X.renderer2D();
        sliceY.container = 'sliceY';
        sliceY.orientation = 'SAGITTAL';
        sliceY.init();
        // .. and for Z
        sliceZ = new X.renderer2D();
        sliceZ.container = 'sliceZ';
        sliceZ.orientation = 'CORONAL';
        sliceZ.init();
        // we create the X.volume container and attach all DICOM files
        v = new X.volume();

        //v.file = urls;

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
            _dataArray[idx] = arrayBuffer; // _dataArray[idx] = byteArray.buffer; // Alternative!
            //_filenames.push(file.name + ".DCM");
            //_dataArray.push(arrayBuffer);
            counter--;
            recursiveLoading(idx + 1);
        };
        reader.readAsArrayBuffer(files[idx]);
    } else {
        //
        // THE VOLUME DATA
        //
        // create a X.volume
        volume = new X.volume();
        // .. and attach the single-file dicom in .NRRD format
        // this works with gzip/gz/raw encoded NRRD files but XTK also supports other
        // formats like MGH/MGZ
        volume.file = _filenames;
        volume.filedata = _dataArray;
        //
        // we also attach a label map to show segmentations on a slice-by-slice base
        //volume.labelmap.file = 'http://x.babymri.org/?seg.nrrd';
        // .. and use a color table to map the label map values to colors
        //volume.labelmap.colortable.file = 'http://x.babymri.org/?genericanatomy.txt';

        // add the volume in the main renderer
        // we choose the sliceX here, since this should work also on
        // non-webGL-friendly devices like Safari on iOS
        sliceX.add(volume);

        // start the loading/rendering
        sliceX.render();


        //
        // THE GUI
        //
        // the onShowtime method gets executed after all files were fully loaded and
        // just before the first rendering attempt
        sliceX.onShowtime = function() {

            // renderThumbnails(volume.image);

            //
            // add the volume to the other 3 renderers
            //
            sliceY.add(volume);
            sliceY.render();
            sliceZ.add(volume);
            sliceZ.render();
            //
            if (_webGLFriendly) {
                // 3d configuration
                // volume.volumeRendering = true;
                volume.lowerThreshold = 80;
                volume.windowLower = 115;
                volume.windowHigh = 360;
                // volume.minColor = [0, 0.06666666666666667, 1];
                // volume.maxColor = [0.5843137254901961, 1, 0];
                volume.opacity = 0.2;
                // 3d render
                threeD.add(volume);
                threeD.render();
            }

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
};

function renderThumbnails(input) {
    for (var z = 0; z < input.length; z++) {
        var array = input[z];
        var u16 = array[0];
        for (var i = 1; i < array.length; i++) {
            u16 = concatenate(Uint16Array, u16, array[i]);
        }
        var c = document.getElementById('each' + z);
        var ctx = c.getContext("2d");
        var data = u16;
        var u8 = new Uint8ClampedArray(data.buffer);
        var img = new ImageData(u8, 256, 512);
        ctx.putImageData(img, 0, 0);
    }
}

function concatenate(resultConstructor, ...arrays) {
    let totalLength = 0;
    for (let arr of arrays) {
        totalLength += arr.length;
    }
    let result = new resultConstructor(totalLength);
    let offset = 0;
    for (let arr of arrays) {
        result.set(arr, offset);
        offset += arr.length;
    }
    return result;
}