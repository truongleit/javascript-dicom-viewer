var files = [];
var _dataArray = [];
var _filenames = [];
var counter;
var reader;
var v;
var sliceX, sliceY, sliceZ;
var filesLoaded = false;
// var threeD;
var renderAlgorithm = '';


$(document).ready(function() {

    // Slide-down menu //
    $('.setting').click(function() {
        if (!$(this).hasClass('render-info')) {
            if (!$(this).find('.config').hasClass('opened')) {
                console.log('true')
                $(this).find('.drop-down').html('keyboard_arrow_up');
                $(this).addClass('opened').find('.config').addClass('opened');
            } else {
                console.log('false')
                $(this).find('.drop-down').html('keyboard_arrow_down');
                $(this).removeClass('opened').find('.config').removeClass('opened');
            }
        }
    });

    // Change viewer's background color //
    $('.color').click(function() {
        var color = $(this).attr('color');
        $('.viewer').css('background', '#' + color);
        $('.color i').removeClass('block');
        $(this).find('i').addClass('block');
    });

    // Change slice's index (new UI) //
    $(".slice-change").bind('keyup mousemove', function() {
        var value = $(this).val();
        if ($(this).hasClass('index-x')) {
            $(this).next().html(value);
            if (renderAlgorithm == 'textureBased') {
                volume.indexX = parseInt(value);
            }
        } else if ($(this).hasClass('index-y')) {
            $(this).next().html(value);
            if (renderAlgorithm == 'textureBased') {
                volume.indexY = parseInt(value);
            }
        } else {
            $(this).next().html(value);
            if (renderAlgorithm == 'textureBased') {
                volume.indexZ = parseInt(value);
            }
        }
    });

    // Move below line between 2 tab buttons //
    $('.tab').click(function() {
        if ($(this).hasClass('datasets')) {
            $('.tab-title .line').removeClass('right');
            $('.settings').removeClass('moved');
        } else {
            $('.tab-title .line').addClass('right');
            $('.settings').addClass('moved');
        }
    });

    // Initialize and run the slideshow on homepage //
    $('.slider').slick({
        infinite: true,
        slidesToShow: 1,
        autoplay: true,
        autoplaySpeed: 5000
    });

    // Create animation for upload modal //
    $('.upload-button').click(function() {
        $('.upload-overlay').addClass('block');
        $('.upload-area').addClass('block').addClass('animation');
        setTimeout(function() {
            $('.files-container').addClass('block').addClass('animated slideInUp');
        }, 800);
    });
    $('.upload-cancel').click(function() {
        $('.files-container').removeClass('slideInUp').addClass('fadeIn');
        $('.files-container').removeClass('block').removeClass('animated fadeIn');
        $('.upload-area').removeClass('animation').addClass('reversing');
        setTimeout(function() {
            $('.upload-area').removeClass('block');
            $('.upload-overlay').removeClass('block');
            $('.upload-area').removeClass('reversing');
        }, 800);
    });

    // Handle input files //
    $('.choose-files').click(function() {
        $('#file_inp').trigger('click');
    });

    $("#file_inp").change(function() {

        // get input files
        var fileNames = [];
        var filesFormat = [];

        files = document.getElementById("file_inp").files;

        if (filesLoaded && files.length != 0) {
            uploadReset();
            filesLoaded = false;
        }

        for (var i = 0; i < files.length; i++) {
            var fullName = files[i].name;
            var format = files[i].name.substr(-3);
            fileNames.push(fullName);
            filesFormat.push(format.toUpperCase());
        }

        if (filesFormat.every(formatCheck)) {
            if ($('.wrong-noti').hasClass('block')) {
                $('.wrong-noti').removeClass('block');
            }
            filesLoaded = true;
            fileNames.sort(naturalSort);
            $('.lds-hourglass').addClass('block');
            setTimeout(function() {
                $('.lds-hourglass').removeClass('block');
                for (var i = 0; i < fileNames.length; i++) {
                    var length = fileNames[i].length;
                    var name = fileNames[i].slice(0, length - 4);
                    var format = fileNames[i].substr(-3);
                    var html = '<tr>' +
                        '<td colspan="1">' + (i + 1) + '</td>' +
                        '<td colspan="6">' + name + '</td>' +
                        '<td colspan="1">' + format.toUpperCase() + '</td>' +
                        '</tr>';
                    $('.files-table tbody').append(html);
                    $('.rendering-algorithm').addClass('block');
                }
                $('.button-overlay').addClass('hidden');
                $('.algorithm-button').addClass('clickable');
            }, 3000);
        } else {
            filesLoaded = false;
            var text = 'Some selected files are in the wrong format';
            $('.wrong-noti').text(text).addClass('block');
        }

    });

    // Execute Ray-cating rendering algorithm //
    $('.ray-casting').click(function() {
        renderAlgorithm = 'rayCasting';
        $('.viewer').css('transform', 'scale(1)');
        $('.viewer').addClass('opened');
        readMultipleFiles(files);
    });

    // Execute Texture-based rendering algorithm //
    $('.texture-based').click(function() {
        console.log('true');
        renderAlgorithm = 'textureBased';
        initTexturebasedRendering();
        $('.viewer').css('transform', 'scale(1)');
        $('.viewer').addClass('opened');
        counter = files.length;
        reader = new FileReader();
        recursiveLoading(0);
    });

    // $('.upload-execute').click(function() {
    //     var algorithm = $('.algorithm-select').val();
    //     if (algorithm != null) {
    //         if ($('.wrong-noti').hasClass('block')) {
    //             $('.wrong-noti').removeClass('block');
    //         }
    //         if (filesLoaded) {
    //             if ($('.wrong-noti').hasClass('block')) {
    //                 $('.wrong-noti').removeClass('block');
    //             }
    //             switch (algorithm) {
    //                 case 'marchingCube':
    //                     renderAlgorithm = 'marchingCube';
    //                     break;
    //                 case 'rayCasting':
    //                     renderAlgorithm = 'rayCasting';
    //                     $('.viewer').css('transform', 'scale(1)');
    //                     $('.viewer').addClass('opened');
    //                     readMultipleFiles(files);
    //                     break;
    //                 case 'textureBased':
    //                     renderAlgorithm = 'textureBased';
    //                     initTexturebasedRendering();
    //                     $('.viewer').css('transform', 'scale(1)');
    //                     $('.viewer').addClass('opened');
    //                     counter = files.length;
    //                     reader = new FileReader();
    //                     recursiveLoading(0);
    //                     break;
    //             }

    //         } else {
    //             var text = 'No files have been loaded';
    //             $('.wrong-noti').text(text).addClass('block');
    //         }
    //     } else {
    //         var text = 'Please choose an algorithm';
    //         $('.wrong-noti').text(text).addClass('block');
    //     }
    // });

});

function naturalSort(a, b) {
    var aPriority = /[a-z]/i.test(a) * 3 + /\d+/i.test(a) * 2;
    var bPriority = /[a-z]/i.test(b) * 3 + /\d+/i.test(b) * 2;
    if (aPriority === bPriority) return a.localeCompare(b, 'en', {
        numeric: true
    });
    return aPriority < bPriority ? 1 : -1;
}

function formatCheck(format) {
    return format === 'DCM';
}

function uploadReset() {
    var files = $('.files-table tbody tr');
    files.remove();
}

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
        var gui = new dat.GUI({
            autoPlace: false
        });
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
        $('.index-x').attr({
            'max': (volume.dimensions[0] - 1),
            'value': volume.indexX
        }).next().html(volume.indexX);
        $('.index-y').attr({
            'max': (volume.dimensions[1] - 1),
            'value': volume.indexY
        }).next().html(volume.indexY);
        $('.index-z').attr({
            'max': (volume.dimensions[2] - 1),
            'value': volume.indexZ
        }).next().html(volume.indexZ);
        volumegui.open();
    };
}