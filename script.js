// DOM Elements
const previousOperandElement = document.getElementById('previous-operand');
const currentOperandElement = document.getElementById('current-operand');
const keypad = document.querySelector('.keypad');

// Calculator State
let currentOperand = '0';
let previousOperand = '';
let operation = undefined;
let shouldResetScreen = false;

// Round floating point inaccuracies (e.g., 0.1 + 0.2)
function roundResult(number) {
  if (isNaN(number) || !isFinite(number)) return number;
  return parseFloat(number.toPrecision(12));
}

// Format display number with commas for readability
function formatDisplayNumber(numberStr) {
  if (numberStr === 'Error' || numberStr === 'Cannot divide by 0') {
    return numberStr;
  }
  if (!numberStr) return '';

  const [integerPart, decimalPart] = numberStr.split('.');
  const integerFormatted = parseFloat(integerPart).toLocaleString('en-US');

  if (isNaN(parseFloat(integerPart))) {
    return numberStr;
  }

  if (decimalPart != null) {
    return `${integerFormatted}.${decimalPart}`;
  }
  return integerFormatted;
}

// Update the Calculator Screen
function updateDisplay() {
  currentOperandElement.textContent = formatDisplayNumber(currentOperand);

  // Dynamically shrink text if it gets long
  if (currentOperand.length > 11) {
    currentOperandElement.style.fontSize = '1.75rem';
  } else if (currentOperand.length > 8) {
    currentOperandElement.style.fontSize = '2.1rem';
  } else {
    currentOperandElement.style.fontSize = '';
  }

  if (operation != null && previousOperand !== '') {
    previousOperandElement.textContent = `${formatDisplayNumber(previousOperand)} ${operation}`;
  } else {
    previousOperandElement.textContent = '';
  }
}

// Clear all state (AC)
function clearAll() {
  currentOperand = '0';
  previousOperand = '';
  operation = undefined;
  shouldResetScreen = false;
  updateDisplay();
}

// Delete the last character (Backspace)
function deleteDigit() {
  if (currentOperand === 'Cannot divide by 0' || currentOperand === 'Error') {
    clearAll();
    return;
  }

  if (shouldResetScreen) {
    return;
  }

  if (currentOperand.length === 1 || (currentOperand.length === 2 && currentOperand.startsWith('-'))) {
    currentOperand = '0';
  } else {
    currentOperand = currentOperand.slice(0, -1);
  }
  updateDisplay();
}

// Append a digit
function appendNumber(number) {
  if (currentOperand === 'Cannot divide by 0' || currentOperand === 'Error') {
    currentOperand = '0';
  }

  if (shouldResetScreen) {
    currentOperand = '';
    shouldResetScreen = false;
  }

  // Prevent input overflow (max 14 digits)
  if (currentOperand.replace(/[^0-9]/g, '').length >= 14 && number !== '.') {
    return;
  }

  if (currentOperand === '0' && number !== '.') {
    currentOperand = number;
  } else {
    currentOperand += number;
  }

  updateDisplay();
}

// Append decimal point
function appendDecimal() {
  if (currentOperand === 'Cannot divide by 0' || currentOperand === 'Error' || shouldResetScreen) {
    currentOperand = '0';
    shouldResetScreen = false;
  }

  if (!currentOperand.includes('.')) {
    currentOperand += '.';
  }
  updateDisplay();
}

// Toggle positive / negative sign
function toggleSign() {
  if (currentOperand === '0' || currentOperand === 'Cannot divide by 0' || currentOperand === 'Error') {
    return;
  }

  if (currentOperand.startsWith('-')) {
    currentOperand = currentOperand.slice(1);
  } else {
    currentOperand = '-' + currentOperand;
  }
  updateDisplay();
}

// Percentage calculation
function calculatePercent() {
  const current = parseFloat(currentOperand);
  if (isNaN(current)) return;

  const result = roundResult(current / 100);
  currentOperand = result.toString();
  shouldResetScreen = true;
  updateDisplay();
}

// Choose an operator (+, -, ×, ÷)
function chooseOperation(op) {
  if (currentOperand === 'Cannot divide by 0' || currentOperand === 'Error') {
    return;
  }

  if (operation !== undefined && !shouldResetScreen) {
    compute();
  }

  operation = op;
  previousOperand = currentOperand;
  shouldResetScreen = true;
  updateDisplay();
}

// Compute the result
function compute() {
  if (operation === undefined || shouldResetScreen && previousOperand === '') {
    return;
  }

  const prev = parseFloat(previousOperand);
  const current = parseFloat(currentOperand);

  if (isNaN(prev) || isNaN(current)) return;

  let result;
  switch (operation) {
    case '+':
      result = prev + current;
      break;
    case '-':
      result = prev - current;
      break;
    case '×':
      result = prev * current;
      break;
    case '÷':
      if (current === 0) {
        currentOperand = 'Cannot divide by 0';
        previousOperand = '';
        operation = undefined;
        shouldResetScreen = true;
        updateDisplay();
        return;
      }
      result = prev / current;
      break;
    default:
      return;
  }

  result = roundResult(result);
  currentOperand = result.toString();
  previousOperand = '';
  operation = undefined;
  shouldResetScreen = true;
  updateDisplay();
}

// Keypad click handler delegation
keypad.addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button) return;

  if (button.dataset.number) {
    appendNumber(button.dataset.number);
  } else if (button.dataset.action === 'decimal') {
    appendDecimal();
  } else if (button.dataset.action === 'operator') {
    chooseOperation(button.dataset.operator);
  } else if (button.dataset.action === 'calculate') {
    compute();
  } else if (button.dataset.action === 'clear') {
    clearAll();
  } else if (button.dataset.action === 'delete') {
    deleteDigit();
  } else if (button.dataset.action === 'percent') {
    calculatePercent();
  } else if (button.dataset.action === 'toggle-sign') {
    toggleSign();
  }
});

// Keyboard Support
window.addEventListener('keydown', (event) => {
  const key = event.key;

  // Prevent default page scroll/search for calculation keys
  if (['/', '*', '+', '-', '=', 'Enter', 'Backspace', 'Escape'].includes(key)) {
    event.preventDefault();
  }

  let matchingButton = null;

  if (!isNaN(key) && key !== ' ') {
    appendNumber(key);
    matchingButton = document.querySelector(`[data-number="${key}"]`);
  } else if (key === '.' || key === ',') {
    appendDecimal();
    matchingButton = document.querySelector('[data-action="decimal"]');
  } else if (key === '+') {
    chooseOperation('+');
    matchingButton = document.querySelector('[data-operator="+"]');
  } else if (key === '-') {
    chooseOperation('-');
    matchingButton = document.querySelector('[data-operator="-"]');
  } else if (key === '*' || key.toLowerCase() === 'x') {
    chooseOperation('×');
    matchingButton = document.querySelector('[data-operator="×"]');
  } else if (key === '/') {
    chooseOperation('÷');
    matchingButton = document.querySelector('[data-operator="÷"]');
  } else if (key === 'Enter' || key === '=') {
    compute();
    matchingButton = document.querySelector('[data-action="calculate"]');
  } else if (key === 'Backspace') {
    deleteDigit();
    matchingButton = document.querySelector('[data-action="delete"]');
  } else if (key === 'Escape' || key.toLowerCase() === 'c') {
    clearAll();
    matchingButton = document.querySelector('[data-action="clear"]');
  } else if (key === '%') {
    calculatePercent();
    matchingButton = document.querySelector('[data-action="percent"]');
  }

  // Visual press effect on physical keyboard input
  if (matchingButton) {
    matchingButton.classList.add('active');
    setTimeout(() => {
      matchingButton.classList.remove('active');
    }, 120);
  }
});

// Initial display render
updateDisplay();
