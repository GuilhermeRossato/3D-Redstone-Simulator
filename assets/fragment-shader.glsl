uniform sampler2D texture0;
uniform sampler2D texture1;

varying vec2 vUv;
varying float vLightness;
varying vec2 vRelativeUv;
varying vec2 vAO;

#define AO_IMPACT 2.0

void main() {
    vec4 color = texture2D(texture0, vUv);

    if (color.a < 0.5) { discard; }

    vec4 aoColor = texture2D(texture1, vAO);
    float aoMult = (1.0 - AO_IMPACT * aoColor.a);

    gl_FragColor = vec4(color.rgb * aoMult * vLightness * aoMult, 1.0);
    //gl_FragColor = vec4(aoColor.rgb * vLightness * aoMult, 1.0);

    // disable texture and use only AO
    // if (vLightness.y >= 0.0 && vLightness.y <= 1288.0) { gl_FragColor = vec4(aoMult.xyz, 1.0); }
}