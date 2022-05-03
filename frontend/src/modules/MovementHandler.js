const playerSpeed = 0.07195416666666666666666666666667;
const playerVerticalSpeed = 0.08724816666666678;

let yawObject;

export function setCameraWrapper(newYawObject) {
    yawObject = newYawObject;
}

export function moveTowardsAngle(yaw) {
    yaw += yawObject.rotation.y;

    const dx = - Math.sin(yaw) * playerSpeed;
    const dz = - Math.cos(yaw) * playerSpeed;

    if (isNaN(dx)) {
        throw new Error('dx is not a number');
    } else if (isNaN(dz)) {
        throw new Error('dz is not a number');
    } else if (isNaN(yawObject.position.x)) {
        throw new Error('y is not a number');
    } else if (isNaN(yawObject.position.z)) {
        throw new Error('z is not a number');
    }
    
    yawObject.position.x += dx;
    yawObject.position.z += dz;
}

export function moveVertically(direction) {
    yawObject.position.y += direction * playerVerticalSpeed;
}