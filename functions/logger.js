export let indent = (n) => "\u00A0".repeat(2).repeat(n);

function isNumber(x) {
  // Positive Infinity, Negative Infinity and NaN return false.

  if (Number.isNaN(Number(x))) {
    return false;
  } else {
    return Number.isFinite(parseFloat(x));
  }
}

Array.prototype.toString = function toString() {
  //l(...this.values());
  let val = this.values();
  return "[" + [...val].join(", ") + "]";
};

var redirect = false;

// Define a new console:
var console;
if (redirect) console = consoleRedirect(window.console);
else console = newConsole(window.console);

function newConsole(oldConsole) {
  return {
    // Main Functions
    log: function (...input) {
      input.push("\u200B".repeat(Math.round(Math.random() * 1000)));
      oldConsole.log(...input);
    },
    info: function (...input) {
      oldConsole.info(...input);
    },
    warn: function (...input) {
      oldConsole.warn(...input);
    },
    error: function (...input) {
      oldConsole.error(...input);
    },
    debug: function (...input) {
      oldConsole.debug(...input);
    },
    // Extra Functions
    clear: function () {
      oldConsole.clear();
    },
    assert: function (...input) {
      oldConsole.assert(...input);
    },
    trace: function (...input) {
      oldConsole.trace(...input);
    },
    table: function (...input) {
      oldConsole.table(...input);
    },
    dir: function (...input) {
      oldConsole.dir(...input);
    },
    dirxml: function (...input) {
      oldConsole.dirxml(...input);
    },
    group: function (...input) {
      oldConsole.group(...input);
    },
    groupCollapsed: function (...input) {
      oldConsole.groupCollapsed(...input);
    },
    groupEnd: function (...input) {
      oldConsole.groupEnd(...input);
    },
    count: function (...input) {
      oldConsole.count(...input);
    },
    countReset: function (...input) {
      oldConsole.countReset(...input);
    },
    time: function (...input) {
      oldConsole.time(...input);
    },
    timeLog: function (...input) {
      oldConsole.timeLog(...input);
    },
    timeEnd: function (...input) {
      oldConsole.timeEnd(...input);
    },
  };
}

function consoleRedirect(oldConsole) {
  let output = document.querySelector("output");
  return {
    // Main Functions
    log: function (...input) {
      oldConsole.log(...input);
      //oldConsole.log(input);
      if (input?.[0]?.includes?.("%c")) {
        let A = input[0].split("%c");
        //oldConsole.log("A", A);
        A = A.map((x) => {
          if (x == " ") return "\u00A0";
          else return x;
        });

        //oldConsole.log("B", input.slice(1));
        A = A.map((x, i) => {
          let output = [];
          if (x.includes("\n")) output.push(document.createElement("br"));
          let span = document.createElement("span");
          span.textContent = x;
          //oldConsole.log(input.slice(1)[i]);
          span.style = input.slice(1)[i - 1] + "font-family:monospace;";
          output.unshift(span);
          return output;
        });
        A = A.flat(1);
        output.append(...A);
      } else {
        if (output.childElementCount == 0) {
          output.append(input.join(" "));
        } else {
          output.append(document.createElement("br"), input.join(" "));
        }
      }
      output.append(document.createElement("hr"));
    },
    info: function (...input) {
      oldConsole.info(...input);
    },
    warn: function (...input) {
      oldConsole.warn(...input);
    },
    error: function (...input) {
      oldConsole.error(...input);
    },
    debug: function (...input) {
      oldConsole.debug(...input);
    },
    // Extra Functions
    clear: function () {
      oldConsole.clear();
      let output = document.querySelector("output");
      output.replaceChildren();
    },
    assert: function (...input) {
      oldConsole.assert(...input);
    },
    trace: function (...input) {
      oldConsole.trace(...input);
    },
    table: function (...input) {
      oldConsole.table(...input);
    },
    dir: function (...input) {
      oldConsole.dir(...input);
    },
    dirxml: function (...input) {
      oldConsole.dirxml(...input);
    },
    group: function (...input) {
      oldConsole.group(...input);
    },
    groupCollapsed: function (...input) {
      oldConsole.groupCollapsed(...input);
    },
    groupEnd: function (...input) {
      oldConsole.groupEnd(...input);
    },
    count: function (...input) {
      oldConsole.count(...input);
    },
    countReset: function (...input) {
      oldConsole.countReset(...input);
    },
    time: function (...input) {
      oldConsole.time(...input);
    },
    timeLog: function (...input) {
      oldConsole.timeLog(...input);
    },
    timeEnd: function (...input) {
      oldConsole.timeEnd(...input);
    },
  };
}

// Then redefine the old console:
window.console = console;

export let l = console.log;

export class ConsoleFormatter {
  constructor(options) {
    if (options?.appendSpace) {
      this.append = " ";
    } else this.append = "";

    if (options?.prefixIndent) {
      this.textStrings = [options?.prefixIndent];
    } else this.textStrings = [];

    //this.textStrings = [];
    this.styleStrings = [];
  }
  add(text, style) {
    let textInput = "%c" + text + "%c" + this.append;
    let styleInput = [style, ""];
    this.textStrings.push(textInput);
    this.styleStrings.push(...styleInput);
  }
  get output() {
    let output = [this.textStrings.join("")].concat(this.styleStrings);
    //l("output:", output);
    return output;
  }
  print(options) {
    let settings = {
      vertical: options?.vertical ?? false,
    };

    if (settings.vertical) {
      let indentN;
      for (let i = 0; i < this.textStrings.length; i++) {
        if (i == 0) indentN = "";
        else indentN = indent(1);
        console.log(indentN + this.textStrings[i], this.styleStrings[2 * i]);
      }
    } else console.log.apply(null, this.output);
    return this;
  }
}

export class Logger {
  static logIndent = 0;
  static ID = 0;

  static levels = {
    // npm logging levels
    //silent:
    error: 0,
    warn: 1,
    info: 2,
    //http: 3,
    //verbose: 4,
    debug: 5,
    //silly: 6,
  };
  static styles = new Map([
    ["bool_true", "color:green;font-style:italic;"],
    ["bool_false", "color:red;font-style:italic;"],
    ["arr", "color:dodgerblue;"],
    ["num", "color:mediumpurple;font-style:italic;"],
    ["text", "color:royalblue;"],
    ["title", "color:royalblue;text-decoration:underline;"],
    ["var", "color:yellow;"],
    ["create", "color:green;"],
    ["attention", "color:orange;"],
    ["warnStyle", ""],
  ]);

  constructor(toggleVariable, location) {
    Logger.ID++;
    this.ID = Logger.ID;

    this.location = location;
    this.folder = location.split("/").at(-2);
    this.module = location.split("/").at(-1);

    this.toggleVariable = toggleVariable;
    this.forceOn = false;
    this.forceOff = false;

    this.loggerName = "Logger" + " #" + this.ID + " @" + this.module;
  }

  get runCheck() {
    if (this.toggleVariable && !this.forceOff) return true;
    else if (this.forceOn /*  && !this.forceOff */) return true;
    else return false;
  }

  get getIndent() {
    return indent(Logger.logIndent);
  }

  indent(indentChange) {
    Logger.logIndent += indentChange;
    return this;
  }

  autoDetectStyle(text) {
    switch (true) {
      case typeof text == "boolean" && text == true:
        return "bool_true";
      case typeof text == "boolean" && text == false:
        return "bool_false";
      case String(text).startsWith("[") || String(text).startsWith("Array["):
        return "arr";
      case typeof text == "number" || typeof text == "bigint" || isNumber(text): // || String(text).includes("ⅈ"):
        return "num";
      case typeof text == "string":
        return "text";
      default:
        return "text";
    }
  }
  getStyle(style, text, logEntry) {
    //l('logEntry1:', logEntry);

    if (style == "auto") {
      style = this.autoDetectStyle(text);
    }
    if (style == "text") {
      return this.getTextStyle(text, logEntry);
    } else if (Logger.styles.has(style)) {
      return Logger.styles.get(style);
    } else {
      return style;
    }
  }
  getTextStyle(text, logEntry) {
    let level = logEntry.level;
    //l('logEntry2:', logEntry);
    switch (logEntry.level) {
      case "info":
        switch (true) {
          case modulesStyles.has(this.module):
            return moduleStyle(text, level, this.module);
          default:
            return "color:royalblue;";
        }
      case "warn":
        switch (true) {
          case modulesStyles.has(this.module):
            return moduleStyle(text, level, this.module);
          default:
            return "";
        }
      case "error":
        switch (true) {
          case modulesStyles.has(this.module):
            return moduleStyle(text, level, this.module);
          default:
            return "";
        }
      case "debug":
        switch (true) {
          case modulesStyles.has(this.module):
            return moduleStyle(text, level, this.module);
          default:
            return "color:dodgerblue";
        }
    }
  }

  applyManualStyles(logEntry) {
    let message = [logEntry.message].flat(1);
    let msg = new ConsoleFormatter({
      appendSpace: true,
      prefixIndent: indent(Logger.logIndent),
    });
    let add = (text, style) =>
      msg.add(text, this.getStyle(style, text, logEntry));

    if (logEntry.level == "info") {
      for (let i = 0; i < message.length; i = i + 2) {
        add(message[i], message[i + 1]);
      }
    } else if (logEntry.level == "warn" || "error") {
      for (let i = 0; i < message.length; i = i + 2) {
        if (i == 0) {
          add(message[0], "warnStyle");
          i--;
        } else {
          add(message[i], message[i + 1]);
        }
      }
    }
    return msg.output;
  }
  applyAutoStyles(logEntry) {
    let message = [logEntry.message].flat(1);
    let msg = new ConsoleFormatter({
      appendSpace: true,
      prefixIndent: indent(Logger.logIndent),
    });
    let add = (text, style) => {
      if (style) {
        msg.add(text, this.getStyle(style, text, logEntry));
      } else {
        msg.add(text, this.getStyle("auto", text, logEntry));
      }
    };
    for (let i = 0; i < message.length; i++) {
      add(message[i]);
    }

    return msg.output;
  }

  info(...message) {
    message = message.flat(1);

    // Convert Object Property Shorthands into entries of the message Array:
    for (let i = 0; i < message.length; i++) {
      if (typeof message[i] == "object" && !Array.isArray(message[i])) {
        message[i] = Object.entries(message[i]);
        //l(message[i]);
        message[i] = message[i].map((x) => [x[0] + ":", x[1]]).flat(1);
        message = message.toSpliced(i, 1, ...message[i]);
        //l(message);
      }
    }
    this.log({
      level: "info",
      message: message,
    });
    return this;
  }
  warn(...message) {
    message = message.flat(1);
    this.log({
      level: "warn",
      message: message,
    });
    return this;
  }
  error(...message) {
    message = message.flat(1);
    this.log({
      level: "error",
      message: message,
    });
    return this;
  }
  debug(...message) {
    message = message.flat(1);
    this.log({
      level: "debug",
      message: message,
    });
    return this;
  }

  log(entry) {
    let logEntry = {
      level: entry?.level ?? "info",
      style: entry?.style ?? "auto",
      message: entry?.message,
    };
    let output;

    if (this.runCheck) {
      switch (logEntry.style) {
        case "auto":
          output = this.applyAutoStyles(logEntry);
          break;
        case "manual":
          output = this.applyManualStyles(logEntry);
          break;
      }
    }
    console[logEntry.level].apply(null, output);
    return this;
  }

  title(level, string) {
    if (this.runCheck) {
      string = this.getIndent + "%c" + string;
      //l('string:', string);
      console[level].apply(null, [string, this.getStyle("title")]);
    }
    return this;
  }
  object(label = "", object) {
    if (this.runCheck) {
      if (typeof label == "object") {
        console.log(label);
      } else {
        let style = this.getTextStyle(label, { level: "info" });
        label = this.getIndent + "%c" + label;
        console.log(label, style, object);
      }
    }
  }

  print(A, options) {
    if (this.runCheck) {
      // { ...{ indentN: indentN }, ...options }
      A.print({
        ...{ indentN: Logger.logIndent + 1, details: false },
        ...options,
      });
      return A;
    }
  }
}

let modulesStyles = new Map([
  ["main.js", webGLModuleStyle],
  ["context.js", webGLModuleStyle],
  ["programs.js", webGLModuleStyle],
]);
function moduleStyle(text, level, module) {
  let style = modulesStyles.get(module).call(null, text, level);
  return style;
}

function webGLModuleStyle(text, level) {
  //l("text:", text);
  text = String(text);
  switch (true) {
    case text.startsWith("Drawing:"):
      return "color:white;text-decoration:underline;";
    case text.startsWith("a_"):
      return "color:springgreen;";
    case text.startsWith("u_"):
      return "color:cyan;";
    case text.startsWith("FLOAT") || text.startsWith("Float"):
      return "color:dodgerblue;font-style:italic;";
    case level == "info":
      return "color:royalblue;";
  }
}
