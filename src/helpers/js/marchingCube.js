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


let renderWindow;
const interactor = vtkRenderWindowInteractor.newInstance();

function updateIsoValue(e) {
    const isoValue = Number(e.target.value);
    marchingCube.setContourValue(isoValue);
    renderWindow.render();
}

$(document).ready(function() {
    $('.mb-interactor-disable').click(function() {
        const container = document.getElementById('3d');
        interactor.unbindEvents(container);
    });
    $(".isoValue").bind('keyup mousemove', function() {
        if (renderAlgorithm == 'marchingCube') {
            var value = $(this).val();
            $(this).next().html(value);
            marchingCube.setContourValue(Number(value));
            $('.lds-hourglass').addClass('block');
            renderWindow.render();
            $('.lds-hourglass').removeClass('block');
        }
    });
    $('.vtk-color-button').click(function() {
        if (renderAlgorithm == 'marchingCube') {
            actor.getProperty().setColor(meshColorMB[0], meshColorMB[1], meshColorMB[2]);
            renderWindow.render();
        }
    });
    $('.marching-cube').on('click', function() {
        renderAlgorithm = 'marchingCube';
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
        renderAlgorithm = 'marchingCube';
        $('.lds-hourglass').addClass('block');
        setTimeout(function() {
            marchingCubeRender(files);
        }, 1500);
        $('.algorithm-name').text('Marching Cube');
    });
});

function marchingCubeRender(files) {

    renderWindow = vtkRenderWindow.newInstance();
    const renderer = vtkRenderer.newInstance({ background: [0.2, 0.3, 0.4] });
    renderWindow.addRenderer(renderer);

    const openglRenderWindow = vtkOpenGLRenderWindow.newInstance();
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
        console.log(itkImage);
        const imageData = vtkITKHelper.convertItkToVtkImage(itkImage);
        const dataRange = imageData
            .getPointData()
            .getScalars()
            .getRange();
        const firstIsoValue = (dataRange[0] + dataRange[1]) / 3;

        $('.isoValue').attr({
            'min': dataRange[0],
            'max': dataRange[1],
            'value': firstIsoValue
        }).next().html(firstIsoValue);

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
        renderWindow.render()

        $('.loading-render').addClass('animated fadeOutDown');
        $('.rendering-layout').addClass('hidden');
        $('.marching-cube-setting').removeClass('hidden');

        global.actor = actor;
        global.mapper = mapper;
        global.marchingCube = marchingCube;
    })
}