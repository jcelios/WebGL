import {
  l,
  sRGB,
  randomInt,
  bind,
  radToDeg,
  degToRad,
  Vec3,
  Mat3,
  Mat4,
  Context,
  Context2D,
  Context3D,
  Program,
  Logger,
  enumMap,
  SceneGraphNode,
} from "./imports.js";
import * as Shapes from "../functions/shapes.js";

import {} from "./sliders.js";

// https://webgl2fundamentals.org/

let log = new Logger(Context.debug, import.meta.url);

function context2D() {
  let vertexShader = `#version 300 es
    in vec2 a_position;
    in vec2 a_texCoord;

    uniform mat3 u_matrix;

    out vec2 v_texCoord;

    void main() {
      gl_Position = vec4((u_matrix * vec3(a_position, 1)).xy, 0, 1);

      // pass the texCoord to the fragment shader
      // The GPU will interpolate this value between points
      v_texCoord = a_texCoord;
    }
  `;

  let fragmentShader = `#version 300 es
    precision highp float;

    // the texCoords passed in from the vertex shader.
    in vec2 v_texCoord;

    // our texture
    uniform sampler2D u_texture;

    out vec4 outColor;

    void main() {
      outColor = texture(u_texture, v_texCoord);
    }
  `;

  let ctx = new Context2D({
    is2D: true,
    controls: true,
    animated: false,
    images: ["./meowmeow.png", "./temple.jpg"],
    view: {
      // Projection Matrix
      FOV: degToRad(60),
      near: 1,
      far: 2000,

      // Camera Matrix
      up: [0, 0, 1],
      cameraPosition: [0, 0, 0, 1],
      cameraAngle: [degToRad(0), degToRad(0), degToRad(0)],
      //cameraTarget: [0, 0, 0],
      cameraZoom: [1, 1, 1],
    },
  });
  ctx.view.cameraTarget = [ctx.width / 2.5, ctx.height / 3, 0, 1];
  let gl = ctx.gl;
  let program = ctx.createProgram(vertexShader, fragmentShader);
  ctx.objectMatrices = (object, i, time) => {
    if (ctx.animated) {
      switch (object.name) {
        case "cube2":
          object.rotation = [-time, time, 0];
        case "sphere":
          object.rotation = [time, time, 0];
        case "cone":
          object.rotation = [time, -time, 0];
      }
    }

    let matrix = ctx.globalMatrices().viewProjectionMatrix;

    log.info("    Translation:", object.translation.toString());
    matrix = Mat3.translate(
      matrix,
      object.translation[0],
      object.translation[1]
    );

    log.info("    Rotation:", object.rotation.toString());
    matrix = Mat3.rotate(matrix, object.rotation[0]);

    log.info("    Scale:", object.scale.toString());
    matrix = Mat3.scale(matrix, object.scale, object.scale);

    return matrix;
  };

  ctx.objects.F2D();
  ctx.objects.axes2D();

  let x = -100;
  let y = -100;
  let width = 100;
  let height = 100;
  ctx.createObject(
    program,
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
      a_texCoord: {
        data: [0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0],
        size: 2,
        normalize: true,
      },
    },
    {
      u_texture: 0,
    },
    { name: "textureTest1", scale: 1, texture: "meowmeow.png" }
  );

  x = 0;
  y = 0;
  width = 100;
  height = 100;
  ctx.createObject(
    program,
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
      a_texCoord: {
        data: [0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0],
        size: 2,
        normalize: true,
      },
    },
    {
      u_texture: 1,
    },
    { scale: 1, translation: [100, 100], texture: "temple.jpg" }
  );

  ctx.drawFunction = function drawFunction(time) {
    if (ctx.animated) time = time * 0.0005;

    ctx.objectsToDraw.forEach((object, i) => {
      log.info("Drawing:", object.name);

      // Set Program for Object
      //let programInfo = object.program;
      gl.useProgram(object.program.object);

      // Vertex Array / Attributes
      let vertexArray = object.vertexArray;
      gl.bindVertexArray(vertexArray.object);

      // Per Object Uniforms
      object.program.setUniforms(object, {
        u_matrix: ctx.objectMatrices(object, i, time),
        u_texture: i,
        // u_worldViewProjection: Mat4.identity(),
        // u_world: Mat4.identity(),
        // u_worldInverseTranspose: Mat4.identity(),
      });
      //this.setUniforms(object.materialUniforms);

      if ("u_texture" in object.uniforms) {
        gl.bindTexture(gl.TEXTURE_2D, object.texture);
      }

      // Draw
      //l("draw", object);
      ctx.drawVertices(vertexArray);
    });
  };
  let sliders = () => {
    let slidersDiv = document.querySelector("#sliders");
    slidersDiv.style = "display: inline-block;text-align:right;";

    let createSlider = (options) => {
      let div = document.createElement("div");

      let groups = Array.from(slidersDiv.children).map((x) => x.name);

      //l(groups);

      if (groups.includes(options.group)) {
        let group = Array.from(slidersDiv.children)[
          groups.indexOf(options.group)
        ];
        group.append(div);
      } else {
        let group = document.createElement("fieldset");
        group.name = options.group;
        slidersDiv.append(group);
        group.append(div);
      }

      let label = document.createElement("label");
      label.textContent = options.label;
      let slider = document.createElement("input");
      slider.type = "range";
      let number = document.createElement("input");
      number.type = "text";
      number.style =
        "width: 25px;text-align: center;background-color: transparent;border: none;";
      div.append(label, slider, number);
      //slidersDiv.append(div);
      let control = {
        get value() {
          this.number.value = this.slider.value;
          return this.slider.value;
        },
        set value(val) {
          this.slider.value = val;
          this.number.value = val;
        },
        set min(val) {
          this.slider.min = val;
        },
        set max(val) {
          this.slider.max = val;
        },
        set step(val) {
          this.slider.step = val;
        },
        slider: slider,
        number: number,
      };
      control.value = options.default;
      control.min = options.min;
      control.max = options.max;
      control.step = options.step;
      control.slider.addEventListener("input", () => {
        options.variable = options.updateFunc(control.value);
        ctx.globalMatrices().viewProjectionMatrix;
        ctx.draw();
      });
      return control;
    };

    createSlider({
      label: "FOV: ",
      group: "Group0",
      default: radToDeg(ctx.view.FOV),
      set variable(val) {
        ctx.view.FOV = val;
      },
      updateFunc: degToRad,
      min: 0,
      max: 360,
      step: 1,
    });
    createSlider({
      label: "Aspect Ratio: ",
      group: "Group0",
      default: ctx.aspectRatio,
      set variable(val) {
        ctx.view.aspectRatio = val;
      },
      updateFunc: (x) => x,
      min: 0.01,
      max: 10,
      step: 0.01,
    });
    createSlider({
      label: "Draw Distance: ",
      group: "Group0",
      default: ctx.view.far,
      set variable(val) {
        ctx.view.far = val;
      },
      updateFunc: (x) => x,
      min: 0,
      max: 2000,
      step: 1,
    });
    createSlider({
      label: "Clipping Distance: ",
      group: "Group0",
      default: ctx.view.near,
      set variable(val) {
        ctx.view.near = val;
      },
      updateFunc: (x) => x,
      min: 0,
      max: 10,
      step: 0.1,
    });

    // Camera Angle
    createSlider({
      label: "Camera Angle X: ",
      group: "Group1",
      default: radToDeg(ctx.view.cameraAngle[0]),
      set variable(val) {
        ctx.view.cameraAngle[0] = val;
      },
      updateFunc: degToRad,
      min: -360,
      max: 360,
      step: 1,
    });
    createSlider({
      label: "Camera Angle Y: ",
      group: "Group1",
      default: radToDeg(ctx.view.cameraAngle[1]),
      set variable(val) {
        ctx.view.cameraAngle[1] = val;
      },
      updateFunc: degToRad,
      min: -360,
      max: 360,
      step: 1,
    });
    createSlider({
      label: "Camera Angle Z: ",
      group: "Group1",
      default: radToDeg(ctx.view.cameraAngle[2]),
      set variable(val) {
        ctx.view.cameraAngle[2] = val;
      },
      updateFunc: degToRad,
      min: -360,
      max: 360,
      step: 1,
    });

    // Camera Target
    createSlider({
      label: "Camera Target X: ",
      group: "Group2",
      default: ctx.view.cameraTarget[0],
      set variable(val) {
        ctx.view.cameraTarget[0] = val;
      },
      updateFunc: (x) => x,
      min: -100,
      max: 100,
      step: 1,
    });
    createSlider({
      label: "Camera Target Y: ",
      group: "Group2",
      default: ctx.view.cameraTarget[1],
      set variable(val) {
        ctx.view.cameraTarget[1] = val;
      },
      updateFunc: (x) => x,
      min: -100,
      max: 100,
      step: 1,
    });
    createSlider({
      label: "Camera Target Z: ",
      group: "Group2",
      default: ctx.view.cameraTarget[2],
      set variable(val) {
        ctx.view.cameraTarget[2] = val;
      },
      updateFunc: (x) => x,
      min: -100,
      max: 100,
      step: 1,
    });

    // Camera Position
    createSlider({
      label: "Camera Position X: ",
      group: "Group3",
      default: ctx.view.cameraPosition[0],
      set variable(val) {
        ctx.view.cameraPosition[0] = val;
      },
      updateFunc: (x) => x,
      min: -10,
      max: 10,
      step: 1,
    });
    createSlider({
      label: "Camera Position Y: ",
      group: "Group3",
      default: ctx.view.cameraPosition[1],
      set variable(val) {
        ctx.view.cameraPosition[1] = val;
      },
      updateFunc: (x) => x,
      min: -10,
      max: 10,
      step: 1,
    });
    createSlider({
      label: "Camera Position Z: ",
      group: "Group3",
      default: ctx.view.cameraPosition[2],
      set variable(val) {
        ctx.view.cameraPosition[2] = val;
      },
      updateFunc: (x) => x,
      min: -10,
      max: 10,
      step: 1,
    });

    // Camera Zoom
    createSlider({
      label: "Camera Zoom X: ",
      group: "Group4",
      default: ctx.view.cameraZoom[0],
      set variable(val) {
        ctx.view.cameraZoom[0] = val;
      },
      updateFunc: (x) => x,
      min: 1,
      max: 30,
      step: 1,
    });
    createSlider({
      label: "Camera Zoom Y: ",
      group: "Group4",
      default: ctx.view.cameraZoom[1],
      set variable(val) {
        ctx.view.cameraZoom[1] = val;
      },
      updateFunc: (x) => x,
      min: 1,
      max: 30,
      step: 1,
    });
    createSlider({
      label: "Camera Zoom Z: ",
      group: "Group4",
      default: ctx.view.cameraZoom[2],
      set variable(val) {
        ctx.view.cameraZoom[2] = val;
      },
      updateFunc: (x) => x,
      min: 1,
      max: 30,
      step: 1,
    });
  };
  sliders();

  let loadImage = async (src) => {
    let img = new Image();
    img.src = src;
    await img.decode();
    return img;
  };

  Promise.all(ctx.images.map(loadImage)).then((loadedImages) => {
    //l(loadedImages);
    loadedImages = loadedImages.map((x) => [x.src.split("/").at(-1), x]);
    loadedImages = new Map(loadedImages);
    // l(loadedImages);
    ctx.objectsToDraw.forEach((object, i) => {
      if (object.texture) {
        object.texture = ctx.createTexture(loadedImages.get(object.texture));
      }
    });
    ctx.draw();
  });
}
//context2D();

function context3D() {
  let vertexShader = `#version 300 es
    in vec4 a_position;
    //in vec4 a_color;
    //in vec2 a_texCoord;
    in vec3 a_normal;

    uniform vec3 u_lightWorldPosition;

    uniform mat4 u_world;
    uniform mat4 u_worldViewProjection;
    uniform mat4 u_worldInverseTranspose;

    //out vec4 v_color;
    //out vec2 v_texCoord;

    out vec3 v_normal;
    out vec3 v_surfaceToLight;

    void main() {
      gl_Position = u_worldViewProjection * a_position;
 
      // orient the normals and pass to the fragment shader
      // v_normal = mat3(u_world) * a_normal;
      v_normal = mat3(u_worldInverseTranspose) * a_normal;

      gl_PointSize = 10.0;

      //v_color = a_color;
      //v_texCoord = a_texCoord;
      //v_normal = a_normal;

      // compute the world position of the surface
      // vec3 surfaceWorldPosition = (u_worldInverseTranspose * a_position).xyz;
      vec3 surfaceWorldPosition = (u_world * a_position).xyz;
 
      // compute the vector of the surface to the light
      // and pass it to the fragment shader
      v_surfaceToLight = u_lightWorldPosition - surfaceWorldPosition;
    }
  `;

  let fragmentShader = `#version 300 es
    precision highp float;

    //in vec4 v_color;
    //in vec2 v_texCoord;

    in vec3 v_normal;
    in vec3 v_surfaceToLight;

    //uniform vec3 u_reverseLightDirection;
    uniform vec4 u_color;

    //uniform sampler2D u_texture;
    //uniform vec4 u_color;

    out vec4 outColor;

    void main() {
      //outColor = texture(u_texture, v_texCoord);

      // because v_normal is a varying it's interpolated
      // so it will not be a unit vector. Normalizing it
      // will make it a unit vector again
      vec3 normal = normalize(v_normal);

      vec3 surfaceToLightDirection = normalize(v_surfaceToLight);
 
      // compute the light by taking the dot product
      // of the normal to the light's reverse direction
      //float light = dot(normal, u_reverseLightDirection);
      float light = dot(normal, surfaceToLightDirection);
 
      outColor = u_color;
 
      // Lets multiply just the color portion (not the alpha)
      // by the light
      outColor.rgb *= light;
    }
  `;

  let ctx = new Context3D({
    is3D: true,
    controls: true,
    animated: false,
    backgroundColor: "black",
    images: ["./meowmeow.png", "./temple.jpg"],
    view: {
      // Projection Matrix
      FOV: degToRad(60),
      near: 1,
      far: 2000,

      // Camera Matrix
      up: [0, 1, 0],
      cameraTarget: [0, 0, 0], // [0, 35, 0],
      cameraPosition: [250, 250, 250, 1], //[100, 150, 200, 1],
      cameraArc: [degToRad(0), degToRad(0), degToRad(0)],
      cameraAngle: [degToRad(0), degToRad(0), degToRad(0)],
      cameraZoom: [1, 1, 1],
    },
  });
  let gl = ctx.gl;
  let program = ctx.createProgram(vertexShader, fragmentShader);

  ctx.createLight([20, 30, 50]);

  // function createNormalLines(vertices) {
  //   let scale = 10;
  //   let srcPositions = vertices.position;
  //   let srcNormals = vertices.normal;

  //   let normVertices = [];

  //   for (let ii = 0; ii < srcPositions.length; ii += 3) {
  //     let cube = Shapes.createCubeVertices(1);
  //     delete cube.normal;
  //     delete cube.texcoord;
  //     cube.color = new Float32Array((cube.position.length / 3) * 4);
  //     cube.color.forEach((v, i) => {
  //       let ch = i % 4;
  //       cube.color[i] = ch === 3 ? 1 : srcNormals[ii + ch] * 0.5 + 0.5;
  //     });
  //     let target = srcNormals.slice(ii, ii + 3);
  //     let self = [0, 0, 0];
  //     let up = Math.abs(target[1]) === 1 ? [1, 0, 0] : [0, 1, 0];
  //     let lookAt = Mat4.lookAt(self, target, up);
  //     let mat = Mat4.identity();
  //     mat = Mat4.translate(mat, srcPositions.slice(ii, ii + 3));
  //     mat = Mat4.multiply(mat, lookAt);
  //     mat = Mat4.scale(mat, [1.5, 1.5, scale]);
  //     mat = Mat4.translate(mat, [0, 0, -0.5]);
  //     //l("cube.position:", cube.position);
  //     Shapes.reorientVertices(cube, mat);
  //     //l("cube.position:", cube.position);
  //     normVertices.push(cube);
  //   }
  //   //l("normVertices2:", normVertices.map(x => x.position));
  //   return Shapes.concatVertices(normVertices);
  // }

  // let cubeVertices = Shapes.createCubeVertices(70);
  // //l("cubeVertices:", cubeVertices);
  // createNormalLines(cubeVertices);

  let obj = ctx.createObject({
    name: "3DF_Textured",
    program: program,
    texture: "temple.jpg",
    scale: 0.25,
    // translation: [0, 100, 100],
    // rotation: [Math.PI, degToRad(-38), degToRad(0)],
    attributes: {
      a_position: [
        -50, 75, 14.999999999999991, -50, -75, 15.000000000000009, -20, 75,
        14.999999999999991, -50, -75, 15.000000000000009, -20, -75,
        15.000000000000009, -20, 75, 14.999999999999991, -20, 75,
        14.999999999999991, -20, 45, 14.999999999999995, 50, 75,
        14.999999999999991, -20, 45, 14.999999999999995, 50, 45,
        14.999999999999995, 50, 75, 14.999999999999991, -20, 15,
        14.999999999999998, -20, -15, 15.000000000000002, 17, 15,
        14.999999999999998, -20, -15, 15.000000000000002, 17, -15,
        15.000000000000002, 17, 15, 14.999999999999998, -50, 75,
        -15.000000000000009, -20, 75, -15.000000000000009, -50, -75,
        -14.999999999999991, -50, -75, -14.999999999999991, -20, 75,
        -15.000000000000009, -20, -75, -14.999999999999991, -20, 75,
        -15.000000000000009, 50, 75, -15.000000000000009, -20, 45,
        -15.000000000000005, -20, 45, -15.000000000000005, 50, 75,
        -15.000000000000009, 50, 45, -15.000000000000005, -20,
        14.999999999999993, -15.000000000000002, 17, 14.999999999999993,
        -15.000000000000002, -20, -15, -14.999999999999998, -20, -15,
        -14.999999999999998, 17, 14.999999999999993, -15.000000000000002, 17,
        -15, -14.999999999999998, -50, 75, 14.999999999999991, 50, 75,
        14.999999999999991, 50, 75, -15.000000000000009, -50, 75,
        14.999999999999991, 50, 75, -15.000000000000009, -50, 75,
        -15.000000000000009, 50, 75, 14.999999999999991, 50, 45,
        14.999999999999995, 50, 45, -15.000000000000005, 50, 75,
        14.999999999999991, 50, 45, -15.000000000000005, 50, 75,
        -15.000000000000009, -20, 45, 14.999999999999995, -20, 45,
        -15.000000000000005, 50, 45, -15.000000000000005, -20, 45,
        14.999999999999995, 50, 45, -15.000000000000005, 50, 45,
        14.999999999999995, -20, 45, 14.999999999999995, -20,
        14.999999999999993, -15.000000000000002, -20, 45, -15.000000000000005,
        -20, 45, 14.999999999999995, -20, 15, 14.999999999999998, -20,
        14.999999999999993, -15.000000000000002, -20, 15, 14.999999999999998,
        17, 14.999999999999993, -15.000000000000002, -20, 14.999999999999993,
        -15.000000000000002, -20, 15, 14.999999999999998, 17, 15,
        14.999999999999998, 17, 14.999999999999993, -15.000000000000002, 17, 15,
        14.999999999999998, 17, -15, -14.999999999999998, 17,
        14.999999999999993, -15.000000000000002, 17, 15, 14.999999999999998, 17,
        -15, 15.000000000000002, 17, -15, -14.999999999999998, -20, -15,
        15.000000000000002, -20, -15, -14.999999999999998, 17, -15,
        -14.999999999999998, -20, -15, 15.000000000000002, 17, -15,
        -14.999999999999998, 17, -15, 15.000000000000002, -20, -15,
        15.000000000000002, -20, -75, -14.999999999999991, -20, -15,
        -14.999999999999998, -20, -15, 15.000000000000002, -20, -75,
        15.000000000000009, -20, -75, -14.999999999999991, -50, -75,
        15.000000000000009, -50, -75, -14.999999999999991, -20, -75,
        -14.999999999999991, -50, -75, 15.000000000000009, -20, -75,
        -14.999999999999991, -20, -75, 15.000000000000009, -50, 75,
        14.999999999999991, -50, 75, -15.000000000000009, -50, -75,
        -14.999999999999991, -50, 75, 14.999999999999991, -50, -75,
        -14.999999999999991, -50, -75, 15.000000000000009,
      ],
      // a_color: {
      //   data: [
      //     // left column front
      //     200, 70, 120, 200, 70, 120, 200, 70, 120, 200, 70, 120, 200, 70, 120,
      //     200, 70, 120,

      //     // top rung front
      //     200, 70, 120, 200, 70, 120, 200, 70, 120, 200, 70, 120, 200, 70, 120,
      //     200, 70, 120,

      //     // middle rung front
      //     200, 70, 120, 200, 70, 120, 200, 70, 120, 200, 70, 120, 200, 70, 120,
      //     200, 70, 120,

      //     // left column back
      //     80, 70, 200, 80, 70, 200, 80, 70, 200, 80, 70, 200, 80, 70, 200, 80,
      //     70, 200,

      //     // top rung back
      //     80, 70, 200, 80, 70, 200, 80, 70, 200, 80, 70, 200, 80, 70, 200, 80,
      //     70, 200,

      //     // middle rung back
      //     80, 70, 200, 80, 70, 200, 80, 70, 200, 80, 70, 200, 80, 70, 200, 80,
      //     70, 200,

      //     // top
      //     70, 200, 210, 70, 200, 210, 70, 200, 210, 70, 200, 210, 70, 200, 210,
      //     70, 200, 210,

      //     // top rung right
      //     200, 200, 70, 200, 200, 70, 200, 200, 70, 200, 200, 70, 200, 200, 70,
      //     200, 200, 70,

      //     // under top rung
      //     210, 100, 70, 210, 100, 70, 210, 100, 70, 210, 100, 70, 210, 100, 70,
      //     210, 100, 70,

      //     // between top rung and middle
      //     210, 160, 70, 210, 160, 70, 210, 160, 70, 210, 160, 70, 210, 160, 70,
      //     210, 160, 70,

      //     // top of middle rung
      //     70, 180, 210, 70, 180, 210, 70, 180, 210, 70, 180, 210, 70, 180, 210,
      //     70, 180, 210,

      //     // right of middle rung
      //     100, 70, 210, 100, 70, 210, 100, 70, 210, 100, 70, 210, 100, 70, 210,
      //     100, 70, 210,

      //     // bottom of middle rung.
      //     76, 210, 100, 76, 210, 100, 76, 210, 100, 76, 210, 100, 76, 210, 100,
      //     76, 210, 100,

      //     // right of bottom
      //     140, 210, 80, 140, 210, 80, 140, 210, 80, 140, 210, 80, 140, 210, 80,
      //     140, 210, 80,

      //     // bottom
      //     90, 130, 110, 90, 130, 110, 90, 130, 110, 90, 130, 110, 90, 130, 110,
      //     90, 130, 110,

      //     // left side
      //     160, 160, 220, 160, 160, 220, 160, 160, 220, 160, 160, 220, 160, 160,
      //     220, 160, 160, 220,
      //   ],
      //   optimized: true,
      // },
      // a_texCoord: [
      //   // left column front
      //   0, 0, 0, 1, 1, 0, 0, 1, 1, 1, 1, 0,

      //   // top rung front
      //   0, 0, 0, 1, 1, 0, 0, 1, 1, 1, 1, 0,

      //   // middle rung front
      //   0, 0, 0, 1, 1, 0, 0, 1, 1, 1, 1, 0,

      //   // left column back
      //   0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1,

      //   // top rung back
      //   0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1,

      //   // middle rung back
      //   0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1,

      //   // top
      //   0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1,

      //   // top rung right
      //   0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1,

      //   // under top rung
      //   0, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0,

      //   // between top rung and middle
      //   0, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1,

      //   // top of middle rung
      //   0, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1,

      //   // right of middle rung
      //   0, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1,

      //   // bottom of middle rung.
      //   0, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0,

      //   // right of bottom
      //   0, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1,

      //   // bottom
      //   0, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0,

      //   // left side
      //   0, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0,
      // ],
      a_normal: [
        // left column front
        0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,

        // top rung front
        0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,

        // middle rung front
        0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,

        // left column back
        0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1,

        // top rung back
        0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1,

        // middle rung back
        0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1,

        // top
        0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0,

        // top rung right
        1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,

        // under top rung
        0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0,

        // between top rung and middle
        1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,

        // top of middle rung
        0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0,

        // right of middle rung
        1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,

        // bottom of middle rung.
        0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0,

        // right of bottom
        1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,

        // bottom
        0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0,

        // left side
        -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0,
      ],
    },
    uniforms: {
      //u_reverseLightDirection: Vec3.normalize([-1, -1, -1]),
      u_color: [0.2, 1, 0.2, 1],
      //u_texture: 0,
      //u_colorMult: [1, 1, 1, 1],
    },
  });

  // let sphere = Shapes.flattenedPrimitives.createSphereBufferInfo(
  //   ctx.gl,
  //   50,
  //   10,
  //   10
  // );
  // let obj2 = ctx.createObject(
  //   program,
  //   {
  //     a_position: {
  //       data: sphere.position,
  //       size: 3,
  //     },
  //     a_normal: {
  //       data: sphere.normal,
  //       size: 3,
  //     },
  //   },
  //   {
  //     //u_reverseLightDirection: Vec3.normalize([-1, -1, -1]),
  //     u_color: [0.2, 1, 0.2, 1],
  //     // u_worldViewProjection: Mat4.identity(),
  //     // u_worldInverseTranspose: Mat4.identity(),
  //     // u_world: Mat4.identity(),

  //     //u_texture: 0,
  //   },
  //   {
  //     name: "sphere2",
  //     texture: "temple.jpg",
  //     //scale: 0.25,
  //     // translation: [0, 100, 100],
  //     // rotation: [Math.PI, degToRad(-38), degToRad(0)],
  //   }
  // );
  // obj2.transform.translation = [-100, 0, 100];

  //l(obj);

  function showNormals(obj) {
    let p = obj.attributes.a_position.data.flat(Infinity);
    let n = obj.attributes.a_normal.data;
    for (let i = 0; i < p.length; i = i + 3) {
      let pos = [p[i], p[i + 1], p[i + 2]];
      let norm = Vec3.scalarMultiply(25, [n[i], n[i + 1], n[i + 2]]);
      let line = ctx.objects.lineSegment(pos, Vec3.add(pos, norm), "red");
      line.transform = obj.transform;
    }
  }
  //showNormals(obj);

  //let sphere = ctx.objects.sphere(program);
  //sphere.transform.translation = [-100, 0, 100];
  // showNormals(sphere);

  //ctx.objects.pointLightSource(ctx.lights.light0.u_lightWorldPosition);

  //ctx.objects.lineSegment([10, 10, 0], [100, 100, 1], "red");

  //ctx.objectSelected = 0;

  //ctx.objects.worldAxes();
  //ctx.objects.objectAxes(1);
  //ctx.objects.objectBox(1);

  //ctx.objects.cameraAxes();
  //ctx.objects.cameraTarget();

  ctx.objectMatrices = (object, i, deltaTime) => {
    deltaTime = deltaTime ?? 1;

    if (object.name == "pointLightSource") {
      //l(object);
      //l(object.node.localMatrix);
      object.node.localMatrix = Mat4.translate(
        object.node.localMatrix,
        ...ctx.lights.light0.position
      );
      //l(object.node.localMatrix);
      object.node.updateWorldMatrix();
    }

    let viewProjectionMatrix = ctx.globalMatrices().viewProjectionMatrix;

    if (object.deformation.vertices.length) {
      log.info("    Deformation:", object.deformation.toString());

      object.deformation.vertices.forEach((x) => {
        let vertexNumber = x[0];
        let newVertex = x[1];
        object.attributes.a_position.data[vertexNumber] = newVertex;
      });

      // Rebind a_position Attribute
      object.vertexArray = object.program.setAttributesAndVAO(
        `${object.name} vertexArray`,
        object.attributes,
        object.primitive
      );
    }
    if (object.deformation.components.length) {
      log.info("    Deformation:", object.deformation.toString());

      object.deformation.components.forEach((x) => {
        let vertexNumber = x[0];
        let newVertex = x[1];
        let component = x[2];
        object.attributes.a_position.data[vertexNumber][component] =
          newVertex[component];
        if (x[3]) {
          component = x[3];
          object.attributes.a_position.data[vertexNumber][component] =
            newVertex[component];
        }
      });

      // Rebind a_position Attribute
      object.vertexArray = object.program.setAttributesAndVAO(
        `${object.name} vertexArray`,
        object.attributes,
        object.primitive
      );
    }

    let worldMatrix = object.node.worldMatrix;

    let worldInverseMatrix = Mat4.inverse(worldMatrix);
    let worldInverseTransposeMatrix = Mat4.transpose(worldInverseMatrix);

    let worldViewProjectionMatrix = Mat4.multiply(
      viewProjectionMatrix,
      worldMatrix
    );

    return {
      viewProjectionMatrix: viewProjectionMatrix,
      worldMatrix: worldMatrix,
      worldInverseTransposeMatrix: worldInverseTransposeMatrix,
      worldViewProjectionMatrix: worldViewProjectionMatrix,
    };
  };

  ctx.drawFunction = function drawFunction(time) {
    if (ctx.animated) time = time * 0.0005;

    ctx.objectsToDraw.forEach((object, i) => {
      log.info("Drawing:", object.name);

      // Set Program for Object
      //let programInfo = object.program;
      gl.useProgram(object.program.object);

      // Calculate Matrices
      let objectMatrices = ctx.objectMatrices(object, i, time);

      // Vertex Array / Attributes
      let vertexArray = object.vertexArray;
      gl.bindVertexArray(vertexArray.object);

      // Uniforms
      object.program.setUniforms(object, {
        u_lightWorldPosition: ctx.lights.light0.u_lightWorldPosition,
        //u_matrix: ctx.objectMatrices(object, i, time),
        u_worldViewProjection: objectMatrices.worldViewProjectionMatrix,
        u_worldInverseTranspose: objectMatrices.worldInverseTransposeMatrix,
        u_world: objectMatrices.worldMatrix,
        // u_worldInverseTransposeMatrix: ctx.objectMatrices(object, i, time).worldInverseTransposeMatrix,
        u_texture: i,
        // u_worldViewProjection: Mat4.identity(),
        // u_world: Mat4.identity(),
        // u_worldInverseTranspose: Mat4.identity(),
      });
      //this.setUniforms(object.materialUniforms);

      if ("u_texture" in object.uniforms) {
        gl.bindTexture(gl.TEXTURE_2D, object.texture);
      }

      // Draw
      ctx.drawVertices(vertexArray);
    });
  };

  ctx.draw();
}
//context3D();

function test3D() {
  let vertexShader = `#version 300 es
    in vec4 a_position;
    in vec4 a_color;

    uniform mat4 u_world;
    uniform mat4 u_worldViewProjection;
    uniform mat4 u_worldInverseTranspose;

    out vec4 v_color;

    void main() {
      gl_Position = u_worldViewProjection * a_position;
 
      gl_PointSize = 10.0;

      v_color = a_color;
    }
  `;

  let fragmentShader = `#version 300 es
    precision highp float;

    in vec4 v_color;

    uniform vec4 u_colorMult;
    uniform vec4 u_colorOffset;

    out vec4 outColor;

    void main() {
      outColor = v_color * u_colorMult + u_colorOffset;
    }
  `;

  let ctx = new Context3D({
    UI: true,
    showAllObjectAxes: false,
    controls: true,
    animated: true,
    backgroundColor: "black",
    images: [],
    view: {
      up: [0, 0, 1],
      cameraPosition: [0, -250, 0, 1], //[100, 150, 200, 1],
    },
  });
  let gl = ctx.gl;
  let program = ctx.createProgram(vertexShader, fragmentShader);

  let sphere = Shapes.flattenedPrimitives.createSphereBufferInfo(gl, 10, 12, 6);

  let solarSystem = ctx.createNode({
    name: "solarSystem",
  });
  let earthOrbit = ctx.createNode({
    name: "earthOrbit",
    parent: solarSystem,
    translation: [100, 0, 0],
  });
  let moonOrbit = ctx.createNode({
    name: "moonOrbit",
    parent: earthOrbit,
    translation: [30, 0, 0],
  });

  let sun = ctx.createObject({
    name: "sun",
    //translation: [0, 0, 0], // sun at the center
    scale: 5,
    program: program,
    parent: solarSystem,
    attributes: {
      a_position: sphere.position,
      a_color: {
        data: sphere.color,
        optimized: true,
      },
    },
    uniforms: {
      u_colorOffset: [0.6, 0.6, 0, 1], // yellow
      u_colorMult: [0.4, 0.4, 0, 1],
    },
  });

  let earth = ctx.createObject({
    name: "earth",
    //translation: [100, 0, 0], // earth 100 units from the sun
    parent: earthOrbit,
    program: program,
    scale: 2,
    attributes: {
      a_position: sphere.position,
      a_color: {
        data: sphere.color,
        optimized: true,
      },
    },
    uniforms: {
      u_colorOffset: [0.2, 0.5, 0.8, 1], // blue-green
      u_colorMult: [0.8, 0.5, 0.2, 1],
    },
  });

  let moon = ctx.createObject({
    name: "moon",
    //translation: [20, 0, 0], // moon 20 units from the earth
    parent: moonOrbit,
    program: program,
    scale: 0.4,
    attributes: {
      a_position: sphere.position,
      a_color: {
        data: sphere.color,
        optimized: true,
      },
    },
    uniforms: {
      u_colorOffset: [0.6, 0.6, 0.6, 1], // gray
      u_colorMult: [0.1, 0.1, 0.1, 1],
    },
  });

  moon.drawTrail();

  ctx.objectMatrices = (object, i, deltaTime) => {
    deltaTime = deltaTime ?? 1;

    // if (ctx.animated) {
    //   switch (object.name) {
    //     case "cube2":
    //       rotation = [-time, time, 0];
    //     case "sphere":
    //       rotation = [time, time, 0];
    //     case "cone":
    //       rotation = [time, -time, 0];
    //   }
    // }

    let viewProjectionMatrix = ctx.globalMatrices().viewProjectionMatrix;
    if (object.deformation.vertices.length) {
      log.info("    Deformation:", object.deformation.toString());

      object.deformation.vertices.forEach((x) => {
        let vertexNumber = x[0];
        let newVertex = x[1];
        object.attributes.a_position.data[vertexNumber] = newVertex;
      });

      // Rebind a_position Attribute
      object.vertexArray = object.program.setAttributesAndVAO(
        `${object.name} vertexArray`,
        object.attributes,
        object.primitive
      );
    }
    if (object.deformation.components.length) {
      log.info("    Deformation:", object.deformation.toString());

      object.deformation.components.forEach((x) => {
        let vertexNumber = x[0];
        let newVertex = x[1];
        let component = x[2];
        object.attributes.a_position.data[vertexNumber][component] =
          newVertex[component];
        if (x[3]) {
          component = x[3];
          object.attributes.a_position.data[vertexNumber][component] =
            newVertex[component];
        }
      });

      // Rebind a_position Attribute
      object.vertexArray = object.program.setAttributesAndVAO(
        `${object.name} vertexArray`,
        object.attributes,
        object.primitive
      );
    }

    // update the Orbits.
    earthOrbit.yRotate(0.01 * deltaTime);
    moonOrbit.yRotate(0.1 * deltaTime);

    // spin the sun
    sun.yRotate(0.005 * deltaTime);

    // spin the earth
    earth.yRotate(0.5 * deltaTime);

    // spin the moon
    moon.yRotate(-0.5 * deltaTime);

    // Update all world matrices in the scene graph
    ctx.world.updateWorldMatrix();

    let worldMatrix = object.node.worldMatrix;
    let worldInverseMatrix = Mat4.inverse(worldMatrix);
    let worldInverseTransposeMatrix = Mat4.transpose(worldInverseMatrix);
    let worldViewProjectionMatrix = Mat4.multiply(
      viewProjectionMatrix,
      worldMatrix
    );

    return {
      viewProjectionMatrix: viewProjectionMatrix,
      worldMatrix: worldMatrix,
      worldInverseTransposeMatrix: worldInverseTransposeMatrix,
      worldViewProjectionMatrix: worldViewProjectionMatrix,
    };
  };

  ctx.drawFunction = function drawFunction(deltaTime) {
    ctx.objectsToDraw.forEach((object, i) => {
      log.info("Drawing:", object.name);

      // Set Program for Object
      //let programInfo = object.program;
      gl.useProgram(object.program.object);

      // Calculate Matrices
      let objectMatrices = ctx.objectMatrices(object, i, deltaTime);

      // Vertex Array / Attributes
      let vertexArray = object.vertexArray;
      gl.bindVertexArray(vertexArray.object);

      // Uniforms
      object.program.setUniforms(object, {
        //u_matrix: ctx.objectMatrices(object, i, time),
        u_worldViewProjection: objectMatrices.worldViewProjectionMatrix,
        u_worldInverseTranspose: objectMatrices.worldInverseTransposeMatrix,
        u_world: objectMatrices.worldMatrix,
      });
      //this.setUniforms(object.materialUniforms);

      if ("u_texture" in object.uniforms) {
        gl.bindTexture(gl.TEXTURE_2D, object.texture);
      }

      // Draw
      ctx.drawVertices(vertexArray);
    });
  };

  ctx.draw();
  return ctx;
}
//test3D(); //.printObjects();

SceneGraphNode.printTree();
