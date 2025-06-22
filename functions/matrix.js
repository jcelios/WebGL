import { l } from "/imports.js";

// https://webgl2fundamentals.org/webgl/resources/m4.js
// https://webgl2fundamentals.org/webgl/resources/m3.js

export class Vec3 {
  static add(a, b) {
    let A = new Array(3);
    A[0] = a[0] + b[0];
    A[1] = a[1] + b[1];
    A[2] = a[2] + b[2];
    return A;
  }
  static scalarMultiply(s, a) {
    let A = new Array(3);
    A[0] = s * a[0];
    A[1] = s * a[1];
    A[2] = s * a[2];
    return A;
  }
  static subtract(a, b) {
    let A = new Array(3);
    A[0] = a[0] - b[0];
    A[1] = a[1] - b[1];
    A[2] = a[2] - b[2];
    return A;
  }
  static cross(a, b) {
    let A = new Array(3);
    A[0] = a[1] * b[2] - a[2] * b[1];
    A[1] = a[2] * b[0] - a[0] * b[2];
    A[2] = a[0] * b[1] - a[1] * b[0];
    return A;
  }
  static dot(a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }
  static normalize(a) {
    let length = Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2]);
    // make sure we don't divide by 0.
    if (length > 0.00001) {
      a[0] /= length;
      a[1] /= length;
      a[2] /= length;
    }
    return a;
  }
}

export class Vec4 {
  static add(a, b) {
    a[0] += b[0];
    a[1] += b[1];
    a[2] += b[2];
    a[3] += b[3];
    return a;
  }
  static subtract(a, b) {
    a[0] -= b[0];
    a[1] -= b[1];
    a[2] -= b[2];
    a[3] -= b[3];
    return a;
  }
  static dot(a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
  }
  static normalize(a) {
    let length = Math.sqrt(
      a[0] * a[0] + a[1] * a[1] + a[2] * a[2] + a[3] * a[3]
    );
    // make sure we don't divide by 0.
    if (length > 0.00001) {
      a[0] /= length;
      a[1] /= length;
      a[2] /= length;
      a[3] /= length;
    }
    return a;
  }
}

export class Mat3 {
  // [1, 0, 0],
  // [0, 1, 0],
  // [x, y, 1]

  // [0, 1, 2],
  // [3, 4, 5],
  // [6, 7, 8]

  static identity() {
    return [1, 0, 0, 0, 1, 0, 0, 0, 1];
  }

  static projection(width, height) {
    let A = new Array(9);
    // Note: This matrix flips the Y axis so 0 is at the top.

    A[0] = 2 / width;
    A[1] = 0;
    A[2] = 0;
    A[3] = 0;
    A[4] = -2 / height;
    A[5] = 0;
    A[6] = -1;
    A[7] = 1;
    A[8] = 1;

    return A;
  }

  static multiply(a, b) {
    let A = new Array(9);

    let a00 = a[0 * 3 + 0];
    let a01 = a[0 * 3 + 1];
    let a02 = a[0 * 3 + 2];
    let a10 = a[1 * 3 + 0];
    let a11 = a[1 * 3 + 1];
    let a12 = a[1 * 3 + 2];
    let a20 = a[2 * 3 + 0];
    let a21 = a[2 * 3 + 1];
    let a22 = a[2 * 3 + 2];
    let b00 = b[0 * 3 + 0];
    let b01 = b[0 * 3 + 1];
    let b02 = b[0 * 3 + 2];
    let b10 = b[1 * 3 + 0];
    let b11 = b[1 * 3 + 1];
    let b12 = b[1 * 3 + 2];
    let b20 = b[2 * 3 + 0];
    let b21 = b[2 * 3 + 1];
    let b22 = b[2 * 3 + 2];

    A[0] = b00 * a00 + b01 * a10 + b02 * a20;
    A[1] = b00 * a01 + b01 * a11 + b02 * a21;
    A[2] = b00 * a02 + b01 * a12 + b02 * a22;
    A[3] = b10 * a00 + b11 * a10 + b12 * a20;
    A[4] = b10 * a01 + b11 * a11 + b12 * a21;
    A[5] = b10 * a02 + b11 * a12 + b12 * a22;
    A[6] = b20 * a00 + b21 * a10 + b22 * a20;
    A[7] = b20 * a01 + b21 * a11 + b22 * a21;
    A[8] = b20 * a02 + b21 * a12 + b22 * a22;

    return A;
  }

  static rotation(angleInRadians) {
    let c = Math.cos(angleInRadians);
    let s = Math.sin(angleInRadians);

    let A = new Array(9);

    A[0] = c;
    A[1] = -s;
    A[2] = 0;
    A[3] = s;
    A[4] = c;
    A[5] = 0;
    A[6] = 0;
    A[7] = 0;
    A[8] = 1;

    return A;
  }

  static rotate(A, angleInRadians) {
    return Mat3.multiply(A, Mat3.rotation(angleInRadians));
  }

  static translation(tx, ty) {
    /**
     * Creates a 2D translation matrix
     * @param {number} tx amount to translate in x
     * @param {number} ty amount to translate in y
     * @param {module:webgl-2d-math.Matrix4} [dst] optional matrix to store result
     * @return {module:webgl-2d-math.Matrix3} a translation matrix that translates by tx and ty.
     * @memberOf module:webgl-2d-math
     */
    let A = new Array(9);

    A[0] = 1;
    A[1] = 0;
    A[2] = 0;
    A[3] = 0;
    A[4] = 1;
    A[5] = 0;
    A[6] = tx;
    A[7] = ty;
    A[8] = 1;

    return A;
  }

  static translate(m, tx, ty) {
    /**
     * Multiplies by a 2D translation matrix
     * @param {module:webgl-2d-math.Matrix3} the matrix to be multiplied
     * @param {number} tx amount to translate in x
     * @param {number} ty amount to translate in y
     * @param {module:webgl-2d-math.Matrix4} [dst] optional matrix to store result
     * @return {module:webgl-2d-math.Matrix3} the result
     * @memberOf module:webgl-2d-math
     */
    return Mat3.multiply(m, Mat3.translation(tx, ty));
  }

  // static translate(A, tx, ty) {
  //   A[6] += tx;
  //   A[7] += ty;
  //   return A;
  // }

  static scaling(sx, sy) {
    /**
     * Creates a 2D scaling matrix
     * @param {number} sx amount to scale in x
     * @param {number} sy amount to scale in y
     * @param {module:webgl-2d-math.Matrix4} [dst] optional matrix to store result
     * @return {module:webgl-2d-math.Matrix3} a scale matrix that scales by sx and sy.
     * @memberOf module:webgl-2d-math
     */

    let A = new Array(9);

    A[0] = sx;
    A[1] = 0;
    A[2] = 0;
    A[3] = 0;
    A[4] = sy;
    A[5] = 0;
    A[6] = 0;
    A[7] = 0;
    A[8] = 1;

    return A;
  }

  static scale(m, sx, sy) {
    /**
     * Multiplies by a 2D scaling matrix
     * @param {module:webgl-2d-math.Matrix3} the matrix to be multiplied
     * @param {number} sx amount to scale in x
     * @param {number} sy amount to scale in y
     * @param {module:webgl-2d-math.Matrix4} [dst] optional matrix to store result
     * @return {module:webgl-2d-math.Matrix3} the result
     * @memberOf module:webgl-2d-math
     */
    return Mat3.multiply(m, Mat3.scaling(sx, sy));
  }

  // static scale(A, sx, sy) {
  //   A[0] *= sx;
  //   A[4] *= sy;
  //   return A;
  // }
}

export class Mat4 {
  // [1, 0, 0, 0],
  // [0, 1, 0, 0],
  // [0, 0, 1, 0],
  // [x, y, z, 1]

  // [ 0,  1,  2,  3],
  // [ 4,  5,  6,  7],
  // [ 8,  9, 10, 11],
  // [12, 13, 14, 15]

  static identity() {
    return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
  }

  static projection(width, height, depth) {
    // Special Case of the Orthographic Matrix.
    // Note: This matrix flips the Y axis so 0 is at the top.

    // projection(width, height, depth) =
    //  orthographic(0, clientWidth, clientHeight, 0, 200, 200);

    //  2/width,  0,          0,        0,
    //  0,        2/height,  0,        0,
    //  0,        0,          2/depth,  0,
    // -1,        1,          0,        1,

    let A = [
      2 / width,
      0,
      0,
      0,
      0,
      2 / height,
      0,
      0,
      0,
      0,
      2 / depth,
      0,
      1,
      1,
      0,
      1,
    ];

    return A;
  }

  static perspective(fieldOfViewInRadians, aspect, near, far) {
    // Computes a 4-by-4 perspective transformation matrix given the angular height of the frustum, the aspect ratio, and the near and far clipping planes.
    // The arguments define a frustum extending in the negative z direction.
    // The given angle is the vertical angle of the frustum, and the horizontal angle is determined to produce the given aspect ratio.
    // The arguments near and far are the distances to the near and far clipping planes.
    // Note that near and far are not z coordinates, but rather they are distances along the negative z-axis.

    // The matrix generated sends the viewing frustum to the unit box.

    // We assume a unit box extending from -1 to 1 in the x and y dimensions and from -1 to 1 in the z dimension.

    // f/aspect,  0,  0,                          0,
    // 0,         f,  0,                          0,
    // 0,         0,  (near + far) * rangeInv,   -1,
    // 0,         0,  near * far * rangeInv * 2,  0,

    /**
     * @param {number} fieldOfViewInRadians field of view in y axis.
     * @param {number} aspect aspect of viewport (width / height)
     * @param {number} near near Z clipping plane
     * @param {number} far far Z clipping plane
     * @return {Matrix4} a new matrix
     */

    let A = new Array(16);

    // let FOV = (fov) => (fov * Math.PI) / 180;

    // let fieldOfViewInRadians = FOV(fieldOfViewInDegrees);

    let f = Math.tan(Math.PI * 0.5 - 0.5 * fieldOfViewInRadians);
    let rangeInv = 1.0 / (near - far);

    A[0] = f / aspect;
    A[1] = 0;
    A[2] = 0;
    A[3] = 0;
    A[4] = 0;
    A[5] = f;
    A[6] = 0;
    A[7] = 0;
    A[8] = 0;
    A[9] = 0;
    A[10] = (near + far) * rangeInv;
    A[11] = -1;
    A[12] = 0;
    A[13] = 0;
    A[14] = near * far * rangeInv * 2;
    A[15] = 0;

    return A;
  }

  static orthographic(left, right, bottom, top, near, far) {
    // Computes a 4-by-4 orthographic projection matrix given the coordinates of the planes defining the axis-aligned, box-shaped viewing volume.

    // The matrix generated sends that box to the unit box.

    // Note that although left and right are x coordinates and bottom and top are y coordinates, near and far are not z coordinates, but rather they are distances along the negative z-axis.
    // We assume a unit box extending from -1 to 1 in the x and y dimensions and from -1 to 1 in the z dimension.

    // 2/(r - l),        0,                0,                0,
    // 0,                2/(t - b),        0,                0,
    // 0,                0,                2/(n - f),        0,
    // (l + r)/(l - r),  (b + t)/(b - t),  (n + f)/(n - f),  1,

    /**
     * @param {number} left The x coordinate of the left plane of the box.
     * @param {number} right The x coordinate of the right plane of the box.
     * @param {number} bottom The y coordinate of the bottom plane of the box.
     * @param {number} top The y coordinate of the right plane of the box.
     * @param {number} near The negative z coordinate of the near plane of the box.
     * @param {number} far The negative z coordinate of the far plane of the box.
     * @return {Matrix4} a new matrix
     */

    let A = new Array(16);

    A[0] = 2 / (right - left);
    A[1] = 0;
    A[2] = 0;
    A[3] = 0;
    A[4] = 0;
    A[5] = 2 / (top - bottom);
    A[6] = 0;
    A[7] = 0;
    A[8] = 0;
    A[9] = 0;
    A[10] = 2 / (near - far);
    A[11] = 0;
    A[12] = (left + right) / (left - right);
    A[13] = (bottom + top) / (bottom - top);
    A[14] = (near + far) / (near - far);
    A[15] = 1;

    return A;
  }

  static frustum(left, right, bottom, top, near, far) {
    // Computes a 4-by-4 perspective transformation matrix given the left, right, top, bottom, near and far clipping planes.
    // The arguments define a frustum extending in the negative z direction.
    // The arguments near and far are the distances to the near and far clipping planes.
    // Note that near and far are not z coordinates, but rather they are distances along the negative z-axis.

    // The matrix generated sends the viewing frustum to the unit box.

    // We assume a unit box extending from -1 to 1 in the x and y dimensions and from -1 to 1 in the z dimension.

    /**
     * @param {number} left The x coordinate of the left plane of the box.
     * @param {number} right The x coordinate of the right plane of the box.
     * @param {number} bottom The y coordinate of the bottom plane of the box.
     * @param {number} top The y coordinate of the right plane of the box.
     * @param {number} near The negative z coordinate of the near plane of the box.
     * @param {number} far The negative z coordinate of the far plane of the box.
     * @return {Matrix4} a new matrix
     */

    let A = new Array(16);

    let dx = right - left;
    let dy = top - bottom;
    let dz = far - near;

    A[0] = (2 * near) / dx;
    A[1] = 0;
    A[2] = 0;
    A[3] = 0;
    A[4] = 0;
    A[5] = (2 * near) / dy;
    A[6] = 0;
    A[7] = 0;
    A[8] = (left + right) / dx;
    A[9] = (top + bottom) / dy;
    A[10] = -(far + near) / dz;
    A[11] = -1;
    A[12] = 0;
    A[13] = 0;
    A[14] = (-2 * near * far) / dz;
    A[15] = 0;

    return A;
  }

  static lookAt(cameraPosition, target, up) {
    // Creates a lookAt matrix.
    // This is a world matrix for a camera.
    // In other words it will transform from the origin to a place and orientation in the world.
    // For a view matrix take the inverse of this.

    /**
     * @param {Vector3} cameraPosition position of the camera
     * @param {Vector3} target position of the target
     * @param {Vector3} up direction
     * @return {Matrix4} a new matrix
     */

    let A = new Array(16);

    let zAxis = Vec3.normalize(Vec3.subtract(cameraPosition, target));
    let xAxis = Vec3.normalize(Vec3.cross(up, zAxis));
    let yAxis = Vec3.normalize(Vec3.cross(zAxis, xAxis));

    A[0] = xAxis[0];
    A[1] = xAxis[1];
    A[2] = xAxis[2];
    A[3] = 0;
    A[4] = yAxis[0];
    A[5] = yAxis[1];
    A[6] = yAxis[2];
    A[7] = 0;
    A[8] = zAxis[0];
    A[9] = zAxis[1];
    A[10] = zAxis[2];
    A[11] = 0;
    A[12] = cameraPosition[0];
    A[13] = cameraPosition[1];
    A[14] = cameraPosition[2];
    A[15] = 1;

    return A;
  }

  static inverse(a) {
    let A = new Array(16);
    let m00 = a[0 * 4 + 0];
    let m01 = a[0 * 4 + 1];
    let m02 = a[0 * 4 + 2];
    let m03 = a[0 * 4 + 3];
    let m10 = a[1 * 4 + 0];
    let m11 = a[1 * 4 + 1];
    let m12 = a[1 * 4 + 2];
    let m13 = a[1 * 4 + 3];
    let m20 = a[2 * 4 + 0];
    let m21 = a[2 * 4 + 1];
    let m22 = a[2 * 4 + 2];
    let m23 = a[2 * 4 + 3];
    let m30 = a[3 * 4 + 0];
    let m31 = a[3 * 4 + 1];
    let m32 = a[3 * 4 + 2];
    let m33 = a[3 * 4 + 3];
    let tmp_0 = m22 * m33;
    let tmp_1 = m32 * m23;
    let tmp_2 = m12 * m33;
    let tmp_3 = m32 * m13;
    let tmp_4 = m12 * m23;
    let tmp_5 = m22 * m13;
    let tmp_6 = m02 * m33;
    let tmp_7 = m32 * m03;
    let tmp_8 = m02 * m23;
    let tmp_9 = m22 * m03;
    let tmp_10 = m02 * m13;
    let tmp_11 = m12 * m03;
    let tmp_12 = m20 * m31;
    let tmp_13 = m30 * m21;
    let tmp_14 = m10 * m31;
    let tmp_15 = m30 * m11;
    let tmp_16 = m10 * m21;
    let tmp_17 = m20 * m11;
    let tmp_18 = m00 * m31;
    let tmp_19 = m30 * m01;
    let tmp_20 = m00 * m21;
    let tmp_21 = m20 * m01;
    let tmp_22 = m00 * m11;
    let tmp_23 = m10 * m01;

    let t0 =
      tmp_0 * m11 +
      tmp_3 * m21 +
      tmp_4 * m31 -
      (tmp_1 * m11 + tmp_2 * m21 + tmp_5 * m31);
    let t1 =
      tmp_1 * m01 +
      tmp_6 * m21 +
      tmp_9 * m31 -
      (tmp_0 * m01 + tmp_7 * m21 + tmp_8 * m31);
    let t2 =
      tmp_2 * m01 +
      tmp_7 * m11 +
      tmp_10 * m31 -
      (tmp_3 * m01 + tmp_6 * m11 + tmp_11 * m31);
    let t3 =
      tmp_5 * m01 +
      tmp_8 * m11 +
      tmp_11 * m21 -
      (tmp_4 * m01 + tmp_9 * m11 + tmp_10 * m21);

    let d = 1.0 / (m00 * t0 + m10 * t1 + m20 * t2 + m30 * t3);

    A[0] = d * t0;
    A[1] = d * t1;
    A[2] = d * t2;
    A[3] = d * t3;
    A[4] =
      d *
      (tmp_1 * m10 +
        tmp_2 * m20 +
        tmp_5 * m30 -
        (tmp_0 * m10 + tmp_3 * m20 + tmp_4 * m30));
    A[5] =
      d *
      (tmp_0 * m00 +
        tmp_7 * m20 +
        tmp_8 * m30 -
        (tmp_1 * m00 + tmp_6 * m20 + tmp_9 * m30));
    A[6] =
      d *
      (tmp_3 * m00 +
        tmp_6 * m10 +
        tmp_11 * m30 -
        (tmp_2 * m00 + tmp_7 * m10 + tmp_10 * m30));
    A[7] =
      d *
      (tmp_4 * m00 +
        tmp_9 * m10 +
        tmp_10 * m20 -
        (tmp_5 * m00 + tmp_8 * m10 + tmp_11 * m20));
    A[8] =
      d *
      (tmp_12 * m13 +
        tmp_15 * m23 +
        tmp_16 * m33 -
        (tmp_13 * m13 + tmp_14 * m23 + tmp_17 * m33));
    A[9] =
      d *
      (tmp_13 * m03 +
        tmp_18 * m23 +
        tmp_21 * m33 -
        (tmp_12 * m03 + tmp_19 * m23 + tmp_20 * m33));
    A[10] =
      d *
      (tmp_14 * m03 +
        tmp_19 * m13 +
        tmp_22 * m33 -
        (tmp_15 * m03 + tmp_18 * m13 + tmp_23 * m33));
    A[11] =
      d *
      (tmp_17 * m03 +
        tmp_20 * m13 +
        tmp_23 * m23 -
        (tmp_16 * m03 + tmp_21 * m13 + tmp_22 * m23));
    A[12] =
      d *
      (tmp_14 * m22 +
        tmp_17 * m32 +
        tmp_13 * m12 -
        (tmp_16 * m32 + tmp_12 * m12 + tmp_15 * m22));
    A[13] =
      d *
      (tmp_20 * m32 +
        tmp_12 * m02 +
        tmp_19 * m22 -
        (tmp_18 * m22 + tmp_21 * m32 + tmp_13 * m02));
    A[14] =
      d *
      (tmp_18 * m12 +
        tmp_23 * m32 +
        tmp_15 * m02 -
        (tmp_22 * m32 + tmp_14 * m02 + tmp_19 * m12));
    A[15] =
      d *
      (tmp_22 * m22 +
        tmp_16 * m02 +
        tmp_21 * m12 -
        (tmp_20 * m12 + tmp_23 * m22 + tmp_17 * m02));

    return A;
  }

  static multiply(a, b) {
    //Takes two 4-by-4 matrices, a and b, and computes the product in the order that pre-composes b with a.
    // In other words, the matrix returned will transform by b first and then a.
    // Note this is subtly different from just multiplying the matrices together.
    // For given a and b, this function returns the same object in both row-major and column-major mode.

    /**
     * @param {Matrix4} a A matrix.
     * @param {Matrix4} b A matrix.
     * @param {Matrix4} [dst] optional matrix to store result
     * @return {Matrix4} dst or a new matrix if none provided
     */

    let A = new Array(16);

    let b00 = b[0 * 4 + 0];
    let b01 = b[0 * 4 + 1];
    let b02 = b[0 * 4 + 2];
    let b03 = b[0 * 4 + 3];
    let b10 = b[1 * 4 + 0];
    let b11 = b[1 * 4 + 1];
    let b12 = b[1 * 4 + 2];
    let b13 = b[1 * 4 + 3];
    let b20 = b[2 * 4 + 0];
    let b21 = b[2 * 4 + 1];
    let b22 = b[2 * 4 + 2];
    let b23 = b[2 * 4 + 3];
    let b30 = b[3 * 4 + 0];
    let b31 = b[3 * 4 + 1];
    let b32 = b[3 * 4 + 2];
    let b33 = b[3 * 4 + 3];

    let a00 = a[0 * 4 + 0];
    let a01 = a[0 * 4 + 1];
    let a02 = a[0 * 4 + 2];
    let a03 = a[0 * 4 + 3];
    let a10 = a[1 * 4 + 0];
    let a11 = a[1 * 4 + 1];
    let a12 = a[1 * 4 + 2];
    let a13 = a[1 * 4 + 3];
    let a20 = a[2 * 4 + 0];
    let a21 = a[2 * 4 + 1];
    let a22 = a[2 * 4 + 2];
    let a23 = a[2 * 4 + 3];
    let a30 = a[3 * 4 + 0];
    let a31 = a[3 * 4 + 1];
    let a32 = a[3 * 4 + 2];
    let a33 = a[3 * 4 + 3];

    A[0] = b00 * a00 + b01 * a10 + b02 * a20 + b03 * a30;
    A[1] = b00 * a01 + b01 * a11 + b02 * a21 + b03 * a31;
    A[2] = b00 * a02 + b01 * a12 + b02 * a22 + b03 * a32;
    A[3] = b00 * a03 + b01 * a13 + b02 * a23 + b03 * a33;
    A[4] = b10 * a00 + b11 * a10 + b12 * a20 + b13 * a30;
    A[5] = b10 * a01 + b11 * a11 + b12 * a21 + b13 * a31;
    A[6] = b10 * a02 + b11 * a12 + b12 * a22 + b13 * a32;
    A[7] = b10 * a03 + b11 * a13 + b12 * a23 + b13 * a33;
    A[8] = b20 * a00 + b21 * a10 + b22 * a20 + b23 * a30;
    A[9] = b20 * a01 + b21 * a11 + b22 * a21 + b23 * a31;
    A[10] = b20 * a02 + b21 * a12 + b22 * a22 + b23 * a32;
    A[11] = b20 * a03 + b21 * a13 + b22 * a23 + b23 * a33;
    A[12] = b30 * a00 + b31 * a10 + b32 * a20 + b33 * a30;
    A[13] = b30 * a01 + b31 * a11 + b32 * a21 + b33 * a31;
    A[14] = b30 * a02 + b31 * a12 + b32 * a22 + b33 * a32;
    A[15] = b30 * a03 + b31 * a13 + b32 * a23 + b33 * a33;

    return A;
  }

  static xRotation(angleInRadians) {
    let c = Math.cos(angleInRadians);
    let s = Math.sin(angleInRadians);

    return [1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1];
  }

  static yRotation(angleInRadians) {
    let c = Math.cos(angleInRadians);
    let s = Math.sin(angleInRadians);

    return [c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1];
  }

  static zRotation(angleInRadians) {
    let c = Math.cos(angleInRadians);
    let s = Math.sin(angleInRadians);

    return [c, s, 0, 0, -s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
  }

  static xRotate(m, angleInRadians) {
    return Mat4.multiply(m, Mat4.xRotation(angleInRadians));
  }

  static yRotate(m, angleInRadians) {
    return Mat4.multiply(m, Mat4.yRotation(angleInRadians));
  }

  static zRotate(m, angleInRadians) {
    return Mat4.multiply(m, Mat4.zRotation(angleInRadians));
  }

  // static xRotate(A, θ) {
  //   return Mat4.rotate(A, θ, 1, 0, 0);
  // }
  // static yRotate(A, θ) {
  //   return Mat4.rotate(A, θ, 0, 1, 0);
  // }
  // static zRotate(A, θ) {
  //   return Mat4.rotate(A, θ, 0, 0, 1);
  // }
  // static rotate(A, θ, x, y, z) {
  //   θ = (θ * Math.PI) / 180;
  //   let sin = Math.sin;
  //   let cos = Math.cos;
  //   let absR = Math.hypot(x, y, z);
  //   let rot = [
  //     x ** 2 + (y ** 2 + z ** 2) * cos(θ),
  //     x * y - x * y * cos(θ) - absR * z * sin(θ),
  //     x * z - x * z * cos(θ) + absR * y * sin(θ),
  //     0,
  //     x * y - x * y * cos(θ) + absR * z * sin(θ),
  //     y ** 2 + (x ** 2 + z ** 2) * cos(θ),
  //     y * z - y * z * cos(θ) - absR * x * sin(θ),
  //     0,
  //     x * z - x * z * cos(θ) - absR * y * sin(θ),
  //     y * z - y * z * cos(θ) + absR * x * sin(θ),
  //     z ** 2 + (x ** 2 + y ** 2) * cos(θ),
  //     0,
  //     0,
  //     0,
  //     0,
  //     1,
  //   ];
  //   return Mat4.multiply(A, rot);
  // }

  static translation(tx, ty, tz) {
    /**
     * Makes a translation matrix
     * @param {number} tx x translation.
     * @param {number} ty y translation.
     * @param {number} tz z translation.
     * @param {Matrix4} [dst] optional matrix to store result
     * @return {Matrix4} dst or a new matrix if none provided
     * @memberOf module:webgl-3d-math
     */
    let A = new Array(16);

    A[0] = 1;
    A[1] = 0;
    A[2] = 0;
    A[3] = 0;
    A[4] = 0;
    A[5] = 1;
    A[6] = 0;
    A[7] = 0;
    A[8] = 0;
    A[9] = 0;
    A[10] = 1;
    A[11] = 0;
    A[12] = tx;
    A[13] = ty;
    A[14] = tz;
    A[15] = 1;

    return A;
  }

  static translate(m, tx, ty, tz) {
    /**
     * Multiply by translation matrix.
     * @param {Matrix4} m matrix to multiply
     * @param {number} tx x translation.
     * @param {number} ty y translation.
     * @param {number} tz z translation.
     * @param {Matrix4} [dst] optional matrix to store result
     * @return {Matrix4} dst or a new matrix if none provided
     * @memberOf module:webgl-3d-math
     */

    // This is the optimized version of
    // return multiply(m, translation(tx, ty, tz), dst);
    let A = new Array(16);

    let m00 = m[0];
    let m01 = m[1];
    let m02 = m[2];
    let m03 = m[3];
    let m10 = m[1 * 4 + 0];
    let m11 = m[1 * 4 + 1];
    let m12 = m[1 * 4 + 2];
    let m13 = m[1 * 4 + 3];
    let m20 = m[2 * 4 + 0];
    let m21 = m[2 * 4 + 1];
    let m22 = m[2 * 4 + 2];
    let m23 = m[2 * 4 + 3];
    let m30 = m[3 * 4 + 0];
    let m31 = m[3 * 4 + 1];
    let m32 = m[3 * 4 + 2];
    let m33 = m[3 * 4 + 3];

    if (m !== A) {
      A[0] = m00;
      A[1] = m01;
      A[2] = m02;
      A[3] = m03;
      A[4] = m10;
      A[5] = m11;
      A[6] = m12;
      A[7] = m13;
      A[8] = m20;
      A[9] = m21;
      A[10] = m22;
      A[11] = m23;
    }

    A[12] = m00 * tx + m10 * ty + m20 * tz + m30;
    A[13] = m01 * tx + m11 * ty + m21 * tz + m31;
    A[14] = m02 * tx + m12 * ty + m22 * tz + m32;
    A[15] = m03 * tx + m13 * ty + m23 * tz + m33;

    return A;
  }

  static scaling(sx, sy, sz) {
    /**
     * Makes a scale matrix
     * @param {number} sx x scale.
     * @param {number} sy y scale.
     * @param {number} sz z scale.
     * @param {Matrix4} [dst] optional matrix to store result
     * @return {Matrix4} dst or a new matrix if none provided
     * @memberOf module:webgl-3d-math
     */

    let A = new Array(16);

    A[0] = sx;
    A[1] = 0;
    A[2] = 0;
    A[3] = 0;
    A[4] = 0;
    A[5] = sy;
    A[6] = 0;
    A[7] = 0;
    A[8] = 0;
    A[9] = 0;
    A[10] = sz;
    A[11] = 0;
    A[12] = 0;
    A[13] = 0;
    A[14] = 0;
    A[15] = 1;

    return A;
  }

  static scale(m, sx, sy, sz) {
    /**
     * Multiply by a scaling matrix
     * @param {Matrix4} m matrix to multiply
     * @param {number} sx x scale.
     * @param {number} sy y scale.
     * @param {number} sz z scale.
     * @param {Matrix4} [dst] optional matrix to store result
     * @return {Matrix4} dst or a new matrix if none provided
     * @memberOf module:webgl-3d-math
     */

    // This is the optimized version of
    // return multiply(m, scaling(sx, sy, sz), dst);
    let A = new Array(16);

    A[0] = sx * m[0 * 4 + 0];
    A[1] = sx * m[0 * 4 + 1];
    A[2] = sx * m[0 * 4 + 2];
    A[3] = sx * m[0 * 4 + 3];
    A[4] = sy * m[1 * 4 + 0];
    A[5] = sy * m[1 * 4 + 1];
    A[6] = sy * m[1 * 4 + 2];
    A[7] = sy * m[1 * 4 + 3];
    A[8] = sz * m[2 * 4 + 0];
    A[9] = sz * m[2 * 4 + 1];
    A[10] = sz * m[2 * 4 + 2];
    A[11] = sz * m[2 * 4 + 3];

    if (m !== A) {
      A[12] = m[12];
      A[13] = m[13];
      A[14] = m[14];
      A[15] = m[15];
    }

    return A;
  }

  // static translate(A, tx, ty, tz) {
  //   A[12] += tx;
  //   A[13] += ty;
  //   A[14] += tz;
  //   return A;
  // }
  // static scale(A, sx, sy, sz) {
  //   A[0] *= sx;
  //   A[5] *= sy;
  //   A[10] *= sz;
  //   return A;
  // }

  static transpose(a) {
    let A = new Array(16);

    A[0] = a[0];
    A[1] = a[4];
    A[2] = a[8];
    A[3] = a[12];
    A[4] = a[1];
    A[5] = a[5];
    A[6] = a[9];
    A[7] = a[13];
    A[8] = a[2];
    A[9] = a[6];
    A[10] = a[10];
    A[11] = a[14];
    A[12] = a[3];
    A[13] = a[7];
    A[14] = a[11];
    A[15] = a[15];

    return A;
  }

  static transformVector(m, v) {
    /**
     * Takes a  matrix and a vector with 4 entries, transforms that vector by
     * the matrix, and returns the result as a vector with 4 entries.
     * @param {Matrix4} m The matrix.
     * @param {Vector4} v The point in homogenous coordinates.
     * @return {Vector4} new Vector4
     */
    let a = new Array(4);
    for (let i = 0; i < 4; ++i) {
      a[i] = 0.0;
      for (let j = 0; j < 4; ++j) {
        a[i] += v[j] * m[j * 4 + i];
      }
    }
    return a;
  }

  static transformPoint(m, v) {
    /**
     * Takes a 4-by-4 matrix and a vector with 3 entries,
     * interprets the vector as a point, transforms that point by the matrix, and
     * returns the result as a vector with 3 entries.
     * @param {Matrix4} m The matrix.
     * @param {Vector3} v The point.
     * @param {Vector4} dst optional vector4 to store result
     * @return {Vector4} dst or new Vector4 if not provided
     * @memberOf module:webgl-3d-math
     */

    let dst = new Array(3);

    let v0 = v[0];
    let v1 = v[1];
    let v2 = v[2];
    let d =
      v0 * m[0 * 4 + 3] + v1 * m[1 * 4 + 3] + v2 * m[2 * 4 + 3] + m[3 * 4 + 3];

    dst[0] =
      (v0 * m[0 * 4 + 0] +
        v1 * m[1 * 4 + 0] +
        v2 * m[2 * 4 + 0] +
        m[3 * 4 + 0]) /
      d;
    dst[1] =
      (v0 * m[0 * 4 + 1] +
        v1 * m[1 * 4 + 1] +
        v2 * m[2 * 4 + 1] +
        m[3 * 4 + 1]) /
      d;
    dst[2] =
      (v0 * m[0 * 4 + 2] +
        v1 * m[1 * 4 + 2] +
        v2 * m[2 * 4 + 2] +
        m[3 * 4 + 2]) /
      d;

    return dst;
  }

  static transformDirection(m, v) {
    /**
     * Takes a 4-by-4 matrix and a vector with 3 entries, interprets the vector as a
     * direction, transforms that direction by the matrix, and returns the result;
     * assumes the transformation of 3-dimensional space represented by the matrix
     * is parallel-preserving, i.e. any combination of rotation, scaling and
     * translation, but not a perspective distortion. Returns a vector with 3
     * entries.
     * @param {Matrix4} m The matrix.
     * @param {Vector3} v The direction.
     * @param {Vector4} dst optional vector4 to store result
     * @return {Vector4} dst or new Vector4 if not provided
     * @memberOf module:webgl-3d-math
     */

    let dst = new Array(3);

    let v0 = v[0];
    let v1 = v[1];
    let v2 = v[2];

    dst[0] = v0 * m[0 * 4 + 0] + v1 * m[1 * 4 + 0] + v2 * m[2 * 4 + 0];
    dst[1] = v0 * m[0 * 4 + 1] + v1 * m[1 * 4 + 1] + v2 * m[2 * 4 + 1];
    dst[2] = v0 * m[0 * 4 + 2] + v1 * m[1 * 4 + 2] + v2 * m[2 * 4 + 2];

    return dst;
  }

  static transformNormal(m, v) {
    /**
     * Takes a 4-by-4 matrix m and a vector v with 3 entries, interprets the vector
     * as a normal to a surface, and computes a vector which is normal upon
     * transforming that surface by the matrix. The effect of this function is the
     * same as transforming v (as a direction) by the inverse-transpose of m.  This
     * function assumes the transformation of 3-dimensional space represented by the
     * matrix is parallel-preserving, i.e. any combination of rotation, scaling and
     * translation, but not a perspective distortion.  Returns a vector with 3
     * entries.
     * @param {Matrix4} m The matrix.
     * @param {Vector3} v The normal.
     * @param {Vector3} [dst] The direction.
     * @return {Vector3} The transformed direction.
     * @memberOf module:webgl-3d-math
     */

    let dst = new Array(3);

    let mi = inverse(m);
    let v0 = v[0];
    let v1 = v[1];
    let v2 = v[2];

    dst[0] = v0 * mi[0 * 4 + 0] + v1 * mi[0 * 4 + 1] + v2 * mi[0 * 4 + 2];
    dst[1] = v0 * mi[1 * 4 + 0] + v1 * mi[1 * 4 + 1] + v2 * mi[1 * 4 + 2];
    dst[2] = v0 * mi[2 * 4 + 0] + v1 * mi[2 * 4 + 1] + v2 * mi[2 * 4 + 2];

    return dst;
  }

  static copy(src, dst) {
    dst = dst || new Array(16);

    dst[0] = src[0];
    dst[1] = src[1];
    dst[2] = src[2];
    dst[3] = src[3];
    dst[4] = src[4];
    dst[5] = src[5];
    dst[6] = src[6];
    dst[7] = src[7];
    dst[8] = src[8];
    dst[9] = src[9];
    dst[10] = src[10];
    dst[11] = src[11];
    dst[12] = src[12];
    dst[13] = src[13];
    dst[14] = src[14];
    dst[15] = src[15];

    return dst;
  }
}
