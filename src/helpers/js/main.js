var files = [];
var _dataArray = [];
var _filenames = [];
var counter;
var reader;
var v;
var sliceX, sliceY, sliceZ;
var filesLoaded = false;
var renderAlgorithm = '';
var oldRenderAlgorithm = '';
var currentViewerColor = '';
var canvasSelected = '';
var t0;
let screenshot

$(document).ready(function() {

    //
    //// Screenshot UI handling (Core capturing feature is moved to marchingCube.js)
    //
    $('.screenshot-option').change(function() {
        var optionSelected = $(this).find("option:selected");
        canvasSelected = optionSelected.val();
        ( renderAlgorithm == 'Point Cloud' && (canvasSelected == 'sliceX' || canvasSelected == 'sliceY' || canvasSelected == 'sliceZ') ) ? $('.screenshot-open').addClass('disabled') : $('.screenshot-open').removeClass('disabled');
    });

    $('#filename').keyup(function () {
        var extension = $('.format-option').val().toUpperCase();
        var filename = $(this).val();
        var final = filename + '.' + extension;
        $('.final-name').text(final);
        $('.save-button').attr({
            'download': final
        });
    })
    //
    //// End Screenshot
    //
    //
    // Switch rendering algorithm
    //
    $('.switch-algorithm').change(function() {
        var optionSelected = $(this).find("option:selected");
        var valueSelected = optionSelected.val();
        ( valueSelected == renderAlgorithm ) ?  $('.re-render-button').addClass('disabled') : $('.re-render-button').removeClass('disabled');
    });

    $('.re-render-button').click(function() {
        var optionSelected = $('.switch-algorithm').find("option:selected");
        var valueSelected = optionSelected.val();
        deleteCanvas(renderAlgorithm);
        switch (valueSelected) {
            case "rayCasting":
                if ( oldRenderAlgorithm == 'marchingCube' ) $('.mb-interactor-disable').trigger('click');
                renderAlgorithm = 'rayCasting';
                $('.lds-hourglass').addClass('block');
                setTimeout(function() {
                    readMultipleFiles(files);
                }, 1500);
                $('.algorithm-name').text('Ray Casting');
                $('.switch-algorithm').val(renderAlgorithm);
                $('select').formSelect();
                $('.statistics').remove();
                break;
            case "textureBased":
                if ( oldRenderAlgorithm == 'marchingCube' ) $('.mb-interactor-disable').trigger('click');
                renderAlgorithm = 'textureBased';
                initTexturebasedRendering();
                $('.lds-hourglass').addClass('block');
                counter = files.length;
                reader = new FileReader();
                setTimeout(function() {
                    recursiveLoading(0);
                }, 1500);
                $('.algorithm-name').text('Texture-based');
                $('.switch-algorithm').val(renderAlgorithm);
                $('select').formSelect();
                break;
            default:
                $('.mb-switch').trigger('click');
                break;
        };
        $('.re-render-button').addClass('disabled');
    });
    //
    // Ray-casting config //
    //
    // Interpolation
    //
    $('.ray-interpolation').change(function() {
        if (renderAlgorithm == 'rayCasting') {
            ( this.checked ) ? vrHelper.interpolation = 1 : vrHelper.interpolation = 0;
            if (vrHelper.uniforms) modified = true;
        }
    });
    //
    // Shading
    //
    $('.ray-shading').change(function() {
        if (renderAlgorithm == 'rayCasting') {
            ( this.checked ) ? vrHelper.shading = 1 : vrHelper.shading = 0;
            if (vrHelper.uniforms) modified = true;
        }
    });

    // Material select, modal, side nav initalizations //
    $('select').formSelect();
    // $('.modal').modal();

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
        if (renderAlgorithm == 'textureBased') volume.opacity = parseFloat(value);
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
        if (renderAlgorithm == 'textureBased') volume.lowerThreshold = parseInt(value);
    });

    // Upper Threshold //
    $('.texture-upper-threshold').bind('keyup mousemove', function() {
        var value = $(this).val();
        $(this).next().html(value);
        if (renderAlgorithm == 'textureBased') volume.upperThreshold = parseInt(value);
    });

    // Window Low //
    $('.texture-window-low').bind('keyup mousemove', function() {
        var value = $(this).val();
        $(this).next().html(value);
        if (renderAlgorithm == 'textureBased') volume.windowLow = parseInt(value);
    });

    // Window High //
    $('.texture-window-high').bind('keyup mousemove', function() {
        var value = $(this).val();
        $(this).next().html(value);
        if (renderAlgorithm == 'textureBased') volume.windowHigh = parseInt(value);
    });

    // Change slice's index (new UI) //
    $(".slice-change").bind('keyup mousemove', function() {
        var value = $(this).val();
        if ($(this).hasClass('index-x')) {
            $(this).next().html(value);
            if (renderAlgorithm == 'textureBased') {
                volume.indexX = parseInt(value);
            } else if (renderAlgorithm == 'rayCasting') {
                r1.stackHelper.index = parseInt(value);
            }
        } else if ($(this).hasClass('index-y')) {
            $(this).next().html(value);
            if (renderAlgorithm == 'textureBased') {
                volume.indexY = parseInt(value);
            } else if (renderAlgorithm == 'rayCasting') {
                r2.stackHelper.index = parseInt(value);
            }
        } else {
            $(this).next().html(value);
            if (renderAlgorithm == 'textureBased') {
                volume.indexZ = parseInt(value);
            } else if (renderAlgorithm == 'rayCasting') {
                r3.stackHelper.index = parseInt(value);
            }
        }
    });

    // Reset dimension //
    $('.reset-dimension').click(function() {
        if ($(this).hasClass('reset-to-X')) {
            if (renderAlgorithm == 'textureBased') threeD.camera.position = [500, 0, 0];
        } else if ($(this).hasClass('reset-to-Y')) {
            if (renderAlgorithm == 'textureBased') threeD.camera.position = [0, 500, 0];
        } else {
            if (renderAlgorithm == 'textureBased') threeD.camera.position = [0, 0, 500];
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
            if (renderAlgorithm == 'textureBased') volume.volumeRendering = true;
        } else {
            if (renderAlgorithm == 'textureBased') volume.volumeRendering = false;
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
        $('.viewer').removeClass(currentViewerColor).addClass(color);
        $('.color i').removeClass('block');
        $(this).find('i').addClass('block');
        currentViewerColor = color;
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
        showViewer('Ray Casting');
        $('.viewer').addClass('opened');
        var total = files.length;
        setTimeout(function() {
            t0 = performance.now();
            readMultipleFiles(files);
        }, 1500);
        $('.slider').slick('unslick');
        $('.switch-algorithm').val(renderAlgorithm);
        $('select').formSelect();
    });

    // Execute Texture-based rendering algorithm //
    $('.texture-based').click(function() {
        renderAlgorithm = 'textureBased';
        initTexturebasedRendering();
        showViewer('Texture-based');
        $('.viewer').addClass('opened');
        var total = files.length;
        counter = files.length;
        reader = new FileReader();
        setTimeout(function() {
            t0 = performance.now();
            recursiveLoading(0);
        }, 1500);
        $('.slider').slick('unslick');
        $('.switch-algorithm').val(renderAlgorithm);
        $('select').formSelect();
    });
    // Execute Slice mode only //
    $('.slice-only').click(function() {
        $('.files-bar').css({ 'width': '312px' });
        $('.canvas-container').css({ 'width': 'calc(100% - ' + 312 + 'px)' });
        showViewer('Slice Mode');
        $('.viewer').css({
            'background': '#212121'
        });
        $('#3d, #sliceX, #sliceY, #sliceZ').css({ "display": "none" });
        $('.representation, .colors, .slices').remove();
        $('.slice-slider, .slice-slider-nav-container, .slice-slider-nav, .sliders').removeClass('hidden');
        $('.viewer').addClass('opened');
        var total = files.length;
        setTimeout(function() {
            twoDMode(total, files);
            twoDMode2(total, files);
        }, 1500);
        setTimeout(function() {
            $('.slice-slider').slick({
                infinite: false,
                slidesToShow: 1,
                slidesToScroll: 1,
                arrows: false,
                asNavFor: '.slice-slider-nav',
                draggable: false
            });
            $('.slice-slider-nav').slick({
                infinite: false,
                slidesToShow: 5,
                slidesToScroll: 1,
                asNavFor: '.slice-slider',
                arrows: true,
                centerMode: false,
                focusOnSelect: true,
                draggable: false
            });
        }, 1500);
        $('.switch-algorithm').attr('disabled', 'disabled');
        $('select').formSelect();
        setTimeout(function() {
            $('.slice-slider-nav, .slice-slider').css({
                'display': 'flex',
                'align-items': 'center'
            });
        }, 1500);
        setTimeout(function() {
            $('.loading-render').addClass('animated fadeOutDown');
        }, 2000);
        $('.slider').slick('unslick');
    });
    $('.slider-control').click(function() {
        ( $(this).hasClass('left') ) ? $('.slick-prev').trigger('click') : $('.slick-next').trigger('click');
    });
    //
    // Change settings for slice mode
    //
    $('.slice-setting').click(function() {
        $('.loading-render').removeClass('animated fadeOutDown');
        var upper_number = $('input[name="upper_slide"]:checked').val();
        var lower_number = $('input[name="lower_slide"]:checked').val();
        var checked = $('input[class="auto-play"]').is(":checked");
        var draggable = $('input[class="draggable"]').is(":checked");

        $('.slice-slider').slick('unslick');
        $('.slice-slider-nav').slick('unslick');
        slickSetUp(parseInt(upper_number), parseInt(lower_number), draggable, checked);
        setTimeout(function() {
            $('.loading-render').addClass('animated fadeOutDown');
        }, 2000);
    });
});

function slickSetUp(upper_number, lower_number, draggable, checked) {
    setTimeout(function() {
        $('.slice-slider').slick({
            infinite: false,
            slidesToShow: upper_number,
            slidesToScroll: 1,
            arrows: false,
            asNavFor: '.slice-slider-nav',
            draggable: draggable,
            autoplay: checked
        });
        $('.slice-slider-nav').slick({
            infinite: false,
            slidesToShow: lower_number,
            slidesToScroll: 1,
            asNavFor: '.slice-slider',
            arrows: true,
            centerMode: false,
            focusOnSelect: true,
            draggable: draggable,
            autoplay: checked
        });
    }, 1500);
}
// Delete canvas and reset range slider //
function deleteCanvas(currentAlgorithm) {

    oldRenderAlgorithm = currentAlgorithm;
    $('.rendering-layout').removeClass('fade-out');
    $('.rendering-layout').removeClass('hidden');
    switch (currentAlgorithm) {
        case "rayCasting":
            $('.ray-setting').addClass("hidden");
            break;
        case "textureBased":
            threeD.destroy();
            sliceX.destroy();
            sliceY.destroy();
            sliceZ.destroy();
            $('.texture-setting').addClass("hidden");
            break;
        case "marchingCube":
            $('.marching-cube-setting').addClass("hidden");
            break;
        default:
            break;
    }

    renderAlgorithm = '';
    $('.canvas-container canvas').remove();

    $('.index-x').attr({
        'max': (0),
        'value': 0
    }).next().html(0);
    $('.index-y').attr({
        'max': (0),
        'value': 0
    }).next().html(0);
    $('.index-z').attr({
        'max': (0),
        'value': 0
    }).next().html(0);

    return true;
}

// Capitalize first letter in text //
String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}

// Display viewer dom //
function showViewer(algorithm) {
    $('.algorithm-name').text(algorithm);
    $('.viewer').css('display', 'block').addClass('animated fadeInUp');
}

// Update min color (Texture-based) //
function texturebasedUpdateMinColor(picker) {
    var rgb = [Math.round(picker.rgb[0]), Math.round(picker.rgb[1]), Math.round(picker.rgb[2])];
    if (renderAlgorithm == 'textureBased') volume.minColor = [rgb[0] / 255, rgb[1] / 255, rgb[2] / 255];
}

// Update max color (Texture-based) //
function texturebasedUpdateMaxColor(picker) {
    var rgb = [Math.round(picker.rgb[0]), Math.round(picker.rgb[1]), Math.round(picker.rgb[2])];
    if (renderAlgorithm == 'textureBased') volume.maxColor = [rgb[0] / 255, rgb[1] / 255, rgb[2] / 255];
}

// Update 3D object's color (Marching Cube)
var meshColorMB = [0, 0, 0];

function vtkColorPicker(picker) {
    var rgb = [Math.round(picker.rgb[0]), Math.round(picker.rgb[1]), Math.round(picker.rgb[2])];
    meshColorMB = [rgb[0] / 255, rgb[1] / 255, rgb[2] / 255];
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
        $('.loaded-slices').append('<div id="dicomImage' + (i + 1) + '" class="file"></div>');
        var divName = '#dicomImage' + (i + 1);
        var element = $(divName).get(0);
        $(divName).append('<div class="slice-number">' + (i + 1) + '</div>');
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

function twoDMode(amount, file) {
    var divData = [];
    for (let i = 0; i < amount; i++) {
        $('.slice-slider').append('<div id="dicomImage' + (i + 1) + '" class="canvas-2d"></div>');
        var divName = '#dicomImage' + (i + 1);
        var element = $(divName).get(0);
        $(divName).append('<div class="slice-number">' + (i + 1) + '</div>');
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

function twoDMode2(amount, file) {
    var divData = [];
    for (let i = 0; i < amount; i++) {
        $('.slice-slider-nav').append('<div id="dicomImageNav' + (i + 1) + '" class="canvas-2d-nav"></div>');
        var divName = '#dicomImageNav' + (i + 1);
        var element = $(divName).get(0);
        $(divName).append('<div class="slice-number">' + (i + 1) + '</div>');
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
        volume.minColor = [0, 0, 0];
        volume.maxColor = [1, 1, 1];
        volume.windowHigh = 2532;
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

        $('.loading-render').addClass('animated fadeOutDown');
        $('.texture-setting').removeClass('hidden');

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
        ESresize();

        // stats
        stats = new Stats();
        stats.domElement.className = 'statistics';
        $('.monitor-container').append(stats.domElement);

    };
    threeD.onRender = function () {
        stats.update();
    }
}
// Trigger the window resize event
function ESresize() {
    if (typeof(Event) === 'function') {
        // modern browsers
        window.dispatchEvent(new Event('resize'));
    } else {
        //This will be executed on old browsers and especially IE
        var resizeEvent = window.document.createEvent('UIEvents');
        resizeEvent.initUIEvent('resize', true, false, window, 0);
        window.dispatchEvent(resizeEvent);
    }
}

function convertCanvasToImage(canvas) {
    var image = new Image();
    image.src = canvas.toDataURL("image/png");
    return image;
}
