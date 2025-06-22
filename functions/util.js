export let l = console.log;
export let indent = (n) => "\u00A0".repeat(2).repeat(n);
export let bind = (a, b) => a[b].bind(a);
export let randomInt = (range) => Math.floor(Math.random() * range);

Object.prototype.print = function () {
  console.log(this);
  return this;
};

Array.prototype.toString = function toString() {
  //l(...this.values());
  let val = this.values();
  return "[" + [...val].join(", ") + "]";
};

export let primitivesMap = (x) => {
  let map = new Map([
    ["points", 'POINTS'],
    ["lines", 'LINES'],
    ["lineStrip", 'LINE_STRIP'],
    ["lineLoop", 'LINE_LOOP'],
    ["triangles", 'TRIANGLES'],
    ["triangleStrip", 'TRIANGLE_STRIP'],
    ["tringleFan", 'TRIANGLE_FAN'],
  ]);
  return map.get(x);
};

export let enumMap = (x) => {
  let map = new Map([
    // https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Constants
    // https://github.com/greggman/twgl.js/blob/main/src/utils.js

    // 0     = ZERO | POINT | NONE | NO_ERROR
    // 1     = ONE | LINES | SYNC_FLUSH_COMMANDS_BIT
    // 2777  = BLEND_EQUATION_RGB | BLEND_EQUATION_RGB
    // 36662 = COPY_READ_BUFFER | COPY_READ_BUFFER_BINDING
    // 36663 = COPY_WRITE_BUFFER | COPY_WRITE_BUFFER_BINDING
    // 36006 = FRAMEBUFFER_BINDING | DRAW_FRAMEBUFFER_BINDING

    ["0", "POINTS"],
    ["1", "LINES"],
    ["2", "LINE_LOOP"],
    ["3", "LINE_STRIP"],
    ["4", "TRIANGLES"],
    ["5", "TRIANGLE_STRIP"],
    ["6", "TRIANGLE_FAN"],
    //
    ["33984", "TEXTURE0"],
    ["35044", "STATIC_DRAW"],
    ["35048", "DYNAMIC_DRAW"],
    ["34962", "ARRAY_BUFFER"],
    ["34963", "ELEMENT_ARRAY_BUFFER"],
    ["35345", "UNIFORM_BUFFER"],
    ["35982", "TRANSFORM_FEEDBACK_BUFFER"],
    ["36386", "TRANSFORM_FEEDBACK"],
    ["35713", "COMPILE_STATUS"],
    ["35714", "LINK_STATUS"],
    ["35715", "VALIDATE_STATUS"],
    ["35632", "FRAGMENT_SHADER"],
    ["35633", "VERTEX_SHADER"],
    ["35981", "SEPARATE_ATTRIBS"],
    ["35718", "ACTIVE_UNIFORMS"],
    ["35721", "ACTIVE_ATTRIBUTES"],
    ["35971", "TRANSFORM_FEEDBACK_VARYINGS"],
    ["35382", "ACTIVE_UNIFORM_BLOCKS"],
    ["34660", "BUFFER_SIZE"],
    ["35396", "UNIFORM_BLOCK_REFERENCED_BY_VERTEX_SHADER"],
    ["35398", "UNIFORM_BLOCK_REFERENCED_BY_FRAGMENT_SHADER"],
    ["35392", "UNIFORM_BLOCK_DATA_SIZE"],
    ["35395", "UNIFORM_BLOCK_ACTIVE_UNIFORM_INDICES"],
    // Returned from getError
    //["0", "NO_ERROR"],
    ["1280", "INVALID_ENUM"],
    ["1281", "INVALID_VALUE"],
    ["1282", "INVALID_OPERATION"],
    ["1285", "OUT_OF_MEMORY"],
    ["37442", "CONTEXT_LOST_WEBGL"],
    //
    ["5120", "BYTE"],
    ["5121", "UNSIGNED_BYTE"],
    ["5122", "SHORT"],
    //
    ["5126", "FLOAT"],
    ["35664", "FLOAT_VEC2"],
    ["35665", "FLOAT_VEC3"],
    ["35666", "FLOAT_VEC4"],
    //
    ["5124", "INT"],
    ["35667", "INT_VEC2"],
    ["35668", "INT_VEC3"],
    ["35669", "INT_VEC4"],
    //
    ["5125", "UNSIGNED_INT"],
    ["36294", "UNSIGNED_INT_VEC2"],
    ["36295", "UNSIGNED_INT_VEC3"],
    ["36296", "UNSIGNED_INT_VEC4"],
    //
    ["35670", "BOOL"],
    ["35671", "BOOL_VEC2"],
    ["35672", "BOOL_VEC3"],
    ["35673", "BOOL_VEC4"],
    //
    ["35674", "FLOAT_MAT2"],
    ["35675", "FLOAT_MAT3"],
    ["35676", "FLOAT_MAT4"],
    //
    ["35685", "FLOAT_MAT2x3"],
    ["35686", "FLOAT_MAT2x4"],
    ["35687", "FLOAT_MAT3x2"],
    ["35688", "FLOAT_MAT3x4"],
    ["35689", "FLOAT_MAT4x2"],
    ["35690", "FLOAT_MAT4x3"],
    //
    ["35678", "SAMPLER_2D"],
    ["35680", "SAMPLER_CUBE"],
    ["35679", "SAMPLER_3D"],
    ["35682", "SAMPLER_2D_SHADOW"],
    ["36289", "SAMPLER_2D_ARRAY"],
    ["36292", "SAMPLER_2D_ARRAY_SHADOW"],
    ["36293", "SAMPLER_CUBE_SHADOW"],
    //
    ["36298", "INT_SAMPLER_2D"],
    ["36299", "INT_SAMPLER_3D"],
    ["36300", "INT_SAMPLER_CUBE"],
    ["36303", "INT_SAMPLER_2D_ARRAY"],
    //
    ["36306", "UNSIGNED_INT_SAMPLER_2D"],
    ["36307", "UNSIGNED_INT_SAMPLER_3D"],
    ["36308", "UNSIGNED_INT_SAMPLER_CUBE"],
    ["36311", "UNSIGNED_INT_SAMPLER_2D_ARRAY"],
    //
    ["3553", "TEXTURE_2D"],
    ["34067", "TEXTURE_CUBE_MAP"],
    ["32879", "TEXTURE_3D"],
    ["35866", "TEXTURE_2D_ARRAY"],
  ]);
  return map.get(x.toString());
};

export let sRGB = (color) => {
  if (!Array.isArray(color)) {
    if (color == "transparent") return [0, 0, 0, 0];
    else return namedColor(color).concat(1);
  } else return color;
};

export function namedColor(color) {
  function toBase10(NonBase10Number, oldBase) {
    let fromNumeral = (numeral) =>
      "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz".indexOf(
        numeral
      );

    let string = String(NonBase10Number);
    if (oldBase <= 36) string = string.toUpperCase();
    let intPart = string.split(".")[0];
    let fracPart = string.split(".")[1];
    let numInt = 0;
    for (let i = 0; i < intPart.length; i++) {
      let digit = fromNumeral(intPart[i]);
      numInt += digit * oldBase ** (intPart.length - 1 - i);
    }
    let numFrac = 0;
    if (fracPart) {
      for (let i = 0; i < fracPart.length; i++) {
        let digit = fromNumeral(fracPart[i]);
        numFrac += digit * (1 / oldBase) ** (fracPart.length - i);
      }
    }
    return numInt + numFrac;
  }
  let hex2sRGB = (s) => {
    return [
      toBase10(s.slice(0, 2), 16) / 255,
      toBase10(s.slice(2, 4), 16) / 255,
      toBase10(s.slice(4, 7), 16) / 255,
    ];
  };
  let HTMLNamedColors = [
    ["black", "000000"],
    ["silver", "c0c0c0"],
    ["gray", "808080"],
    ["white", "ffffff"],
    ["maroon", "800000"],
    ["red", "ff0000"],
    ["purple", "800080"],
    ["fuchsia", "ff00ff"],
    ["green", "008000"],
    ["lime", "00ff00"],
    ["olive", "808000"],
    ["yellow", "ffff00"],
    ["navy", "000080"],
    ["blue", "0000ff"],
    ["teal", "008080"],
    ["aqua", "00ffff"],
    ["aliceblue", "f0f8ff"],
    ["antiquewhite", "faebd7"],
    ["aqua", "00ffff"],
    ["aquamarine", "7fffd4"],
    ["azure", "f0ffff"],
    ["beige", "f5f5dc"],
    ["bisque", "ffe4c4"],
    ["black", "000000"],
    ["blanchedalmond", "ffebcd"],
    ["blue", "0000ff"],
    ["blueviolet", "8a2be2"],
    ["brown", "a52a2a"],
    ["burlywood", "deb887"],
    ["cadetblue", "5f9ea0"],
    ["chartreuse", "7fff00"],
    ["chocolate", "d2691e"],
    ["coral", "ff7f50"],
    ["cornflowerblue", "6495ed"],
    ["cornsilk", "fff8dc"],
    ["crimson", "dc143c"],
    ["cyan", "00ffff"],
    ["darkblue", "00008b"],
    ["darkcyan", "008b8b"],
    ["darkgoldenrod", "b8860b"],
    ["darkgray", "a9a9a9"],
    ["darkgreen", "006400"],
    ["darkgrey", "a9a9a9"],
    ["darkkhaki", "bdb76b"],
    ["darkmagenta", "8b008b"],
    ["darkolivegreen", "556b2f"],
    ["darkorange", "ff8c00"],
    ["darkorchid", "9932cc"],
    ["darkred", "8b0000"],
    ["darksalmon", "e9967a"],
    ["darkseagreen", "8fbc8f"],
    ["darkslateblue", "483d8b"],
    ["darkslategray", "2f4f4f"],
    ["darkslategrey", "2f4f4f"],
    ["darkturquoise", "00ced1"],
    ["darkviolet", "9400d3"],
    ["deeppink", "ff1493"],
    ["deepskyblue", "00bfff"],
    ["dimgray", "696969"],
    ["dimgrey", "696969"],
    ["dodgerblue", "1e90ff"],
    ["firebrick", "b22222"],
    ["floralwhite", "fffaf0"],
    ["forestgreen", "228b22"],
    ["fuchsia", "ff00ff"],
    ["gainsboro", "dcdcdc"],
    ["ghostwhite", "f8f8ff"],
    ["gold", "ffd700"],
    ["goldenrod", "daa520"],
    ["gray", "808080"],
    ["green", "008000"],
    ["greenyellow", "adff2f"],
    ["grey", "808080"],
    ["honeydew", "f0fff0"],
    ["hotpink", "ff69b4"],
    ["indianred", "cd5c5c"],
    ["indigo", "4b0082"],
    ["ivory", "fffff0"],
    ["khaki", "f0e68c"],
    ["lavender", "e6e6fa"],
    ["lavenderblush", "fff0f5"],
    ["lawngreen", "7cfc00"],
    ["lemonchiffon", "fffacd"],
    ["lightblue", "add8e6"],
    ["lightcoral", "f08080"],
    ["lightcyan", "e0ffff"],
    ["lightgoldenrodyellow", "fafad2"],
    ["lightgray", "d3d3d3"],
    ["lightgreen", "90ee90"],
    ["lightgrey", "d3d3d3"],
    ["lightpink", "ffb6c1"],
    ["lightsalmon", "ffa07a"],
    ["lightseagreen", "20b2aa"],
    ["lightskyblue", "87cefa"],
    ["lightslategray", "778899"],
    ["lightslategrey", "778899"],
    ["lightsteelblue", "b0c4de"],
    ["lightyellow", "ffffe0"],
    ["lime", "00ff00"],
    ["limegreen", "32cd32"],
    ["linen", "faf0e6"],
    ["magenta", "ff00ff"],
    ["maroon", "800000"],
    ["mediumaquamarine", "66cdaa"],
    ["mediumblue", "0000cd"],
    ["mediumorchid", "ba55d3"],
    ["mediumpurple", "9370db"],
    ["mediumseagreen", "3cb371"],
    ["mediumslateblue", "7b68ee"],
    ["mediumspringgreen", "00fa9a"],
    ["mediumturquoise", "48d1cc"],
    ["mediumvioletred", "c71585"],
    ["midnightblue", "191970"],
    ["mintcream", "f5fffa"],
    ["mistyrose", "ffe4e1"],
    ["moccasin", "ffe4b5"],
    ["navajowhite", "ffdead"],
    ["navy", "000080"],
    ["oldlace", "fdf5e6"],
    ["olive", "808000"],
    ["olivedrab", "6b8e23"],
    ["orange", "ffa500"],
    ["orangered", "ff4500"],
    ["orchid", "da70d6"],
    ["palegoldenrod", "eee8aa"],
    ["palegreen", "98fb98"],
    ["paleturquoise", "afeeee"],
    ["palevioletred", "db7093"],
    ["papayawhip", "ffefd5"],
    ["peachpuff", "ffdab9"],
    ["peru", "cd853f"],
    ["pink", "ffc0cb"],
    ["plum", "dda0dd"],
    ["powderblue", "b0e0e6"],
    ["purple", "800080"],
    ["rebeccapurple", "663399"],
    ["red", "ff0000"],
    ["rosybrown", "bc8f8f"],
    ["royalblue", "4169e1"],
    ["saddlebrown", "8b4513"],
    ["salmon", "fa8072"],
    ["sandybrown", "f4a460"],
    ["seagreen", "2e8b57"],
    ["seashell", "fff5ee"],
    ["sienna", "a0522d"],
    ["silver", "c0c0c0"],
    ["skyblue", "87ceeb"],
    ["slateblue", "6a5acd"],
    ["slategray", "708090"],
    ["slategrey", "708090"],
    ["snow", "fffafa"],
    ["springgreen", "00ff7f"],
    ["steelblue", "4682b4"],
    ["tan", "d2b48c"],
    ["teal", "008080"],
    ["thistle", "d8bfd8"],
    ["tomato", "ff6347"],
    ["turquoise", "40e0d0"],
    ["violet", "ee82ee"],
    ["wheat", "f5deb3"],
    ["white", "ffffff"],
    ["whitesmoke", "f5f5f5"],
    ["yellow", "ffff00"],
    ["yellowgreen", "9acd32"],
  ];
  HTMLNamedColors = HTMLNamedColors.map((x) => [x[0], hex2sRGB(x[1])]);
  let NamedColors = new Map(HTMLNamedColors);
  if (typeof color == "string" && NamedColors.has(color))
    color = NamedColors.get(color);
  return color;
}

export function radToDeg(r) {
  return (r * 180) / Math.PI;
}

export function degToRad(d) {
  return (d * Math.PI) / 180;
}
