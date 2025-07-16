"use client";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
const codeMirror = dynamic(() => import("@uiw/react-codemirror"), { ssr: false });
import { python } from "@codemirror/lang-python";

export default function PyPlayground() {
  const [code, setCode] = useState(`for i in range(3):\n    print('Hello, Python!', i)`);
  const [stdout, setStdout] = useState('');
  const [stderr, setStderr] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPyodideReady, setIsPyodideReady] = useState(false);
  interface IPyodide {
    runPython: (code: string) => void;
    globals: { get: (name: string) => string };
  }
  const pyodideRef = useRef<IPyodide | null>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  // 动态加载 pyodide.js
  useEffect(() => {
    if (!((window as unknown) as { loadPyodide?: (config: { indexURL: string }) => Promise<IPyodide> }).loadPyodide) {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js";
      script.onload = () => {
        setIsPyodideReady(true);
        console.log("pyodide.js loaded");
      };
      document.body.appendChild(script);
    } else {
      setIsPyodideReady(true);
    }
  }, []);

  const ensurePyodide = async () => {
    if (!pyodideRef.current) {
      setIsLoading(true);
      try {
        pyodideRef.current = await ((window as unknown) as { loadPyodide: (config: { indexURL: string }) => Promise<IPyodide> }).loadPyodide({
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
    if (!((window as unknown) as { loadPyodide?: (config: { indexURL: string }) => Promise<IPyodide> }).loadPyodide) {
      setStderr("Pyodide 脚本还未加载完成");
      return;
    }
    const isOk = await ensurePyodide();
    if (!isOk) return;
    setIsLoading(true);
    setStdout('');
    setStderr('');
    try {
      const pyodide = pyodideRef.current;
      if (!pyodide) {
        setStderr('Pyodide 未初始化');
        setIsLoading(false);
        return;
      }
      const captureCode = `
import sys
from io import StringIO
stdout_buffer = StringIO()
stderr_buffer = StringIO()
original_stdout = sys.stdout
original_stderr = sys.stderr
sys.stdout = stdout_buffer
sys.stderr = stderr_buffer
try:
    exec("""${code.replace(/"/g, '"').replace(/\n/g, '\n')}""")
except Exception as e:
    import traceback
    traceback.print_exc()
finally:
    sys.stdout = original_stdout
    sys.stderr = original_stderr
captured_stdout = stdout_buffer.getvalue()
captured_stderr = stderr_buffer.getvalue()
stdout_buffer.close()
stderr_buffer.close()
`;
      pyodide.runPython(captureCode);
      const capturedStdout = pyodide.globals.get('captured_stdout');
      const capturedStderr = pyodide.globals.get('captured_stderr');
      setStdout(capturedStdout || '');
      setStderr(capturedStderr || '');
    } catch (error) {
      setStderr(`执行错误: ${error instanceof Error ? error.message : String(error)}`);
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

  // eslint-disable-next-line @typescript-eslint/naming-convention
  const CodeMirror = codeMirror;

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-100 mb-4">
      <div className="w-full max-w-screen-2xl px-4">
        <div className="flex items-center justify-between mb-8">
        </div>
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6 flex flex-col md:flex-row gap-6">
          {/* 左侧：编辑器 */}
          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-4 h-10">
              <span className="font-semibold text-gray-700">Python Editor</span>
              <button
                onClick={runCode}
                disabled={isLoading || !isPyodideReady}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              >
                {isLoading ? 'Running...' : (!isPyodideReady ? 'Loading...' : 'Run Code')}
              </button>
            </div>
            <div className="border border-gray-300 rounded-lg overflow-hidden flex-1 min-h-[550px] max-h-[550px]">
              <CodeMirror
                value={code}
                onChange={(value: string) => setCode(value)}
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