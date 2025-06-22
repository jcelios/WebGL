import { l, Mat4 } from "../imports.js";

export function createCubeVertices(size) {
  /**
   * Creates the vertices and indices for a cube.
   *
   * The cube is created around the origin. (-size / 2, size / 2).
   *
   * @param {number} [size] width, height and depth of the cube.
   * @return {Object.<string, TypedArray>} The created vertices.
   * @memberOf module:twgl/primitives
   */

  size = size || 1;
  let k = size / 2;

  let CUBE_FACE_INDICES = [
    /**
     * Array of the indices of corners of each face of a cube.
     * @type {Array.<number[]>}
     * @private
     */
    [3, 7, 5, 1], // right
    [6, 2, 0, 4], // left
    [6, 7, 3, 2], // ??
    [0, 1, 5, 4], // ??
    [7, 6, 4, 5], // front
    [2, 3, 1, 0], // back
  ];

  let cornerVertices = [
    [-k, -k, -k],
    [+k, -k, -k],
    [-k, +k, -k],
    [+k, +k, -k],
    [-k, -k, +k],
    [+k, -k, +k],
    [-k, +k, +k],
    [+k, +k, +k],
  ];

  let faceNormals = [
    [+1, +0, +0],
    [-1, +0, +0],
    [+0, +1, +0],
    [+0, -1, +0],
    [+0, +0, +1],
    [+0, +0, -1],
  ];

  let uvCoords = [
    [1, 0],
    [0, 0],
    [0, 1],
    [1, 1],
  ];

  //let numVertices = 6 * 4;
  let positions = []; //new Array(3 * numVertices);
  let normals = []; //new Array(3 * numVertices);
  let texcoords = []; //new Array(2 * numVertices);
  let indices = []; //new Array(3 * 6 * 2);

  for (let f = 0; f < 6; ++f) {
    let faceIndices = CUBE_FACE_INDICES[f];
    for (let v = 0; v < 4; ++v) {
      let position = cornerVertices[faceIndices[v]];
      let normal = faceNormals[f];
      let uv = uvCoords[v];

      // Each face needs all four vertices because the normals and texture
      // coordinates are not all the same.
      positions.push(position);
      normals.push(normal);
      texcoords.push(uv);
    }
    // Two triangles make a square face.
    let offset = 4 * f;
    indices.push(offset + 0, offset + 1, offset + 2);
    indices.push(offset + 0, offset + 2, offset + 3);
  }

  return {
    position: positions.flat(Infinity),
    normal: normals.flat(Infinity),
    texcoord: texcoords.flat(Infinity),
    indices: indices.flat(Infinity),
  };
}

export function createSphereVertices(
  radius,
  subdivisionsAxis,
  subdivisionsHeight,
  opt_startLatitudeInRadians,
  opt_endLatitudeInRadians,
  opt_startLongitudeInRadians,
  opt_endLongitudeInRadians
) {
  /**
   * Creates sphere vertices.
   *
   * The created sphere has position, normal, and texcoord data
   *
   * @param {number} radius radius of the sphere.
   * @param {number} subdivisionsAxis number of steps around the sphere.
   * @param {number} subdivisionsHeight number of vertically on the sphere.
   * @param {number} [opt_startLatitudeInRadians] where to start the
   *     top of the sphere. Default = 0.
   * @param {number} [opt_endLatitudeInRadians] Where to end the
   *     bottom of the sphere. Default = Math.PI.
   * @param {number} [opt_startLongitudeInRadians] where to start
   *     wrapping the sphere. Default = 0.
   * @param {number} [opt_endLongitudeInRadians] where to end
   *     wrapping the sphere. Default = 2 * Math.PI.
   * @return {Object.<string, TypedArray>} The created sphere vertices.
   */

  if (subdivisionsAxis <= 0 || subdivisionsHeight <= 0) {
    throw new Error("subdivisionAxis and subdivisionHeight must be > 0");
  }

  opt_startLatitudeInRadians = opt_startLatitudeInRadians || 0;
  opt_endLatitudeInRadians = opt_endLatitudeInRadians || Math.PI;
  opt_startLongitudeInRadians = opt_startLongitudeInRadians || 0;
  opt_endLongitudeInRadians = opt_endLongitudeInRadians || Math.PI * 2;

  let latRange = opt_endLatitudeInRadians - opt_startLatitudeInRadians;
  let longRange = opt_endLongitudeInRadians - opt_startLongitudeInRadians;

  // We are going to generate our sphere by iterating through its
  // spherical coordinates and generating 2 triangles for each quad on a
  // ring of the sphere.
  //let numVertices = (subdivisionsAxis + 1) * (subdivisionsHeight + 1);
  let positions = []; //new Array(3 * numVertices);
  let normals = []; //new Array(3 * numVertices);
  let texcoords = []; //new Array(2 * numVertices);

  // Generate the individual vertices in our vertex buffer.
  for (let y = 0; y <= subdivisionsHeight; y++) {
    for (let x = 0; x <= subdivisionsAxis; x++) {
      // Generate a vertex based on its spherical coordinates
      let u = x / subdivisionsAxis;
      let v = y / subdivisionsHeight;
      let theta = longRange * u + opt_startLongitudeInRadians;
      let phi = latRange * v + opt_startLatitudeInRadians;
      let sinTheta = Math.sin(theta);
      let cosTheta = Math.cos(theta);
      let sinPhi = Math.sin(phi);
      let cosPhi = Math.cos(phi);
      let ux = cosTheta * sinPhi;
      let uy = cosPhi;
      let uz = sinTheta * sinPhi;
      positions.push(radius * ux, radius * uy, radius * uz);
      normals.push(ux, uy, uz);
      texcoords.push(1 - u, v);
    }
  }

  let numVertsAround = subdivisionsAxis + 1;
  let indices = new Array(3 * subdivisionsAxis * subdivisionsHeight * 2);
  for (let x = 0; x < subdivisionsAxis; x++) {
    // eslint-disable-line
    for (let y = 0; y < subdivisionsHeight; y++) {
      // eslint-disable-line
      // Make triangle 1 of quad.
      indices.push(
        (y + 0) * numVertsAround + x,
        (y + 0) * numVertsAround + x + 1,
        (y + 1) * numVertsAround + x
      );

      // Make triangle 2 of quad.
      indices.push(
        (y + 1) * numVertsAround + x,
        (y + 0) * numVertsAround + x + 1,
        (y + 1) * numVertsAround + x + 1
      );
    }
  }

  //l("positions:", positions);
  return {
    position: positions.flat(Infinity),
    normal: normals.flat(Infinity),
    texcoord: texcoords.flat(Infinity),
    indices: indices.flat(Infinity),
  };
}

export function createTruncatedConeVertices(
  bottomRadius,
  topRadius,
  height,
  radialSubdivisions,
  verticalSubdivisions,
  opt_topCap,
  opt_bottomCap
) {
  if (radialSubdivisions < 3) {
    throw new Error("radialSubdivisions must be 3 or greater");
  }

  if (verticalSubdivisions < 1) {
    throw new Error("verticalSubdivisions must be 1 or greater");
  }

  let topCap = opt_topCap === undefined ? true : opt_topCap;
  let bottomCap = opt_bottomCap === undefined ? true : opt_bottomCap;

  let extra = (topCap ? 2 : 0) + (bottomCap ? 2 : 0);

  //let numVertices = (radialSubdivisions + 1) * (verticalSubdivisions + 1 + extra);
  let positions = []; //new Array(3 * numVertices);
  let normals = []; //new Array(3 * numVertices);
  let texcoords = []; //new Array(2 * numVertices);
  let indices = []; //new Array(3 * radialSubdivisions * (verticalSubdivisions + extra / 2) * 2);

  let vertsAroundEdge = radialSubdivisions + 1;

  // The slant of the cone is constant across its surface
  let slant = Math.atan2(bottomRadius - topRadius, height);
  let cosSlant = Math.cos(slant);
  let sinSlant = Math.sin(slant);

  let start = topCap ? -2 : 0;
  let end = verticalSubdivisions + (bottomCap ? 2 : 0);

  for (let yy = start; yy <= end; ++yy) {
    let v = yy / verticalSubdivisions;
    let y = height * v;
    let ringRadius;
    if (yy < 0) {
      y = 0;
      v = 1;
      ringRadius = bottomRadius;
    } else if (yy > verticalSubdivisions) {
      y = height;
      v = 1;
      ringRadius = topRadius;
    } else {
      ringRadius =
        bottomRadius + (topRadius - bottomRadius) * (yy / verticalSubdivisions);
    }
    if (yy === -2 || yy === verticalSubdivisions + 2) {
      ringRadius = 0;
      v = 0;
    }
    y -= height / 2;
    for (let i = 0; i < vertsAroundEdge; ++i) {
      let sin = Math.sin((i * Math.PI * 2) / radialSubdivisions);
      let cos = Math.cos((i * Math.PI * 2) / radialSubdivisions);
      positions.push(sin * ringRadius, y, cos * ringRadius);
      if (yy < 0) {
        normals.push(0, -1, 0);
      } else if (yy > verticalSubdivisions) {
        normals.push(0, 1, 0);
      } else if (ringRadius === 0.0) {
        normals.push(0, 0, 0);
      } else {
        normals.push(sin * cosSlant, sinSlant, cos * cosSlant);
      }
      texcoords.push(i / radialSubdivisions, 1 - v);
    }
  }

  for (let yy = 0; yy < verticalSubdivisions + extra; ++yy) {
    // eslint-disable-line
    if (
      (yy === 1 && topCap) ||
      (yy === verticalSubdivisions + extra - 2 && bottomCap)
    ) {
      continue;
    }
    for (let i = 0; i < radialSubdivisions; ++i) {
      // eslint-disable-line
      indices.push(
        vertsAroundEdge * (yy + 0) + 0 + i,
        vertsAroundEdge * (yy + 0) + 1 + i,
        vertsAroundEdge * (yy + 1) + 1 + i
      );
      indices.push(
        vertsAroundEdge * (yy + 0) + 0 + i,
        vertsAroundEdge * (yy + 1) + 1 + i,
        vertsAroundEdge * (yy + 1) + 0 + i
      );
    }
  }

  return {
    position: positions.flat(Infinity),
    normal: normals.flat(Infinity),
    texcoord: texcoords.flat(Infinity),
    indices: indices.flat(Infinity),
  };
}

function allButIndices(name) {
  return name !== "indices";
}

function deindexVertices(vertices) {
  let indices = vertices.indices;
  let newVertices = {};
  let numElements = indices.length;

  function expandToUnindexed(channel) {
    let srcBuffer = vertices[channel];
    let numComponents = 3; //srcBuffer.numComponents;
    let dstBuffer = new Array(numComponents * numElements);
    for (let i = 0; i < numElements; ++i) {
      let ndx = indices[i];
      let offset = ndx * numComponents;
      for (let jj = 0; jj < numComponents; ++jj) {
        dstBuffer.push(srcBuffer[offset + jj]);
      }
    }
    newVertices[channel] = dstBuffer;
  }

  Object.keys(vertices).filter(allButIndices).forEach(expandToUnindexed);

  return newVertices;
}

function makeRandomVertexColors(vertices, options) {
  options = options || {};
  let numElements = vertices.position.length / 3;
  let vColors = new Array(4 * numElements);
  let rand =
    options.rand ||
    function (ndx, channel) {
      return channel < 3 ? randInt(256) : 255;
    };
  vertices.color = vColors;
  if (vertices.indices) {
    // just make random colors if index
    for (let i = 0; i < numElements; ++i) {
      vColors.push(rand(i, 0), rand(i, 1), rand(i, 2), rand(i, 3));
    }
  } else {
    // make random colors per triangle
    let numVertsPerColor = options.vertsPerColor || 3;
    let numSets = numElements / numVertsPerColor;
    for (let i = 0; i < numSets; ++i) {
      // eslint-disable-line
      let color = [rand(i, 0), rand(i, 1), rand(i, 2), rand(i, 3)];
      for (let jj = 0; jj < numVertsPerColor; ++jj) {
        vColors.push(color);
      }
    }
  }
  return vertices;
}

// this function takes a set of indexed vertices
// It deindexed them. It then adds random vertex
// colors to each triangle. Finally it passes
// the result to createBufferInfoFromArrays and
// returns a twgl.BufferInfo
function createFlattenedVertices(gl, vertices, vertsPerColor) {
  let last;
  // return twgl.createBufferInfoFromArrays(
  //   gl,
  return makeRandomVertexColors(deindexVertices(vertices), {
    vertsPerColor: vertsPerColor || 1,
    rand: function (ndx, channel) {
      if (channel === 0) {
        last = (128 + Math.random() * 128) | 0;
      }
      return channel < 3 ? last : 255;
    },
  });
  //   );
}

function createFlattenedFunc(createVerticesFunc, vertsPerColor) {
  return function (gl) {
    let arrays = createVerticesFunc.apply(
      null,
      Array.prototype.slice.call(arguments, 1)
    );
    return createFlattenedVertices(gl, arrays, vertsPerColor);
  };
}

// These functions make primitives with semi-random vertex colors.
// This means the primitives can be displayed without needing lighting
// which is important to keep the samples simple.

export let flattenedPrimitives = {
  //create3DFBufferInfo: createFlattenedFunc(create3DFVertices, 6),
  createCubeBufferInfo: createFlattenedFunc(createCubeVertices, 6),
  //createPlaneBufferInfo: createFlattenedFunc(createPlaneVertices, 6),
  createSphereBufferInfo: createFlattenedFunc(createSphereVertices, 6),
  createTruncatedConeBufferInfo: createFlattenedFunc(
    createTruncatedConeVertices,
    6
  ),
  // createXYQuadBufferInfo: createFlattenedFunc(
  //   twgl.primitives.createXYQuadVertices,
  //   6
  // ),
  // createCresentBufferInfo: createFlattenedFunc(
  //   twgl.primitives.createCresentVertices,
  //   6
  // ),
  // createCylinderBufferInfo: createFlattenedFunc(
  //   twgl.primitives.createCylinderVertices,
  //   6
  // ),
  // createTorusBufferInfo: createFlattenedFunc(
  //   twgl.primitives.createTorusVertices,
  //   6
  // ),
  // createDiscBufferInfo: createFlattenedFunc(
  //   twgl.primitives.createDiscVertices,
  //   4
  // ),
};

export function reorientVertices(arrays, matrix) {
  /**
   * Reorients arrays by the given matrix. Assumes arrays have
   * names that contains 'pos' could be reoriented as positions,
   * 'binorm' or 'tan' as directions, and 'norm' as normals.
   *
   * @param {Object.<string, NativeArrayOrTypedArray>} arrays The vertices to reorient
   * @param {module:twgl/Mat4.Mat4} matrix matrix to reorient by.
   * @return {Object.<string, NativeArrayOrTypedArray>} same arrays that were passed in.
   * @memberOf module:twgl/primitives
   */
  Object.keys(arrays).forEach(function (name) {
    const array = arrays[name];
    if (name.indexOf("pos") >= 0) {
      reorientPositions(array, matrix);
    } else if (name.indexOf("tan") >= 0 || name.indexOf("binorm") >= 0) {
      reorientDirections(array, matrix);
    } else if (name.indexOf("norm") >= 0) {
      reorientNormals(array, matrix);
    }
  });
  return arrays;
}

function reorientPositions(array, matrix) {
  /**
   * Reorients positions by the given matrix. In other words, it
   * multiplies each vertex by the given matrix.
   * @param {(number[]|TypedArray)} array The array. Assumes value floats per element.
   * @param {module:twgl/Mat4.Mat4} matrix A matrix to multiply by.
   * @return {(number[]|TypedArray)} the same array that was passed in
   * @memberOf module:twgl/primitives
   */
  applyFuncToV3Array(array, matrix, Mat4.transformPoint);
  return array;
}

function reorientNormals(array, matrix) {
  /**
   * Reorients normals by the inverse-transpose of the given
   * matrix..
   * @param {(number[]|TypedArray)} array The array. Assumes value floats per element.
   * @param {module:twgl/Mat4.Mat4} matrix A matrix to multiply by.
   * @return {(number[]|TypedArray)} the same array that was passed in
   * @memberOf module:twgl/primitives
   */
  applyFuncToV3Array(array, Mat4.inverse(matrix), transformNormal);
  return array;
}

function reorientDirections(array, matrix) {
  /**
   * Reorients directions by the given matrix..
   * @param {(number[]|TypedArray)} array The array. Assumes value floats per element.
   * @param {module:twgl/Mat4.Mat4} matrix A matrix to multiply by.
   * @return {(number[]|TypedArray)} the same array that was passed in
   * @memberOf module:twgl/primitives
   */
  applyFuncToV3Array(array, matrix, Mat4.transformDirection);
  return array;
}

function flattenNormals(vertices) {
  /**
   * flattens the normals of deindexed vertices in place.
   * @param {Object.<string, TypedArray>} vertices The deindexed vertices who's normals to flatten
   * @return {Object.<string, TypedArray>} The flattened vertices (same as was passed in)
   * @memberOf module:twgl/primitives
   */
  if (vertices.indices) {
    throw new Error(
      "can not flatten normals of indexed vertices. deindex them first"
    );
  }

  const normals = vertices.normal;
  const numNormals = normals.length;
  for (let ii = 0; ii < numNormals; ii += 9) {
    // pull out the 3 normals for this triangle
    const nax = normals[ii + 0];
    const nay = normals[ii + 1];
    const naz = normals[ii + 2];

    const nbx = normals[ii + 3];
    const nby = normals[ii + 4];
    const nbz = normals[ii + 5];

    const ncx = normals[ii + 6];
    const ncy = normals[ii + 7];
    const ncz = normals[ii + 8];

    // add them
    let nx = nax + nbx + ncx;
    let ny = nay + nby + ncy;
    let nz = naz + nbz + ncz;

    // normalize them
    const length = Math.sqrt(nx * nx + ny * ny + nz * nz);

    nx /= length;
    ny /= length;
    nz /= length;

    // copy them back in
    normals[ii + 0] = nx;
    normals[ii + 1] = ny;
    normals[ii + 2] = nz;

    normals[ii + 3] = nx;
    normals[ii + 4] = ny;
    normals[ii + 5] = nz;

    normals[ii + 6] = nx;
    normals[ii + 7] = ny;
    normals[ii + 8] = nz;
  }

  return vertices;
}

function applyFuncToV3Array(array, matrix, fn) {
  const len = array.length;
  const tmp = new Float32Array(3);
  for (let ii = 0; ii < len; ii += 3) {
    fn(matrix, [array[ii], array[ii + 1], array[ii + 2]], tmp);
    array[ii] = tmp[0];
    array[ii + 1] = tmp[1];
    array[ii + 2] = tmp[2];
  }
}

function transformNormal(mi, v, dst) {
  dst = dst || v3.create();
  const v0 = v[0];
  const v1 = v[1];
  const v2 = v[2];

  dst[0] = v0 * mi[0 * 4 + 0] + v1 * mi[0 * 4 + 1] + v2 * mi[0 * 4 + 2];
  dst[1] = v0 * mi[1 * 4 + 0] + v1 * mi[1 * 4 + 1] + v2 * mi[1 * 4 + 2];
  dst[2] = v0 * mi[2 * 4 + 0] + v1 * mi[2 * 4 + 1] + v2 * mi[2 * 4 + 2];

  return dst;
}

export function concatVertices(arrayOfArrays) {
  /**
   * Concatenates sets of vertices
   *
   * Assumes the vertices match in composition. For example
   * if one set of vertices has positions, normals, and indices
   * all sets of vertices must have positions, normals, and indices
   * and of the same type.
   *
   * Example:
   *
   *      const cubeVertices = twgl.primitives.createCubeVertices(2);
   *      const sphereVertices = twgl.primitives.createSphereVertices(1, 10, 10);
   *      // move the sphere 2 units up
   *      twgl.primitives.reorientVertices(
   *          sphereVertices, twgl.m4.translation([0, 2, 0]));
   *      // merge the sphere with the cube
   *      const cubeSphereVertices = twgl.primitives.concatVertices(
   *          [cubeVertices, sphereVertices]);
   *      // turn them into WebGL buffers and attrib data
   *      const bufferInfo = twgl.createBufferInfoFromArrays(gl, cubeSphereVertices);
   *
   * @param {module:twgl.Arrays[]} arrays Array of arrays of vertices
   * @return {module:twgl.Arrays} The concatenated vertices.
   * @memberOf module:twgl/primitives
   */

  const names = {};
  let baseName;
  // get names of all arrays.
  // and numElements for each set of vertices
  for (let ii = 0; ii < arrayOfArrays.length; ++ii) {
    const arrays = arrayOfArrays[ii];
    Object.keys(arrays).forEach(function (name) {
      // eslint-disable-line
      if (!names[name]) {
        names[name] = [];
      }
      if (!baseName && name !== "indices") {
        baseName = name;
      }
      const arrayInfo = arrays[name];
      const numComponents = getNumComponents(arrayInfo, name);
      const array = getArray(arrayInfo);
      const numElements = array.length / numComponents;
      names[name].push(numElements);
    });
  }

  // compute length of combined array
  // and return one for reference
  function getLengthOfCombinedArrays(name) {
    let length = 0;
    let arraySpec;
    for (let ii = 0; ii < arrayOfArrays.length; ++ii) {
      const arrays = arrayOfArrays[ii];
      const arrayInfo = arrays[name];
      const array = getArray(arrayInfo);
      length += array.length;
      if (!arraySpec || arrayInfo.data) {
        arraySpec = arrayInfo;
      }
    }
    return {
      length: length,
      spec: arraySpec,
    };
  }

  function copyArraysToNewArray(name, base, newArray) {
    let baseIndex = 0;
    let offset = 0;
    for (let ii = 0; ii < arrayOfArrays.length; ++ii) {
      const arrays = arrayOfArrays[ii];
      const arrayInfo = arrays[name];
      const array = getArray(arrayInfo);
      if (name === "indices") {
        copyElements(array, newArray, offset, baseIndex);
        baseIndex += base[ii];
      } else {
        copyElements(array, newArray, offset);
      }
      offset += array.length;
    }
  }

  const base = names[baseName];

  const newArrays = {};
  Object.keys(names).forEach(function (name) {
    const info = getLengthOfCombinedArrays(name);
    const newArraySpec = createArrayOfSameType(info.spec, info.length);
    copyArraysToNewArray(name, base, getArray(newArraySpec));
    newArrays[name] = newArraySpec;
  });
  return newArrays;
}
