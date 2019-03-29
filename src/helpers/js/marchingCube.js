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


const renderWindow = vtkRenderWindow.newInstance();
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

function updateIsoValue(e) {
    const isoValue = Number(e.target.value);
    marchingCube.setContourValue(isoValue);
    renderWindow.render();
}

$(document).ready(function() {
    $('.marching-cube').on('click', function() {
        var files = document.getElementById("file_inp").files;
        $('.lds-hourglass').addClass('block');
        showViewer();
        $('.viewer').addClass('opened');
        setTimeout(function() {
            marchingCubeRender(files);
        }, 1500)
    })
});

const reader = vtkHttpDataSetReader.newInstance({
    fetchGzip: true
});
marchingCube.setInputConnection(reader.getOutputPort());

function marchingCubeRender(files) {
    let reader = itkreadImageDICOMFileSeries;
    let arg = files;
    reader(null, arg).then(({
        image: itkImage,
        webWorker
    }) => {
        webWorker.terminate()
        console.log(itkImage)

        const imageData = vtkITKHelper.convertItkToVtkImage(itkImage);
        console.log(imageData)

        const dataRange = imageData
            .getPointData()
            .getScalars()
            .getRange();
        const firstIsoValue = (dataRange[0] + dataRange[1]) / 3;

        const container = document.getElementById('3d');
        openglRenderWindow.setContainer(container);
        const { width, height } = container.getBoundingClientRect();
        openglRenderWindow.setSize(width, height);

        const interactor = vtkRenderWindowInteractor.newInstance();
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
        renderer.resetCamera();
        renderWindow.render();
        $('.rendering-layout').addClass('fade-out');
        $('.lds-hourglass').removeClass('block');
        $('.rendering-layout').addClass('hidden');
    })
}

global.actor = actor;
global.mapper = mapper;
global.marchingCube = marchingCube;