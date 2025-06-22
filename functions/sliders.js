import { l } from "../imports.js";

// let slidersDiv = document.querySelector("#sliders");
// slidersDiv.style = "display: inline-block;text-align:right;";

let createSlider = (options) => {
  let div = document.createElement("div");

  let groups = Array.from(slidersDiv.children).map((x) => x.name);

  //l(groups);

  if (groups.includes(options.group)) {
    let group = Array.from(slidersDiv.children)[groups.indexOf(options.group)];
    group.append(div);
  } else {
    let group = document.createElement("fieldset");
    group.name = options.group;
    group.open = true;
    slidersDiv.append(group);
    group.append(div);
  }

  let label = document.createElement("label");
  label.textContent = options.label;
  let button1 = document.createElement("button");
  button1.textContent = ">";
  let slider = document.createElement("input");
  slider.type = "range";
  let number = document.createElement("input");
  number.type = "text";
  number.style =
    "width: 25px;text-align: center;background-color: transparent;border: none;";
  div.append(label, button1, slider, number);
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
    button1: button1,
    number: number,
  };
  slider.min = options.min;
  slider.max = options.max;
  slider.step = options.step;
  this.value = options.default;
  this.context.canvas.addEventListener("draw", () => {
    //control.value = options.default;
  });
  control.slider.addEventListener("input", () => {
    options.variable = options.updateFunc(control.value);
    this.context.update();
  });
  control.button1.addEventListener("click", () => {
    control.slider.value += control.step;
    this.context.update();
  });
  return control;
};

export class Slider {
  static ID = 0;

  static attachment;
  static groups = {};

  //static sliders = [];

  constructor(options) {
    Slider.ID++;
    this.ID = Slider.ID;
    this.name = this.constructor.name + " #" + this.ID;

    this.options = options;

    let container = document.createElement("div");
    container.style =
      "display:flex; align-items:center; justify-content:right;";
    let label = document.createElement("label");
    label.style = "whitespace:no-wrap;"
    label.textContent = options.name + ":\u00A0";
    let button1 = document.createElement("button");
    button1.textContent = ">";
    let button2 = document.createElement("button");
    button2.textContent = "<";
    let slider = document.createElement("input");
    slider.type = "range";
    slider.id = "slider" + this.ID;
    label.htmlFor = slider.id;
    let number = document.createElement("input");
    number.name = this.name + " Number"
    number.type = "text";
    number.style =
      "width: 35px;text-align: center;background-color: transparent;border: none;";
    container.append(label, slider, button2, button1, number);

    this.variable = options.variable;
    this.updateFunction = options.updateFunction || false;
    this.slider = slider;
    this.button1 = button1;
    this.number = number;

    slider.min = options.min || 0;
    slider.max = options.max || 100;
    slider.step = options.step || 1;

    this.default = options.variable;
    this.slider.value = this.default;
    this.number.value = this.default;

    //l(options.variable);

    slider.addEventListener("input", () => {
      this.value = slider.value;
      options.variable = this.value;
      if (this.updateFunction) this.updateFunction();
    });
    number.addEventListener("input", () => {
      this.value = number.value;
      options.variable = this.value;
      if (this.updateFunction) this.updateFunction();
    });
    button1.addEventListener("click", () => {
      this.value = Number(slider.value) + Number(slider.step);
      options.variable = this.value;
      if (this.updateFunction) this.updateFunction();
    });
    button2.addEventListener("click", () => {
      this.value = Number(slider.value) - Number(slider.step);
      options.variable = this.value;
      if (this.updateFunction) this.updateFunction();
    });
    document.querySelector("body").addEventListener("draw", () => {
      //l("Test!");
      this.value = options.variable;
    });

    if (options.group) {
      if (options.group in Slider.groups) {
        let group = Slider.groups[options.group];
        group.append(container);
      } else {
        let group = document.createElement("fieldset");
        group.name = options.group;
        group.id = group.name;
        group.open = true;
        Slider.attachment.append(group);
        group.append(container);
        Slider.groups[group.name] = group;
      }
    } else Slider.attachment.append(container);

    //Slider.sliders.push(this);
  }

  // update() {
  //   this.value = this.options.variable;
  // }

  get value() {
    return this._value;
  }

  set value(val) {
    this._value = val;
    this.variable = val;
    this.slider.value = val;
    this.number.value = val;
  }

  get min() {
    return this.slider.min;
  }
  get max() {
    return this.slider.max;
  }
  get step() {
    return this.slider.step;
  }
  set min(val) {
    this.slider.min = val;
  }
  set max(val) {
    this.slider.max = val;
  }
  set step(val) {
    this.slider.step = val;
  }
}

//let a = 50;

//new Slider({ name: "Test", variable: a, max: 100, min: 0, step: 1 });
