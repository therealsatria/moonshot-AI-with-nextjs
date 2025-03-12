'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function Home() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ sender: string; content: string }[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setMessages((prev) => [...prev, { sender: 'You', content: input }]);
    setInput('');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
      });

      if (!response.ok) throw new Error('Failed to fetch response');
      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let result = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ') && !line.includes('[DONE]')) {
            const jsonString = line.slice(6).trim();
            if (!jsonString) continue;

            try {
              const data = JSON.parse(jsonString);
              const content = data.choices?.[0]?.delta?.content;
              if (content) {
                result += content;
                setMessages((prev) => {
                  const newMessages = [...prev];
                  const lastIndex = newMessages.length - 1;
                  if (newMessages[lastIndex].sender === 'Bot') {
                    newMessages[lastIndex].content = result;
                  } else {
                    newMessages.push({ sender: 'Bot', content: result });
                  }
                  return newMessages;
                });
              }
            } catch (parseError) {
              console.warn('Failed to parse JSON chunk:', parseError, 'Raw:', jsonString);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages((prev) => [...prev, { sender: 'Bot', content: 'Error occurred' }]);
    }
  };

  return (
    <div className="flex flex-col min-h-screen justify-center items-center bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container max-w-3xl mx-auto p-6 shadow-lg rounded-3xl bg-white">
      <h1 className="text-3xl font-semibold text-gray-800 mb-6 text-center drop-shadow-sm">
        Moonshot Chat
      </h1>
      <div className="flex-1 overflow-y-auto mb-6 flex flex-col items-center">
        {messages.length === 0 ? (
          <p className="text-gray-500 text-center italic">Mulai percakapan...</p>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx} className={`mb-4 max-w-[80%] w-full ${msg.sender === 'You' ? 'self-end' : 'self-start'}`}>
            <div
              className={`py-3 px-4 rounded-2xl  ${
                msg.sender === 'You'
                  ? 'bg-blue-100 text-blue-900'
                  : 'bg-gray-200 text-gray-900'
              }`}
            >
              <span className="block text-sm font-medium text-gray-700">
                {msg.sender}
              </span>
              <div className="mt-2">
                {msg.sender === 'Bot' ? (
                  <div className="markdown">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <span>{msg.content}</span>
                )}
              </div>
                </div>
            </div>
          ))
        )}
      </div>
       <div className="fixed bottom-0 left-0 right-0 mx-auto w-full max-w-3xl p-6 z-10 bg-gradient-to-br from-gray-50 to-gray-100">
          <form
              onSubmit={handleSubmit}
              className="flex items-center w-full shadow-md rounded-full bg-white"
          >
                  <input type="text" value={input} onChange={(e) => setInput(e.target.value)} className="flex-1 p-4 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-200 text-gray-900 placeholder-gray-500" placeholder="Ketik sesuatu..." />
                   <button type="submit" className="p-4 bg-blue-500 text-white rounded-full hover:bg-blue-600 mr-1" aria-label="Kirim pesan"> chat </button>
          </form>
              </div>
    </div>
    </div>
  );
}