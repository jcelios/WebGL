import { l, WebGLObject } from "../imports.js";

export class Buffer extends WebGLObject {

  static ID = 0;

  constructor(context, name, type, data) {
    super(context);

    Buffer.ID++;
    

    this.object = this.gl.createBuffer();
    this.name = name;
    this.type = this.gl[type];
    this.data = data;

    this.bind();
    this.setData(data);
    this.context.buffers[name] = this;
  }
  setData(data) {
    let usage = this.gl.STATIC_DRAW;
    let typedData;
    if (!Array.isArray(data)) typedData = data;
    else typedData = new Float32Array(data);
    this.gl.bufferData(this.type, typedData, usage);
    this.data = data;
  }
  updateData(offset, newData) {
    this.gl.bufferSubData(this.type, offset, newData);
  }
  isBuffer() {
    return this.gl.isBuffer(this.object);
  }
  bind(type = this.type) {
    this.gl.bindBuffer(type, this.object);
  }
  parameter(parameter) {
    return this.gl.getBufferParameter(this.object, parameter);
  }
}
