import {
  l, sRGB, bind,
  Context,
  Draw,
} from "./imports.js";
import {} from "./functions/matrix.js";

let context = new Context();

let createShader = bind(context, 'createShader');
let createProgram = bind(context, 'createProgram');
let createBuffer = bind(context, 'createBuffer');

createShader(
  "vertexShader",
  'VERTEX_SHADER',
  `
    attribute vec4 aVertexPosition;
    attribute vec4 aVertexColor;

    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;

    varying lowp vec4 vColor;

    void main(void) {
      gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
      vColor = aVertexColor;
      gl_PointSize = 10.0;
    }`
);

createShader(
  "fragmentShader",
 'FRAGMENT_SHADER',
  `
    varying lowp vec4 vColor;

    void main(void) {
      gl_FragColor = vColor;
      //gl_FragColor = vec4(0, 0, 1, 1);
    }`
);

let shaderProgram = createProgram("shaderProgram", [
  "vertexShader",
  "fragmentShader",
]);

let draw = new Draw(shaderProgram);
draw.animate(0.25);