import dynamic from 'next/dynamic';

const ChatBoxComponent = dynamic(() => import('./components/Chatbox'), { ssr: false });

export default function Home() {
  return (
    <main className="flex flex-col items-center min-h-screen bg-gray-100 pt-6">
      <ChatBoxComponent />
    </main>
  );
}
