import * as THREE from '../libs/three.module.js';

export function createMarker(x = 0, y = 0, z = 0, color = 0xFFFFFF, size = 1/16, duration = null) {
    if (!(color instanceof THREE.Color)) {
        color = new THREE.Color(color);
    }
    const geometry = new THREE.BufferGeometry();
    const vertices = new Float32Array([
        // Line 1
    	x, y - size, z,
    	x, y + size, z,
        // Line 2
    	x, y, z - size,
    	x, y, z + size,
        // Line 3
    	x - size, y, z,
    	x + size, y, z
    ]);
    geometry.setAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );
    
    const material = new THREE.LineBasicMaterial({
        color: color,
        linewidth: 1
    });

    const lines = new THREE.LineSegments(geometry, material);
    if (window.scene) {
        window.scene.add(lines);
    }
    if (duration) {
        setTimeout(() => { window.scene.remove(lines); }, duration * 1000);
    }
    return lines;
}

document.addEventListener('keydown', event => {
    if (event.keyCode === 113 || event.code === 'F2') {
        event.preventDefault();
    } else if (event.keyCode === 114 || event.code === 'F3') {
        event.preventDefault();
    } else if (event.keyCode === 115 || event.code === 'F4') {
        event.preventDefault();
    }
});

window.addEventListener('keyup', (event) => {
    if (event.code === 'F4') {
        /*
        const markers = [];
        for (let i = 0; i < 10; i++) {
            const origin = raycaster.ray.origin;
            const direction = raycaster.ray.direction;
            const target = new THREE.Vector3();
            ['x', 'y', 'z'].forEach(axis => target[axis] = origin[axis] + (direction[axis] * i / 2));
            markers.push(createMarker(target.x, target.y, target.z));
        }
        setTimeout(() => {
            markers.forEach(marker => marker.parent.remove(marker));
        }, 3000);
        */
    }
});

window.createMarker = createMarker;
