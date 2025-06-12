import { l, Buffer, Shader, Program } from "../imports.js";

export class WebGLObject {
  static ID = 0;

  constructor(context) {
    WebGLObject.ID++;
    this.context = context;
    this.gl = context.gl;
  }
}

export class Context {
  // WebGLRenderingContext
  static ID = 0;

  constructor(canvas) {
    Context.ID++;

    if (canvas) this.canvas = canvas;
    else this.canvas = document.querySelector("canvas");

    this.gl = this.canvas.getContext("webgl2");
    this.height = this.gl.drawingBufferHeight;
    this.width = this.gl.drawingBufferWidth;
    this.backgroundColor = document.body.style.backgroundColor;
    this.colorSpace = this.gl.drawingBufferColorSpace;
    this.format = this.gl.drawingBufferFormat;
    this.enums = this.gl.__proto__;

    this.buffers = {};
    this.shaders = {};
    this.programs = {};
  }

  createBuffer(name, type, data) {
    return new Buffer(this, name, type, data);
  }
  createTempBuffer(data) {
    //l(this);
    let buff = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buff);
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      new Float32Array(data),
      this.gl.STATIC_DRAW
    );
    return buff;
  }
  createShader(name, type, source) {
    return new Shader(this, name, type, source);
  }
  createProgram(name, ...shaders) {
    shaders = shaders.flat(1);
    return new Program(this, name, shaders);
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
