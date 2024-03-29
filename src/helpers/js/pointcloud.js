// Execute Point cloud rendering algorithm //
var points = [];

$(document).ready(function() {

    //
    //// Increase points' size
    //
    $('.size-decrease').click(function() {
        var points = pointCloudScene.getObjectByName('dicomMesh');
        if (renderAlgorithm == 'Point Cloud') {
            points.material.size /= 1.1;
            points.material.needsUpdate = true;
        }
    });

    //
    //// Decrease points' size
    //
    $('.size-increase').click(function() {
        var points = pointCloudScene.getObjectByName('dicomMesh');
        if (renderAlgorithm == 'Point Cloud') {
            points.material.size *= 1.1;
            points.material.needsUpdate = true;
        }
    });

    //
    //// Color picker
    //
    var colorPC = new iro.ColorPicker('.sinh-color', {
        width: 180,
        borderWidth: 1,
        borderColor: '#333',
    });
    colorPC.on('color:change', onPCColorChange);
    function onPCColorChange(color, changes) {
        if (renderAlgorithm == 'Point Cloud') {
            var points = pointCloudScene.getObjectByName('dicomMesh');
            var hex = color.hexString;
            var color = new THREE.Color(hex);
            points.material.color.setRGB(color.r, color.g, color.b);
            points.material.needsUpdate = true;
        }
    }

    //
    //// Randomize points' color
    //
    $('.random-color-button').click(function() {
        var points = pointCloudScene.getObjectByName('dicomMesh');
        points.material.color.setHex(Math.random() * 0xffffff);
        points.material.needsUpdate = true;
    });

    $('.point-cloud').click(async function() {
        var boundary_container = '<div class="boundary-container"></div>';
        $('#sliceX, #sliceY, #sliceZ').remove();
        $('.slices.setting').addClass('hidden');
        $('#3d').css({
            'width': 75 + '%',
            'height': 100 + '%',
        });
        $('.twoD-container').css({
            'width': 25 + '%',
        }).append(boundary_container);

        renderAlgorithm = 'Point Cloud';

        var files = document.getElementById("file_inp").files;

        $('.re-render').remove();
        showViewer('Sinh' + '\'' + 's Method');
        $('.viewer').addClass('opened');

        t0 = performance.now();

        let zInfo = await getZCoordinate(files);

        var initPoint = zInfo[0];
        var zSpacing = zInfo[1];
        var newPoint = initPoint;

        var meshWidth = zInfo[2];
        var meshHeight = zInfo[3];

        for (var i = 0; i < files.length; i++) {

            var zCoordinate = (i == 0) ? initPoint : newPoint;
            newPoint += zSpacing;
            await boundaryExtraction(files[i], points, i, zCoordinate);

        }

        pcdLoader(points, meshWidth, meshHeight);

        $('.dicom-canvas').css({
            'width': 100 + '%',
        });
        $('.loading-render').addClass('animated fadeOutDown');
        $('.slider').slick('unslick');
        $('.switch-algorithm').val(renderAlgorithm);
        $('select').formSelect();

        $('.sinh-setting').removeClass('hidden');


    });
});

var pointCloudContainer, pointCloudStats;
var pointCloudCamera, pointCloudControls, pointCloudScene, pointCloudRenderer;

function pcdLoader(points) {

    pointCloudInit();
    pointCloudAnimate();

}

function pointCloudInit() {

    pointCloudContainer = document.getElementById('3d');

    pointCloudScene = new THREE.Scene();
    pointCloudScene.background = new THREE.Color(0x000000);

    pointCloudCamera = new THREE.PerspectiveCamera(5, pointCloudContainer.offsetWidth / pointCloudContainer.offsetHeight, 1, 1000);
    pointCloudCamera.position.x = -0.7738894355355945;
    pointCloudCamera.position.y = -0.6186002375339695;
    pointCloudCamera.position.z = -0.21005870317276934;
    pointCloudCamera.up.set(0.239655992413268, 0.028890429480839173, -0.9704279202418031);

    pointCloudScene.add(pointCloudCamera);

    pointCloudRenderer = new THREE.WebGLRenderer({ antialias: true });
    pointCloudRenderer.setPixelRatio(window.devicePixelRatio);
    pointCloudRenderer.setSize(pointCloudContainer.offsetWidth, pointCloudContainer.offsetHeight);
    pointCloudContainer.appendChild(pointCloudRenderer.domElement);


    let mesh = meshFromArray(points)
    pointCloudScene.add(mesh);

    pointCloudControls = new THREE.TrackballControls(pointCloudCamera, pointCloudRenderer.domElement);

    var center = mesh.geometry.boundingSphere.center;
    pointCloudControls.target.set(center.x, center.y, center.z);
    pointCloudControls.update();

    pointCloudControls.rotateSpeed = 1.2;
    pointCloudControls.zoomSpeed = 0.8;
    pointCloudControls.panSpeed = 0.1;

    pointCloudControls.noZoom = false;
    pointCloudControls.noPan = false;

    pointCloudControls.staticMoving = true;
    pointCloudControls.dynamicDampingFactor = 0.3;

    pointCloudControls.minDistance = 0.3;
    pointCloudControls.maxDistance = 0.3 * 100;

    window.addEventListener('resize', onWindowResizePointCloud(), false);

    window.addEventListener('keypress', keyboard);

    // stats
    meter = new FPSMeter(
        $('.monitor-container').get(0),
        {
            graph: 1,
            theme: 'diRea'
        });

}

function pointCloudAnimate() {

    if ($('.settings').hasClass('moved')) meter.tick();
    pointCloudControls.update();
    pointCloudRenderer.render(pointCloudScene, pointCloudCamera);
    requestAnimationFrame(pointCloudAnimate);

}

function onWindowResizePointCloud() {

    pointCloudCamera.aspect = pointCloudContainer.offsetWidth / pointCloudContainer.offsetHeight;
    pointCloudCamera.updateProjectionMatrix();
    pointCloudRenderer.setSize(pointCloudContainer.offsetWidth, pointCloudContainer.offsetHeight);
    pointCloudControls.handleResize();

}

function pointColorPicker(picker) {
    var points = pointCloudScene.getObjectByName('dicomMesh');
    var hex = picker.toHEXString();
    var color = new THREE.Color(hex);
    points.material.color.setRGB(color.r, color.g, color.b);
    points.material.needsUpdate = true;
}

function keyboard(ev) {

    var points = pointCloudScene.getObjectByName('dicomMesh');

    switch (ev.key || String.fromCharCode(ev.keyCode || ev.charCode)) {

        case '+':
            points.material.size *= 1.2;
            points.material.needsUpdate = true;
            break;

        case '-':
            points.material.size /= 1.2;
            points.material.needsUpdate = true;
            break;

        case 'c':
            points.material.color.setHex(Math.random() * 0xffffff);
            points.material.needsUpdate = true;
            break;

    }

}

function meshFromArray(array, width, height) {

    var position = [];

    for (points of array) {
        position.push(points[0]);
        position.push(points[1]);
        position.push(points[2]);
    }

    // build geometry
    var geometry = new THREE.BufferGeometry();
    if (position.length > 0) geometry.addAttribute('position', new THREE.Float32BufferAttribute(position, 3));

    geometry.computeBoundingSphere();

    // build material
    var material = new THREE.PointsMaterial({ size: 0.005 });
    // material.color.setHex(Math.random() * 0xffffff);
    material.color.setHex(0x1D7FFF);

    // build mesh
    var mesh = new THREE.Points(geometry, material);
    mesh.name = 'dicomMesh';
    mesh.width = parseInt(width);
    mesh.height = parseInt(height);

    return mesh;
}

async function getZCoordinate(file) {

    let data = await itk.readImageDICOMFileSeries(null, file).then(function({ image, webWorker }) {
        webWorker.terminate();
        return ([image.origin[2], image.spacing[2], image.size[0], image.size[1]]);
    });

    return data;
}

async function boundaryExtraction(file, points, index, zCoordinate) {

    //
    //// Read and draw DICOM to canvas
    //
    var inputFile = file;
    $('.boundary-container').append('<div id="slice-' + index + '" class="dicom-canvas"></div>');

    var element = $('#slice-' + index).get(0);
    var div = '#slice-' + index;
    cornerstone.enable(element);

    var index = cornerstoneFileImageLoader.addFile(inputFile);
    var imageId = "dicomfile://" + index;

    image = await cornerstone.loadImage(imageId)
    cornerstone.displayImage(element, image);

    //
    //// Boundary extraction
    //
    var imgElement = $('#slice-' + index + ' canvas').get(0);
    let mat = cv.imread(imgElement);
    let rows = mat.rows
    let cols = mat.cols
    let flag = new Array(rows * cols);
    flag = flag.fill(false);

    // Set the threshold to pixel data
    cv.threshold(mat.clone(), mat, 20, 100, cv.THRESH_BINARY);

    // Mark and change inner's pixel color to white 
    flag[0] = true;
    for (let row = 0; row < rows; ++row) {
        for (let col = 0; col < cols; ++col) {

            let pixel = mat.ucharPtr(row, col);
            let R = pixel[0];
            let G = pixel[1];
            let B = pixel[2];
            let A = pixel[3];

            if (flag[row * mat.cols + col] && !(R || B || G)) {
                flag[(row) * mat.cols + col + 1] = true;
                flag[(row + 1) * mat.cols + col - 1] = true;
                flag[(row + 1) * mat.cols + col] = true;
                flag[(row + 1) * mat.cols + col + 1] = true;
                pixel[0] = 0;
                pixel[1] = 0;
                pixel[2] = 0;
                pixel[3] = 255;
            } else {
                pixel[0] = 255;
                pixel[1] = 255;
                pixel[2] = 255;
                pixel[3] = 255;
            }
        }
    }

    // Apply canny edge detection to remove all inner pixels
    cv.Canny(mat.clone(), mat, 50, 100, 3, false);

    // Add boundary canvas to container
    cv.imshow(imgElement, mat);
    $(div).append('<div class="boundary-info"><p><b>Index:</b> ' + index + '</p><p><b>Size:</b> 140x140 (px)</p><p><b>Type:</b> Canvas</p><p><b>Filename:</b> ' + inputFile.name + '</p></div>');

    //
    //// Get all coordinates (only x,y) for slice
    //
    for (let row = 0; row < rows; ++row) {
        for (let col = 0; col < cols; ++col) {

            let pixel = mat.ucharPtr(row, col);
            let grayscale = pixel[0];

            if (grayscale >= 250) {
                points.push([row / 550, col / 550, zCoordinate / 1100]);
            }
        }
    }
    mat.delete();

}