export function applyVelocity(entity, delta) {
  entity.mesh
  if (!entity.velocity) return;
  entity.position.x += entity.velocity.x * delta;
  entity.position.y += entity.velocity.y * delta;
  entity.position.z += entity.velocity.z * delta;
  // Apply gravity  
  if (!entity.onGround) {
    entity.velocity.y -= 9.81 * delta; // Gravity constant
  } else {
    entity.velocity.y = Math.max(0, entity.velocity.y); // Prevent sinking into ground
  }
}