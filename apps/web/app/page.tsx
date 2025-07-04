import dynamic from 'next/dynamic';
import Link from 'next/link';

const Chatbox = dynamic(() => import('./components/Chatbox'), { ssr: false });

export default function Home() {
  return (
    <main className="flex flex-col items-center min-h-screen bg-gray-100 pt-6">
      <div className="flex w-full items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold text-blue-800 text-center w-full">Chatbox</h1>
        <Link href="/py-editor" className="ml-4 px-3 py-1 rounded bg-blue-100 text-blue-800 border border-blue-200 hover:bg-blue-200 transition text-sm font-medium whitespace-nowrap" style={{position: 'absolute', right: '2rem', top: '2rem'}}>Python Editor</Link>
      </div>
      <Chatbox />
    </main>
  );
}
