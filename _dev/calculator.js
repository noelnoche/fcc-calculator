(function() {

'use strict';

  // Button assignments
  var display = document.getElementById('display');
  var btns = document.querySelectorAll('.buttons');
  var ce = document.getElementById('clear-entry');
  var ac = document.getElementById('all-clear');
  var decimal = document.getElementById('decimal');
  var percent = document.getElementById('percent');
  var inverse = document.getElementById('inverse');
  var equals = document.getElementById('equals');

  // For key press animation
  var pressEffect = document.querySelectorAll('.press-effect');

  // For showing currently active operator
  var operator = document.getElementById('operator');

  // For translate()
  var divSign = String.fromCharCode(247);
  var mltSign = String.fromCharCode(215);
  var minusSign = String.fromCharCode(8210);

  // For keeping track of calculation state
  var calcStart = false;
  var enableEquals = false;
  var isResult = false;
  
  // For current entry, operator and operands
  var curInput = '0';
  var curOper = '';
  var lastInput = '';

  // For holdng elements to evaluate: [numA, operator, numB]
  var evalStack = [];


  // Animates a key press
  function press_effect() {
    var that = this;
    that.className = that.className + ' effect-01a';
    window.setTimeout(function() { that.className = that.className.replace(' effect-01a', ''); }, 50);
  }

  // Truncates and rounds long answers to nine significant digits
  function truncate(num) {
    var array;
    num = parseFloat(num).toPrecision(9) + '';

    // 5.00000000e+25 --> 5.e+25 --> 5e+25
    // 5.05000000e-25 --> 5.05e-25
    if (num.match(/e/)) {
      array = num.split('e');
      num = array[0].replace(/\d+[0]+$/, '') + 'e' + array[1];

      if (num.match(/\d+\.e/)) {
        num = num.split('.').join('');
      }
    }

    // 5.00000000 --> 5. ---> 5
    // 5.05000000 --> 5.05
    else {
      num = num.replace(/[0]+$/, '');

      if (num.match(/\d+\.$/)) {
        num = num.substr(0, num.length - 1);
      }
    }

    return num;
  }

  // Calculates the answer
  function calculate() {
    var a, b, sym, result, resultLen;
    
    if (!evalStack.length) {
      return;
    }
    else {
      a = parseFloat(evalStack[0]);
      b = parseFloat(evalStack[2]);
      sym = evalStack[1];
      isResult = true;

      switch (sym) {
        case '/':
          result = a / b;
          break;
        case '*':
          result = a * b;
          break;
        case '-':
          result = a - b;
          break;
        case '+':
          result = a + b;
          break;
        default:
          break;
      }

      result = truncate(result);
      display.value = result;
      evalStack = [];
      evalStack.push(result);
      evalStack.push(curOper);
    }
  }

  // Handler for equals button
  function run_equals() {
    if (enableEquals === false) {
      return;
    }
    else {
      if (curInput !== '') {
        lastInput = curInput;
      }
      
      if (lastInput === '') {
        lastInput = evalStack[0];
      }
    }

    evalStack.push(lastInput);
    curInput = '';
    calculate();
    
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

  // Tranlates HTML math symbols into JS operators
  function translate_sym(domData) {
    var result;

    switch (domData) {
      case divSign:
        result = '/';
        break;
      case mltSign:
        result = '*';
        break;
      case minusSign:
        result = '-';
        break;
      default:
        result = domData;
    }

    return result;
  }

  // Callback for number key input
  function proc_nums(data) {

    // Limit length of input value to 9 digits
    if (curInput.length > 9) {
      return;
    }

    if (data === '.') {
      if (curInput === '') {
        curInput = '0';
      }
      decimal.disabled = true;
    }

    curInput += data;
    curInput = parseFloat(curInput) + '';
    display.value = curInput;
  }

  // Callback for operator key input
  function proc_operator(data) {
    var stackLen = evalStack.length;
    decimal.disabled = false;
    curOper = data;
    show_operator(curOper);

    // if [numA] or [numA, curOper, numB] --> push curOper or calculate respectively
    // else if [numA, curOper] --> change curOper
    // else error message
    if (evalStack[stackLen-1].match(/[0-9]/)) {     
      if (stackLen === 1) {
        evalStack.push(curOper);
      }
      else {
        calculate();
      }
    }
    else if (evalStack[stackLen-1].match(/[\*\-\+\/]/)) {
      evalStack.pop();
      evalStack.push(curOper);
    }
    else {
      return;
    }
  }

  // Controls input logic
  function proc_key() {
    var keyVal = translate_sym(this.innerHTML);

    if (keyVal.match(/[0-9.]/)) {
      calcStart = true;
      proc_nums(keyVal);
    }
    
    if (keyVal.match(/[\*\-\+\/]/)) {

      // If press an operator key first, set first num to 0
      if (calcStart === false) {
        calcStart = true;
        curInput = '0';
      }

      if (curInput !== '') {
        evalStack.push(curInput);
        curInput = '';
      }

      proc_operator(keyVal);
    }

    if (evalStack.length === 2) {
      enableEquals = true;
    }
    else {
      enableEquals = false;
    }
  }

  // Handler for percent key
  function to_percent() {
    if (calcStart === false) {
      return;
    }
    else {
      curOper = '/';

      if (isResult === false) {
        curInput = (curInput / 100) + '';
        display.value = truncate(curInput);
      }
      else {
        evalStack = [evalStack[0], curOper, '100'];
        calculate();
      }
    }
  }

  // Handler for inverse key
  function to_inverse() {
    if (calcStart === false) {
      return;
    }
    else {
      curOper = '*';

      if (isResult === false) {
        curInput = (curInput * -1.0) + '';
        display.value = curInput;
      }
      else {
        evalStack = [evalStack[0], curOper, '-1'];
        calculate();
      }
    }
  }

  // Handler for clear functions
  function clear() {

    // Prevents entry clear if input value is a result value
    if (this === 'entry' && isResult === true) {
      return;
    }

    decimal.disabled = false;
    curInput = '0';
    display.value = '0';

    if (this === 'all') {
      calcStart = false;
      enableEquals = false;
      isResult = false;
      curOper = '';
      show_operator();
      lastInput = '';
      evalStack = [];
    }
  }

  function init() {
    clear('all');
  }
  
  for (var i = 0; i < btns.length; i++) {
    btns[i].addEventListener('click', proc_key, false);
  }

  for (var j = 0; j < pressEffect.length; j++) {
    pressEffect[j].addEventListener('click', press_effect, false);
  }

  equals.onclick = run_equals;
  percent.onclick = to_percent;
  inverse.onclick = to_inverse;
  ce.onclick = clear.bind('entry');
  ac.onclick = clear.bind('all');

  document.onload = init();
})();
