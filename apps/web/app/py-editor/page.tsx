"use client";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
const CodeMirror = dynamic(() => import("@uiw/react-codemirror"), { ssr: false });
import { python } from "@codemirror/lang-python";

export default function PyPlayground() {
  const [code, setCode] = useState(`for i in range(3):\n    print('Hello, Python!', i)`);
  const [stdout, setStdout] = useState('');
  const [stderr, setStderr] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pyodideReady, setPyodideReady] = useState(false);
  const pyodideRef = useRef<any>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  // 动态加载 pyodide.js
  useEffect(() => {
    if (!(window as any).loadPyodide) {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js";
      script.onload = () => {
        setPyodideReady(true);
        console.log("pyodide.js loaded");
      };
      document.body.appendChild(script);
    } else {
      setPyodideReady(true);
    }
  }, []);

  const ensurePyodide = async () => {
    if (!pyodideRef.current) {
      setIsLoading(true);
      try {
        pyodideRef.current = await (window as any).loadPyodide({
          indexURL: "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/",
        });
      } catch (e) {
        setStderr("Pyodide 加载失败");
        setIsLoading(false);
        return false;
      }
      setIsLoading(false);
    }
    return true;
  };

  const runCode = async () => {
    if (!(window as any).loadPyodide) {
      setStderr("Pyodide 脚本还未加载完成");
      return;
    }
    const ok = await ensurePyodide();
    if (!ok) return;
    setIsLoading(true);
    setStdout('');
    setStderr('');
    try {
      const pyodide = pyodideRef.current;
      const captureCode = `\nimport sys\nfrom io import StringIO\nstdout_buffer = StringIO()\nstderr_buffer = StringIO()\noriginal_stdout = sys.stdout\noriginal_stderr = sys.stderr\nsys.stdout = stdout_buffer\nsys.stderr = stderr_buffer\ntry:\n    exec(\"\"\"${code.replace(/"/g, '\\"').replace(/\n/g, '\\n')}\"\"\")\nexcept Exception as e:\n    import traceback\n    traceback.print_exc()\nfinally:\n    sys.stdout = original_stdout\n    sys.stderr = original_stderr\ncaptured_stdout = stdout_buffer.getvalue()\ncaptured_stderr = stderr_buffer.getvalue()\nstdout_buffer.close()\nstderr_buffer.close()\n`;
      pyodide.runPython(captureCode);
      const capturedStdout = pyodide.globals.get('captured_stdout');
      const capturedStderr = pyodide.globals.get('captured_stderr');
      setStdout(capturedStdout || '');
      setStderr(capturedStderr || '');
    } catch (error: any) {
      setStderr(`执行错误: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const renderOutput = () => {
    const combinedOutput = stdout + (stderr ? (stdout ? '\n' : '') + stderr : '');
    if (!combinedOutput.trim()) {
      return <span className="text-gray-500 font-mono">(无输出)</span>;
    }
    const hasError = stderr && stderr.trim();
    const textColor = hasError ? 'text-red-400' : 'text-green-300';
    return (
      <pre 
        className={`font-mono ${textColor} text-sm m-0 p-0`}
        style={{ 
          lineHeight: 1.6, 
          whiteSpace: 'pre-wrap',
          wordWrap: 'break-word',
          overflowWrap: 'break-word'
        }}
      >
        {combinedOutput}
      </pre>
    );
  };

  const handleCopy = () => {
    const combinedOutput = stdout + (stderr ? (stdout ? '\n' : '') + stderr : '');
    navigator.clipboard.writeText(combinedOutput);
  };

  const clearOutput = () => {
    setStdout('');
    setStderr('');
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-100 pt-8">
      <div className="w-full max-w-screen-2xl px-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            Python Editor
          </h1>
          <Link href="/" className="px-3 py-1 rounded bg-blue-100 text-blue-800 border border-blue-200 hover:bg-blue-200 transition text-sm font-medium">
            Chatbox
          </Link>
        </div>
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6 flex flex-col md:flex-row gap-6">
          {/* 左侧：编辑器 */}
          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-4 h-10">
              <span className="font-semibold text-gray-700">Python Editor</span>
              <button
                onClick={runCode}
                disabled={isLoading || !pyodideReady}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              >
                {isLoading ? 'Running...' : (!pyodideReady ? 'Loading...' : 'Run Code')}
              </button>
            </div>
            <div className="border border-gray-300 rounded-lg overflow-hidden flex-1 min-h-[550px] max-h-[550px]">
              <CodeMirror
                value={code}
                onChange={(value) => setCode(value)}
                extensions={[python()]}
                theme="dark"
                height="100%"
                className="text-sm h-full"
              />
            </div>
          </div>
          {/* 右侧：输出区 */}
          <div className="flex-1 flex flex-col">
            <div className="flex items-center mb-4 h-10">
              <span className="font-semibold text-gray-700">Output:</span>
            </div>
            <div
              ref={outputRef}
              className="bg-[#1a1a1a] rounded-lg p-4 text-sm overflow-y-auto border border-gray-700 flex-1 min-h-[550px] max-h-[550px]"
              style={{ minHeight: '550px', maxHeight: '550px' }}
            >
              {renderOutput()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 