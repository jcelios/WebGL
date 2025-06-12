import { l, Mat4, WebGLObject } from "../imports.js";

export class Program extends WebGLObject {
  static ID = 0;

  constructor(context, name, ...shaders) {
    super(context);
    Program.ID++;

    shaders = shaders.flat(1);
    shaders = shaders.map((shader) => this.context.shaders[shader].object);

    this.object = this.gl.createProgram();
    this.name = name;
    this.shaders = shaders;
    this.attributes = {};
    this.uniforms = {};

    this.attachShader(shaders);
    this.link();
    this.validate();
    if (!this.linkStatus) {
      console.error("Unable to initialize the shader program:", this.log);
      return;
    }

    this.context.programs[name] = this;
    //shaderProgram.status;
  }
  get shaderObjects() {
    return this.gl.getAttachedShaders(this.object);
  }
  use() {
    this.gl.useProgram(this.object);
  }
  link() {
    this.gl.linkProgram(this.object);
  }
  validate() {
    this.gl.validateProgram(this.object);
  }
  isProgram() {
    this.gl.isProgram(this.object);
  }
  attachShader(...shaders) {
    shaders = shaders.flat(1);
    for (let shader of shaders) {
      this.gl.attachShader(this.object, shader);
    }
  }
  detachShader(...shaders) {
    shaders = shaders.flat(1);

    for (let shader of shaders) {
      this.gl.detachShader(this.object, shader.object);
    }
  }
  parameter(parameter) {
    return this.gl.getProgramParameter(this.object, parameter);
  }
  get log() {
    let log = this.gl.getProgramInfoLog(shaderProgram.object);
    console.log(" Log:", log);
    //return
  }
  createTempAttribute(size, nameGLSL, buffer) {
    let loc = this.gl.getAttribLocation(this.object, nameGLSL);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
    //buffer.bind();
    this.gl.vertexAttribPointer(loc, size, this.gl.FLOAT, false, 0, 0);
    this.gl.enableVertexAttribArray(loc);
  }
  addAttribute(name, nameGLSL, size) {
    let attribute = new Attribute(this.context, this, name, nameGLSL, size);
    this.attributes[name] = attribute;
    return this.attributes[name];
  }
  setAttributeFromBuffer(attribute, buffer) {
    attribute = this.attributes[attribute];
    attribute.setFromBuffer(buffer);
  }
  addUniform(name, nameGLSL) {
    let uniform = new Uniform(this.context, this, name, nameGLSL);
    this.uniforms[name] = uniform;
    return this.uniforms[name];
  }
  setUniformMatrix(uniform, matrix) {
    uniform = this.uniforms[uniform];
    uniform.setMatrix(matrix);
  }
  get status() {
    let gl = this.gl;
    console.log(
      " Flagged for Deletion:",
      "".padStart(0),
      this.parameter(gl.DELETE_STATUS),
      "\n",
      "Link Successful:",
      "".padStart(5),
      this.parameter(gl.LINK_STATUS),
      "\n",
      "Validation Successful:",
      this.parameter(gl.VALIDATE_STATUS),
      "\n",
      "Attached Shaders:",
      "".padStart(4),
      this.parameter(gl.ATTACHED_SHADERS),
      "\n",
      "Active Attributes:",
      "".padStart(3),
      this.parameter(gl.ACTIVE_ATTRIBUTES),
      "\n",
      "Active Uniforms:",
      "".padStart(5),
      this.parameter(gl.ACTIVE_UNIFORMS),
      "\n"
    );
    this.log;

    console.log("Active Attributes:");
    let M = this.parameter(gl.ACTIVE_ATTRIBUTES);
    for (let i = 0; i < M; i++) {
      console.log(gl.getActiveAttrib(this.object, 0));
    }

    console.log("Active Uniforms:");
    let N = this.parameter(gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < N; i++) {
      console.log(gl.getActiveUniform(this.object, 0));
    }

    console.log("Context Attributes:");
    console.log(gl.getContextAttributes());
  }
  get linkStatus() {
    return this.parameter(this.gl.LINK_STATUS);
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

  constructor(context, shaderProgram, name, nameGLSL, size) {
    super(context);
    Attribute.ID++;

    this.shaderProgram = shaderProgram;
    this.name = name;
    this.nameGLSL = nameGLSL;
    this.type = this.gl.FLOAT;
    this.size = size;
  }
  get location() {
    return this.gl.getAttribLocation(this.shaderProgram.object, this.nameGLSL);
  }
  setFromBuffer(buffer) {
    buffer.bind();
    this.gl.vertexAttribPointer(
      this.location,
      this.size,
      this.type,
      false,
      0,
      0
    );
    this.gl.enableVertexAttribArray(this.location);
  }
}

export class Uniform extends WebGLObject {
  static ID = 0;

  constructor(context, shaderProgram, name, nameGLSL) {
    super(context);
    Uniform.ID++;

    this.shaderProgram = shaderProgram;
    this.name = name;
    this.nameGLSL = nameGLSL;
  }
  get location() {
    return this.gl.getUniformLocation(this.shaderProgram.object, this.nameGLSL);
  }
  setMatrix(matrix) {
    this.gl.uniformMatrix4fv(this.location, false, matrix.convert);
  }
}
