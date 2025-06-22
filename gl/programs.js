import {
  l,
  randomInt,
  Mat4,
  enumMap,
  sRGB,
  WebGLObject,
  Context,
  Logger,
  primitivesMap,
} from "../imports.js";

let log = new Logger(Context.debug, import.meta.url);

let typeInfoMap = new Map([
  ["FLOAT", { entries: 1, entryType: "FLOAT", arrayType: Float32Array }],
  ["FLOAT_VEC2", { entries: 2, entryType: "FLOAT", arrayType: Float32Array }],
  ["FLOAT_VEC3", { entries: 3, entryType: "FLOAT", arrayType: Float32Array }],
  ["FLOAT_VEC4", { entries: 4, entryType: "FLOAT", arrayType: Float32Array }],
  ["FLOAT_MAT2", { entries: 4, entryType: "FLOAT", arrayType: Float32Array }],
  ["FLOAT_MAT3", { entries: 9, entryType: "FLOAT", arrayType: Float32Array }],
  ["FLOAT_MAT4", { entries: 16, entryType: "FLOAT", arrayType: Float32Array }],
  //
  ["INT", { entries: 1, entryType: "INT", arrayType: Int32Array }],
  ["INT_VEC2", { entries: 2, entryType: "INT", arrayType: Int32Array }],
  ["INT_VEC3", { entries: 3, entryType: "INT", arrayType: Int32Array }],
  ["INT_VEC4", { entries: 4, entryType: "INT", arrayType: Int32Array }],
  //
  ["UNSIGNED_INT", { entries: 1, entryType: "UINT", arrayType: Uint32Array }],
  [
    "UNSIGNED_INT_VEC2",
    { entries: 2, entryType: "UINT", arrayType: Uint32Array },
  ],
  [
    "UNSIGNED_INT_VEC3",
    { entries: 3, entryType: "UINT", arrayType: Uint32Array },
  ],
  [
    "UNSIGNED_INT_VEC4",
    { entries: 4, entryType: "UINT", arrayType: Uint32Array },
  ],
  //
  ["BOOL", { entries: 1, entryType: "BOOL", arrayType: Uint32Array }],
  ["BOOL_VEC2", { entries: 2, entryType: "BOOL", arrayType: Uint32Array }],
  ["BOOL_VEC3", { entries: 3, entryType: "BOOL", arrayType: Uint32Array }],
  ["BOOL_VEC4", { entries: 4, entryType: "BOOL", arrayType: Uint32Array }],
  //
  ["SAMPLER_2D", { entries: 1, entryType: "INT" }],
  ["SAMPLER_CUBE", { entries: 1, entryType: "INT" }],
  ["SAMPLER_3D", { entries: 1, entryType: "INT" }],
  ["SAMPLER_2D_SHADOW", { entries: 1, entryType: "INT" }],
  ["SAMPLER_2D_ARRAY", { entries: 1, entryType: "INT" }],
  ["SAMPLER_2D_ARRAY_SHADOW", { entries: 1, entryType: "INT" }],
  ["SAMPLER_CUBE_SHADOW", { entries: 1, entryType: "INT" }],
  //
  ["INT_SAMPLER_2D", { size: 0 }],
  ["INT_SAMPLER_3D", { size: 0 }],
  ["INT_SAMPLER_CUBE, { size: 0 }"],
  ["INT_SAMPLER_2D_ARRAY", { size: 0 }],
  //
  ["UNSIGNED_INT_SAMPLER_2D", { size: 0 }],
  ["UNSIGNED_INT_SAMPLER_3D", { size: 0 }],
  ["UNSIGNED_INT_SAMPLER_CUBE", { size: 0 }],
  ["UNSIGNED_INT_SAMPLER_2D_ARRAY", { size: 0 }],
  //
  ["TEXTURE_2D", { size: 0 }],
  ["TEXTURE_CUBE_MAP", { size: 0 }],
  ["TEXTURE_3D", { size: 0 }],
  ["TEXTURE_2D_ARRAY", { size: 0 }],
]);

export class Program extends WebGLObject {
  static ID = 0;

  constructor(context, program) {
    super(context);
    Program.ID++;
    this.ID = Program.ID;
    this.name = this.constructor.name + " #" + this.ID;

    let gl = this.gl;

    this.object = program;

    // this.is2D = false;
    // this.is3D = false;
    // this.context.animated = false;
    // this.time = 0;
    //this.indices = false;

    this.attributes = {};
    this.uniforms = {};

    log.info("Program:", this.name, "Created");

    let numberOfAttributes = gl.getProgramParameter(
      program,
      gl.ACTIVE_ATTRIBUTES
    );
    log.info("  Number of Attributes:", numberOfAttributes);
    for (let i = 0; i < numberOfAttributes; ++i) {
      let info = gl.getActiveAttrib(program, i);
      let name = info.name;
      let type = enumMap(info.type);
      // l(context);
      // l(this.object);
      // l(name);
      // l(type);
      let attribute = new Attribute(context, this.object, name, type);
      this.attributes[name] = attribute;
    }

    let numberOfUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    log.info("  Number of Uniforms:", numberOfUniforms);
    for (let i = 0; i < numberOfUniforms; ++i) {
      let info = gl.getActiveUniform(program, i); //.print();
      let name = info.name;
      let type = enumMap(info.type); //.print();
      let uniform = new Uniform(context, this.object, name, type); //.print();
      this.uniforms[name] = uniform;
    }
  }
  setAttributesAndVAO(name, attributes, primitive) {
    log.warn("  setAttributesAndVAO:", name);
    let gl = this.gl;
    //l(attributes);

    let newVao = {
      name: name,
      object: gl.createVertexArray(),
      primitive: primitive,
      hasIndices: false,
      indices: {},
      attributes: {},
    };
    gl.bindVertexArray(newVao.object);

    for (let attribute of Object.keys(attributes)) {
      //l(attribute);
      if (attribute == "indices") {
        newVao.hasIndices = true;
        newVao["indices"] = {
          name: "indices",
          data: attributes["indices"].data || attributes["indices"],
        };
        continue;
      }
      let attributeInput = attributes[attribute];
      attribute = this.attributes[attribute];
      //l(attribute);
      newVao.attributes[attribute.name] = attribute?.clone();
      attribute = newVao.attributes[attribute.name];
      log.object(attribute);
      attribute.buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, attribute.buffer);
      // Just Setting Data:
      if (Array.isArray(attributeInput) || typeof attributeInput != "object") {
        attribute.data = attributeInput.flat(Infinity);
        gl.bufferData(
          gl.ARRAY_BUFFER,
          new Float32Array(attribute.data),
          gl.STATIC_DRAW
        );
        gl.vertexAttribPointer(
          attribute.location,
          attribute.size,
          gl[attribute.entryType],
          attribute.normalize,
          0,
          0
        );

        //log.info("    Attribute", attribute.name, "set to:", attributeInput);
      }
      // Setting Data & Overriding some Defaults:
      else if (
        typeof attributeInput == "object" &&
        !Array.isArray(attributeInput)
      ) {
        attribute.data = attributeInput.data.flat(Infinity);
        let size = attributeInput.size || attribute.size;
        let type = attributeInput.type || attribute.entryType;
        let normalize = attributeInput.normalize || false;
        let arrayType = attributeInput.arrayType || attribute.arrayType;
        if (attributeInput.optimized) {
          size = 3;
          type = "UNSIGNED_BYTE"; // The data is 8bit unsigned bytes
          normalize = true; // Convert from 0-255 to 0.0-1.0
          arrayType = Uint8Array;
        }
        gl.bufferData(
          gl.ARRAY_BUFFER,
          new arrayType(attribute.data),
          gl.STATIC_DRAW
        );
        log.info(
          attribute.name + ":",
          "location:",
          attribute.location,
          "size:",
          size,
          "arrayType:",
          arrayType.name,
          "type:",
          type,
          "normalize:",
          normalize
        );
        gl.vertexAttribPointer(
          attribute.location,
          size,
          gl[type],
          normalize,
          0,
          0
        );
      }
      gl.enableVertexAttribArray(attribute.location);
      newVao.attributes[attribute.name] = attribute;
      log.info(
        "    Attribute",
        attribute.name,
        "set to:",
        attribute.data.toString()
      );
    }

    if (newVao.hasIndices) {
      let indices = newVao.indices;
      log.info("  Indices Detected:", indices.data?.toString());
      indices.buffer = gl.createBuffer();
      // It’s important to note that unlike the ARRAY_BUFFER binding point which is global state, the ELEMENT_ARRAY_BUFFER binding point is part of the current vertex array.
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indices.buffer);
      gl.bufferData(
        gl.ELEMENT_ARRAY_BUFFER,
        new Uint16Array(indices.data),
        gl.STATIC_DRAW
      );
    }
    gl.bindVertexArray(null);
    log.object("  VertexArrayObject:", newVao);
    return newVao;
  }
  setUniforms(object, uniforms) {
    //l(this.uniforms);
    //l(uniforms);
    for (let uniform of Object.keys(uniforms)) {
      //l(uniform);
      //l(this.uniforms[uniform]);
      if (uniform in object.program.uniforms) {
        //l("test");
        let value = uniforms[uniform] || object.uniforms[uniform];
        //l(uniform);
        this.uniforms[uniform]?.setUniform(value);
      }
    }

    for (let uniform of Object.keys(object.uniforms)) {
      //l(uniform);
      //l(this.uniforms[uniform]);
      if (uniform in object.program.uniforms) {
        //l("test");
        let value = uniforms[uniform] || object.uniforms[uniform];
        //l(uniform);
        this.uniforms[uniform]?.setUniform(value);
      }
    }
  }
  parameter(parameter) {
    return this.gl.getProgramParameter(this.object, parameter);
  }
}

export class Shader extends WebGLObject {
  static ID = 0;

  constructor(context, name, type, source) {
    super(context);
    Shader.ID++;

    this.type = this.gl[type];
    this.object = this.gl.createShader(this.type);
    this.name = name;
    this.source = source;

    this.setSource(source);
    this.compile();
    if (!this.compileStatus) {
      console.error("An error occurred compiling the shaders:", this.log);
      this.delete();
      return;
    }
    this.context.shaders[name] = this;
  }
  setSource(source) {
    this.gl.shaderSource(this.object, source);
    this.source = source;
  }
  getSource() {
    return this.gl.getShaderSource(this.object);
  }
  compile() {
    this.gl.compileShader(this.object);
  }
  isShader() {
    return this.gl.isShader(this.object);
  }
  delete() {
    this.gl.deleteShader(this.object);
  }
  parameter(parameter) {
    return this.gl.getShaderParameter(this.object, parameter);
  }
  get log() {
    return this.gl.getShaderInfoLog(this.object);
  }
  get compileStatus() {
    return this.parameter(this.gl.COMPILE_STATUS);
  }
}

export class Attribute extends WebGLObject {
  static ID = 0;

  constructor(context, program, name, type) {
    super(context);
    Attribute.ID++;

    let gl = this.gl;
    this.program = program;

    this.name = name;
    this.GLSLtype = type;
    this.size = typeInfoMap.get(type).entries;
    this.entryType = typeInfoMap.get(type).entryType;
    this.arrayType = typeInfoMap.get(type).arrayType;
    this.normalize = false;
    this.location = gl.getAttribLocation(program, name);

    if (["posiiton", "a_position"].includes(this.name)) {
      if (this.context.is2D) {
        this.size = 2;
      } else if (this.context.is3D) {
        this.size = 3;
      }
    }

    if (["normal", "a_normal"].includes(this.name)) {
      if (this.context.is2D) {
        this.size = 2;
      } else if (this.context.is3D) {
        this.size = 3;
      }
    }

    if (["texCoord", "a_texCoord"].includes(this.name)) {
      this.size = 2;
      this.normalize = true;
    }

    log.info(
      "    Attribute:",
      this.name + ":",
      this.GLSLtype,
      this.size,
      this.entryType,
      this.arrayType
    );
  }
  clone() {
    return new Attribute(this.context, this.program, this.name, this.GLSLtype);
  }
}

export class Uniform extends WebGLObject {
  static ID = 0;

  constructor(context, program, name, type) {
    super(context);
    Uniform.ID++;

    let gl = this.gl;
    this.program = program;

    this.name = name;
    this.GLSLtype = type;
    this.size = typeInfoMap.get(type).entries;
    this.entryType = typeInfoMap.get(type).entryType;
    this.arrayType = typeInfoMap.get(type).arrayType;
    this.location = gl.getUniformLocation(program, name);
    log.info(
      "    Uniform:",
      this.name + ":",
      this.GLSLtype,
      this.size,
      this.entryType,
      this.arrayType
    );
  }
  setUniform(value) {
    let gl = this.gl;

    //l(this.name, "set to", value);
    //l(this);
    //l(value);
    switch (this.GLSLtype) {
      case "INT":
        gl.uniform1i(this.location, value);
        break;
      case "FLOAT":
        gl.uniform1f(this.location, value);
        break;
      case "FLOAT_VEC2":
        gl.uniform2f(this.location, ...value);
        break;
      case "FLOAT_VEC3":
        gl.uniform3f(this.location, ...value);
        break;
      case "FLOAT_VEC4":
        gl.uniform4f(this.location, ...value);
        break;
      case "FLOAT_MAT3":
        gl.uniformMatrix3fv(this.location, false, new Float32Array(value));
        break;
      case "FLOAT_MAT4":
        //l(value);
        gl.uniformMatrix4fv(this.location, false, new Float32Array(value));
        break;
    }
    log.info("    Uniform", this.name, "set to:", value.toString());
  }
}
