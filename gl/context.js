import {
  l,
  Slider,
  sRGB,
  Mat3,
  Mat4,
  Vec3,
  radToDeg,
  degToRad,
  Program,
  Logger,
  enumMap,
  primitivesMap,
  indent,
} from "../imports.js";
import * as Shapes from "../functions/shapes.js";

export class WebGLObject {
  static ID = 0;

  constructor(context) {
    WebGLObject.ID++;
    this.ID = WebGLObject.ID;
    this.name = this.constructor.name + " #" + this.ID;

    this.context = context;
    this.gl = context.gl;
  }
}

export class Context {
  // WebGLRenderingContext
  static ID = 0;
  static debug = false;

  constructor(options, canvas) {
    Context.ID++;
    this.ID = Context.ID;
    this.name = this.constructor.name + " #" + this.ID;

    if (canvas) this.canvas = canvas;
    else this.canvas = document.querySelector("canvas");

    this.gl = this.canvas.getContext("webgl2");
    this.height = this.gl.drawingBufferHeight;
    this.width = this.gl.drawingBufferWidth;
    this.pageBackgroundColor = document.body.style.backgroundColor;
    this.backgroundColor = sRGB(options?.backgroundColor) || [0, 0, 0, 1];
    this.colorSpace = this.gl.drawingBufferColorSpace;
    this.format = this.gl.drawingBufferFormat;
    this.enums = this.gl.__proto__;

    this.aspectRatio = 1; //this.gl.canvas.clientWidth / this.gl.canvas.clientHeight;

    this.unit = 1;
    this.origin = [0, 0, 0]; // World Origin
    this.orientation = [0, 0, 0]; // World Orientation
    this.up = [0, 1, 0];
    this.defaultView = {
      // Projection Matrix
      aspectRatio: this.aspectRatio,
      FOV: degToRad(60),
      near: 1,
      far: 2000,

      // Camera Matrix
      up: this.up,
      cameraPosition: [50, 50, 50, 1],
      cameraAngle: [degToRad(0), degToRad(0), degToRad(0)],
      cameraArc: [degToRad(0), degToRad(0), degToRad(0)],
      cameraTarget: [0, 0, 0],
      cameraZoom: [1, 1, 1],
    };

    this.view = { ...this.defaultView, ...options?.view };
    this.is2D = options?.is2D || false;
    this.is3D = options?.is3D || false;
    this.animated = options?.animated || false;
    //this.controls = options?.controls || false;

    this.objectsToDraw = [];
    this.objectMatrices;
    this.drawFunction;

    this.objectSelected = this.nonUIObjectsToDraw[this.objectSelectedNumber];

    this.lights = {};

    this.currentProgram;

    this.images = options?.images || [];

    this.buffers = {};
    this.shaders = {};
    this.programs = {};
    this.textures = [];

    SceneGraphNode.nodes = [];
    new SceneGraphNode("world");
    new SceneGraphNode("worldOrigin").setParent(SceneGraphNode.world);
    //new SceneGraphNode("objectSelected").setParent(this.objectSelected?.node);

    // if (this.controls) {
    //   this.enableControls();
    // }

    // if (this.is2D) {
    //   this.context2D.programs.basicProgram2D =
    //     this.context2D.programs.createBasicProgram2D();
    // }
    // this.programs.basicProgram3D =
    //   this.programs.createBasicProgram3D();

    log.info("Context:", this.name, "Created");
    log.object("  Canvas:", this.canvas);
  }

  printObjects() {
    console.log("------Context RenderObjects------");
    this.objectsToDraw.forEach((object, i) => {
      if (object.UIObject) {
        console.log(` ${i}: %c${object.name}`, "color:palegreen;");
      } else {
        console.log(` ${i}: %c${object.name}`, "color:yellow;");
      }
    });
    return this;
  }
  get nonUIObjectsToDraw() {
    return this.objectsToDraw.filter((x) => !x.UIObject);
  }
  get world() {
    return SceneGraphNode.world;
  }

  createShader(shaderSource, shaderType) {
    let gl = this.gl;
    let shader = gl.createShader(shaderType);
    gl.shaderSource(shader, shaderSource);
    log.info("  isShader:", gl.isShader(shader));
    gl.compileShader(shader);
    log.info(
      "    Shader Compile:",
      gl.getShaderParameter(shader, gl.COMPILE_STATUS)
    );
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error("Could not compile shader:" + gl.getShaderInfoLog(shader));
    }
    return shader;
  }
  createProgram(vertexShader, fragmentShader) {
    let gl = this.gl;
    vertexShader = this.createShader(vertexShader, gl.VERTEX_SHADER);
    fragmentShader = this.createShader(fragmentShader, gl.FRAGMENT_SHADER);
    let program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    log.info("  isProgram:", gl.isProgram(program));

    log.info(
      "    Program Link:",
      gl.getProgramParameter(program, gl.LINK_STATUS)
    );
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(
        "Unable to initialize the shader program:",
        gl.getProgramInfoLog(program)
      );
    }
    gl.validateProgram(program);
    log.info(
      "    Program Validate:",
      gl.getProgramParameter(program, gl.VALIDATE_STATUS)
    );

    this.program = new Program(this, program);
    return this.program;
  }
  createTexture(image) {
    let gl = this.gl;

    let texture = gl.createTexture();

    //gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Set the parameters so we don't need mips
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    //l(image);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    //gl.generateMipmap(gl.TEXTURE_2D);

    return texture;
  }
  createObject(settings) {
    let object = new RenderObject(this, settings);
    this.objectsToDraw.push(object);
    return object;
  }
  createNode(settings) {
    let node = new SceneGraphNode(settings.name);
    if (settings.parent) node.setParent(settings.parent);
    if (settings.translation) node.translate(...settings.translation);
    return node;
  }

  createLight(position) {
    let light = {
      name: "light" + Array.from(this.lights).length,
      position: position,
      get u_lightWorldPosition() {
        return this.position;
      },
      set u_lightWorldPosition(val) {
        this.position = val;
      },
    };
    this.lights[light.name] = light;
    this.conditionalObjectFilter("showLightSources", "pointLightSource", [
      "pointLightSource",
    ]);
    //this.sliders();
    //l(this.lights);
  }
  get numberOfLights() {
    return Array.from(this.lights).length;
  }

  drawVertices(vao) {
    let gl = this.gl;
    let primitive = primitivesMap(vao.primitive) || "TRIANGLES";
    log.info("  drawVertices() called with vao:", vao.name);
    if (vao.hasIndices) {
      log.info(
        "    Calling drawElements() with",
        this.countVertices(vao),
        "Vertices."
      );
      gl.drawElements(
        gl[primitive],
        this.countVertices(vao),
        gl.UNSIGNED_SHORT,
        0
      );
    } else {
      log.info(
        "    Calling drawArrays() with",
        this.countVertices(vao),
        "Vertices."
      );
      //l(primitive);
      gl.drawArrays(gl[primitive], 0, this.countVertices(vao));
    }
  }
  countVertices(vao) {
    let vertexCount;
    // l(this.attributes);
    //l("vao.hasIndices", vao.hasIndices);
    // l('this.is2Ds', this.is2D);
    // l('this.is3D', this.is3D);
    if (vao.hasIndices) {
      //l("test1");
      vertexCount = vao.indices.data?.length || vao.indices.length;
    } else {
      if (this.is2D) {
        //l("test2");
        vertexCount =
          vao.attributes.a_position.length / 2 ||
          vao.attributes.a_position.data.length / 2;
      } else if (this.is3D) {
        //l("test3");
        vertexCount =
          vao.attributes.a_position?.length / 3 ||
          vao.attributes.a_position?.data?.length / 3;
      } else {
        vertexCount =
          vao.attributes.a_position?.length / 3 ||
          vao.attributes.a_position?.data?.length / 3;
      }
    }
    //l('vertexCount', vertexCount);
    return vertexCount;
  }

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

  useProgram(program) {
    this.program.use();
  }

  resizeCanvasToDisplaySize(multiplier) {
    multiplier = multiplier || 1;

    // Lookup the size the browser is displaying the canvas in CSS pixels.
    let width = (this.canvas.clientWidth * multiplier) | 0;
    let height = (this.canvas.clientHeight * multiplier) | 0;

    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
      return true;
    }
    return false;
  }
  canvasDrawingbufferSize(width, height) {
    this.canvas.width = width;
    this.canvas.height = height;
  }
  get getCanvasDrawingbufferSize() {
    return [this.canvas.width, this.canvas.height];
  }
  canvasDisplaySize(width, height) {
    //this.canvas.style = `width:${width};height:${height};`;
    this.canvas.style.width = String(width + "px");
    this.canvas.style.height = String(height + "px");
  }
  get getCanvasDisplaySize() {
    return [this.canvas.style.width, this.canvas.style.height];
  }

  lineWidth(width) {
    // This is essentially deprecated and doesn't do anything.
    this.gl.lineWidth(width);
  }
  get getLineWidth() {
    return this.parameter(this.gl.LINE_WIDTH);
  }
  get aliasedLineWidths() {
    return this.parameter(this.gl.ALIASED_LINE_WIDTH_RANGE);
  }
  get aliasedPointSizes() {
    return this.parameter(this.gl.ALIASED_POINT_SIZE_RANGE);
  }

  get contextAttributes() {
    //this = { ...this, ...this.gl.getContextAttributes() };
    return this.gl.getContextAttributes();
  }
  get supportedExtensions() {
    return this.gl.getSupportedExtensions();
  }
  isEnabled(capability) {
    return this.gl.isEnabled(capability);
  }
  get isContextLost() {
    return this.gl.isContextLost();
  }

  get currentProgram() {
    return this.parameter(this.gl.CURRENT_PROGRAM);
  }

  getError() {
    return this.gl.getError();
  }
  parameter(parameter) {
    return this.gl.getParameter(parameter);
  }
  enable(capability) {
    return this.gl.enable(capability);
  }
  disable(capability) {
    return this.gl.disable(capability);
  }

  // Extensions
  getSupportedExtensions() {
    return this.gl.getSupportedExtensions();
  }
  getExtension() {
    return this.gl.getExtension();
  }
}

let log = new Logger(Context.debug, import.meta.url);

export class Context2D extends Context {
  constructor(options) {
    super(options);

    this.is2D = true;
    this.programs.basicProgram2D = this.programs.createBasicProgram2D();
  }
  update() {
    let event = new Event("draw");
    this.globalMatrices().viewProjectionMatrix;
    this.draw();
    document.querySelector("body").dispatchEvent(event);
  }
  objects = {
    context: this,
    F() {
      this.context.createObject(
        this.context.context2D.programs.locationColorizeProgram2D(),
        {
          a_position: {
            data: [
              //left column
              0, 0, 30, 0, 0, 150, 0, 150, 30, 0, 30, 150,
              // top rung
              30, 0, 100, 0, 30, 30, 30, 30, 100, 0, 100, 30,
              // middle rung
              30, 60, 67, 60, 30, 90, 30, 90, 67, 60, 67, 90,
            ],
            size: 2,
          },
        },
        {},
        { name: "2DF", scale: 1, translation: [0, 0] }
      );
    },
    axes2D() {
      this.context.createObject(
        this.context.context2D.programs.basicProgram2D,
        {
          a_position: {
            data: [
              [0, 0],
              [1, 0],
              [0, 1],
            ],
            size: 2,
          },
          a_color: {
            data: [sRGB("black"), sRGB("red"), sRGB("blue")],
            // size: 3,
            // type: "UNSIGNED_BYTE", // The data is 8bit unsigned bytes
            // normalize: true, // Convert from 0-255 to 0.0-1.0
            // arrayType: Uint8Array,
          },
        },
        {},
        { name: "axes2DPoints", primitive: "points" }
      );
      let max = 100;
      let direction1 = [1, 0];
      let direction2 = [0, 1];
      this.context.createObject(
        this.context.context2D.programs.basicProgram2D,
        {
          a_position: {
            data: [
              [-direction1[0] * max, -direction1[1] * max],
              [direction1[0] * max, direction1[1] * max],
              [-direction2[0] * max, -direction2[1] * max],
              [direction2[0] * max, direction2[1] * max],
            ],
            size: 2,
          },
          a_color: {
            data: [sRGB("red"), sRGB("red"), sRGB("blue"), sRGB("blue")],
            // size: 3,
            // type: "UNSIGNED_BYTE", // The data is 8bit unsigned bytes
            // normalize: true, // Convert from 0-255 to 0.0-1.0
            // arrayType: Uint8Array,
          },
        },
        {},
        { name: "axes2DLines", primitive: "lines" }
      );
    },
    rectangle(width = 1, height = 1, x = 0, y = 0, color = "red") {
      this.context.createObject(
        this.context.context2D.programs.basicProgram2D,
        {
          a_position: {
            data: [
              [x, y],
              [x + height, y],
              [x, y + width],
              [x, y + width],
              [x + height, y],
              [x + height, y + width],
            ],
            size: 2,
          },
          a_color: {
            data: new Array(6).fill(sRGB(color)),
            // size: 3,
            // type: "UNSIGNED_BYTE", // The data is 8bit unsigned bytes
            // normalize: true, // Convert from 0-255 to 0.0-1.0
            // arrayType: Uint8Array,
          },
        },
        {},
        { name: "retangle", scale: 100 }
      );
    },
  };
  programs = {
    context: this,
    createBasicProgram2D() {
      //l(this.context);
      let basicVertexShader = `#version 300 es
          in vec2 a_position;
          in vec4 a_color;

          uniform mat3 u_matrix;

          out vec4 v_color;

          void main(void) {
            gl_Position = vec4((u_matrix * vec3(a_position, 1)).xy, 0, 1);
            gl_PointSize = 10.0;

            v_color = a_color;
          }
        `;

      let basicFragmentShader = `#version 300 es
          precision highp float;

          in vec4 v_color;

          out vec4 outColor;

          void main() {
            outColor = v_color;
          }
        `;

      return this.context.createProgram(basicVertexShader, basicFragmentShader);
    },
    locationColorizeProgram2D() {
      let vertexShader = `#version 300 es
          in vec2 a_position;

          uniform mat3 u_matrix;

          out vec4 v_color;

          void main(void) {
            gl_Position = vec4((u_matrix * vec3(a_position, 1)).xy, 0, 1);

            // Convert from clipspace to colorspace.
            // Clipspace goes -1.0 to +1.0
            // Colorspace goes from 0.0 to 1.0
            v_color = gl_Position * 0.5 + 0.5;
          }
        `;

      let fragmentShader = `#version 300 es
          precision highp float;

          in vec4 v_color;

          out vec4 outColor;

          void main(void) {
            outColor = v_color;
          }
        `;

      return this.context.createProgram(vertexShader, fragmentShader);
    },
  };
  globalMatrices() {
    let view = this.view;
    let gl = this.gl;

    // Compute the Projection Matrix:
    // log.info("  Translation:", translation.toString());
    // log.info("  Scale:", scale.toString());
    // log.info("  Rotate:", angle);

    let projectionMatrix = Mat3.projection(
      this.canvas.clientWidth,
      this.canvas.clientHeight
    );

    let cameraMatrix = Mat3.identity();
    cameraMatrix = Mat3.translate(
      cameraMatrix,
      view.cameraTarget[0],
      view.cameraTarget[1]
    );
    cameraMatrix = Mat3.rotate(cameraMatrix, degToRad(view.cameraAngle[0]));
    cameraMatrix = Mat3.scale(
      cameraMatrix,
      view.cameraZoom[0],
      view.cameraZoom[1]
    );

    let viewMatrix = Mat3.identity();

    let viewProjectionMatrix = Mat3.multiply(projectionMatrix, cameraMatrix);

    return {
      projectionMatrix: projectionMatrix,
      cameraMatrix: cameraMatrix,
      viewMatrix: viewMatrix,
      viewProjectionMatrix: viewProjectionMatrix,
    };
  }
  mouseControls() {
    let view = this.view;
    let draw = this.draw.bind(this);
    let globalMatrices = this.globalMatrices.bind(this);
    let gl = this.gl;
    let canvas = this.canvas;
    // Holding Left Mouse Button + Horizontal Mouse Movement = TranslateX
    // Holding Left Mouse Button + Vertical Mouse Movement = TranslateY
    // Holding Left Mouse Button + Scrolling Mouse Wheel = TranslateZ

    // Holding Right Mouse Button + Horizontal Mouse Movement = RotateY
    // Holding Right Mouse Button + Vertical Mouse Movement = RotateZ
    // Holding Mouse Wheel Button + Vertical Mouse Movement = RotateX

    // Scrolling Mouse Wheel = Uniform Scale

    //l("test");

    let output = document.querySelector("output");

    let draggingPrimary = false,
      draggingSecondary = false,
      draggingWheel = false;
    canvas.addEventListener(
      "wheel",
      (e) => {
        if (draggingPrimary == false) {
          let min = 0;
          let max = 10;
          let step = 0.1;
          if (e.deltaY > 0) {
            if (
              view.cameraZoom[0] + step > min &&
              view.cameraZoom[0] + step < max
            ) {
              view.cameraZoom[0] += step;
              view.cameraZoom[1] += step;
              globalMatrices().viewProjectionMatrix;
              draw();
            }
          } else if (e.deltaY < 0) {
            if (
              view.cameraZoom[0] - step > min &&
              view.cameraZoom[0] - step < max
            ) {
              view.cameraZoom[0] -= step;
              view.cameraZoom[1] -= step;
              globalMatrices().viewProjectionMatrix;
              draw();
            }
          }
          output.textContent = `Wheel: X: ${e.deltaX} Y: ${e.deltaY} (Uniform Scaling)`;
        } else if (draggingPrimary == true) {
          view.cameraTarget[2] += e.deltaY / 10;
          output.textContent = `Wheel: X: ${e.deltaX} Y: ${e.deltaY} (Z Translation)`;
          globalMatrices().viewProjectionMatrix;
          draw();
        }
      },
      { passive: true }
    );
    canvas.addEventListener("mousedown", (e) => {
      if (e.button == 0) {
        draggingPrimary = true;
        output.textContent = `DraggingPrimary: X: ${e.clientX} Y: ${e.clientY}`;
      } else if (e.button == 2 && !e.shiftKey) {
        draggingSecondary = true;
        output.textContent = `DraggingSecondary: X: ${e.clientX} Y: ${e.clientY}`;
      } else if (e.button == 1 && !e.shiftKey) {
        draggingWheel = true;
        output.textContent = `DraggingWheel: X: ${e.clientX} Y: ${e.clientY}`;
      }
    });
    canvas.addEventListener("contextmenu", (e) => {
      if (!e.shiftKey) {
        e.preventDefault();
      }
    });
    canvas.addEventListener("mouseup", (e) => {
      if (e.button == 0) {
        draggingPrimary = false;
        output.textContent = `X: ${e.clientX} Y: ${e.clientY}`;
      } else if (e.button == 2 && !e.shiftKey) {
        draggingSecondary = false;
        output.textContent = `X: ${e.clientX} Y: ${e.clientY}`;
      } else if (e.button == 1 && !e.shiftKey) {
        draggingWheel = false;
        output.textContent = `X: ${e.clientX} Y: ${e.clientY}`;
      }
    });
    canvas.addEventListener("mousemove", (e) => {
      if (draggingPrimary) {
        view.cameraTarget[0] = e.clientX;
        view.cameraTarget[1] = e.clientY; // * (2 / gl.canvas.clientWidth);//-(e.pageY - 8) * (2 / gl.canvas.clientHeight);
        output.textContent = `DraggingPrimary: X: ${e.clientX} Y: ${e.clientY} (X & Y Translation)`;
        globalMatrices().viewProjectionMatrix;
        draw();
      } else if (draggingSecondary && !e.shiftKey) {
        view.cameraAngle[0] -= e.movementY * (1 / gl.canvas.clientWidth) * 500;
        output.textContent = `DraggingSecondary: X: ${e.clientX} Y: ${e.clientY} (Y & Z Rotation) (Y: Pitch / Elevation) (Z: Yaw / Heading)`;
        globalMatrices().viewProjectionMatrix;
        draw();
      } else if (draggingWheel && !e.shiftKey) {
        view.cameraAngle[0] = e.movementY * (1 / gl.canvas.clientHeight) * 100;
        output.textContent = `DraggingWheel: X: ${e.clientX} Y: ${e.clientY} (X Rotation) (Roll / Bank)`;
        globalMatrices().viewProjectionMatrix;
        draw();
      }
    });
  }
  draw() {
    log.warn("program.draw() Called.");
    let ctx = this;
    let animated = this.animated;

    let drawFunction = this.drawFunction.bind(this);
    let draw2D = this.context2D.draw2D.bind(this, drawFunction);

    if (animated) requestAnimationFrame(draw2D);
    else draw2D();
  }

  draw2D(drawFunction, time) {
    let gl = this.gl;

    this.resizeCanvasToDisplaySize();

    // Tell WebGL how to convert from clip space to pixels
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // Clear the canvas
    gl.clearColor(...sRGB("slategrey"));
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    log.info("  drawFunction() Called.");
    drawFunction.call(this, time);
    if (this.animated) {
      requestAnimationFrame(this.draw.bind(this, drawFunction));
    }
  }
}

export class Context3D extends Context {
  constructor(options) {
    super(options);

    this.is3D = true;
    this.programs.basicProgram3D = this.programs.createBasicProgram3D();

    this.firstDraw = true;

    this.projection = "perspective"; //"orthographic";

    this.showAllObjectAxes = options.showAllObjectAxes ?? false;
    this.showAllBoundingBoxes = options.showAllBoundingBoxes ?? false;

    this.grid = options.UI ?? true;
    this.worldAxes = options.UI ?? true;
    this.objectAxes = options.UI ?? true;
    this.showLightSources = options.UI ?? true;
    this.objectBox = options.UI ?? false;

    this.conditionalObjectFilter("grid", "grid", ["grid"]);
    this.conditionalObjectFilter("worldAxes", "worldAxes", [
      "worldAxesPoints",
      "worldAxesLines",
    ]);

    if (this.numberOfLights) {
      this.conditionalObjectFilter("showLightSources", "pointLightSource", [
        "pointLightSource",
      ]);
    }

    this.objectSelectedNumber = 0;

    this.objectSelected = this.nonUIObjectsToDraw[this.objectSelectedNumber];

    if (options.controls) {
      this.controls.mouseControls();
      this.controls.sliders();
      this.controls.radiobuttons();
      this.controls.checkboxes();
      this.controls.objectSelector();
      this.controls.statsDisplay();
    }
  }

  update() {
    let event = new Event("draw");
    this.globalMatrices().viewProjectionMatrix;
    this.draw();
    document.querySelector("body").dispatchEvent(event);
    //this.printObjects();
    //SceneGraphNode.printTree();
  }
  objects = {
    ctx: this,
    F() {
      return this.ctx.createObject(
        this.ctx.programs.basicProgram3D,
        {
          a_position: {
            data: [
              // left column front
              [0, 0, 0],
              [0, 150, 0],
              [30, 0, 0],
              [0, 150, 0],
              [30, 150, 0],
              [30, 0, 0],

              // top rung front
              [30, 0, 0],
              [30, 30, 0],
              [100, 0, 0],
              [30, 30, 0],
              [100, 30, 0],
              [100, 0, 0],

              // middle rung front
              [30, 60, 0],
              [30, 90, 0],
              [67, 60, 0],
              [30, 90, 0],
              [67, 90, 0],
              [67, 60, 0],

              // left column back
              [0, 0, 30],
              [30, 0, 30],
              [0, 150, 30],
              [0, 150, 30],
              [30, 0, 30],
              [30, 150, 30],

              // top rung back
              [30, 0, 30],
              [100, 0, 30],
              [30, 30, 30],
              [30, 30, 30],
              [100, 0, 30],
              [100, 30, 30],

              // middle rung back
              [30, 60, 30],
              [67, 60, 30],
              [30, 90, 30],
              [30, 90, 30],
              [67, 60, 30],
              [67, 90, 30],

              // top
              [0, 0, 0],
              [100, 0, 0],
              [100, 0, 30],
              [0, 0, 0],
              [100, 0, 30],
              [0, 0, 30],

              // top rung right
              [100, 0, 0],
              [100, 30, 0],
              [100, 30, 30],
              [100, 0, 0],
              [100, 30, 30],
              [100, 0, 30],

              // under top rung
              [30, 30, 0],
              [30, 30, 30],
              [100, 30, 30],
              [30, 30, 0],
              [100, 30, 30],
              [100, 30, 0],

              // between top rung and middle
              [30, 30, 0],
              [30, 60, 30],
              [30, 30, 30],
              [30, 30, 0],
              [30, 60, 0],
              [30, 60, 30],

              // top of middle rung
              [30, 60, 0],
              [67, 60, 30],
              [30, 60, 30],
              [30, 60, 0],
              [67, 60, 0],
              [67, 60, 30],

              // right of middle rung
              [67, 60, 0],
              [67, 90, 30],
              [67, 60, 30],
              [67, 60, 0],
              [67, 90, 0],
              [67, 90, 30],

              // bottom of middle rung.
              [30, 90, 0],
              [30, 90, 30],
              [67, 90, 30],
              [30, 90, 0],
              [67, 90, 30],
              [67, 90, 0],

              // right of bottom
              [30, 90, 0],
              [30, 150, 30],
              [30, 90, 30],
              [30, 90, 0],
              [30, 150, 0],
              [30, 150, 30],

              // bottom
              [0, 150, 0],
              [0, 150, 30],
              [30, 150, 30],
              [0, 150, 0],
              [30, 150, 30],
              [30, 150, 0],

              // left side
              [0, 0, 0],
              [0, 0, 30],
              [0, 150, 30],
              [0, 0, 0],
              [0, 150, 30],
              [0, 150, 0],
            ],
            size: 3,
          },
          a_color: {
            data: [
              // left column front
              200, 70, 120, 200, 70, 120, 200, 70, 120, 200, 70, 120, 200, 70,
              120, 200, 70, 120,

              // top rung front
              200, 70, 120, 200, 70, 120, 200, 70, 120, 200, 70, 120, 200, 70,
              120, 200, 70, 120,

              // middle rung front
              200, 70, 120, 200, 70, 120, 200, 70, 120, 200, 70, 120, 200, 70,
              120, 200, 70, 120,

              // left column back
              80, 70, 200, 80, 70, 200, 80, 70, 200, 80, 70, 200, 80, 70, 200,
              80, 70, 200,

              // top rung back
              80, 70, 200, 80, 70, 200, 80, 70, 200, 80, 70, 200, 80, 70, 200,
              80, 70, 200,

              // middle rung back
              80, 70, 200, 80, 70, 200, 80, 70, 200, 80, 70, 200, 80, 70, 200,
              80, 70, 200,

              // top
              70, 200, 210, 70, 200, 210, 70, 200, 210, 70, 200, 210, 70, 200,
              210, 70, 200, 210,

              // top rung right
              200, 200, 70, 200, 200, 70, 200, 200, 70, 200, 200, 70, 200, 200,
              70, 200, 200, 70,

              // under top rung
              210, 100, 70, 210, 100, 70, 210, 100, 70, 210, 100, 70, 210, 100,
              70, 210, 100, 70,

              // between top rung and middle
              210, 160, 70, 210, 160, 70, 210, 160, 70, 210, 160, 70, 210, 160,
              70, 210, 160, 70,

              // top of middle rung
              70, 180, 210, 70, 180, 210, 70, 180, 210, 70, 180, 210, 70, 180,
              210, 70, 180, 210,

              // right of middle rung
              100, 70, 210, 100, 70, 210, 100, 70, 210, 100, 70, 210, 100, 70,
              210, 100, 70, 210,

              // bottom of middle rung.
              76, 210, 100, 76, 210, 100, 76, 210, 100, 76, 210, 100, 76, 210,
              100, 76, 210, 100,

              // right of bottom
              140, 210, 80, 140, 210, 80, 140, 210, 80, 140, 210, 80, 140, 210,
              80, 140, 210, 80,

              // bottom
              90, 130, 110, 90, 130, 110, 90, 130, 110, 90, 130, 110, 90, 130,
              110, 90, 130, 110,

              // left side
              160, 160, 220, 160, 160, 220, 160, 160, 220, 160, 160, 220, 160,
              160, 220, 160, 160, 220,
            ],
            size: 3,
            type: "UNSIGNED_BYTE", // The data is 8bit unsigned bytes
            normalize: true, // Convert from 0-255 to 0.0-1.0
            arrayType: Uint8Array,
          },
        },
        {
          u_color: [1, 1, 1, 1],
        },
        {
          name: "3DF",
          scale: 1,
          translation: [10, 10, 15],
          rotation: [degToRad(-90), degToRad(-135), degToRad(0)],
        }
      );
    },
    line(direction, color) {
      let max = 100;

      let line = this.ctx.createObject({
        name: "line",
        primitive: "lines",
        program: this.ctx.programs.basicProgram3D,
        attributes: {
          a_position: [
            [-direction[0] * max, -direction[1] * max, -direction[2] * max],
            [direction[0] * max, direction[1] * max, direction[2] * max],
          ],
          a_color: new Array(2).fill(sRGB(color)),
        },
        uniform: {
          u_color: [1, 1, 1, 1],
        },
      });

      return line;
    },
    lineSegment(start, end, color) {
      return this.ctx.createObject(
        this.ctx.programs.basicProgram3D,
        {
          a_position: {
            data: [start, end],
            size: 3,
          },
          a_color: {
            data: new Array(2).fill(sRGB(color)),
            // size: 3,
            // type: "UNSIGNED_BYTE", // The data is 8bit unsigned bytes
            // normalize: true, // Convert from 0-255 to 0.0-1.0
            // arrayType: Uint8Array,
          },
        },
        {
          u_color: [1, 1, 1, 1],
        },
        { name: "lineSegment", primitive: "lines", scale: 1 }
      );
    },
    point(location, color) {
      let point = this.ctx.createObject({
        name: "point",
        primitive: "points",
        translation: location,
        program: this.ctx.programs.basicProgram3D,
        attributes: {
          a_position: [0, 0, 0],
          a_color: sRGB(color),
        },
        uniforms: {
          u_color: [1, 1, 1, 1],
        },
      });
      return point;
    },
    rectangle(height, width, x, y, color) {
      return this.ctx.createObject(
        this.ctx.programs.basicProgram3D,
        {
          a_position: {
            data: [
              [x, y, 0],
              [x + height, y, 0],
              [x, y + width, 0],
              [x, y + width, 0],
              [x + height, y, 0],
              [x + height, y + width, 0],
            ],
            size: 3,
          },
          a_color: {
            data: new Array(6).fill(sRGB(color)),
            // size: 3,
            // type: "UNSIGNED_BYTE", // The data is 8bit unsigned bytes
            // normalize: true, // Convert from 0-255 to 0.0-1.0
            // arrayType: Uint8Array,
          },
        },
        {
          u_color: [1, 1, 1, 1],
        },
        { name: "retangle" }
      );
    },
    plane(color) {
      let max = 100;
      let direction = [1, 0, 0];
      let direction2 = [0, 1, 0];

      return this.ctx.createObject(
        this.ctx.programs.basicProgram3D,
        {
          a_position: {
            data: [
              [-max, -max, 0],
              [max, -max, 0],
              [-max, max, 0],
              [-max, max, 0],
              [max, -max, 0],
              [max, max, 0],
              // [0, max * 2, 0],
              // [max * 2, 0, 0],
              // [max * 2, max * 2, 0],
              // [-direction[0] * max, -direction[1] * max, -direction[2] * max],
              // [direction[0] * max, direction[1] * max, direction[2] * max],
              // [-direction2[0] * max, -direction2[1] * max, -direction2[2] * max],
              // [direction2[0] * max, direction2[1] * max, direction2[2] * max],
            ],
            size: 3,
          },
          a_color: {
            data: new Array(6).fill(sRGB(color)),
            // size: 3,
            // type: "UNSIGNED_BYTE", // The data is 8bit unsigned bytes
            // normalize: true, // Convert from 0-255 to 0.0-1.0
            // arrayType: Uint8Array,
          },
        },
        {
          u_color: [1, 1, 1, 1],
        },
        { name: "plane" }
      );
    },
    path(points, color) {
      let path = this.ctx.createObject({
        name: "path",
        primitive: "lines",
        program: this.ctx.programs.basicProgram3D,
        attributes: {
          a_position: points,
          a_color: new Array(points.length).fill(sRGB(color)),
        },
        uniform: {
          u_color: [1, 1, 1, 1],
        },
      });

      return path;
    },

    cube(...location) {
      return this.ctx.createObject(
        this.ctx.programs.basicProgram3D,
        {
          a_position: {
            data: [
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
            ],
            size: 3,
          },
          a_color: {
            data: [
              [sRGB("white"), sRGB("white"), sRGB("white"), sRGB("white")], // Front face
              [sRGB("purple"), sRGB("purple"), sRGB("purple"), sRGB("purple")], // Back face
              [sRGB("green"), sRGB("green"), sRGB("green"), sRGB("green")], // Top face
              [sRGB("blue"), sRGB("blue"), sRGB("blue"), sRGB("blue")], // Bottom face
              [sRGB("yellow"), sRGB("yellow"), sRGB("yellow"), sRGB("yellow")], // Right face
              [sRGB("red"), sRGB("red"), sRGB("red"), sRGB("red")], // Left face
            ],
            // size: 3,
            // type: "UNSIGNED_BYTE", // The data is 8bit unsigned bytes
            // normalize: true, // Convert from 0-255 to 0.0-1.0
            // arrayType: Uint8Array,
          },
          indices: [
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
          ],
        },
        {
          u_color: [1, 1, 1, 1],
        },
        { name: "cube", scale: this.unit, translation: location }
      );
    },
    cube2() {
      let cube = Shapes.flattenedPrimitives.createCubeBufferInfo(this.gl, 2);
      return this.ctx.createObject(
        this.ctx.programs.basicProgram3D,
        {
          a_position: {
            data: cube.position,
            size: 3,
          },
          a_color: {
            data: cube.color,
            size: 3,
            type: "UNSIGNED_BYTE", // The data is 8bit unsigned bytes
            normalize: true, // Convert from 0-255 to 0.0-1.0
            arrayType: Uint8Array,
          },
        },
        { u_color: [1, 0.5, 0.5, 1] },
        {
          name: "cube2",
          translation: [-40, 0, 0],
        }
      );
    },
    sphere(program) {
      //program = program || this.ctx.programs.basicProgram3D;
      let sphere = Shapes.flattenedPrimitives.createSphereBufferInfo(
        this.gl,
        50,
        10,
        10
      );
      return this.ctx.createObject({
        name: "sphere",
        program: program,
        //scale: 1,
        translation: [0, 0, 80],
        attributes: {
          a_position: sphere.position,
          // a_color: sphere.color,
          a_normal: sphere.normal,
        },
        uniforms: {
          //u_reverseLightDirection: Vec3.normalize([0.5, 0.7, 1]),
          u_color: [0.2, 1, 0.2, 1],
        },
      });
    },
    cone() {
      let cone = Shapes.flattenedPrimitives.createTruncatedConeBufferInfo(
        this.gl,
        1,
        0,
        2,
        100,
        1,
        true,
        false
      );
      return this.ctx.createObject(
        this.ctx.programs.basicProgram3D,
        {
          a_position: {
            data: cone.position,
            size: 3,
          },
          a_color: {
            data: cone.color,
            size: 3,
            type: "UNSIGNED_BYTE", // The data is 8bit unsigned bytes
            normalize: true, // Convert from 0-255 to 0.0-1.0
            arrayType: Uint8Array,
          },
        },
        { u_color: [0.5, 0.5, 1, 1] },
        {
          name: "cone",
          translation: [40, 0, 0],
        }
      );
    },

    grid() {
      function createGrid(size, subdivisions) {
        let numLines = subdivisions;
        let numVertices = numLines * 4;
        let positions = []; //twgl.primitives.createAugmentedTypedArray(3, numVertices);
        let colors = []; //twgl.primitives.createAugmentedTypedArray(4, numVertices);

        //  ..|..|..|..
        //  <-  size ->
        let black = [0, 0, 0, 1];
        let gray = [0.75, 0.75, 0.75, 1];

        let gridSize = size / (subdivisions + 2);
        for (let i = 0; i < numLines; i++) {
          let j = i - (numLines - 1) / 2;
          let p = j * gridSize;
          positions.push([p, 0, -size / 2]);
          positions.push([p, 0, size / 2]);
          positions.push([-size / 2, 0, p]);
          positions.push([size / 2, 0, p]);
          let color = j ? gray : black;
          colors.push(color);
          colors.push(color);
          colors.push(color);
          colors.push(color);
        }

        return {
          position: positions,
          color: colors,
        };
      }
      let grid = createGrid(100, 100);

      this.ctx.createObject({
        name: "grid",
        program: this.ctx.programs.basicProgram3D,
        parent: SceneGraphNode.worldOrigin,
        primitive: "lines",
        UIObject: true,
        scale: 10,
        translation: [25, 0.2, 25],
        attributes: {
          a_position: grid.position,
          a_color: grid.color,
        },
        uniforms: {
          u_color: [0.3, 0.3, 0.3, 1],
        },
      });
    },
    worldAxes() {
      // Conventional (?)
      //  Positive x is Red
      //  Up is Green
      //  Positive z is Blue

      let max = this.ctx.view.far;
      let direction1 = [1, 0, 0];
      let direction2 = [0, 1, 0];
      let direction3 = [0, 0, 1];

      let lines = this.ctx.createObject({
        name: "worldAxesLines",
        program: this.ctx.programs.basicProgram3D,
        parent: SceneGraphNode.worldOrigin,
        primitive: "lines",
        UIObject: true,
        attributes: {
          a_position: [
            [-direction1[0] * max, -direction1[1] * max, -direction1[2] * max],
            [direction1[0] * max, direction1[1] * max, direction1[2] * max],
            [-direction2[0] * max, -direction2[1] * max, -direction2[2] * max],
            [direction2[0] * max, direction2[1] * max, direction2[2] * max],
            [-direction3[0] * max, -direction3[1] * max, -direction3[2] * max],
            [direction3[0] * max, direction3[1] * max, direction3[2] * max],
          ],
          a_color: [
            sRGB("red"),
            sRGB("red"),
            sRGB("green"),
            sRGB("green"),
            sRGB("blue"),
            sRGB("blue"),
          ],
        },
        uniforms: {
          u_color: [1, 1, 1, 1],
        },
      });

      this.ctx.createObject({
        name: "worldAxesPoints",
        program: this.ctx.programs.basicProgram3D,
        primitive: "points",
        UIObject: true,
        parent: lines.node,
        attributes: {
          a_position: [
            [0, 0, 0],
            [100, 0, 0],
            [0, 100, 0],
            [0, 0, 100],
          ],
          a_color: [sRGB("black"), sRGB("red"), sRGB("green"), sRGB("blue")],
        },
        uniforms: {
          u_color: [1, 1, 1, 1],
        },
      });
    },
    objectAxes(parentObject) {
      let objectSelected = this.ctx.objectSelected;

      let dimensions = parentObject.dimensions;
      let Xmax = dimensions?.Xmax;
      let Ymax = dimensions?.Ymax;
      let Zmax = dimensions?.Zmax;

      let max = 100;
      let direction1 = [1, 0, 0];
      let direction2 = [0, 1, 0];
      let direction3 = [0, 0, 1];

      let lines = this.ctx.createObject({
        name: `objectAxesLines-${parentObject.name}`,
        program: this.ctx.programs.basicProgram3D,
        primitive: "lines",
        UIObject: true,
        parent: parentObject.node,
        attributes: {
          a_position: [
            [-direction1[0] * max, -direction1[1] * max, -direction1[2] * max],
            [direction1[0] * max, direction1[1] * max, direction1[2] * max],
            [-direction2[0] * max, -direction2[1] * max, -direction2[2] * max],
            [direction2[0] * max, direction2[1] * max, direction2[2] * max],
            [-direction3[0] * max, -direction3[1] * max, -direction3[2] * max],
            [direction3[0] * max, direction3[1] * max, direction3[2] * max],
          ],
          a_color: [
            sRGB("red"),
            sRGB("red"),
            sRGB("green"),
            sRGB("green"),
            sRGB("blue"),
            sRGB("blue"),
          ],
        },
        uniforms: {
          u_color: [1, 1, 1, 1],
        },
      });

      let points = this.ctx.createObject({
        name: `objectAxesPoints-${parentObject.name}`,
        program: this.ctx.programs.basicProgram3D,
        primitive: "points",
        UIObject: true,
        parent: lines.node,
        attributes: {
          a_position: [
            [0, 0, 0],
            [Xmax, 0, 0],
            [0, Ymax, 0],
            [0, 0, Zmax],
          ],
          a_color: [sRGB("black"), sRGB("red"), sRGB("green"), sRGB("blue")],
        },
        uniforms: {
          u_color: [1, 1, 1, 1],
        },
      });
    },
    objectBox(parentObject) {
      let objectSelected = this.ctx.objectSelected;

      let dimensions = objectSelected?.dimensions;
      let Xmax = dimensions?.Xmax;
      let Ymax = dimensions?.Ymax;
      let Zmax = dimensions?.Zmax;
      let Xmin = dimensions?.Xmin;
      let Ymin = dimensions?.Ymin;
      let Zmin = dimensions?.Zmin;

      let box = this.ctx.createObject({
        name: `objectBox-${parentObject.name}`,
        program: this.ctx.programs.basicProgram3D,
        primitive: "lines",
        UIObject: true,
        parent: parentObject.node,
        attributes: {
          a_position: [
            // Front Face
            [Xmin, Ymin, Zmin],
            [Xmax, Ymin, Zmin],
            [Xmin, Ymin, Zmin],
            [Xmin, Ymax, Zmin],
            [Xmax, Ymin, Zmin],
            [Xmax, Ymax, Zmin],
            [Xmin, Ymax, Zmin],
            [Xmax, Ymax, Zmin],

            // Back Face
            [Xmin, Ymin, Zmax],
            [Xmax, Ymin, Zmax],
            [Xmin, Ymin, Zmax],
            [Xmin, Ymax, Zmax],
            [Xmax, Ymin, Zmax],
            [Xmax, Ymax, Zmax],
            [Xmin, Ymax, Zmax],
            [Xmax, Ymax, Zmax],

            // Depth
            [Xmin, Ymin, Zmin],
            [Xmin, Ymin, Zmax],
            [Xmax, Ymin, Zmin],
            [Xmax, Ymin, Zmax],
            [Xmin, Ymax, Zmin],
            [Xmin, Ymax, Zmax],
            [Xmax, Ymax, Zmin],
            [Xmax, Ymax, Zmax],
          ],
          a_color: new Array(24).fill(sRGB("cyan")),
        },
        uniforms: {
          u_color: [1, 1, 1, 1],
        },
      });

      return box;
    },
    cameraTarget() {
      let cameraTarget = this.ctx.view.cameraTarget;
      let cameraTargetX = cameraTarget[0];
      let cameraTargetY = cameraTarget[1];
      let cameraTargetZ = cameraTarget[2];

      let point = this.ctx.createObject(
        this.ctx.programs.basicProgram3D,
        {
          a_position: {
            data: [0, 0, 0],
            size: 3,
          },
          a_color: {
            data: sRGB("yellow"),
            // size: 3,
            // type: "UNSIGNED_BYTE", // The data is 8bit unsigned bytes
            // normalize: true, // Convert from 0-255 to 0.0-1.0
            // arrayType: Uint8Array,
          },
        },
        {
          u_color: [1, 1, 1, 1],
        },
        {
          name: "Camera Target",
          primitive: "points",
          UIObject: true,
        }
      );
      point.transform.translation = cameraTarget;

      //l(point.attributes.a_position.data[0]);

      let line = this.ctx.createObject(
        this.ctx.programs.basicProgram3D,
        {
          a_position: {
            data: [
              // Top Face
              [0, cameraTargetY, cameraTargetZ],
              [cameraTargetX, cameraTargetY, cameraTargetZ],
            ],
            size: 3,
          },
          a_color: {
            data: new Array(2).fill(sRGB("orange")),
          },
        },
        {
          u_color: [1, 1, 1, 1],
        },
        {
          name: "Camera Target Line",
          primitive: "lines",
          UIObject: true,
        }
      );
      line.deformVertexComponent(0, cameraTarget, 1, 2);
      line.deformVertex(1, cameraTarget);

      let line2 = this.ctx.createObject(
        this.ctx.programs.basicProgram3D,
        {
          a_position: {
            data: [
              // Vertical Line
              [cameraTargetX, cameraTargetY, 0],
              [cameraTargetX, cameraTargetY, cameraTargetZ],
            ],
            size: 3,
          },
          a_color: {
            data: new Array(2).fill(sRGB("orange")),
          },
        },
        {
          u_color: [1, 1, 1, 1],
        },
        {
          name: "Camera Target Line",
          primitive: "lines",
          UIObject: true,
        }
      );
      line2.deformVertexComponent(0, cameraTarget, 0, 1);
      line2.deformVertex(1, cameraTarget);

      let line3 = this.ctx.createObject(
        this.ctx.programs.basicProgram3D,
        {
          a_position: {
            data: [
              // Vertical Line
              [cameraTargetX, 0, cameraTargetZ],
              [cameraTargetX, cameraTargetY, cameraTargetZ],
            ],
            size: 3,
          },
          a_color: {
            data: new Array(2).fill(sRGB("orange")),
          },
        },
        {
          u_color: [1, 1, 1, 1],
        },
        {
          name: "Camera Target Line",
          primitive: "lines",
          UIObject: true,
        }
      );
      line3.deformVertexComponent(0, cameraTarget, 0, 2);
      line3.deformVertex(1, cameraTarget);

      // let lines = this.ctx.createObject(
      //   this.ctx.programs.basicProgram3D,
      //   {
      //     a_position: {
      //       data: [
      //         // Botom Face
      //         [cameraTargetX, 0, 0], [cameraTargetX, 0, cameraTargetZ],
      //         [0, 0, cameraTargetZ], [cameraTargetX, 0, cameraTargetZ],

      //         // Vertical Lines
      //         [0, 0, cameraTargetZ], [0, cameraTargetY, cameraTargetZ],
      //         [cameraTargetX, 0, 0], [cameraTargetX, cameraTargetY, 0],
      //         [cameraTargetX, 0, cameraTargetZ], [cameraTargetX, cameraTargetY, cameraTargetZ],

      //         // Top Face
      //         [0, cameraTargetY, 0], [cameraTargetX, cameraTargetY, 0],
      //         [0, cameraTargetY, 0], [0, cameraTargetY, cameraTargetZ],
      //         [cameraTargetX, cameraTargetY, 0], [cameraTargetX, cameraTargetY, cameraTargetZ],
      //         [0, cameraTargetY, cameraTargetZ], [cameraTargetX, cameraTargetY, cameraTargetZ],
      //       ],
      //       size: 3,
      //     },
      //     a_color: {
      //       data: new Array(18).fill(sRGB("orange")),
      //     },
      //   },
      //   {
      //     u_color: [1, 1, 1, 1],
      //   },
      //   {
      //     name: "Camera Target Lines",
      //     primitive: "lines",
      //   }
      // );
      //lines.transform.translation = cameraTarget;
    },
    cameraAxes() {
      // Conventional (?)
      //  Positive x is Red
      //  Up is Green
      //  Positive z is Blue

      let view = this.ctx.view;
      let cameraTarget = this.ctx.view.cameraTarget;
      let cameraTargetX = cameraTarget[0];
      let cameraTargetY = cameraTarget[1];
      let cameraTargetZ = cameraTarget[2];
      let cameraPosition = this.ctx.view.cameraPosition;

      let line = this.ctx.createObject(
        this.ctx.programs.basicProgram3D,
        {
          a_position: {
            data: [
              // Top Face
              [0, 0, 0],
              [cameraTargetX, cameraTargetY, cameraTargetZ],
            ],
            size: 3,
          },
          a_color: {
            data: new Array(2).fill(sRGB("magenta")),
          },
        },
        {
          u_color: [1, 1, 1, 1],
        },
        {
          name: "Camera Target Line",
          primitive: "lines",
          UIObject: true,
        }
      );
      //line.deformVertexComponent(0, cameraTarget, 1, 2);
      line.deformVertex(1, cameraTarget);

      let line2 = this.ctx.createObject(
        this.ctx.programs.basicProgram3D,
        {
          a_position: {
            data: [
              // Top Face
              [0, 0, 0],
              cameraPosition,
            ],
            size: 3,
          },
          a_color: {
            data: new Array(2).fill(sRGB("magenta")),
          },
        },
        {
          u_color: [1, 1, 1, 1],
        },
        {
          name: "Camera Target Line",
          primitive: "lines",
          UIObject: true,
        }
      );
      //line.deformVertexComponent(0, cameraTarget, 1, 2);
      line2.deformVertex(1, cameraPosition);

      // let points = this.ctx.createObject(
      //   this.ctx.programs.basicProgram3D,
      //   {
      //     a_position: {
      //       data: [
      //         [0, 0, 0],
      //         [100, 0, 0],
      //         [0, 100, 0],
      //         [0, 0, 100],
      //       ],
      //       size: 3,
      //     },
      //     a_color: {
      //       data: [sRGB("black"), sRGB("red"), sRGB("green"), sRGB("blue")],
      //       // size: 3,
      //       // type: "UNSIGNED_BYTE", // The data is 8bit unsigned bytes
      //       // normalize: true, // Convert from 0-255 to 0.0-1.0
      //       // arrayType: Uint8Array,
      //     },
      //   },
      //   {
      //     u_color: [1, 1, 1, 1],
      //   },
      //   { name: "cameraAxesPoints", primitive: "points" }
      // );
      // let max = this.ctx.view.far;

      // let direction1 = [1, 0, 0];
      // let direction2 = [0, 1, 0];
      // let direction3 = [0, 0, 1];

      // let lines = this.ctx.createObject(
      //   this.ctx.programs.basicProgram3D,
      //   {
      //     a_position: {
      //       data: [
      //         [
      //           -direction1[0] * max,
      //           -direction1[1] * max,
      //           -direction1[2] * max,
      //         ],
      //         [direction1[0] * max, direction1[1] * max, direction1[2] * max],
      //         [
      //           -direction2[0] * max,
      //           -direction2[1] * max,
      //           -direction2[2] * max,
      //         ],
      //         [direction2[0] * max, direction2[1] * max, direction2[2] * max],
      //         [
      //           -direction3[0] * max,
      //           -direction3[1] * max,
      //           -direction3[2] * max,
      //         ],
      //         [direction3[0] * max, direction3[1] * max, direction3[2] * max],
      //       ],
      //       size: 3,
      //     },
      //     a_color: {
      //       data: [
      //         sRGB("red"),
      //         sRGB("red"),
      //         sRGB("green"),
      //         sRGB("green"),
      //         sRGB("blue"),
      //         sRGB("blue"),
      //       ],
      //       // size: 3,
      //       // type: "UNSIGNED_BYTE", // The data is 8bit unsigned bytes
      //       // normalize: true, // Convert from 0-255 to 0.0-1.0
      //       // arrayType: Uint8Array,
      //     },
      //   },
      //   {
      //     u_color: [1, 1, 1, 1],
      //   },
      //   {
      //     name: "cameraAxesLines",
      //     primitive: "lines",
      //     translation: view.cameraPosition,
      //     rotation: view.cameraAngle,
      //     //scale: view.cameraZoom,
      //   }
      // );
      //lines.transform.translation = this.ctx.view.cameraTarget;
      //Vec3.subtract(this.ctx.view.cameraPosition, this.ctx.view.cameraTarget);
      //lines.transform.rotation = this.ctx.view.cameraAngle;
    },

    pointLightSource() {
      //let u_lightWorldPosition = this.ctx.lights.light0.position;

      //l(this.ctx.lights.light0.position);

      let sphere = Shapes.flattenedPrimitives.createSphereBufferInfo(
        this.gl,
        10,
        10,
        10
      );
      return this.ctx.createObject({
        name: "pointLightSource",
        program: this.ctx.programs.basicProgram3D,
        UIObject: true,
        //translation: this.ctx.lights.light0.position,
        attributes: {
          a_position: sphere.position,
          a_color: {
            data: sphere.color,
            optimized: true,
          },
          //a_normal: sphere.normal,
        },
        uniforms: {
          //u_reverseLightDirection: Vec3.normalize([0.5, 0.7, 1]),
          u_color: sRGB("yellow"), //[0.5, 1, 0.5, 1],
        },
      });
    },
  };
  programs = {
    ctx: this,
    createBasicProgram3D() {
      let basicVertexShader = `#version 300 es
          in vec4 a_position;
          in vec4 a_color;

          uniform mat4 u_worldViewProjection;

          out vec4 v_color;

          void main() {
            gl_Position = u_worldViewProjection * a_position;
            gl_PointSize = 10.0;

            v_color = a_color;
          }
        `;

      let basicFragmentShader = `#version 300 es
          precision highp float;

          in vec4 v_color;

          uniform vec4 u_color;

          out vec4 outColor;

          void main() {
            outColor = v_color * u_color;
          }
        `;

      return this.ctx.createProgram(basicVertexShader, basicFragmentShader);
    },
  };
  globalMatrices() {
    let view = this.view;
    let aspectRatio = this.aspectRatio;

    // Compute the Projection Matrix:
    let projectionMatrix;
    if (this.projection == "perspective") {
      projectionMatrix = Mat4.perspective(
        view.FOV,
        aspectRatio,
        view.near,
        view.far
      );
    } else if (this.projection == "orthographic") {
      // view.cameraTarget[0] = 200;
      // view.cameraTarget[1] = 500;
      // view.cameraTarget[2] = 300;

      // view.cameraPosition[0] = 1000;
      // view.cameraPosition[1] = 100;
      // view.cameraPosition[2] = 1000;

      // view.cameraZoom[2] = 3;

      projectionMatrix = Mat4.projection(
        this.canvas.clientWidth,
        this.canvas.clientHeight,
        1000
      );

      //l(projectionMatrix);
    }

    view.cameraPosition = Mat4.transformVector(
      Mat4.xRotation(view.cameraArc[0]),
      view.cameraPosition
    );
    view.cameraPosition = Mat4.transformVector(
      Mat4.yRotation(view.cameraArc[1]),
      view.cameraPosition
    );
    view.cameraPosition = Mat4.transformVector(
      Mat4.zRotation(view.cameraArc[2]),
      view.cameraPosition
    );

    // Compute the Camera Matrix using LookAt:
    let cameraMatrix = Mat4.lookAt(
      view.cameraPosition,
      view.cameraTarget,
      view.up
    );

    //let cameraMatrix = Mat4.identity();

    cameraMatrix = Mat4.xRotate(cameraMatrix, view.cameraAngle[0]);
    cameraMatrix = Mat4.yRotate(cameraMatrix, view.cameraAngle[1]);
    cameraMatrix = Mat4.zRotate(cameraMatrix, view.cameraAngle[2]);

    cameraMatrix = Mat4.scale(cameraMatrix, ...view.cameraZoom);

    // Make a View Matrix from the Camera Matrix:
    let viewMatrix = Mat4.inverse(cameraMatrix);

    // Create a viewProjection Matrix.
    //  This will both apply perspective AND move the world so that the camera is effectively the origin.
    // (Move the projection space to view space) (the space in front of the camera)
    let viewProjectionMatrix = Mat4.multiply(projectionMatrix, viewMatrix);

    this.world.updateWorldMatrix();

    return {
      projectionMatrix: projectionMatrix,
      cameraMatrix: cameraMatrix,
      viewMatrix: viewMatrix,
      viewProjectionMatrix: viewProjectionMatrix,
    };
  }
  controls = {
    ctx: this,
    mouseControls() {
      let update = this.ctx.update.bind(this.ctx);
      let view = this.ctx.view;
      // let draw = this.ctx.draw.bind(this.ctx);
      // let globalMatrices = this.ctx.globalMatrices.bind(this.ctx);
      let gl = this.ctx.gl;
      let canvas = this.ctx.canvas;
      // Holding Left Mouse Button + Horizontal Mouse Movement = TranslateX
      // Holding Left Mouse Button + Vertical Mouse Movement = TranslateY
      // Holding Left Mouse Button + Scrolling Mouse Wheel = TranslateZ

      // Holding Right Mouse Button + Horizontal Mouse Movement = RotateY
      // Holding Right Mouse Button + Vertical Mouse Movement = RotateZ
      // Holding Mouse Wheel Button + Vertical Mouse Movement = RotateX

      // Scrolling Mouse Wheel = Uniform Scale

      //l("test");

      let output = document.querySelector("output");
      let draggingPrimary = false,
        draggingSecondary = false,
        draggingWheel = false;
      canvas.addEventListener(
        "wheel",
        (e) => {
          if (draggingPrimary == false) {
            let min = 0;
            let max = 10;
            let step = 0.3;
            if (e.deltaY > 0) {
              if (
                view.cameraZoom[2] + step > min &&
                view.cameraZoom[2] + step < max
              ) {
                view.cameraZoom[2] += step;
                // view.cameraZoom[1] += step;
                // view.cameraZoom[2] += step;
                update();
              }
            } else if (e.deltaY < 0) {
              if (
                view.cameraZoom[2] - step > min &&
                view.cameraZoom[2] - step < max
              ) {
                view.cameraZoom[2] -= step;
                // view.cameraZoom[1] -= step;
                // view.cameraZoom[2] -= step;
                update();
              }
            }
            // output.textContent = `Wheel: X: ${e.deltaX} Y: ${e.deltaY} (Uniform Scaling)`;
          } else if (draggingPrimary == true) {
            view.cameraTarget[1] += e.deltaY / 5;
            view.cameraPosition[1] += e.deltaY / 5;

            // output.textContent = `Wheel: X: ${e.deltaX} Y: ${e.deltaY} (Z Translation)`;
            update();
          }
          e.preventDefault();
        }
        //{ passive: true }
      );
      canvas.addEventListener("mousedown", (e) => {
        if (e.button == 0) {
          draggingPrimary = true;
          // output.textContent = `DraggingPrimary: X: ${e.clientX} Y: ${e.clientY}`;
        } else if (e.button == 2 && !e.shiftKey) {
          draggingSecondary = true;
          // output.textContent = `DraggingSecondary: X: ${e.clientX} Y: ${e.clientY}`;
        } else if (e.button == 1 && !e.shiftKey) {
          draggingWheel = true;
          // output.textContent = `DraggingWheel: X: ${e.clientX} Y: ${e.clientY}`;
        }
      });
      canvas.addEventListener("contextmenu", (e) => {
        if (!e.shiftKey) {
          e.preventDefault();
        }
      });
      canvas.addEventListener("mouseup", (e) => {
        if (e.button == 0) {
          draggingPrimary = false;
          // output.textContent = `X: ${e.clientX} Y: ${e.clientY}`;
        } else if (e.button == 2 && !e.shiftKey) {
          draggingSecondary = false;
          view.cameraAngle[2] = 0;
          // output.textContent = `X: ${e.clientX} Y: ${e.clientY}`;
        } else if (e.button == 1 && !e.shiftKey) {
          draggingWheel = false;
          view.cameraAngle[0] = 0;
          // output.textContent = `X: ${e.clientX} Y: ${e.clientY}`;
        }
      });
      canvas.addEventListener("mousemove", (e) => {
        if (draggingPrimary) {
          view.cameraTarget[0] += e.movementX / 5;
          view.cameraPosition[0] += e.movementX / 5;

          view.cameraTarget[2] += e.movementY / 5;
          view.cameraPosition[2] += e.movementY / 5;

          // output.textContent = `DraggingPrimary: X: ${e.clientX} Y: ${e.clientY} (X & Y Translation)`;
          update();
        } else if (draggingSecondary && !e.shiftKey) {
          view.cameraAngle[2] += e.movementX * (1 / gl.canvas.clientWidth);
          //l("view.cameraAngle[2]:", view.cameraAngle[2]);
          // output.textContent = `DraggingSecondary: X: ${e.clientX} Y: ${e.clientY} (Y & Z Rotation) (Y: Pitch / Elevation) (Z: Yaw / Heading)`;

          update();
        } else if (draggingWheel && !e.shiftKey) {
          view.cameraAngle[0] = e.movementY * (1 / gl.canvas.clientHeight) * 50;
          // output.textContent = `DraggingWheel: X: ${e.clientX} Y: ${e.clientY} (X Rotation) (Roll / Bank)`;
          update();
        }
      });
    },
    sliders() {
      let view = this.ctx.view;
      let objectSelected = this.ctx.objectSelected;
      let ctx = this.ctx;

      let slidersDiv = document.querySelector("#sliders");
      slidersDiv.style =
        "display: inline-block;text-align:right;whitespace:no-wrap;";
      Slider.attachment = slidersDiv;

      // View
      new Slider({
        name: "FOV",
        group: "group0",
        set variable(x) {
          view.FOV = degToRad(x);
        },
        get variable() {
          return radToDeg(view.FOV);
        },
        max: 360,
        updateFunction: ctx.update.bind(ctx),
      });
      new Slider({
        name: "Aspect Ratio",
        group: "group0",
        set variable(x) {
          ctx.aspectRatio = x;
        },
        get variable() {
          return ctx.aspectRatio;
        },
        min: 0.01,
        max: 10,
        step: 0.01,
        updateFunction: ctx.update.bind(ctx),
      });
      new Slider({
        name: "Draw Distance",
        group: "group0",
        set variable(x) {
          view.far = x;
        },
        get variable() {
          return view.far;
        },
        max: 5000,
        updateFunction: ctx.update.bind(ctx),
      });
      new Slider({
        name: "Clipping Distance",
        group: "group0",
        set variable(x) {
          view.near = x;
        },
        get variable() {
          return view.near;
        },
        max: 10,
        step: 0.1,
        updateFunction: ctx.update.bind(ctx),
      });

      // Camera Position
      new Slider({
        name: "Camera Position X",
        group: "group1",
        set variable(x) {
          view.cameraPosition[0] = x;
        },
        get variable() {
          return view.cameraPosition[0];
        },
        min: -1000,
        max: 1000,
        updateFunction: ctx.update.bind(ctx),
      });
      new Slider({
        name: "Camera Position Y",
        group: "group1",
        set variable(x) {
          view.cameraPosition[1] = x;
        },
        get variable() {
          return view.cameraPosition[1];
        },
        min: -1000,
        max: 1000,
        updateFunction: ctx.update.bind(ctx),
      });
      new Slider({
        name: "Camera Position Z",
        group: "group1",
        set variable(x) {
          view.cameraPosition[2] = x;
        },
        get variable() {
          return view.cameraPosition[2];
        },
        min: -1000,
        max: 1000,
        updateFunction: ctx.update.bind(ctx),
      });

      // Camera Zoom
      new Slider({
        name: "Camera Zoom X",
        group: "group2",
        set variable(x) {
          view.cameraZoom[0] = x;
        },
        get variable() {
          return view.cameraZoom[0];
        },
        min: 1,
        max: 50,
        updateFunction: ctx.update.bind(ctx),
      });
      new Slider({
        name: "Camera Zoom Y",
        group: "group2",
        set variable(x) {
          view.cameraZoom[1] = x;
        },
        get variable() {
          return view.cameraZoom[1];
        },
        min: 1,
        max: 50,
        updateFunction: ctx.update.bind(ctx),
      });
      new Slider({
        name: "Camera Zoom Z",
        group: "group2",
        set variable(x) {
          view.cameraZoom[2] = x;
        },
        get variable() {
          return view.cameraZoom[2];
        },
        min: 1,
        max: 50,
        updateFunction: ctx.update.bind(ctx),
      });

      // Camera Target
      new Slider({
        name: "Camera Target X",
        group: "group2",
        set variable(x) {
          view.cameraTarget[0] = x;
        },
        get variable() {
          return view.cameraTarget[0];
        },
        min: -1000,
        max: 1000,
        updateFunction: ctx.update.bind(ctx),
      });
      new Slider({
        name: "Camera Target Y",
        group: "group2",
        set variable(x) {
          view.cameraTarget[1] = x;
        },
        get variable() {
          return view.cameraTarget[1];
        },
        min: -1000,
        max: 1000,
        updateFunction: ctx.update.bind(ctx),
      });
      new Slider({
        name: "Camera Target Z",
        group: "group2",
        set variable(x) {
          view.cameraTarget[2] = x;
        },
        get variable() {
          return view.cameraTarget[2];
        },
        min: -1000,
        max: 1000,
        updateFunction: ctx.update.bind(ctx),
      });

      // Camera Angle
      new Slider({
        name: "Camera Tilt",
        group: "group2",
        set variable(x) {
          view.cameraAngle[0] = degToRad(x);
        },
        get variable() {
          return radToDeg(view.cameraAngle[0]);
        },
        min: -360,
        max: 360,
        updateFunction: ctx.update.bind(ctx),
      });
      new Slider({
        name: "Camera Pan",
        group: "group2",
        set variable(x) {
          view.cameraAngle[1] = degToRad(x);
        },
        get variable() {
          return radToDeg(view.cameraAngle[1]);
        },
        min: -360,
        max: 360,
        updateFunction: ctx.update.bind(ctx),
      });
      new Slider({
        name: "Camera Roll",
        group: "group2",
        set variable(x) {
          view.cameraAngle[2] = degToRad(x);
        },
        get variable() {
          return radToDeg(view.cameraAngle[2]);
        },
        min: -360,
        max: 360,
        updateFunction: ctx.update.bind(ctx),
      });

      // Camera Arc
      new Slider({
        name: "Camera Arc X",
        group: "group2",
        set variable(x) {
          view.cameraArc[0] = degToRad(x);
        },
        get variable() {
          return radToDeg(view.cameraArc[0]);
        },
        min: -360,
        max: 360,
        updateFunction: ctx.update.bind(ctx),
      });
      new Slider({
        name: "Camera Arc Y",
        group: "group2",
        set variable(x) {
          view.cameraArc[1] = degToRad(x);
        },
        get variable() {
          return radToDeg(view.cameraArc[1]);
        },
        min: -360,
        max: 360,
        updateFunction: ctx.update.bind(ctx),
      });
      new Slider({
        name: "Camera Arc Z",
        group: "group2",
        set variable(x) {
          view.cameraArc[2] = degToRad(x);
        },
        get variable() {
          return radToDeg(view.cameraArc[2]);
        },
        min: -360,
        max: 360,
        updateFunction: ctx.update.bind(ctx),
      });

      // Object Scale
      new Slider({
        name: "Object Scale X",
        group: "group3",
        set variable(x) {
          objectSelected.transform.scale = x;
        },
        get variable() {
          return objectSelected?.transform.scale;
        },
        min: 0.001,
        max: 3,
        step: 0.1,
        updateFunction: ctx.update.bind(ctx),
      });
      new Slider({
        name: "Object Scale Y",
        group: "group3",
        set variable(x) {
          objectSelected.transform.scale = x;
        },
        get variable() {
          return objectSelected?.transform.scale;
        },
        min: 0.001,
        max: 3,
        step: 0.1,
        updateFunction: ctx.update.bind(ctx),
      });
      new Slider({
        name: "Object Scale Z",
        group: "group3",
        set variable(x) {
          objectSelected.transform.scale = x;
        },
        get variable() {
          return objectSelected?.transform.scale;
        },
        min: 0.001,
        max: 3,
        step: 0.1,
        updateFunction: ctx.update.bind(ctx),
      });

      // Object Position
      new Slider({
        name: "Object Position X",
        group: "group3",
        set variable(x) {
          objectSelected.transform.translation[0] = x;
        },
        get variable() {
          return objectSelected?.transform.translation[0];
        },
        min: -1000,
        max: 1000,
        updateFunction: ctx.update.bind(ctx),
      });
      new Slider({
        name: "Object Position Y",
        group: "group3",
        set variable(x) {
          objectSelected.transform.translation[1] = x;
        },
        get variable() {
          return objectSelected?.transform.translation[1];
        },
        min: -1000,
        max: 1000,
        updateFunction: ctx.update.bind(ctx),
      });
      new Slider({
        name: "Object Position Z",
        group: "group3",
        set variable(x) {
          objectSelected.transform.translation[2] = x;
        },
        get variable() {
          return objectSelected?.transform.translation[2];
        },
        min: -1000,
        max: 1000,
        updateFunction: ctx.update.bind(ctx),
      });

      // Object Angle
      new Slider({
        name: "Object Angle X",
        group: "group3",
        set variable(x) {
          objectSelected.transform.rotation[0] = degToRad(x);
        },
        get variable() {
          return radToDeg(objectSelected?.transform.rotation[0]);
        },
        min: -360,
        max: 360,
        updateFunction: ctx.update.bind(ctx),
      });
      new Slider({
        name: "Object Angle Y",
        group: "group3",
        set variable(x) {
          objectSelected.transform.rotation[1] = degToRad(x);
        },
        get variable() {
          return radToDeg(objectSelected?.transform.rotation[1]);
        },
        min: -360,
        max: 360,
        updateFunction: ctx.update.bind(ctx),
      });
      new Slider({
        name: "Object Angle Z",
        group: "group3",
        set variable(x) {
          objectSelected.transform.rotation[2] = degToRad(x);
        },
        get variable() {
          return radToDeg(objectSelected?.transform.rotation[2]);
        },
        min: -360,
        max: 360,
        updateFunction: ctx.update.bind(ctx),
      });

      // Light Source
      //if (this.numberOfLights) {
      new Slider({
        name: "Light Position X",
        group: "group4",
        set variable(x) {
          ctx.lights.light0.u_lightWorldPosition[0] = x;
        },
        get variable() {
          return ctx.lights.light0?.u_lightWorldPosition[0];
        },
        min: -1000,
        max: 1000,
        updateFunction: ctx.update.bind(ctx),
      });
      new Slider({
        name: "Light Position Y",
        group: "group4",
        set variable(x) {
          ctx.lights.light0.u_lightWorldPosition[1] = x;
        },
        get variable() {
          return ctx.lights.light0?.u_lightWorldPosition[1];
        },
        min: -1000,
        max: 1000,
        updateFunction: ctx.update.bind(ctx),
      });
      new Slider({
        name: "Light Position Z",
        group: "group4",
        set variable(x) {
          ctx.lights.light0.u_lightWorldPosition[2] = x;
        },
        get variable() {
          return ctx.lights.light0?.u_lightWorldPosition[2];
        },
        min: -1000,
        max: 1000,
        updateFunction: ctx.update.bind(ctx),
      });
      //}
    },
    radiobuttons() {
      let ctx = this.ctx;

      let container = document.createElement("div");
      container.style = "text-align: center;";
      let label1 = document.createElement("label");
      let radio1 = document.createElement("input");
      radio1.type = "radio";
      radio1.name = "projection";
      radio1.value = "perspective";
      radio1.checked = true;
      label1.textContent = "Perspective: ";
      label1.append(radio1);
      let label2 = document.createElement("label");
      let radio2 = document.createElement("input");
      radio2.type = "radio";
      radio2.name = "projection";
      radio2.value = "orthographic";
      label2.textContent = " Orthographic: ";
      label2.append(radio2);
      container.append(label1, label2);
      document.querySelector("#group0").append(container);

      container.addEventListener("input", (e) => {
        l(e.target.value);
        ctx.projection = e.target.value;
        ctx.update();
      });
    },
    checkboxes() {
      let ctx = this.ctx;
      let controls2Div = document.querySelector("#controls2");

      function makeCheckbox(name, variable, defaultChecked) {
        let checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.defaultChecked = defaultChecked ?? true;
        checkbox.name = name + "Toggle";
        let label = document.createElement("label");
        label.textContent = " " + name + ": ";
        label.append(checkbox);
        controls2Div.append(label);
        return checkbox;
      }

      makeCheckbox("Grid", "grid").addEventListener("input", (e) => {
        ctx["grid"] = e.target.checked;
        ctx.conditionalObjectFilter("grid", "grid", ["grid"]);
        ctx.update();
      });

      makeCheckbox("World Axes", "worldAxes").addEventListener("input", (e) => {
        ctx["worldAxes"] = e.target.checked;
        ctx.conditionalObjectFilter("worldAxes", "worldAxes", [
          "worldAxesPoints",
          "worldAxesLines",
        ]);

        ctx.update();
      });

      makeCheckbox(
        "Show Object Axes",
        "showAllObjectAxes",
        false
      ).addEventListener("input", (e) => {
        ctx["showAllObjectAxes"] = e.target.checked;
        if (e.target.checked) {
          ctx.UI.showAllObjectAxes();
        } else {
          ctx.UI.hideAllObjectAxes();
        }
        ctx.update();
      });

      makeCheckbox(
        "Show Bounding Boxes",
        "showAllBoundingBoxes",
        false
      ).addEventListener("input", (e) => {
        ctx["showAllBoundingBoxes"] = e.target.checked;
        if (e.target.checked) {
          ctx.UI.showAllBoundingBoxes();
        } else {
          ctx.UI.hideAllBoundingBoxes();
        }
        ctx.update();
      });

      controls2Div.append(document.createElement("br"));

      makeCheckbox("Show Light Sources", "showLightSources").addEventListener(
        "input",
        (e) => {
          ctx["showLightSources"] = e.target.checked;
          ctx.conditionalObjectFilter("showLightSources", "pointLightSource", [
            "pointLightSource",
          ]);
          ctx.update();
        }
      );
    },
    objectSelector() {
      //l(this.nonUIObjectsToDraw);
      let ctx = this.ctx;
      let controls2Div = document.querySelector("#controls2");

      let createObjectSelector = () => {
        let objectNumber = document.createElement("input");
        objectNumber.type = "number";
        objectNumber.name = "objectNumber";
        objectNumber.min = 0;
        objectNumber.max = ctx.nonUIObjectsToDraw.length - 1;
        objectNumber.defaultValue = 0;
        objectNumber.style = "width: 30px;text-align: center;";
        let label = document.createElement("label");
        label.textContent = "Object Selector: ";
        label.append(objectNumber);

        let label2 = document.createElement("span");
        label2.textContent = "Object Selected: ";
        let objectName = document.createElement("span");
        objectName.textContent = ctx.objectSelected?.name;
        objectName.style = "color:cyan;";
        label2.append(objectName);

        controls2Div.append(label, label2);
        return objectNumber;
      };
      createObjectSelector().addEventListener("click", (e) => {
        ctx.objectSelectedNumber = e.target.value;
        //l(ctx.objectSelectedNumber);
        ctx.objectSelected = ctx.nonUIObjectsToDraw[ctx.objectSelectedNumber];
        SceneGraphNode.objectSelected.setParent(ctx.objectSelected.node);

        // objectBox
        // ctx.objectsToDraw = ctx.objectsToDraw.filter(
        //   (x) => !["objectBox"].includes(x.name)
        // );
        // ctx.conditionalObjectFilter("objectBox", "objectBox", ["objectBox"]);

        // objectAxes
        ctx.objectsToDraw = ctx.objectsToDraw.filter(
          (x) => !["objectAxesPoints", "objectAxesLines"].includes(x.name)
        );
        ctx.conditionalObjectFilter("objectAxes", "objectAxes", [
          "objectAxesPoints",
          "objectAxesLines",
        ]);

        ctx.update();

        objectNumber.max = ctx.nonUIObjectsToDraw.length - 1;
        objectName.textContent = ctx.objectSelected?.name;

        //l(this.nonUIObjectsToDraw);
        //l(ctx.objectSelected);
        //l(ctx.objectsToDraw.map((x) => x.name));
      });
    },
    statsDisplay(angle) {
      let overlay = document.querySelector("#overlay");
      overlay.replaceChildren();

      let now = this.ctx.time.now;
      let fps = this.ctx.time.fps;
      //let angle = earthOrbit.orientation[1];
      // angle = angle % 360;

      let time = document.createElement("div");
      time.innerText = "Time: " + now.toFixed(2); // 2 decimal places

      let FPS = document.createElement("div");
      FPS.innerText = "FPS: " + fps.toFixed(1); // 1 decimal place

      let angleNode = document.createElement("div");
      angleNode.innerText = "Angle: " + angle?.toFixed(0); // no decimal place

      overlay.append(time, FPS, angleNode);
    },
  };

  UI = {
    ctx: this,
    showAllBoundingBoxes() {
      //l("showing Bounding Boxes");
      this.ctx.nonUIObjectsToDraw.forEach((x) => x.showBoundingBox());
    },
    hideAllBoundingBoxes() {
      //l("Hiding Bounding Boxes");
      this.ctx.nonUIObjectsToDraw.forEach((x) => x.hideBoundingBox());
    },
    showAllObjectAxes() {
      //l("showing Object Axes");
      //l(this);
      this.ctx.nonUIObjectsToDraw.forEach((x) => x.showAxes());
    },
    hideAllObjectAxes() {
      //l("Hiding Object Axes");
      this.ctx.nonUIObjectsToDraw.forEach((x) => x.hideAxes());
    },
  };

  conditionalObjectFilter(toggleProperty, objectProprty, namesToFilter) {
    if (this[toggleProperty]) {
      this.objects[objectProprty]();
    } else {
      this.objectsToDraw = this.objectsToDraw.filter(
        (x) => !namesToFilter.includes(x.name)
      );
    }
  }
  draw() {
    log.warn("program.draw() Called.");
    let ctx = this;
    let animated = this.animated;

    log.warn(
      "draw():",
      "this.objectsToDraw:",
      this.objectsToDraw.map((x) => x.name).toString()
    );

    if (this.firstDraw) {
      this.preload();
      this.objectSelected = this.nonUIObjectsToDraw[this.objectSelectedNumber];
      if (this.showAllObjectAxes) this.UI.showAllObjectAxes();
      if (this.showAllBoundingBoxes) this.UI.showAllBoundingBoxes();
      // this.conditionalObjectFilter("objectBox", "objectBox", ["objectBox"]);
      // this.conditionalObjectFilter("objectAxes", "objectAxes", [
      //   "objectAxesPoints",
      //   "objectAxesLines",
      // ]);
      this.firstDraw = false;
    }

    let drawFunction = this.drawFunction.bind(this);
    let draw3D = this.draw3D.bind(this, drawFunction);

    if (this.animated)
      requestAnimationFrame(this.animate.bind(this, drawFunction));
    else draw3D();
  }
  time = {
    now: 0,
    then: 0,
    deltaTime: 0,
    fps: 0,
  };
  animate(drawFunction, now) {
    // Convert to Seconds:
    now *= 0.001;
    this.time.now = now;

    //l(now);

    // Subtract the Previous Time from the Current Time:
    //this.time.deltaTime = now - this.time.then;
    let deltaTime = now - this.time.then;
    this.time.deltaTime = deltaTime;
    let fps = 1 / deltaTime;
    if (fps !== Infinity) this.time.fps = fps;

    // Remember the Current Time for the next Frame:
    this.time.then = now;

    // Every frame increase the rotation a little.
    // let rotationSpeed = 1.2;
    // object.rotation[1] += rotationSpeed * deltaTime;

    this.draw3D(drawFunction, deltaTime);
  }
  draw3D(drawFunction, deltaTime) {
    let gl = this.gl;
    let ctx = this; // Because of how its called with .bind()

    this.resizeCanvasToDisplaySize();

    // Tell WebGL how to convert from clip space to pixels
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // WebGL has the ability to draw only forward facing or back facing triangles.
    // We can turn that feature on with gl.CULL_FACE:
    gl.enable(gl.CULL_FACE);

    // Depth Buffer (Z-Buffer)
    gl.enable(gl.DEPTH_TEST);

    // Clear the canvas
    gl.clearColor(...ctx.backgroundColor);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    log.info("  drawFunction() Called.");
    drawFunction.call(this, deltaTime);

    if (this.animated) {
      requestAnimationFrame(this.animate.bind(this, drawFunction));
    }
  }
  preload() {
    let ctx = this;

    let loadImage = async (src) => {
      let img = new Image();
      img.src = src;
      await img.decode();
      return img;
    };

    Promise.all(ctx.images.map(loadImage)).then((loadedImages) => {
      loadedImages = loadedImages.map((x) => [x.src.split("/").at(-1), x]);
      loadedImages = new Map(loadedImages);
      ctx.objectsToDraw.forEach((object, i) => {
        if (object.texture) {
          object.texture = ctx.createTexture(loadedImages.get(object.texture));
        }
      });
      ctx.draw();
    });
  }
}

export class RenderObject {
  // settings: {
  //  program: program,
  //  attributes: {},
  //  uniforms: {}
  // }

  static ID = 0;

  constructor(context, settings) {
    RenderObject.ID++;
    this.ID = RenderObject.ID;

    this.context = context;
    this.UIObject = settings?.UIObject || false;

    this.name = settings?.name || this.constructor.name + " #" + this.ID;
    this.program = settings.program;
    this.vertexArray = "";
    this.primitive = settings?.primitive || "triangles";
    this.texture = settings?.texture || "";
    this.attributes = {
      ...{},
      ...settings.attributes,
    };
    this.uniforms = {
      ...{
        u_worldViewProjection: Mat4.identity(),
        u_worldInverseTranspose: Mat4.identity(),
        u_world: Mat4.identity(),
        // u_matrix: this.is2D ? Mat3.identity() : Mat4.identity(),
        // u_color: [1, 1, 1, 1],
        // u_texture: 0,
      },
      ...settings.uniforms,
    };
    this.dimensions = {
      Xmax: 0,
      Xmin: 0,
      Ymax: 0,
      Ymin: 0,
      Zmax: 0,
      Zmin: 0,
    };
    this.transform = {
      translation: settings?.translation || this.context.origin,
      rotation: settings?.rotation || this.context.orientation,
      scale: settings?.scale ?? this.context.unit,
    };
    this.deformation = {
      vertices: [
        // [oldVertexNumber, newVertexValues],
        // [oldVertexNumber, newVertexValues],
        // [oldVertexNumber, newVertexValues],
      ],
      components: [
        // [oldVertexNumber, newVertexValues, componentToChange],
      ],
    };

    if (!Array.isArray(this.transform.scale)) {
      this.transform.scale = [
        this.transform.scale,
        this.transform.scale,
        this.transform.scale,
      ];
    }

    this.node = new SceneGraphNode(this.name);
    this.setParent(SceneGraphNode.world);
    if (settings?.parent) this.setParent(settings?.parent);
    if (settings?.UIObject) this.node.UINode = true;

    this.translate(...this.transform.translation);
    this.xRotate(this.transform.rotation[0]);
    this.yRotate(this.transform.rotation[1]);
    this.zRotate(this.transform.rotation[2]);
    this.scale(...this.transform.scale);

    // this.applyTransforms();
    this.calculateDimensions();
    this.bindVertexArray();
  }

  get position() {
    return this.attributes.a_position.data || this.attributes.a_position;
  }
  get color() {
    return this.attributes.a_color.data || this.attributes.a_color;
  }
  get normal() {
    return this.attributes.a_normal.data || this.attributes.a_normal;
  }
  get textureCoordinates() {
    return this.attributes.a_texCoord.data || this.attributes.a_texCoord;
  }

  get location() {
    let matrix = this.node.worldMatrix;
    return [matrix[12], matrix[13], matrix[14]];
  }
  get orientation() {
    let matrix = this.node.worldMatrix;
    return Math.asin(matrix[2]) / (Math.PI / 180);
  }

  drawTrail() {
    this.history = [];

    // let test = 0;

    // test = test + this.context.time.deltaTime;

    // l(test);

    // for (let t = 0; t < 60; t = t + this.context.time.deltaTime) {
    //   if (t % 1 == 0) {
    //     this.history.push(this.location);
    //     l(this.history);
    //   }
    //   // if (t % 1 == 0) {
    //   //   this.context.objects.path(this.history, "purple");
    //   //   this.history = [];
    //   // }
    // }

    let a = setInterval(() => this.history.push(this.location), 100);

    let b = setInterval(() => {
      this.context.objects.path(this.history, "purple");
      this.history = [];
    }, 1000);

    let c = setInterval(() => {
      clearInterval(a);
      clearInterval(b);
      clearInterval(c);
    }, 60000);
  }

  showBoundingBox() {
    this.context.objects.objectBox(this);
  }
  hideBoundingBox() {
    this.context.objectsToDraw = this.context.objectsToDraw.filter(
      (x) => x.name != `objectBox-${this.name}`
    );
  }

  showAxes() {
    this.context.objects.objectAxes(this);
  }
  hideAxes() {
    this.context.objectsToDraw = this.context.objectsToDraw.filter(
      (x) =>
        x.name != `objectAxesLines-${this.name}` &&
        x.name != `objectAxesPoints-${this.name}`
    );
  }

  vertex(n) {
    return object.attributes.a_position.data[n];
  }
  deformVertex(vertexNumber, newVertex) {
    object.deformation.vertices.push([vertexNumber, newVertex]);
  }
  deformVertexComponent(vertexNumber, newVertex, component1, component2) {
    object.deformation.components.push([
      vertexNumber,
      newVertex,
      component1,
      component2,
    ]);
  }

  translate(tx, ty, tz) {
    this.node.localMatrix = Mat4.multiply(
      Mat4.translation(tx, ty, tz),
      this.node.localMatrix
    );
    return this;
  }
  xRotate(angleInRadians) {
    // Order is important: R*A, not A*R

    this.node.localMatrix = Mat4.multiply(
      Mat4.xRotation(angleInRadians),
      this.node.localMatrix
    );

    return this;
  }
  yRotate(angleInRadians) {
    // Order is important: R*A, not A*R

    this.node.localMatrix = Mat4.multiply(
      Mat4.yRotation(angleInRadians),
      this.node.localMatrix
    );

    return this;
  }
  zRotate(angleInRadians) {
    // Order is important: R*A, not A*R

    this.node.localMatrix = Mat4.multiply(
      Mat4.zRotation(angleInRadians),
      this.node.localMatrix
    );

    return this;
  }
  scale(sx, sy, sz) {
    this.node.localMatrix = Mat4.multiply(
      Mat4.scaling(sx, sy, sz),
      this.node.localMatrix
    );

    return this;
  }

  calculateDimensions() {
    let position = this.position.flat(Infinity);

    let Xpositions = [];
    let Ypositions = [];
    let Zpositions = [];

    for (let i = 0; i < position.length; i = i + 3) {
      Xpositions.push(position[i]);
      Ypositions.push(position[i + 1]);
      Zpositions.push(position[i + 2]);
    }
    this.dimensions.Xmax = Math.max(...Xpositions);
    this.dimensions.Ymax = Math.max(...Ypositions);
    this.dimensions.Zmax = Math.max(...Zpositions);

    this.dimensions.Xmin = Math.min(...Xpositions);
    this.dimensions.Ymin = Math.min(...Ypositions);
    this.dimensions.Zmin = Math.min(...Zpositions);
  }
  bindVertexArray() {
    this.vertexArray = this.program.setAttributesAndVAO(
      `${this.name} vertexArray`,
      this.attributes,
      this.primitive
    );
  }

  setParent(parent) {
    this.node.setParent(parent);
  }
}
export class Sphere extends RenderObject {
  constructor(context, settings) {
    super(context, settings);
  }
}

let TRS = function () {
  this.translation = [0, 0, 0];
  this.rotation = [0, 0, 0];
  this.scale = [1, 1, 1];
};

TRS.prototype.getMatrix = function (dst) {
  dst = dst || new Array(16);
  let t = this.translation;
  let r = this.rotation;
  let s = this.scale;

  // compute a matrix from translation, rotation, and scale
  dst = Mat4.translation(t[0], t[1], t[2]);
  dst = Mat4.xRotate(dst, r[0]);
  dst = Mat4.yRotate(dst, r[1]);
  dst = Mat4.zRotate(dst, r[2]);
  dst = Mat4.scale(dst, s[0], s[1], s[2]);
  return dst;
};

export class SceneGraphNode {
  constructor(name, source) {
    this.name = name;
    this.children = [];
    this.localMatrix = Mat4.identity();
    this.worldMatrix = Mat4.identity();
    this.source = source;

    this.UINode = false;

    if (this.name != "world") this.setParent(SceneGraphNode.world);
    SceneGraphNode.nodes.push(this);
  }

  static nodes = [];
  // static get rootNodes() {
  //   return SceneGraphNode.nodes.filter((x) => !x.parent);
  // }
  static get world() {
    return SceneGraphNode.nodes.find((x) => x.name == "world");
  }
  static get worldOrigin() {
    return SceneGraphNode.nodes.find((x) => x.name == "worldOrigin");
  }
  static get objectSelected() {
    return SceneGraphNode.nodes.find((x) => x.name == "objectSelected");
  }
  static printTree() {
    console.log("-----------Scene Graph-----------");
    SceneGraphNode.nodes.forEach((x) =>
      x.children.sort((a, b) => {
        let A = a.children.length;
        let B = b.children.length;
        if (A < B) return -1;
        if (A == B) return 0;
        if (A > B) return 1;
      })
    );
    SceneGraphNode.world.print(1, "");
  }

  print(indentN, string) {
    if (this.UINode) {
      console.log(
        indent(indentN) + string + "%c" + this.name,
        "color:palegreen;"
      );
    } else {
      console.log(indent(indentN) + string + "%c" + this.name, "color:yellow;");
    }
    if (this.children.length) {
      this.children.forEach((x) => x.print(indentN + 1, string));
    }
    return this;
  }

  get location() {
    let matrix = this.worldMatrix;
    return [matrix[12], matrix[13], matrix[14]];
  }
  get orientation() {
    let x = this.location[0];
    let y = this.location[1];
    let z = this.location[2];

    let Rx = Math.atan2(z, y) / (Math.PI / 180);
    let Ry = Math.atan2(z, x) / (Math.PI / 180);
    let Rz = Math.atan2(y, x) / (Math.PI / 180);

    return [Rx, Ry, Rz];
    //return Math.asin(matrix[2]);
  }

  translate(tx, ty, tz) {
    this.localMatrix = Mat4.multiply(
      Mat4.translation(tx, ty, tz),
      this.localMatrix
    );
    return this;
  }
  xRotate(angleInRadians) {
    // Order is important: R*A, not A*R

    this.localMatrix = Mat4.multiply(
      Mat4.xRotation(angleInRadians),
      this.localMatrix
    );

    return this;
  }
  yRotate(angleInRadians) {
    // Order is important: R*A, not A*R

    this.localMatrix = Mat4.multiply(
      Mat4.yRotation(angleInRadians),
      this.localMatrix
    );

    return this;
  }
  zRotate(angleInRadians) {
    // Order is important: R*A, not A*R

    this.localMatrix = Mat4.multiply(
      Mat4.zRotation(angleInRadians),
      this.localMatrix
    );

    return this;
  }
  scale(sx, sy, sz) {
    this.localMatrix = Mat4.multiply(
      Mat4.scaling(sx, sy, sz),
      this.localMatrix
    );

    return this;
  }

  setParent(parent) {
    // remove us from our parent
    if (this.parent) {
      let ndx = this.parent.children.indexOf(this);
      if (ndx >= 0) {
        this.parent.children.splice(ndx, 1);
      }
    }

    // Add us to our new parent
    if (parent) {
      parent.children.push(this);
    }
    this.parent = parent;

    return this;
  }

  updateWorldMatrix(parentWorldMatrix) {
    let source = this.source;
    if (source) {
      source.getMatrix(this.localMatrix);
    }

    if (parentWorldMatrix) {
      // a matrix was passed in so do the math and store the result in `this.worldMatrix`.
      this.worldMatrix = Mat4.multiply(parentWorldMatrix, this.localMatrix);
    } else {
      // no matrix was passed in so just copy.
      Mat4.copy(this.localMatrix, this.worldMatrix);
    }

    // now process all the children
    this.children.forEach((child) => child.updateWorldMatrix(this.worldMatrix));

    return this;
  }
}

export class Shader {
  constructor() {}

  vertexTemplate() {
    return `#version 300 es
      ${inVariables}

      ${uniformVariables}

      ${outVariables}

      void main() {
        gl_Position = ${positionCalculation}
  
        gl_PointSize = 10.0;

        ${varyingVariables}
      }
    `;
  }

  fragmentTemplate() {
    return `#version 300 es
      precision highp float;

      ${inVariables}

      ${vertexUniformVariables}

      ${outVariables}

      void main() {
        outColor = ${colorCalculation}
      }
    `;
  }
}

let generalVertexShader = `#version 300 es
    in vec4 a_position;
    in vec4 a_color;
    in vec3 a_normal;
    in vec2 a_texCoord;

    uniform mat4 u_world;
    uniform mat4 u_worldViewProjection;
    uniform mat4 u_worldInverseTranspose;
    uniform vec3 u_lightWorldPosition;

    out vec4 v_color;
    out vec3 v_normal;
    out vec3 v_surfaceToLight;
    out vec2 v_texCoord;

    void main() {
      gl_Position = u_worldViewProjection * a_position;
      vec3 surfaceWorldPosition = (u_world * a_position).xyz;
 
      gl_PointSize = 10.0;

      v_color = a_color;
      v_normal = mat3(u_worldInverseTranspose) * a_normal;
      v_surfaceToLight = u_lightWorldPosition - surfaceWorldPosition;
      v_texCoord = a_texCoord;

    }
  `;

let generalFragmentShader = `#version 300 es
    precision highp float;

    in vec4 v_color;
    in vec3 v_normal;
    in vec3 v_surfaceToLight;
    in vec2 v_texCoord;

    uniform vec4 u_colorMult;
    uniform vec4 u_colorOffset;
    uniform sampler2D u_texture;

    out vec4 outColor;

    void main() {
      outColor = texture(u_texture, v_texCoord) + v_color * u_colorMult + u_colorOffset;

      vec3 normal = normalize(v_normal);
      vec3 surfaceToLightDirection = normalize(v_surfaceToLight);

      float light = dot(normal, surfaceToLightDirection);

      outColor.rgb *= light;

    }
  `;
