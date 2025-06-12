
export class Vec4 {
  static ID = 0;

  constructor(...array) {
    array = array.flat(1);

    Vec4.ID++;
    this.ID = Vec4.ID;
    this.name = this.constructor.name + " #" + Vec4.ID;

    this.array = array;

    return new Proxy(this, {
      get(target, prop) {
        if (typeof prop === "string" && Number(prop) >= 0)
          return target.array[prop];
        else if (typeof prop === "string" && Number(prop) < 0)
          return target.array[target.array.length + Number(prop)];
        else if (prop === "length") return target.array.length;
        else return target[prop];
      },
      set(target, prop, value) {
        if (typeof prop === "string" && Number(prop) >= 0)
          return (target.array[prop] = value);
        else if (typeof prop === "string" && Number(prop) < 0)
          return (target.array[target.array.length + Number(prop)] = value);
        else return (target[prop] = value);
      },
    });
  }

  dot(v) {
    return this[0] * v[0] + this[1] * v[1] + this[2] * v[2] + this[3] * v[3];
  }
  clone() {
    let clone = new this.constructor(structuredClone(this.array));
    return clone;
  }
  print(options) {
    let type = this.constructor.name;
    let settings = {
      indentN: options?.indentN ?? 0,
      title: options?.title ?? true,
      details: options?.details ?? true,
      padding: options?.padding ?? true,
      numberFormatting: options?.numberFormatting ?? true,
    };

    printMatrix(this, options);

    function printTitle(T, options) {
      let settings = {
        indentN: options?.indentN ?? 0,
        details: options?.details ?? true,
      };
      let indentN = settings.indentN;

      let name1 = T.name.split(" ")[0];

      let name2;
      if (type == "Tensor") name2 = "";
      else if (settings.details) name2 = " " + T.name.split(" ")[1];
      else name2 = "";

      let colon;
      if (settings.details) colon = ":";
      else colon = "";

      let dims = "";

      let total = "";

      console.log(
        `${indent(indentN)}%c${name1}%c%c${name2}%c${colon} %c${dims}${total}`,
        "color:yellow;text-decoration:underline;",
        "",
        "color:yellow;",
        "",
        "color:grey;font-style:italic;"
      );
    }
    function printMatrix(A, options) {
      A = A.clone();

      let settings = {
        indentN: options?.indentN ?? 0,
        title: options?.title ?? true,
        padding: options?.padding ?? true,
        numberFormatting: options?.numberFormatting ?? true,
        highlight: options?.highlight ?? false, // [i, j]
      };
      let indentN = settings.indentN;

      // For Padding Formatting
      if (settings.padding) {
        let arr = A.array.flat(Infinity).map((x) => String(x).length);
        let max = Math.max.apply(null, arr);
        A.array = A.array.map((x, row) =>
          x.map((_, col) => String(A[row][col]).padStart(max, "\u00A0"))
        );
      }

      if (settings.title) {
        printTitle(A, { ...{ indentN: indentN }, ...options });
      }

      function consoleStylish(A, row) {
        let colLength = 4;
        let rowLength = 4;

        let textStrings = [];
        let styleStrings = [];
        let add = (text, style, coords) => {
          if (
            settings.highlight &&
            settings.highlight[0] == coords?.[0] &&
            settings.highlight[1] == coords?.[1]
          ) {
            textStrings.push("%c" + text + "%c");
            styleStrings.push("color:yellow;", "");
          } else {
            textStrings.push("%c" + text + "%c");
            styleStrings.push(style, "");
          }
        };
        let isRowStart = (col) => col == 0;
        let isRowEnd = (col) => col == rowLength - 1;
        let isFirstRow = (row) => row == 0;
        let isLastRow = (row) => row == colLength - 1;
        let isDiagonal = (row, col) => row == col;
        let isZero = (row, col) => A[row][col] == 0;
        let entry = (row, col) => A[row][col];
        let comma = ", ";

        let zeroesStyle = "color:dimgray;font-style:italic;";
        let entryStyle = "color:mediumpurple;font-style:italic;";
        let diagonalStyle = "color:cornflowerblue;font-style:italic;";
        let bracketStyle = "color:grey;";

        for (let col = 0; col < rowLength; col++) {
          if (isFirstRow(row) && isRowStart(col))
            add(indent(indentN + 1) + "[[", bracketStyle);
          if (!isFirstRow(row) && isRowStart(col))
            add(indent(indentN + 1) + " [", bracketStyle);

          if (!isDiagonal(row, col)) {
            switch (true) {
              case isRowEnd(col) && isZero(row, col):
                add(entry(row, col), zeroesStyle, [row, col]);
                break;
              case isRowEnd(col):
                add(entry(row, col), entryStyle, [row, col]);
                break;
              case !isRowEnd(col) && isZero(row, col):
                add(entry(row, col) + comma, zeroesStyle, [row, col]);
                break;
              case !isRowEnd(col):
                add(entry(row, col) + comma, entryStyle, [row, col]);
                break;
            }
          }
          switch (true) {
            case isDiagonal(row, col) && !isRowEnd(col):
              add(entry(row, col) + ", ", diagonalStyle, [row, col]);
              break;
            case isDiagonal(row, col) && isRowEnd(col):
              add(entry(row, col), diagonalStyle, [row, col]);
              break;
          }

          //l('row:', row, 'colLength:', colLength, 'col:', col, 'rowLength:', rowLength);

          if (isLastRow(row) && isRowEnd(col)) add("]]", bracketStyle);
          if (!isLastRow(row) && isRowEnd(col)) add("]" + comma, bracketStyle);
        }

        let outputArguments = [textStrings.join("")].concat(styleStrings);
        console.log.apply(null, outputArguments);
      }

      for (let row = 0; row < A.length; row++) {
        consoleStylish(A, row);
      }
    }

    return this;
  }
}

export class Mat4 {
  // [1, 0, 0, "x"],
  // [0, 1, 0, "y"],
  // [0, 0, 1, "z"],
  // [0, 0, 0, 1]
  static ID = 0;

  constructor(...array) {
    array = array.flat(1);

    Mat4.ID++;
    this.ID = Mat4.ID;
    this.name = this.constructor.name + " #" + Mat4.ID;

    if (!Array.isArray(array[0])) {
      this.array = [
        [array[0], array[1], array[2], array[3]],
        [array[4], array[5], array[6], array[7]],
        [array[8], array[9], array[10], array[11]],
        [array[12], array[13], array[14], array[15]],
      ];
    } else this.array = array;

    return new Proxy(this, {
      get(target, prop) {
        if (typeof prop === "string" && Number(prop) >= 0)
          return target.array[prop];
        else if (typeof prop === "string" && Number(prop) < 0)
          return target.array[target.array.length + Number(prop)];
        else if (prop === "length") return target.array.length;
        else return target[prop];
      },
      set(target, prop, value) {
        if (typeof prop === "string" && Number(prop) >= 0)
          return (target.array[prop] = value);
        else if (typeof prop === "string" && Number(prop) < 0)
          return (target.array[target.array.length + Number(prop)] = value);
        else return (target[prop] = value);
      },
    });
  }

  static identity() {
    return new Mat4([
      [1, 0, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 1],
    ]);
  }
  static perspective(aspectRatio, fovy, near, far) {
    let FOV = (fov) => (fov * Math.PI) / 180;
    let f = 1 / Math.tan(FOV(fovy) / 2);
    let nf;

    let array = [
      [f / aspectRatio, 0, 0, 0],
      [0, f, 0, 0],
      [0, 0, undefined, undefined],
      [0, 0, -1, 0],
    ];
    if (far != null && far !== Infinity) {
      nf = 1 / (near - far);
      array[2][2] = (far + near) * nf;
      array[2][3] = 2 * far * near * nf;
    } else {
      array[2][2] = -1;
      array[2][3] = -2 * near;
    }
    return new Mat4(array);
  }

  getRows() {
    return this.array.map((x) => new Vec4(x));
  }
  getCols() {
    return this.transpose.array.map((x) => new Vec4(x));
  }
  multi(B) {
    let A = this;
    let Arows = A.getRows();
    let Bcols = B.getCols();
    let C = Mat4.identity();
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        C[i][j] = Arows[i].dot(Bcols[j]);
      }
    }
    return C;
  }
  translate(x, y, z) {
    this[0][3] += x;
    this[1][3] += y;
    this[2][3] += z;
    return this;
  }
  rotate(θ, x, y, z) {
    θ = (θ * Math.PI) / 180;
    let sin = Math.sin;
    let cos = Math.cos;
    let absR = Math.hypot(x, y, z);
    let arr = [
      [
        x ** 2 + (y ** 2 + z ** 2) * cos(θ),
        x * y - x * y * cos(θ) - absR * z * sin(θ),
        x * z - x * z * cos(θ) + absR * y * sin(θ),
        0,
      ],
      [
        x * y - x * y * cos(θ) + absR * z * sin(θ),
        y ** 2 + (x ** 2 + z ** 2) * cos(θ),
        y * z - y * z * cos(θ) - absR * x * sin(θ),
        0,
      ],
      [
        x * z - x * z * cos(θ) - absR * y * sin(θ),
        y * z - y * z * cos(θ) + absR * x * sin(θ),
        z ** 2 + (x ** 2 + y ** 2) * cos(θ),
        0,
      ],
      [0, 0, 0, 1],
    ];
    let rot = new Mat4(arr);
    return this.multi(rot);
  }
  get transpose() {
    let arr = this.array;
    let newArr = [];
    //log.info(A.array);
    for (let j = 0; j < arr[0].length; j++) {
      let row = [];
      for (let i = 0; i < arr.length; i++) {
        row.push(arr[i][j]);
      }
      newArr.push(row);
    }
    return new Mat4(newArr);
  }
  get convert() {
    return Float32Array.from(this.transpose.array.flat(1));
  }
  clone() {
    let clone = new this.constructor(structuredClone(this.array));
    return clone;
  }
  print(options) {
    let type = this.constructor.name;
    let settings = {
      indentN: options?.indentN ?? 0,
      title: options?.title ?? true,
      details: options?.details ?? true,
      padding: options?.padding ?? true,
      numberFormatting: options?.numberFormatting ?? true,
    };

    printMatrix(this, options);

    function printTitle(T, options) {
      let settings = {
        indentN: options?.indentN ?? 0,
        details: options?.details ?? true,
      };
      let indentN = settings.indentN;

      let name1 = T.name.split(" ")[0];

      let name2;
      if (type == "Tensor") name2 = "";
      else if (settings.details) name2 = " " + T.name.split(" ")[1];
      else name2 = "";

      let colon;
      if (settings.details) colon = ":";
      else colon = "";

      let dims = "";

      let total = "";

      console.log(
        `${indent(indentN)}%c${name1}%c%c${name2}%c${colon} %c${dims}${total}`,
        "color:yellow;text-decoration:underline;",
        "",
        "color:yellow;",
        "",
        "color:grey;font-style:italic;"
      );
    }
    function printMatrix(A, options) {
      A = A.clone();

      let settings = {
        indentN: options?.indentN ?? 0,
        title: options?.title ?? true,
        padding: options?.padding ?? true,
        numberFormatting: options?.numberFormatting ?? true,
        highlight: options?.highlight ?? false, // [i, j]
      };
      let indentN = settings.indentN;

      // For Padding Formatting
      if (settings.padding) {
        let arr = A.array.flat(Infinity).map((x) => String(x).length);
        let max = Math.max.apply(null, arr);
        A.array = A.array.map((x, row) =>
          x.map((_, col) => String(A[row][col]).padStart(max, "\u00A0"))
        );
      }

      if (settings.title) {
        printTitle(A, { ...{ indentN: indentN }, ...options });
      }

      function consoleStylish(A, row) {
        let colLength = 4;
        let rowLength = 4;

        let textStrings = [];
        let styleStrings = [];
        let add = (text, style, coords) => {
          if (
            settings.highlight &&
            settings.highlight[0] == coords?.[0] &&
            settings.highlight[1] == coords?.[1]
          ) {
            textStrings.push("%c" + text + "%c");
            styleStrings.push("color:yellow;", "");
          } else {
            textStrings.push("%c" + text + "%c");
            styleStrings.push(style, "");
          }
        };
        let isRowStart = (col) => col == 0;
        let isRowEnd = (col) => col == rowLength - 1;
        let isFirstRow = (row) => row == 0;
        let isLastRow = (row) => row == colLength - 1;
        let isDiagonal = (row, col) => row == col;
        let isZero = (row, col) => A[row][col] == 0;
        let entry = (row, col) => A[row][col];
        let comma = ", ";

        let zeroesStyle = "color:dimgray;font-style:italic;";
        let entryStyle = "color:mediumpurple;font-style:italic;";
        let diagonalStyle = "color:cornflowerblue;font-style:italic;";
        let bracketStyle = "color:grey;";

        for (let col = 0; col < rowLength; col++) {
          if (isFirstRow(row) && isRowStart(col))
            add(indent(indentN + 1) + "[[", bracketStyle);
          if (!isFirstRow(row) && isRowStart(col))
            add(indent(indentN + 1) + " [", bracketStyle);

          if (!isDiagonal(row, col)) {
            switch (true) {
              case isRowEnd(col) && isZero(row, col):
                add(entry(row, col), zeroesStyle, [row, col]);
                break;
              case isRowEnd(col):
                add(entry(row, col), entryStyle, [row, col]);
                break;
              case !isRowEnd(col) && isZero(row, col):
                add(entry(row, col) + comma, zeroesStyle, [row, col]);
                break;
              case !isRowEnd(col):
                add(entry(row, col) + comma, entryStyle, [row, col]);
                break;
            }
          }
          switch (true) {
            case isDiagonal(row, col) && !isRowEnd(col):
              add(entry(row, col) + ", ", diagonalStyle, [row, col]);
              break;
            case isDiagonal(row, col) && isRowEnd(col):
              add(entry(row, col), diagonalStyle, [row, col]);
              break;
          }

          //l('row:', row, 'colLength:', colLength, 'col:', col, 'rowLength:', rowLength);

          if (isLastRow(row) && isRowEnd(col)) add("]]", bracketStyle);
          if (!isLastRow(row) && isRowEnd(col)) add("]" + comma, bracketStyle);
        }

        let outputArguments = [textStrings.join("")].concat(styleStrings);
        console.log.apply(null, outputArguments);
      }

      for (let row = 0; row < A.length; row++) {
        consoleStylish(A, row);
      }
    }

    return this;
  }
}

//let arr = new Mat4([1, 2, 3, 4, 1, 2, 3, 4, 1, 2, 3, 4, 1, 2, 3, 4]).print();

//arr.multi(arr).print();

//arr.rotate(90, 0, 0, 1).print();

// arr.translate(0, 0, -5).print();

//arr.transpose.array.flat(1).print();
