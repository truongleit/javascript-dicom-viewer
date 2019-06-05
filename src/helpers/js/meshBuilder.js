function meshFromArray(array, row, col, name) {
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
    var name = name;
    mesh.name = name;

    return mesh;
}