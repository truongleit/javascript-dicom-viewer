// Execute Point cloud rendering algorithm //
var points = [];
$(document).ready(function() {
    $('.point-cloud').click(async function() {
        $('.slice-mode-layout').addClass('hidden');
        renderAlgorithm = 'Point Cloud';

        var files = document.getElementById("file_inp").files;

        $('.lds-hourglass').addClass('block');
        showViewer('Point Cloud');
        $('.viewer').addClass('opened');

        let zInfo = await getZCoordinate(files);

        var initPoint = zInfo[0];
        var zSpacing = zInfo[1];
        var newPoint = initPoint;

        for (var i = 0; i < files.length; i++) {

            var zCoordinate = (i == 0) ? initPoint : newPoint;
            newPoint += zSpacing;
            await boundaryExtraction(files[i], points, i, zCoordinate);

        }
        console.log(points);
        pcdLoader(points);

        $('.slider').slick('unslick');
        $('.switch-algorithm').val(renderAlgorithm);
        $('select').formSelect();
        $('.lds-hourglass').removeClass('block');
    });
});



function pcdLoader(points) {

    var container, stats;
    var camera, controls, scene, renderer;

    init();
    animate();

    function init() {

        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x000000);

        camera = new THREE.PerspectiveCamera(15, window.innerWidth / window.innerHeight, 0.01, 40);
        camera.position.x = 0.4;
        camera.position.z = -2;
        camera.up.set(0, 0, 1);

        scene.add(camera);

        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);

        let mesh = meshFromArray(points)
        scene.add(mesh);

        container = document.getElementById('3d');
        container.appendChild(renderer.domElement);

        controls = new THREE.TrackballControls(camera, renderer.domElement);

        controls.rotateSpeed = 2.0;
        controls.zoomSpeed = 0.3;
        controls.panSpeed = 0.2;

        controls.noZoom = false;
        controls.noPan = false;

        controls.staticMoving = true;
        controls.dynamicDampingFactor = 0.3;

        controls.minDistance = 0.3;
        controls.maxDistance = 0.3 * 100;

        stats = new Stats();
        container.appendChild(stats.dom);

        window.addEventListener('resize', onWindowResize, false);

        window.addEventListener('keypress', keyboard);

    }

    function onWindowResize() {

        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        controls.handleResize();

    }

    function keyboard(ev) {

        var points = scene.getObjectByName('Zaghetto.pcd');

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

    function animate() {

        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
        stats.update();

    }
}

function meshFromArray(array) {

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
    material.color.setHex(Math.random() * 0xffffff);

    // build mesh
    var mesh = new THREE.Points(geometry, material);

    return mesh;
}

async function getZCoordinate(file) {

    let data = await itk.readImageDICOMFileSeries(null, file).then(function({ image, webWorker }) {
        webWorker.terminate();
        return ([image.origin[2], image.spacing[2]]);
    });

    return data;
}

async function boundaryExtraction(file, points, index, zCoordinate) {

    //
    //// Read and draw DICOM to canvas
    //

    var inputFile = file;
    $('.viewer').append('<div id="slice-' + index + '" class="dicom-canvas"></div>');

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
    $(div).remove();
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
    // cv.imshow('canvasOutput', mat);

    //
    //// Get all coordinates (only x,y) for slice
    //
    for (let row = 0; row < rows; ++row) {
        for (let col = 0; col < cols; ++col) {

            let pixel = mat.ucharPtr(row, col);
            let grayscale = pixel[0];

            if (grayscale >= 250) {
                points.push([row / 1000, col / 1000, zCoordinate / 1000]);
                // points.push([row, col]);
            }
        }
    }
    mat.delete();

}