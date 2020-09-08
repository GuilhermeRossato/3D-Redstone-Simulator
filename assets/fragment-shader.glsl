uniform sampler2D texture0;
uniform sampler2D texture1;

varying vec2 vUv;
varying vec2 vLightness;
varying vec2 vRelativeUv;

#define AO_IMPACT 0.3

void main() {
    vec4 color = texture2D(texture0, vUv);

    if (color.a < 0.5) { discard; }

    float aoMult;



    if (mod(vLightness.y, 128.0) <= 1.0) { // nothing
        aoMult = 1.0;
    } else {
        aoMult = 0.5;
    }

    gl_FragColor = vec4(color.xyz * vLightness.x * aoMult, 1.0);

    // disable texture and use only AO
    // if (vLightness.y >= 0.0 && vLightness.y <= 1288.0) { gl_FragColor = vec4(aoMult.xyz, 1.0); }

}