import {
  l,
  namedColor,
  sRGB,
  Mat4,
  WebGLObject,
  Context,
  Program,
  Shader,
  Attribute,
  Uniform,
  Buffer,
} from "../imports.js";

export class Draw extends WebGLObject {
  static ID = 0;

  constructor(program) {
    super(program.context);
    Draw.ID++;

    this.program = program;
    this.buffers = this.context.buffers;

    // Drawing buffers
    this.height = this.context.height;
    this.width = this.context.width;
    this.colorSpace = this.context.colorSpace;

    // Clear Color
    this.backgroundColor = this.context.backgroundColor;
    this.clearColor(this.backgroundColor, 1);

    // Clear everything
    // gl.clearDepth(1.0);

    // Enable depth testing
    this.depthTesting();

    // Clear the canvas before we start drawing on it.
    this.clear();
    //this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

    this.program.addUniform("projectionMatrix", "uProjectionMatrix");
    this.program.addUniform("modelViewMatrix", "uModelViewMatrix");
  }

  get aliasedPointSizes() {
    return this.context.parameter(this.gl.ALIASED_POINT_SIZE_RANGE);
  }

  lineWidth(width) {
    this.gl.lineWidth(width);
  }
  get getLineWidth() {
    return this.context.parameter(this.gl.LINE_WIDTH);
  }
  get aliasedLineWidths() {
    return this.context.parameter(this.gl.ALIASED_LINE_WIDTH_RANGE);
  }

  primitives = {
    points: this.gl.POINTS,
    lineStrip: this.gl.LINE_STRIP,
    lineLoop: this.gl.LINE_LOOP,
    lines: this.gl.LINES,
    triangleStrip: this.gl.TRIANGLE_STRIP,
    triangleFan: this.gl.TRIANGLE_FAN,
    triangles: this.gl.TRIANGLES,
  };

  clear() {
    // Clears Buffers to Preset Values.
    // Preset Values = [clearColor(), clearDepth(), clearStencil()]
    let a = this.gl["COLOR_BUFFER_BIT"];
    let b = this.gl["DEPTH_BUFFER_BIT"];
    let c = this.gl["STENCIL_BUFFER_BIT"];

    this.gl.clear(a | b | c);
  }
  finish() {
    this.gl.finish();
  }
  flush() {
    this.gl.flush();
  }

  get getClearColor() {
    return this.context.parameter(this.gl["COLOR_CLEAR_VALUE"]);
  }
  clearColor(color, alpha) {
    this.gl.clearColor(...namedColor(color), alpha);
  }

  get getClearDepth() {
    return this.context.parameter(this.gl["DEPTH_CLEAR_VALUE"]);
  }
  clearDepth(depth) {
    this.gl.clearDepth(depth);
  }

  get getClearStencil() {
    return this.context.parameter(this.gl["STENCIL_CLEAR_VALUE"]);
  }
  clearStencil(stencilIndex) {
    this.gl.clearStencil(stencilIndex);
  }

  depthTesting() {
    // Enable Depth Testing
    this.context.enable(this.gl.DEPTH_TEST);

    // Near things obscure far things
    //gl.depthFunc(gl.LEQUAL);
  }

  useProgram() {
    this.program.use();
  }

  draw() {}

  camera(time) {
    let FOV = 90;
    let aspectRatio = this.width / this.height;

    let panHorizontal = 0;
    let panVertical = 0;
    let zoom = 5;

    let Rx = time;
    let Ry = time * 0.7;
    let Rz = time * 0.3;

    let near = 0.1;
    let far = 100;

    this.program.setUniformMatrix(
      "projectionMatrix",
      Mat4.perspective(aspectRatio, FOV, near, far)
    );
    this.program.setUniformMatrix(
      "modelViewMatrix",
      Mat4.identity()
        .translate(panHorizontal, panVertical, -zoom)
        .rotate(Rz, 0, 0, 1)
        .rotate(Ry, 0, 1, 0)
        .rotate(Rx, 1, 0, 0)
    );
  }

  animate(speed = 1) {
    let time = 0;
    let deltaTime = 0;
    let then = 0;

    // Draw the scene repeatedly
    let renderLoop = (now) => {
      // This code uses requestAnimationFrame to ask the browser to call the function render on each frame.
      // requestAnimationFrame passes us the time in milliseconds since the page loaded.
      // We convert that to seconds and then subtract from it the last time to compute deltaTime, which is the number of second since the last frame was rendered.

      now *= 0.001; // Convert to Seconds
      now *= 50; // Tweak Factor
      now *= speed; // Speed Adjustment
      deltaTime = now - then;
      then = now;

      //this.draw(time);
      this.plane([1, 0, 0], [0, 1, 0], "palegreen", time);
      //this.square(2, 2, "red", time);
      this.triangle([1, 0, 0], [0, 1, 0], [0, 0, 1], [0.5, 0, 1], time);
      this.triangle([-5, 0, 0], [0, -5, 0], [0, 0, -5], "rebeccapurple", time);
      this.dot([1, 0, 0], "red", time);
      this.line([1, 0, 0], "red", time);
      this.dot([0, 1, 0], "green", time);
      this.line([0, 1, 0], "green", time);
      this.dot([0, 0, 1], "blue", time);
      this.line([0, 0, 1], "blue", time);

      // l("==============");
      // l("WebGLObject:", WebGLObject.ID);
      // l("Context:", Context.ID);
      // l("Program:", Program.ID);
      // l("Shader:", Shader.ID);
      // l("Attribute:", Attribute.ID);
      // l("Uniform:", Uniform.ID);
      // l("Buffer:", Buffer.ID);
      // l("Draw:", Draw.ID);
      // l("==============");

      // this.square(1, 3, "red", time);
      // this.square(3, 1, "blue", time);
      // this.cube(time);

      //trans += deltaTime;

      time += deltaTime;

      requestAnimationFrame(renderLoop);
    };
    requestAnimationFrame(renderLoop);
  }

  drawVertexArray(primitive, vertexCount, timeParameter) {
    // Enable Attribute & Bind vertexPosition Buffer to 'ARRAY_BUFFER'
    this.program.setAttributeFromBuffer(
      "vertexPosition",
      this.buffers.positionBuffer
    );

    // Enable Attribute & Bind vertexColor Buffer to 'ARRAY_BUFFER'
    this.program.setAttributeFromBuffer(
      "vertexColor",
      this.buffers.colorBuffer
    );

    // Activate Program
    this.useProgram();

    // Activate Camera
    this.camera(timeParameter);

    // Call Draw Function
    let offset = 0;
    this.gl.drawArrays(this.primitives[primitive], offset, vertexCount);

    // Set to Default Draw Function for RenderLoop
    this.draw = this.drawVertexArray.bind(this, primitive, vertexCount);
  }

  drawVertexIndices(primitive, vertexCount, timeParameter) {
    // Enable Attribute & Bind vertexPosition Buffer to 'ARRAY_BUFFER'
    this.program.setAttributeFromBuffer(
      "vertexPosition",
      this.buffers.positionBuffer
    );

    // Enable Attribute & Bind vertexColor Buffer to 'ARRAY_BUFFER'
    this.program.setAttributeFromBuffer(
      "vertexColor",
      this.buffers.colorBuffer
    );

    // Bind vertexIndex Buffer to 'ELEMENT_ARRAY_BUFFER'
    this.buffers.indexBuffer.bind(this.gl["ELEMENT_ARRAY_BUFFER"]);

    // Activate Program
    this.useProgram();

    // Activate Camera
    this.camera(timeParameter);

    // Call Draw Function
    let vertexIndexType = this.gl.UNSIGNED_SHORT;
    let offset = 0;
    this.gl.drawElements(
      this.primitives[primitive],
      vertexCount,
      vertexIndexType,
      offset
    );

    // Set to Default Draw Function for RenderLoop
    this.draw = this.drawVertexIndices.bind(this, primitive, vertexCount);
  }

  dot(location, color, timeParameter) {
    let buffer = this.context.createTempBuffer.bind(this.context);
    let attribute = this.program.createTempAttribute.bind(this.program);

    attribute(3, "aVertexPosition", buffer(location));
    attribute(4, "aVertexColor", buffer(sRGB(color)));

    this.useProgram();
    this.camera(timeParameter);

    this.gl.drawArrays(this.primitives["points"], 0, 1);
  }

  line(V, color, timeParameter) {
    let buffer = this.context.createTempBuffer.bind(this.context);
    let attribute = this.program.createTempAttribute.bind(this.program);

    let max = 100;

    let start = [V[0] * max, V[1] * max, V[2] * max];
    let end = [-V[0] * max, -V[1] * max, -V[2] * max];

    attribute(3, "aVertexPosition", buffer([start, end].flat(1)));
    attribute(4, "aVertexColor", buffer([sRGB(color), sRGB(color)].flat(1)));

    this.useProgram();
    this.camera(timeParameter);

    this.gl.drawArrays(this.primitives["lines"], 0, 2);
  }

  plane(U, V, color, timeParameter) {
    let max = 100;
    let A = [0, 0, 0];

    let u1 = U[0];
    let u2 = U[1];
    let u3 = U[2];

    let v1 = V[0];
    let v2 = V[1];
    let v3 = V[2];

    let B = [u1 * max, u2 * max, u3 * max];
    let C = [v1 * max, v2 * max, v3 * max];
    let D = [u1 + v1, u2 + v2, u3 + v3];

    this.triangle(A, B, C, color, timeParameter);
    this.triangle(B, C, D, color, timeParameter);

    let B2 = [-u1 * max, -u2 * max, -u3 * max];
    let C2 = [-v1 * max, -v2 * max, -v3 * max];
    let D2 = [-u1 + -v1, -u2 + -v2, -u3 + -v3];

    this.triangle(A, B2, C2, color, timeParameter);
    this.triangle(B2, C2, D2, color, timeParameter);

    let B3 = [-u1 * max, -u2 * max, -u3 * max];
    let C3 = [v1 * max, v2 * max, v3 * max];
    let D3 = [-u1 + v1, -u2 + v2, -u3 + v3];

    this.triangle(A, B3, C3, color, timeParameter);
    this.triangle(B3, C3, D3, color, timeParameter);

    let B4 = [u1 * max, u2 * max, u3 * max];
    let C4 = [-v1 * max, -v2 * max, -v3 * max];
    let D4 = [u1 + -v1, u2 + -v2, u3 + -v3];

    this.triangle(A, B4, C4, color, timeParameter);
    this.triangle(B4, C4, D4, color, timeParameter);
  }

  triangle(A, B, C, color, timeParameter) {
    let buffer = this.context.createTempBuffer.bind(this.context);
    let attribute = this.program.createTempAttribute.bind(this.program);

    attribute(3, "aVertexPosition", buffer([A, B, C].flat(1)));
    attribute(
      4,
      "aVertexColor",
      buffer([sRGB(color), sRGB(color), sRGB(color)].flat(1))
    );

    this.useProgram();
    this.camera(timeParameter);

    this.gl.drawArrays(this.primitives["triangles"], 0, 3);
  }

  square(height, width, color, timeParameter) {
    let A = [0, 0, 0];
    let B = [1 * width, 0, 0];
    let C = [0, 1 * height, 0];
    let D = [1 * width, 1 * height, 0];

    this.triangle(A, B, C, color, timeParameter);
    this.triangle(B, C, D, color, timeParameter);
  }

  cube(timeParameter) {
    let cubeVertices = [
      // Front face
      [-1, -1, 1],
      [1, -1, 1],
      [1, 1, 1],
      [-1, 1, 1],
      // Back face
      [-1, -1, -1],
      [-1, 1, -1],
      [1, 1, -1],
      [1, -1, -1],
      // Top face
      [-1, 1, -1],
      [-1, 1, 1],
      [1, 1, 1],
      [1, 1, -1],
      // Bottom face
      [-1, -1, -1],
      [1, -1, -1],
      [1, -1, 1],
      [-1, -1, 1],
      // Right face
      [1, -1, -1],
      [1, 1, -1],
      [1, 1, 1],
      [1, -1, 1],
      // Left face
      [-1, -1, -1],
      [-1, -1, 1],
      [-1, 1, 1],
      [-1, 1, -1],
    ];

    let cubeColors = [
      [sRGB("white"), sRGB("white"), sRGB("white"), sRGB("white")], // Front face
      [sRGB("purple"), sRGB("purple"), sRGB("purple"), sRGB("purple")], // Back face
      [sRGB("green"), sRGB("green"), sRGB("green"), sRGB("green")], // Top face
      [sRGB("blue"), sRGB("blue"), sRGB("blue"), sRGB("blue")], // Bottom face
      [sRGB("yellow"), sRGB("yellow"), sRGB("yellow"), sRGB("yellow")], // Right face
      [sRGB("red"), sRGB("red"), sRGB("red"), sRGB("red")], // Left face
    ];

    let cubeBuffer = this.context.createBuffer(
      "cubeBuffer",
      "ARRAY_BUFFER",
      cubeVertices.flat(Infinity)
    );

    let cubeColorsBuffer = this.context.createBuffer(
      "cubeColorsBuffer",
      "ARRAY_BUFFER",
      cubeColors.flat(Infinity)
    );

    let cubeIndexBuffer = this.context.createBuffer(
      "cubeIndexBuffer",
      "ELEMENT_ARRAY_BUFFER",
      new Uint16Array([
        0,
        1,
        2,
        0,
        2,
        3, // front
        4,
        5,
        6,
        4,
        6,
        7, // back
        8,
        9,
        10,
        8,
        10,
        11, // top
        12,
        13,
        14,
        12,
        14,
        15, // bottom
        16,
        17,
        18,
        16,
        18,
        19, // right
        20,
        21,
        22,
        20,
        22,
        23, // left
      ])
    );

    this.program.addAttribute("cubePosition", "aVertexPosition", 3);
    this.program.addAttribute("cubeColor", "aVertexColor", 4);

    this.program.setAttributeFromBuffer("cubePosition", cubeBuffer);
    this.program.setAttributeFromBuffer("cubeColor", cubeColorsBuffer);

    cubeIndexBuffer.bind();

    this.useProgram();
    this.camera(timeParameter);

    let vertexIndexType = this.gl.UNSIGNED_SHORT;
    this.gl.drawElements(this.primitives["triangles"], 36, vertexIndexType, 0);
  }
}
