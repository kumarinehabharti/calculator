const display = document.getElementById('calc-display');
const buttons = document.querySelectorAll('.btn');
const equalBtn = document.getElementById('equal-btn');

// Calculator state
let currentInput = '';      // what user is typing now
let previousInput = '';     // previous value before operator
let operator = null;        // current operator (+, -, *, /, %)
let waitingForOperand = false;  // true after pressing operator, waiting for next number
let resetDisplay = false;   // flag to clear display after equals or error

// ==================== HELPER FUNCTIONS ====================

// Update the display with currentInput or '0'
function updateDisplay() {
    if (currentInput === '') {
        display.value = '0';
    } else {
        display.value = currentInput;
    }
}

// Handle number input (0-9) and decimal point
function inputNumber(num) {
    // If display should be reset (after equals), start fresh
    if (resetDisplay) {
        clearAll();
        resetDisplay = false;
    }
    
    // Handle decimal point: prevent multiple dots
    if (num === '.') {
        if (currentInput.includes('.')) {
            return;  // already has decimal
        }
        if (currentInput === '') {
            currentInput = '0.';  // start with "0."
            updateDisplay();
            return;
        }
    }
    
    // Append the number
    currentInput += num;
    updateDisplay();
    waitingForOperand = false;
}

// Handle operator buttons (+, -, ×, ÷, %)
function setOperator(op) {
    // If we have an operator and waiting for operand, just change the operator
    if (waitingForOperand && operator !== null) {
        operator = op;
        return;
    }
    
    // If currentInput is empty, do nothing (unless we want to use previous)
    if (currentInput === '' && previousInput === '') {
        return;
    }
    
    // If previousInput exists and operator exists, calculate first
    if (previousInput !== '' && operator !== null && !waitingForOperand) {
        calculate();
    }
    
    // If after calculation we got error, reset
    if (currentInput === 'ERROR') {
        return;
    }
    
    // Store current value as previous and clear current for next number
    if (currentInput !== '') {
        previousInput = currentInput;
        currentInput = '';
    }
    
    operator = op;
    waitingForOperand = true;
    resetDisplay = false;
}

// Perform calculation based on previousInput, operator, and currentInput
function calculate() {
    if (operator === null || previousInput === '' || (currentInput === '' && !waitingForOperand)) {
        return;  // not enough data
    }
    
    let prev = parseFloat(previousInput);
    let curr = parseFloat(currentInput);
    
    // Handle division by zero or invalid numbers
    if (isNaN(prev) || isNaN(curr)) {
        showError();
        return;
    }
    
    let result;
    
    switch (operator) {
        case '+':
            result = prev + curr;
            break;
        case '-':
            result = prev - curr;
            break;
        case '*':
            result = prev * curr;
            break;
        case '/':
            if (curr === 0) {
                showError();
                return;
            }
            result = prev / curr;
            break;
        case '%':
            result = prev % curr;
            break;
        default:
            return;
    }
    
    // Round to avoid long decimals (max 8 decimal places)
    result = Math.round(result * 100000000) / 100000000;
    
    // Store result as string
    currentInput = result.toString();
    previousInput = '';
    operator = null;
    waitingForOperand = false;
    resetDisplay = true;   // next number will start fresh
    updateDisplay();
}

// Clear everything (AC button)
function clearAll() {
    currentInput = '';
    previousInput = '';
    operator = null;
    waitingForOperand = false;
    resetDisplay = false;
    updateDisplay();  // shows '0'
}

// Delete last character (DEL button)
function deleteLast() {
    if (resetDisplay) {
        clearAll();
        return;
    }
    
    // Remove last character from currentInput
    currentInput = currentInput.slice(0, -1);
    if (currentInput === '') {
        updateDisplay();  // shows 0
    } else {
        updateDisplay();
    }
}

// Show error message
function showError() {
    display.value = 'ERROR';
    currentInput = 'ERROR';
    previousInput = '';
    operator = null;
    waitingForOperand = false;
    resetDisplay = true;
    
    // Auto clear error after 1.5 seconds? Optional nice touch
    setTimeout(() => {
        if (display.value === 'ERROR') {
            clearAll();
        }
    }, 1500);
}

// ==================== KEYBOARD SUPPORT ====================
function handleKeyboard(event) {
    const key = event.key;
    
    // Numbers 0-9
    if (/^[0-9]$/.test(key)) {
        event.preventDefault();
        inputNumber(key);
    }
    // Decimal point
    else if (key === '.') {
        event.preventDefault();
        inputNumber('.');
    }
    // Operators
    else if (key === '+') {
        event.preventDefault();
        setOperator('+');
    }
    else if (key === '-') {
        event.preventDefault();
        setOperator('-');
    }
    else if (key === '*') {
        event.preventDefault();
        setOperator('*');
    }
    else if (key === '/') {
        event.preventDefault();
        setOperator('/');
    }
    else if (key === '%') {
        event.preventDefault();
        setOperator('%');
    }
    // Enter or = for equals
    else if (key === 'Enter' || key === '=') {
        event.preventDefault();
        calculate();
    }
    // Backspace for delete
    else if (key === 'Backspace') {
        event.preventDefault();
        deleteLast();
    }
    // Escape or Delete for clear all
    else if (key === 'Escape' || key === 'Delete') {
        event.preventDefault();
        clearAll();
    }
}

// ==================== EVENT LISTENERS ====================

// Handle button clicks (event delegation is clean, but we loop through all .btn)
buttons.forEach(button => {
    button.addEventListener('click', (e) => {
        e.stopPropagation();
        
        // Get custom data attributes
        const numValue = button.getAttribute('data-num');
        const opValue = button.getAttribute('data-op');
        const action = button.getAttribute('data-action');
        
        // Number button (including decimal)
        if (numValue !== null) {
            inputNumber(numValue);
        }
        // Operator button
        else if (opValue !== null) {
            let mappedOp = opValue;
            // Convert display symbols to actual operators
            if (opValue === '÷') mappedOp = '/';
            if (opValue === '×') mappedOp = '*';
            if (opValue === '−') mappedOp = '-';
            setOperator(mappedOp);
        }
        // Special action buttons (AC, DEL)
        else if (action === 'clear') {
            clearAll();
        }
        else if (action === 'delete') {
            deleteLast();
        }
        // Equal button is handled separately with ID but let's also catch if someone clicks generic? 
        // We'll use equalBtn id separately.
    });
});

// Equal button specific
if (equalBtn) {
    equalBtn.addEventListener('click', () => {
        calculate();
    });
}

// Keyboard event listener
window.addEventListener('keydown', handleKeyboard);

// Initialize display
clearAll();

// Optional: prevent form submission or weird behaviors
display.addEventListener('keydown', (e) => {
    // Disable typing directly in input field to avoid confusion
    e.preventDefault();
});

// Focus on load for keyboard usage
window.addEventListener('load', () => {
    display.focus();
    // Blur any focused button to let keyboard work nicely
    document.activeElement?.blur();
    display.focus();
});