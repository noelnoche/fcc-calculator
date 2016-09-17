(function() {

"use strict";

  // Button assignments
  var display = document.getElementById("display");
  var btns = document.querySelectorAll(".buttons");
  var fnBtns = document.querySelectorAll(".fn");
  var ce = document.getElementById("clear-entry");
  var ac = document.getElementById("all-clear");
  var decimal = document.getElementById("decimal");
  var percent = document.getElementById("percent");
  var inverse = document.getElementById("inverse");
  var operator = document.getElementById("operator");
  var divSign = String.fromCharCode(247);
  var mltSign = String.fromCharCode(215);
  var minusSign = String.fromCharCode(8210);

  // For keeping track of calculation state
  var calcStart = false;
  var isResult = false;

  // For current entry, operator and operands
  var cur = "0";
  var curOper = "";
  var operands = [];


  // Animates a key press
  function press_effect() {
    var that = this;
    that.className = that.className + " effect-01a";
    window.setTimeout(function() { that.className = that.className.replace(" effect-01a", ""); }, 50);
  }

  // Truncates and rounds long answers to nine significant digits
  function truncate_result(num) {
    var array;
    num = parseFloat(num).toPrecision(9) + "";

    // 5.00000000e+25 --> 5.e+25 --> 5e+25
    // 5.05000000e-25 --> 5.05e-25
    if (num.match(/e/)) {
      array = num.split("e");
      num = array[0].replace(/\d+[0]+$/, "") + "e" + array[1];

      if (num.match(/\d+\.e/)) {
        num = num.split(".").join("");
      }
    }

    // 5.00000000 --> 5. ---> 5
    // 5.05000000 --> 5.05
    else {
      num = num.replace(/[0]+$/, "");

      if (num.match(/\d+\.$/)) {
        num = num.substr(0, num.length - 1);
      }
    }

     return num;
  }

  // Calculates and updates the current answer and operator
  function calculate(sym) {
    var x, y, result, resultLen;

    x = parseFloat(operands[0]);
    y = parseFloat(operands[1]);

    switch (curOper) {
      case divSign:
        result = x / y;
        break;
      case mltSign:
        result = x * y;
        break;
      case minusSign:
        result = x - y;
        break;
      case "+":
        result = x + y;
        break;
      default:
        break;
    }

    resultLen = (result + "").length;

    if (resultLen > 9) {
      result = truncate_result(result);
    }

    // Pressing equals displays the answer; otherwise continue calculation chain
    if (sym === "=") {
      display.value = result;
    }
    else {
      curOper = sym;
    }

    // Necessary for proper execution of percent and inverse keys
    isResult = true;

    // Next x value will take result
    operands = [result];
  }

  // Callback for number key input
  function proc_nums(input) {

    if (input === ".") {
      decimal.disabled = true;
    }

    // Takes and updates current entry, restricting it to 9 digits
    if (calcStart === false) {
      cur = input;
      calcStart = true;
    }
    else if (cur === "0" && input === "0") {
      cur = "0";
    }
    else {
      if (cur.length > 8) {
        cur = cur.substr(0, cur.length-1) + input;
      } else {
        cur += input;
      }
    }

    if (cur === ".") {
      cur = "0.";
    }

    // 02.005 --> 2.005
    if (cur.match(/^0{1,}[1-9]/)) {
       cur = parseFloat(cur);
     }

    display.value = cur;
    isResult = false;
  }

  // Shows currently active operator in the calculator LCD
  function show_operator() {
    var oper;

    if (curOper === "*") {
      oper = mltSign;
    }
    else if (curOper === "/") {
      oper = divSign;
    }
    else {
      oper = curOper;
    }

    operator.innerHTML = oper;
  }

  // Callback for operator key input
  function proc_operator(input) {

    // If user presses an operator key first when start calculation,
    // the first operand takes a value of zero
    if (calcStart === false && input !== "=") {
      cur = "0";
      curOper = input;
      calcStart = true;
    }

    if (cur !== "" && cur !== "." && operands.length !== 2) {
      operands.push(cur);
      cur = "";
    }

    // If get two operands, perform calculation; otherwise update current operator
    // This is so calculation uses the last pressed operator
    if (operands.length === 2 && curOper) {
      calculate(input);
    }
    else if (input !== "=") {
      curOper = input;
    }
    else if (operands.length <= 2 && input === "=")  {
      clear_all();
    }
    else {
      return;
    }

    decimal.disabled = false;
    show_operator();
  }

  // Coordinates operand and operator input order
  function proc_input() {
    var data = this.innerHTML;

    press_effect.call(this);

    if (data.match(/[0-9.]/)) {
      proc_nums(data);
    }
    else {
      proc_operator(data);
    }
  }

  // Converts current entry to percent
  function to_percent() {
    if (calcStart === true) {
      cur = display.value / 100;
      display.value = truncate_result(cur);

      // If the current converted value is an answer, then remove
      // the original from the calculation flow (to replaced with
      // the converted value
      if (isResult === true) {
        operands = [];
        curOper = "";
        show_operator("");
        isResult = false;
      }
    }
    else {
      return;
    }
  }

  // Gets the inverse value of current entry
  function to_inverse() {
    if (calcStart === true) {
      cur = display.value * -1;
      display.value = cur;

      // Using same reasoning as to_percent()
      if (isResult === true) {
        operands = [];
        curOper = "";
        show_operator("");
        isResult = false;
      }
    }
    else {
      return;
    }
  }

  // Clears current entry
  function clear_entry() {
    if (isResult === false) {
      calcStart = false;
      decimal.disabled = false;
      cur = "0";
      display.value = cur;
    }
  }

  // Clears and resets all values
  function clear_all() {
    isResult = false;
    clear_entry();
    operator.innerHTML = "";
    curOper = "";
    operands = [];
  }

  function init() {
    clear_all();
  }
  

  for (var i = 0; i < btns.length; i++) {
    btns[i].addEventListener("click", proc_input, false);
  }

  for (var j = 0; j < fnBtns.length; j++) {
    fnBtns[j].addEventListener("click", press_effect, false);
  }


  percent.onclick = to_percent;
  inverse.onclick = to_inverse;
  ce.onclick = clear_entry;
  ac.onclick = clear_all;

  document.onload = init();

})();
