import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkHttpDataSetReader from 'vtk.js/Sources/IO/Core/HttpDataSetReader';
import vtkImageMarchingCubes from 'vtk.js/Sources/Filters/General/ImageMarchingCubes';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import itkreadImageFile from 'itk/readImageFile';
import itkreadImageDICOMFileSeries from 'itk/readImageDICOMFileSeries';
import vtkITKHelper from 'vtk.js/Sources/Common/DataModel/ITKHelper';
import vtkOpenGLRenderWindow from 'vtk.js/Sources/Rendering/OpenGL/RenderWindow';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkRenderWindowInteractor from 'vtk.js/Sources/Rendering/Core/RenderWindowInteractor';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkInteractorStyleTrackballCamera from 'vtk.js/Sources/Interaction/Style/InteractorStyleTrackballCamera';


let renderWindow, openglRenderWindow;
const interactor = vtkRenderWindowInteractor.newInstance();

$(document).ready(function() {

    //
    //// IRO color picker for Background and Mesh
    //
    var meshColorPicker = new iro.ColorPicker('.vtk-color', {
        width: 200,
        borderWidth: 2,
        borderColor: '#333',
    });
    var bgColorPicker = new iro.ColorPicker('#color-picker-container', {
        width: 250,
        borderWidth: 2,
        borderColor: '#333',
    });
    meshColorPicker.on('color:change', onMeshColorChange);
    bgColorPicker.on('color:change', onBackgroundColorChange);

    function onMeshColorChange(color, changes) {
        if (renderAlgorithm == 'marchingCube') {
            var rgb = color.rgb;
            actor.getProperty().setColor(rgb.r/255, rgb.g/255, rgb.b/255);
            renderWindow.render();
        }
    }

    function onBackgroundColorChange(color, changes) {
        switch (renderAlgorithm) {
            case 'marchingCube':
                var rgb = color.rgb;
                renderer.setBackground(rgb.r/255, rgb.g/255, rgb.b/255, 1);
                renderWindow.render();
                break;
            case 'rayCasting':
                var hex = color.hexString;
                var bgColor = new THREE.Color(hex);
                scene.background = bgColor;
                modified = true;
                break;
            case 'Point Cloud':
                var hex = color.hexString;
                var bgColor = new THREE.Color(hex);
                pointCloudScene.background = bgColor;
                break;
            case 'textureBased':
                break;
        }
    }

    //
    //// Save screenshot
    //
    $('#screenshot-container').modal({
            dismissible: true,
            onOpenEnd: function(modal, trigger) {
                var base64;
                switch (renderAlgorithm) {
                    case "marchingCube":
                        openglRenderWindow.captureNextImage().then(function(data){
                            base64 = data;
                            screenshotCapture(base64);
                        });
                        renderWindow.render();
                        break;
                    case "rayCasting":
                        controls.update();
                        renderer.render(scene, camera);
                        base64 = renderer.domElement.toDataURL();
                        screenshotCapture(base64);
                        break;
                    default:
                        base64 = convertCanvasToImage($('#3d canvas').get(0)).src;
                        screenshotCapture(base64);
                        break;
                }
            }
        }
    );

    $('.mb-interactor-disable').click(function() {
        const container = document.getElementById('3d');
        interactor.unbindEvents(container);
    });
    //
    //// Set iso-value (requires re-rendering process)
    //
    $('.isoValue').bind('keyup mousemove', function () {
        var value = $(this).val();
        $(this).next().html(value);
    })
    $('.apply-iso').click(function() {
        if (renderAlgorithm == 'marchingCube') {
            var value = $('.isoValue').val();
            marchingCube.setContourValue(Number(value));
            renderWindow.render();
        }
    });

    $('.marching-cube').on('click', function() {
        renderAlgorithm = 'marchingCube';
        $('.three-dimemsion').addClass('forced-fullwidth');
        var files = document.getElementById("file_inp").files;
        showViewer('Marching Cube');
        $('.viewer').addClass('opened');
        var total = files.length;
        setTimeout(function() {
            marchingCubeRender(files);
        }, 1500);
        $('.slider').slick('unslick');
        $('.switch-algorithm').val(renderAlgorithm);
        $('select').formSelect();
    });
    $('.mb-switch').on('click', function() {
        $('.monitor-container').empty();
        $('.three-dimemsion').addClass('forced-fullwidth');
        renderAlgorithm = 'marchingCube';
        $('.loading-render').removeClass('animated fadeOutDown').css('display', 'block').removeClass('animated fadeInUp');
        setTimeout(function() {
            marchingCubeRender(files);
        }, 1500);
        $('.algorithm-name').text('Marching Cube');
    });
});

function screenshotCapture(data) {
    $('.image-holder').css({
        'background-size': 'contain',
        'background-position': 'center center',
        'background-image': 'url(' + data + ')',
        'background-repeat': 'no-repeat'
    });
    $('.save-button').attr({
        'href': data
    });
}

function marchingCubeRender(files) {

    renderWindow = vtkRenderWindow.newInstance();
    renderer = vtkRenderer.newInstance({ background: [0, 0, 0] });
    renderWindow.addRenderer(renderer);

    openglRenderWindow = vtkOpenGLRenderWindow.newInstance();
    renderWindow.addView(openglRenderWindow);

    const actor = vtkActor.newInstance();
    const mapper = vtkMapper.newInstance();
    const marchingCube = vtkImageMarchingCubes.newInstance({
        contourValue: 0.0,
        computeNormals: true,
        mergePoints: true,
    });

    actor.setMapper(mapper);
    mapper.setInputConnection(marchingCube.getOutputPort());

    const reader = vtkHttpDataSetReader.newInstance({
        fetchGzip: true
    });
    marchingCube.setInputConnection(reader.getOutputPort());

    let dicomReader = itkreadImageDICOMFileSeries;
    let arg = files;
    dicomReader(null, arg).then(({
        image: itkImage,
        webWorker
    }) => {
        webWorker.terminate()

        const imageData = vtkITKHelper.convertItkToVtkImage(itkImage);
        const dataRange = imageData
            .getPointData()
            .getScalars()
            .getRange();
        const firstIsoValue = (dataRange[0] + dataRange[1]) / 3;

        $('.isoValue').attr({
            'min': dataRange[0],
            'max': dataRange[1],
            'value': parseInt(firstIsoValue)
        }).next().html(parseInt(firstIsoValue));

        const container = document.getElementById('3d');
        openglRenderWindow.setContainer(container);
        const { width, height } = container.getBoundingClientRect();
        openglRenderWindow.setSize(width, height);

        interactor.setView(openglRenderWindow);
        interactor.initialize();
        interactor.bindEvents(container);
        interactor.setInteractorStyle(vtkInteractorStyleTrackballCamera.newInstance());

        marchingCube.setInputData(imageData);
        marchingCube.setContourValue(firstIsoValue);
        renderer.addActor(actor);
        renderer.getActiveCamera().set({
            position: [1, 1, 0],
            viewUp: [0, 0, -1]
        });
        renderer.getActiveCamera().set({ position: [1, 1, 0], viewUp: [0, 0, -1] });
        renderer.resetCamera();
        renderWindow.render();

        meter = new FPSMeter(
            $('.monitor-container').get(0),
            {
                graph: 1,
                theme: 'diRea'
            });

        renderWindow.getInteractor().onAnimation(() => {
            if ($('.settings').hasClass('moved')) meter.tick();
        });

        $('.loading-render').addClass('animated fadeOutDown');
        $('.rendering-layout').addClass('hidden');
        $('.marching-cube-setting').removeClass('hidden');

        global.actor = actor;
        global.mapper = mapper;
        global.marchingCube = marchingCube;
    })
}