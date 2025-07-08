import { useState } from 'react';

export default function HRAgentChat() {
  const [messages, setMessages] = useState([
    { role: 'system', content: 'You are an HR assistant. Answer questions about HR policies, compliance, and tasks.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    setLoading(true);
    const newMessages = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);

    try {
      const res = await fetch('/api/hr-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages })
      });
      if (!res.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await res.json();
      const aiReply = data.choices?.[0]?.message?.content || 'Sorry, I could not get a response.';
      setMessages([...newMessages, { role: 'assistant', content: aiReply }]);
    } catch (err) {
      setMessages([...newMessages, { role: 'assistant', content: 'Sorry, there was an error contacting the AI agent.' }]);
      console.error(err);
    }
    setInput('');
    setLoading(false);
  };

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-white shadow-lg rounded-lg p-4">
      <div className="h-64 overflow-y-auto mb-2">
        {messages.filter(m => m.role !== 'system').map((msg, i) => (
          <div key={i} className={msg.role === 'user' ? 'text-right' : 'text-left'}>
            <span className={msg.role === 'user' ? 'bg-blue-100' : 'bg-gray-100'}>{msg.content}</span>
          </div>
        ))}
      </div>
      <div className="flex">
        <input value={input} onChange={e => setInput(e.target.value)} className="flex-1 border rounded px-2" />
        <button onClick={sendMessage} disabled={loading} className="ml-2 px-4 py-2 bg-blue-600 text-white rounded">Send</button>
      </div>
    </div>
  );
}