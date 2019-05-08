var files = [];
var _dataArray = [];
var _filenames = [];
var counter;
var reader;
var v;
var sliceX, sliceY, sliceZ;
var filesLoaded = false;
var renderAlgorithm = '';

$(document).ready(function() {
    $('.modal').modal();
    // Ray-casting config //
    //
    // Interpolation
    //
    $('.ray-interpolation').change(function() {
        if (renderAlgorithm == 'rayCasting') {
            if (this.checked) {
                vrHelper.interpolation = 1;
            } else {
                vrHelper.interpolation = 0;
            }
            if (vrHelper.uniforms) modified = true;
        }
    });
    //
    // Shading
    //
    $('.ray-shading').change(function() {
        if (renderAlgorithm == 'rayCasting') {
            if (this.checked) {
                vrHelper.shading = 1;
            } else {
                vrHelper.shading = 0;
            }
            if (vrHelper.uniforms) modified = true;
        }
    });

    // Material select //
    $('select').formSelect();

    // Ray-casting algorithm //
    $('.ray-algorithm select').change(function() {
        if (renderAlgorithm == 'rayCasting') {
            var optionSelected = $(this).find("option:selected");
            var valueSelected = optionSelected.val();
            vrHelper.algorithm = valueSelected;
            modified = true;
        }
    });

    // Ray-casting LUT //
    $('.ray-lut select').change(function() {
        if (renderAlgorithm == 'rayCasting') {
            var optionSelected = $(this).find("option:selected");
            var valueSelected = optionSelected.val();
            lut.lut = valueSelected;
            vrHelper.uniforms.uTextureLUT.value.dispose();
            vrHelper.uniforms.uTextureLUT.value = lut.texture;
            modified = true;
        }
    });

    // Ray-casting Opacity //
    $('.ray-opacity select').change(function() {
        if (renderAlgorithm == 'rayCasting') {
            var optionSelected = $(this).find("option:selected");
            var valueSelected = optionSelected.val();
            lut.lutO = valueSelected;
            vrHelper.uniforms.uTextureLUT.value.dispose();
            vrHelper.uniforms.uTextureLUT.value = lut.texture;
            modified = true;
        }
    });

    // Ray-casting Steps //
    $(".ray-steps").bind('keyup mousemove', function() {
        if (renderAlgorithm == 'rayCasting') {
            var value = $(this).val();
            $(this).next().html(value);
            if (vrHelper.uniforms) {
                vrHelper.uniforms.uSteps.value = value;
                modified = true;
            }
        }
    });

    // Ray-casting Alpha Correction //
    $(".ray-alpha").bind('keyup mousemove', function() {
        if (renderAlgorithm == 'rayCasting') {
            var value = $(this).val();
            $(this).next().html(value);
            if (vrHelper.uniforms) {
                vrHelper.uniforms.uAlphaCorrection.value = value;
                modified = true;
            }
        }
    });

    // Ray-casting Shininess//
    $(".ray-shininess").bind('keyup mousemove', function() {
        if (renderAlgorithm == 'rayCasting') {
            var value = $(this).val();
            $(this).next().html(value);
            vrHelper.shininess = value;
            if (vrHelper.uniforms) modified = true;
        }
    });

    //
    // Texture-based configs //
    //
    $('.texture-opacity').on('input', function() {
        var value = $(this).val();
        $(this).next().html(value);
        if (renderAlgorithm == 'textureBased') {
            volume.opacity = parseFloat(value);
        }
    });

    // Switch between 3D and 2D modes //
    $('.texturebased-algorithm select').change(function() {
        if (renderAlgorithm == 'textureBased') {
            var optionSelected = $(this).find("option:selected");
            var valueSelected = optionSelected.val();
            volume.volumeRendering = valueSelected == 'true' ? true : false;
        }
    });

    // Lower Threshold //
    $('.texture-lower-threshold').bind('keyup mousemove', function() {
        var value = $(this).val();
        $(this).next().html(value);
        if (renderAlgorithm == 'textureBased') {
            volume.lowerThreshold = parseInt(value);
        }
    });

    // Upper Threshold //
    $('.texture-upper-threshold').bind('keyup mousemove', function() {
        var value = $(this).val();
        $(this).next().html(value);
        if (renderAlgorithm == 'textureBased') {
            volume.upperThreshold = parseInt(value);
        }
    });

    // Window Low //
    $('.texture-window-low').bind('keyup mousemove', function() {
        var value = $(this).val();
        $(this).next().html(value);
        if (renderAlgorithm == 'textureBased') {
            volume.windowLow = parseInt(value);
        }
    });

    // Window High //
    $('.texture-window-high').bind('keyup mousemove', function() {
        var value = $(this).val();
        $(this).next().html(value);
        if (renderAlgorithm == 'textureBased') {
            volume.windowHigh = parseInt(value);
        }
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

    // Reset dimension //
    $('.reset-dimension').click(function() {
        if ($(this).hasClass('reset-to-X')) {
            if (renderAlgorithm == 'textureBased') {
                threeD.camera.position = [500, 0, 0];
            }
        } else if ($(this).hasClass('reset-to-Y')) {
            if (renderAlgorithm == 'textureBased') {
                threeD.camera.position = [0, 500, 0];
            }
        } else {
            if (renderAlgorithm == 'textureBased') {
                threeD.camera.position = [0, 0, 500];
            }
        }
    });

    // Switch between 3D and 2D //
    $('.switch-view').click(function() {
        if (!$('.dropdown-view').hasClass('block')) {
            $(this).find('i').addClass('rotated');
            $('.dropdown-view').addClass('block');
        } else {
            $(this).find('i').removeClass('rotated');
            $('.dropdown-view').removeClass('block');
        }
    });

    $('.dimension-option').click(function() {
        $('.switch-view span').html($(this).text());
        if ($(this).text() == '3D') {
            if (renderAlgorithm == 'textureBased') {
                volume.volumeRendering = true;
            }
        } else {
            if (renderAlgorithm == 'textureBased') {
                volume.volumeRendering = false;
            }
        }
    });

    // End Texture-based configs // 

    //
    // Front-end Handlings //
    //
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

    // Change viewer's background color //
    $('.color').click(function() {
        var color = $(this).attr('color');
        $('.viewer').css('background', '#' + color);
        $('.color i').removeClass('block');
        $(this).find('i').addClass('block');
    });

    // Initialize and run the slideshows on homepage //
    $('.slider').slick({
        infinite: true,
        slidesToShow: 1,
        autoplay: true,
        autoplaySpeed: 5000,
        draggable: false
    });

    // Slide-down menu //
    $('.setting .title').click(function() {
        var setting = $(this).parent();
        if (!setting.hasClass('render-info')) {
            if (!setting.find('.config').hasClass('opened')) {
                setting.find('.drop-down').addClass('rotated');
                setting.find('.config').addClass('opened').slideDown(380);
            } else {
                setting.find('.drop-down').removeClass('rotated');
                setting.find('.config').removeClass('opened').slideUp(380);
            }
        }
    });

    // Create animation for upload modal //
    $('.upload-button').click(function() {
        $('.upload-overlay').addClass('block');
        $('.upload-area').addClass('block').addClass('animated fast fadeInUp-custom');
    });
    $('.upload-cancel').click(function() {
        $('.upload-area').removeClass('fadeInUp-custom').addClass('fadeOutDown-custom');
        setTimeout(function() {
            $('.upload-area').removeClass('block').removeClass('animated fast fadeOutDown-custom');
            $('.upload-overlay').removeClass('block');
        }, 500)
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

        } else {
            filesLoaded = false;
            var text = 'Some selected files are in the wrong format';
            $('.wrong-noti').text(text).addClass('block');
        }

    });

    // End Front-end Handlings //

    // Execute Ray-cating rendering algorithm //
    $('.ray-casting').click(function() {
        renderAlgorithm = 'rayCasting';
        showViewer();
        $('.viewer').addClass('opened');
        $('.lds-hourglass').addClass('block');
        var total = files.length;
        renderThumbnails(total, files);
        $('.modal').removeClass('temp-block');
        setTimeout(function() {
            readMultipleFiles(files);
        }, 1500);
        $('.slider').slick('unslick');
    });

    // Execute Texture-based rendering algorithm //
    $('.texture-based').click(function() {
        renderAlgorithm = 'textureBased';
        initTexturebasedRendering();
        $('.lds-hourglass').addClass('block');
        showViewer();
        $('.viewer').addClass('opened');
        var total = files.length;
        renderThumbnails(total, files);
        $('.modal').removeClass('temp-block');
        counter = files.length;
        reader = new FileReader();
        setTimeout(function() {
            recursiveLoading(0);
        }, 1500)
    });

});

// Capitalize first letter in text //
String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}

// Display viewer dom //
function showViewer() {
    $('.viewer').css('display', 'block').addClass('animated fadeInUp');
}

// Update min color (Texture-based) //
function texturebasedUpdateMinColor(picker) {
    var rgb = [Math.round(picker.rgb[0]), Math.round(picker.rgb[1]), Math.round(picker.rgb[2])];
    if (renderAlgorithm == 'textureBased') {
        volume.minColor = [rgb[0] / 255, rgb[1] / 255, rgb[2] / 255];
        console.log(volume.minColor);
    }
}

// Update max color (Texture-based) //
function texturebasedUpdateMaxColor(picker) {
    var rgb = [Math.round(picker.rgb[0]), Math.round(picker.rgb[1]), Math.round(picker.rgb[2])];
    if (renderAlgorithm == 'textureBased') {
        volume.maxColor = [rgb[0] / 255, rgb[1] / 255, rgb[2] / 255];
    }
}

// Sorting for complex text //
function naturalSort(a, b) {
    var aPriority = /[a-z]/i.test(a) * 3 + /\d+/i.test(a) * 2;
    var bPriority = /[a-z]/i.test(b) * 3 + /\d+/i.test(b) * 2;
    if (aPriority === bPriority) return a.localeCompare(b, 'en', {
        numeric: true
    });
    return aPriority < bPriority ? 1 : -1;
}

// Check file format //
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
        $('.list-files').append('<div id="dicomImage' + (i + 1) + '" class="file"></div>');
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
        threeD.camera.position = [0, 500, 0];
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
        volume.opacity = 0.6;
        volume.windowHigh = 1506;
        volume.lowerThreshold = 308;
        volume.upperThreshold = 2565;
        volume.minColor = [0.16862745098039217, 0.17254901960784313, 0.17647058823529413];
        volume.maxColor = [1, 1, 1];
        volume.windowHigh = 2547;
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

        $('.rendering-layout').addClass('fade-out');
        $('.lds-hourglass').removeClass('block');
        $('.rendering-layout').addClass('hidden');
        $('.texture-setting').removeClass('hidden');
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
        $('.min-color-picker').attr({
            'value': '2b2c2d'
        });
        $('.max-color-picker').attr({
            'value': 'ffffff'
        });
        $('.texture-opacity').attr({
            'min': 0,
            'max': 1,
            'value': volume.opacity
        }).next().html(volume.opacity);
        $('.texture-lower-threshold').attr({
            'min': volume.min,
            'max': volume.max,
            'value': volume.lowerThreshold
        }).next().html(volume.lowerThreshold);
        $('.texture-upper-threshold').attr({
            'min': volume.min,
            'max': volume.max,
            'value': volume.upperThreshold
        }).next().html(volume.upperThreshold);
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
        $('.texture-window-low').attr({
            'min': volume.min,
            'max': volume.max,
            'value': volume.windowLow
        }).next().html(volume.windowLow);
        $('.texture-window-high').attr({
            'min': volume.min,
            'max': volume.max,
            'value': volume.windowHigh
        }).next().html(volume.windowHigh);
        volumegui.open();
    };
}