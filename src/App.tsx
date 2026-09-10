import { useState, useCallback, useEffect } from 'react';

type AngleMode = 'DEG' | 'RAD';

interface HistoryEntry {
  expression: string;
  result: string;
}

function factorial(n: number): number {
  if (n < 0) return NaN;
  if (n === 0 || n === 1) return 1;
  if (n > 170) return Infinity;
  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
  }
  return result;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function toDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

function App() {
  const [display, setDisplay] = useState('0');
  const [expression, setExpression] = useState('');
  const [memory, setMemory] = useState(0);
  const [angleMode, setAngleMode] = useState<AngleMode>('DEG');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isSecond, setIsSecond] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);
  const [isNewInput, setIsNewInput] = useState(true);

  const formatNumber = (num: number): string => {
    if (isNaN(num)) return 'Error';
    if (!isFinite(num)) return 'Infinity';
    if (Math.abs(num) > 1e15 || (Math.abs(num) < 1e-10 && num !== 0)) {
      return num.toExponential(8);
    }
    const str = num.toPrecision(12);
    // Remove trailing zeros
    return parseFloat(str).toString();
  };

  const evaluateExpression = useCallback((expr: string): number => {
    // Replace display symbols with JS equivalents
    let processed = expr
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/π/g, `(${Math.PI})`)
      .replace(/e(?![x])/g, `(${Math.E})`);

    // Handle factorial
    processed = processed.replace(/(\d+(?:\.\d+)?)!/g, (_, num) => {
      return factorial(parseFloat(num)).toString();
    });

    // Handle percentage
    processed = processed.replace(/(\d+(?:\.\d+)?)%/g, (_, num) => {
      return (parseFloat(num) / 100).toString();
    });

    // Handle implicit multiplication: 2π, 2(, )(
    processed = processed.replace(/(\d)\(/g, '$1*(');
    processed = processed.replace(/\)(\d)/g, ')*$1');
    processed = processed.replace(/\)\(/g, ')*(');

    // Evaluate safely using Function constructor
    try {
      const result = new Function(`return (${processed})`)();
      return typeof result === 'number' ? result : NaN;
    } catch {
      return NaN;
    }
  }, []);

  const handleNumber = (num: string) => {
    if (isNewInput) {
      setDisplay(num);
      setExpression(num);
      setIsNewInput(false);
    } else {
      if (display === '0' && num !== '.') {
        setDisplay(num);
        setExpression(expression.slice(0, -1) + num);
      } else if (num === '.' && display.includes('.')) {
        return;
      } else {
        setDisplay(display + num);
        setExpression(expression + num);
      }
    }
  };

  const handleOperator = (op: string) => {
    setIsNewInput(true);
    setLastResult(null);
    setExpression(expression + ` ${op} `);
    setDisplay('0');
  };

  const handleEquals = () => {
    try {
      const result = evaluateExpression(expression);
      const formatted = formatNumber(result);
      setHistory(prev => [{ expression, result: formatted }, ...prev].slice(0, 50));
      setDisplay(formatted);
      setExpression(formatted);
      setLastResult(formatted);
      setIsNewInput(true);
    } catch {
      setDisplay('Error');
      setExpression('');
      setIsNewInput(true);
    }
  };

  const handleClear = () => {
    setDisplay('0');
    setExpression('');
    setIsNewInput(true);
    setLastResult(null);
  };

  const handleClearEntry = () => {
    setDisplay('0');
    setIsNewInput(true);
  };

  const handleBackspace = () => {
    if (display.length > 1) {
      const newDisplay = display.slice(0, -1);
      setDisplay(newDisplay);
      // Also remove from expression
      if (expression.length > 0) {
        setExpression(expression.slice(0, -1));
      }
    } else {
      setDisplay('0');
      setIsNewInput(true);
    }
  };

  const handleScientific = (func: string) => {
    const current = parseFloat(display);
    let result: number;

    const angleInput = (val: number) => angleMode === 'DEG' ? toRad(val) : val;
    const angleOutput = (val: number) => angleMode === 'DEG' ? toDeg(val) : val;

    switch (func) {
      case 'sin':
        result = Math.sin(angleInput(current));
        break;
      case 'cos':
        result = Math.cos(angleInput(current));
        break;
      case 'tan':
        result = Math.tan(angleInput(current));
        break;
      case 'asin':
        result = angleOutput(Math.asin(current));
        break;
      case 'acos':
        result = angleOutput(Math.acos(current));
        break;
      case 'atan':
        result = angleOutput(Math.atan(current));
        break;
      case 'sinh':
        result = Math.sinh(current);
        break;
      case 'cosh':
        result = Math.cosh(current);
        break;
      case 'tanh':
        result = Math.tanh(current);
        break;
      case 'log':
        result = Math.log10(current);
        break;
      case 'ln':
        result = Math.log(current);
        break;
      case 'log2':
        result = Math.log2(current);
        break;
      case 'sqrt':
        result = Math.sqrt(current);
        break;
      case 'cbrt':
        result = Math.cbrt(current);
        break;
      case 'x2':
        result = current * current;
        break;
      case 'x3':
        result = current * current * current;
        break;
      case '10x':
        result = Math.pow(10, current);
        break;
      case 'ex':
        result = Math.exp(current);
        break;
      case '2x':
        result = Math.pow(2, current);
        break;
      case '1/x':
        result = 1 / current;
        break;
      case 'abs':
        result = Math.abs(current);
        break;
      case 'fact':
        result = factorial(Math.floor(current));
        break;
      case 'exp':
        setDisplay(display + 'e');
        setExpression(expression + 'e');
        setIsNewInput(false);
        return;
      case 'pi':
        setDisplay(Math.PI.toString());
        setExpression(expression + (isNewInput ? '' : ' * ') + Math.PI.toString());
        setIsNewInput(false);
        return;
      case 'euler':
        setDisplay(Math.E.toString());
        setExpression(expression + (isNewInput ? '' : ' * ') + Math.E.toString());
        setIsNewInput(false);
        return;
      case 'negate':
        result = -current;
        break;
      case 'percent':
        result = current / 100;
        break;
      case 'rand':
        result = Math.random();
        break;
      default:
        return;
    }

    const formatted = formatNumber(result);
    setDisplay(formatted);
    setExpression(formatted);
    setIsNewInput(true);
  };

  const handleParenthesis = (paren: string) => {
    if (isNewInput && paren === '(') {
      setExpression(expression + '(');
      setDisplay('0');
      setIsNewInput(false);
    } else {
      setExpression(expression + paren);
      setIsNewInput(paren === '(');
    }
  };

  const handleMemory = (action: string) => {
    const current = parseFloat(display);
    switch (action) {
      case 'MC':
        setMemory(0);
        break;
      case 'MR':
        setDisplay(formatNumber(memory));
        setExpression(expression + (isNewInput ? '' : ' + ') + memory.toString());
        setIsNewInput(true);
        break;
      case 'M+':
        setMemory(memory + current);
        setIsNewInput(true);
        break;
      case 'M-':
        setMemory(memory - current);
        setIsNewInput(true);
        break;
      case 'MS':
        setMemory(current);
        setIsNewInput(true);
        break;
    }
  };

  const handlePower = () => {
    setIsNewInput(true);
    setExpression(expression + ' ** ');
    setDisplay('0');
  };

  const handleNthRoot = () => {
    setIsNewInput(true);
    setExpression(expression + ' ** (1/');
    setDisplay('0');
  };

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      if (e.key >= '0' && e.key <= '9') handleNumber(e.key);
      else if (e.key === '.') handleNumber('.');
      else if (e.key === '+') handleOperator('+');
      else if (e.key === '-') handleOperator('-');
      else if (e.key === '*') handleOperator('×');
      else if (e.key === '/') handleOperator('÷');
      else if (e.key === 'Enter' || e.key === '=') handleEquals();
      else if (e.key === 'Escape') handleClear();
      else if (e.key === 'Backspace') handleBackspace();
      else if (e.key === '(') handleParenthesis('(');
      else if (e.key === ')') handleParenthesis(')');
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [display, expression, isNewInput]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-700/50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700/50">
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-2xl">🔬</span> Scientific Calculator
            </h1>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAngleMode(angleMode === 'DEG' ? 'RAD' : 'DEG')}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                  angleMode === 'DEG'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                }`}
              >
                {angleMode}
              </button>
              <button
                onClick={() => setShowHistory(!showHistory)}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                  showHistory
                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                    : 'bg-gray-700/50 text-gray-400 border border-gray-600/30'
                }`}
              >
                📋 History
              </button>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row">
            {/* Calculator */}
            <div className="flex-1 p-4">
              {/* Display */}
              <div className="bg-gray-900/80 rounded-2xl p-5 mb-4 border border-gray-700/30">
                <div className="flex items-center gap-2 mb-1">
                  {memory !== 0 && (
                    <span className="text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                      M
                    </span>
                  )}
                  <span className="text-xs text-gray-500">
                    {angleMode} | {isSecond ? '2nd' : '1st'}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-gray-400 text-sm h-6 overflow-x-auto whitespace-nowrap scrollbar-hide">
                    {expression || ' '}
                  </div>
                  <div className="text-white text-4xl font-light tracking-wide overflow-x-auto whitespace-nowrap scrollbar-hide">
                    {display}
                  </div>
                </div>
              </div>

              {/* Memory Buttons */}
              <div className="grid grid-cols-5 gap-1.5 mb-2">
                {['MC', 'MR', 'M+', 'M-', 'MS'].map((btn) => (
                  <button
                    key={btn}
                    onClick={() => handleMemory(btn)}
                    className="py-2 rounded-lg text-xs font-semibold bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 hover:text-white transition-all border border-gray-600/20"
                  >
                    {btn}
                  </button>
                ))}
              </div>

              {/* Scientific Functions Row 1 */}
              <div className="grid grid-cols-5 gap-1.5 mb-1.5">
                <button
                  onClick={() => setIsSecond(!isSecond)}
                  className={`py-2.5 rounded-lg text-xs font-bold transition-all border ${
                    isSecond
                      ? 'bg-purple-500/30 text-purple-300 border-purple-500/40'
                      : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 border-gray-600/20'
                  }`}
                >
                  2nd
                </button>
                <button
                  onClick={() => handleScientific(isSecond ? 'asin' : 'sin')}
                  className="py-2.5 rounded-lg text-xs font-semibold bg-indigo-900/40 text-indigo-300 hover:bg-indigo-800/50 transition-all border border-indigo-700/30"
                >
                  {isSecond ? 'sin⁻¹' : 'sin'}
                </button>
                <button
                  onClick={() => handleScientific(isSecond ? 'acos' : 'cos')}
                  className="py-2.5 rounded-lg text-xs font-semibold bg-indigo-900/40 text-indigo-300 hover:bg-indigo-800/50 transition-all border border-indigo-700/30"
                >
                  {isSecond ? 'cos⁻¹' : 'cos'}
                </button>
                <button
                  onClick={() => handleScientific(isSecond ? 'atan' : 'tan')}
                  className="py-2.5 rounded-lg text-xs font-semibold bg-indigo-900/40 text-indigo-300 hover:bg-indigo-800/50 transition-all border border-indigo-700/30"
                >
                  {isSecond ? 'tan⁻¹' : 'tan'}
                </button>
                <button
                  onClick={() => handleScientific(isSecond ? 'cbrt' : 'sqrt')}
                  className="py-2.5 rounded-lg text-xs font-semibold bg-indigo-900/40 text-indigo-300 hover:bg-indigo-800/50 transition-all border border-indigo-700/30"
                >
                  {isSecond ? '∛x' : '√x'}
                </button>
              </div>

              {/* Scientific Functions Row 2 */}
              <div className="grid grid-cols-5 gap-1.5 mb-1.5">
                <button
                  onClick={() => handleScientific('x2')}
                  className="py-2.5 rounded-lg text-xs font-semibold bg-indigo-900/40 text-indigo-300 hover:bg-indigo-800/50 transition-all border border-indigo-700/30"
                >
                  x²
                </button>
                <button
                  onClick={() => handleScientific('x3')}
                  className="py-2.5 rounded-lg text-xs font-semibold bg-indigo-900/40 text-indigo-300 hover:bg-indigo-800/50 transition-all border border-indigo-700/30"
                >
                  x³
                </button>
                <button
                  onClick={handlePower}
                  className="py-2.5 rounded-lg text-xs font-semibold bg-indigo-900/40 text-indigo-300 hover:bg-indigo-800/50 transition-all border border-indigo-700/30"
                >
                  xⁿ
                </button>
                <button
                  onClick={() => handleScientific(isSecond ? '2x' : '10x')}
                  className="py-2.5 rounded-lg text-xs font-semibold bg-indigo-900/40 text-indigo-300 hover:bg-indigo-800/50 transition-all border border-indigo-700/30"
                >
                  {isSecond ? '2ˣ' : '10ˣ'}
                </button>
                <button
                  onClick={() => handleScientific('log')}
                  className="py-2.5 rounded-lg text-xs font-semibold bg-indigo-900/40 text-indigo-300 hover:bg-indigo-800/50 transition-all border border-indigo-700/30"
                >
                  log
                </button>
              </div>

              {/* Scientific Functions Row 3 */}
              <div className="grid grid-cols-5 gap-1.5 mb-1.5">
                <button
                  onClick={() => handleScientific('ln')}
                  className="py-2.5 rounded-lg text-xs font-semibold bg-indigo-900/40 text-indigo-300 hover:bg-indigo-800/50 transition-all border border-indigo-700/30"
                >
                  ln
                </button>
                <button
                  onClick={() => handleScientific(isSecond ? 'log2' : 'ex')}
                  className="py-2.5 rounded-lg text-xs font-semibold bg-indigo-900/40 text-indigo-300 hover:bg-indigo-800/50 transition-all border border-indigo-700/30"
                >
                  {isSecond ? 'log₂' : 'eˣ'}
                </button>
                <button
                  onClick={() => handleScientific('1/x')}
                  className="py-2.5 rounded-lg text-xs font-semibold bg-indigo-900/40 text-indigo-300 hover:bg-indigo-800/50 transition-all border border-indigo-700/30"
                >
                  1/x
                </button>
                <button
                  onClick={() => handleScientific('fact')}
                  className="py-2.5 rounded-lg text-xs font-semibold bg-indigo-900/40 text-indigo-300 hover:bg-indigo-800/50 transition-all border border-indigo-700/30"
                >
                  n!
                </button>
                <button
                  onClick={() => handleScientific('abs')}
                  className="py-2.5 rounded-lg text-xs font-semibold bg-indigo-900/40 text-indigo-300 hover:bg-indigo-800/50 transition-all border border-indigo-700/30"
                >
                  |x|
                </button>
              </div>

              {/* Scientific Functions Row 4 - Hyperbolic */}
              <div className="grid grid-cols-5 gap-1.5 mb-3">
                <button
                  onClick={() => handleScientific('sinh')}
                  className="py-2.5 rounded-lg text-xs font-semibold bg-indigo-900/40 text-indigo-300 hover:bg-indigo-800/50 transition-all border border-indigo-700/30"
                >
                  sinh
                </button>
                <button
                  onClick={() => handleScientific('cosh')}
                  className="py-2.5 rounded-lg text-xs font-semibold bg-indigo-900/40 text-indigo-300 hover:bg-indigo-800/50 transition-all border border-indigo-700/30"
                >
                  cosh
                </button>
                <button
                  onClick={() => handleScientific('tanh')}
                  className="py-2.5 rounded-lg text-xs font-semibold bg-indigo-900/40 text-indigo-300 hover:bg-indigo-800/50 transition-all border border-indigo-700/30"
                >
                  tanh
                </button>
                <button
                  onClick={() => handleScientific('pi')}
                  className="py-2.5 rounded-lg text-xs font-semibold bg-indigo-900/40 text-indigo-300 hover:bg-indigo-800/50 transition-all border border-indigo-700/30"
                >
                  π
                </button>
                <button
                  onClick={() => handleScientific('euler')}
                  className="py-2.5 rounded-lg text-xs font-semibold bg-indigo-900/40 text-indigo-300 hover:bg-indigo-800/50 transition-all border border-indigo-700/30"
                >
                  e
                </button>
              </div>

              {/* Main Buttons */}
              <div className="grid grid-cols-5 gap-1.5">
                {/* Row 1 */}
                <button
                  onClick={() => handleParenthesis('(')}
                  className="py-4 rounded-xl text-lg font-semibold bg-gray-700/60 text-gray-200 hover:bg-gray-600/70 transition-all border border-gray-600/30"
                >
                  (
                </button>
                <button
                  onClick={() => handleParenthesis(')')}
                  className="py-4 rounded-xl text-lg font-semibold bg-gray-700/60 text-gray-200 hover:bg-gray-600/70 transition-all border border-gray-600/30"
                >
                  )
                </button>
                <button
                  onClick={handleBackspace}
                  className="py-4 rounded-xl text-lg font-semibold bg-red-900/30 text-red-300 hover:bg-red-800/40 transition-all border border-red-700/30"
                >
                  ⌫
                </button>
                <button
                  onClick={handleClearEntry}
                  className="py-4 rounded-xl text-lg font-semibold bg-red-900/30 text-red-300 hover:bg-red-800/40 transition-all border border-red-700/30"
                >
                  CE
                </button>
                <button
                  onClick={handleClear}
                  className="py-4 rounded-xl text-lg font-semibold bg-red-900/30 text-red-300 hover:bg-red-800/40 transition-all border border-red-700/30"
                >
                  AC
                </button>

                {/* Row 2 */}
                <button
                  onClick={() => handleNumber('7')}
                  className="py-4 rounded-xl text-lg font-semibold bg-gray-700/40 text-white hover:bg-gray-600/50 transition-all border border-gray-600/20"
                >
                  7
                </button>
                <button
                  onClick={() => handleNumber('8')}
                  className="py-4 rounded-xl text-lg font-semibold bg-gray-700/40 text-white hover:bg-gray-600/50 transition-all border border-gray-600/20"
                >
                  8
                </button>
                <button
                  onClick={() => handleNumber('9')}
                  className="py-4 rounded-xl text-lg font-semibold bg-gray-700/40 text-white hover:bg-gray-600/50 transition-all border border-gray-600/20"
                >
                  9
                </button>
                <button
                  onClick={handleNthRoot}
                  className="py-4 rounded-xl text-lg font-semibold bg-indigo-900/40 text-indigo-300 hover:bg-indigo-800/50 transition-all border border-indigo-700/30"
                >
                  ⁿ√x
                </button>
                <button
                  onClick={() => handleOperator('÷')}
                  className="py-4 rounded-xl text-lg font-semibold bg-amber-700/30 text-amber-300 hover:bg-amber-600/40 transition-all border border-amber-600/30"
                >
                  ÷
                </button>

                {/* Row 3 */}
                <button
                  onClick={() => handleNumber('4')}
                  className="py-4 rounded-xl text-lg font-semibold bg-gray-700/40 text-white hover:bg-gray-600/50 transition-all border border-gray-600/20"
                >
                  4
                </button>
                <button
                  onClick={() => handleNumber('5')}
                  className="py-4 rounded-xl text-lg font-semibold bg-gray-700/40 text-white hover:bg-gray-600/50 transition-all border border-gray-600/20"
                >
                  5
                </button>
                <button
                  onClick={() => handleNumber('6')}
                  className="py-4 rounded-xl text-lg font-semibold bg-gray-700/40 text-white hover:bg-gray-600/50 transition-all border border-gray-600/20"
                >
                  6
                </button>
                <button
                  onClick={() => handleScientific('percent')}
                  className="py-4 rounded-xl text-lg font-semibold bg-indigo-900/40 text-indigo-300 hover:bg-indigo-800/50 transition-all border border-indigo-700/30"
                >
                  %
                </button>
                <button
                  onClick={() => handleOperator('×')}
                  className="py-4 rounded-xl text-lg font-semibold bg-amber-700/30 text-amber-300 hover:bg-amber-600/40 transition-all border border-amber-600/30"
                >
                  ×
                </button>

                {/* Row 4 */}
                <button
                  onClick={() => handleNumber('1')}
                  className="py-4 rounded-xl text-lg font-semibold bg-gray-700/40 text-white hover:bg-gray-600/50 transition-all border border-gray-600/20"
                >
                  1
                </button>
                <button
                  onClick={() => handleNumber('2')}
                  className="py-4 rounded-xl text-lg font-semibold bg-gray-700/40 text-white hover:bg-gray-600/50 transition-all border border-gray-600/20"
                >
                  2
                </button>
                <button
                  onClick={() => handleNumber('3')}
                  className="py-4 rounded-xl text-lg font-semibold bg-gray-700/40 text-white hover:bg-gray-600/50 transition-all border border-gray-600/20"
                >
                  3
                </button>
                <button
                  onClick={() => handleScientific('negate')}
                  className="py-4 rounded-xl text-lg font-semibold bg-indigo-900/40 text-indigo-300 hover:bg-indigo-800/50 transition-all border border-indigo-700/30"
                >
                  ±
                </button>
                <button
                  onClick={() => handleOperator('-')}
                  className="py-4 rounded-xl text-lg font-semibold bg-amber-700/30 text-amber-300 hover:bg-amber-600/40 transition-all border border-amber-600/30"
                >
                  −
                </button>

                {/* Row 5 */}
                <button
                  onClick={() => handleNumber('0')}
                  className="py-4 rounded-xl text-lg font-semibold bg-gray-700/40 text-white hover:bg-gray-600/50 transition-all border border-gray-600/20"
                >
                  0
                </button>
                <button
                  onClick={() => handleNumber('.')}
                  className="py-4 rounded-xl text-lg font-semibold bg-gray-700/40 text-white hover:bg-gray-600/50 transition-all border border-gray-600/20"
                >
                  .
                </button>
                <button
                  onClick={handleEquals}
                  className="py-4 rounded-xl text-lg font-semibold bg-green-600/80 text-white hover:bg-green-500/80 transition-all border border-green-500/40 shadow-lg shadow-green-900/20"
                >
                  =
                </button>
                <button
                  onClick={() => handleScientific('rand')}
                  className="py-4 rounded-xl text-lg font-semibold bg-indigo-900/40 text-indigo-300 hover:bg-indigo-800/50 transition-all border border-indigo-700/30"
                >
                  Rand
                </button>
                <button
                  onClick={() => handleOperator('+')}
                  className="py-4 rounded-xl text-lg font-semibold bg-amber-700/30 text-amber-300 hover:bg-amber-600/40 transition-all border border-amber-600/30"
                >
                  +
                </button>
              </div>
            </div>

            {/* History Panel */}
            {showHistory && (
              <div className="lg:w-72 bg-gray-900/50 border-l border-gray-700/30 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-bold text-gray-300">History</h2>
                  <button
                    onClick={() => setHistory([])}
                    className="text-xs text-gray-500 hover:text-red-400 transition-colors"
                  >
                    Clear All
                  </button>
                </div>
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {history.length === 0 ? (
                    <p className="text-gray-600 text-xs text-center py-8">
                      No calculations yet
                    </p>
                  ) : (
                    history.map((entry, idx) => (
                      <div
                        key={idx}
                        className="bg-gray-800/50 rounded-lg p-2.5 border border-gray-700/20 cursor-pointer hover:bg-gray-700/50 transition-colors"
                        onClick={() => {
                          setDisplay(entry.result);
                          setExpression(entry.result);
                          setIsNewInput(true);
                        }}
                      >
                        <div className="text-xs text-gray-500 truncate">
                          {entry.expression}
                        </div>
                        <div className="text-sm text-white font-medium">
                          = {entry.result}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-gray-700/30 flex items-center justify-between">
            <p className="text-xs text-gray-600">
              Keyboard supported • Click history to reuse results
            </p>
            <p className="text-xs text-gray-600">
              {memory !== 0 && `Memory: ${formatNumber(memory)}`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
