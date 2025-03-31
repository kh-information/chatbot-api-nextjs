"use client";

import { useState, useEffect, useRef } from "react";

type RoleType = "user" | "assistant";
type Message = {
  role: RoleType;
  content: string;
};

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedMessages = localStorage.getItem("chatMessages");
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("chatMessages", JSON.stringify(messages));
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const newMessages: Message[] = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setInput("");

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: newMessages }),
    });

    const data = await res.json();
    setMessages([...newMessages, { role: "assistant", content: data.content }]);
  };

  return (
    <div>
      {/* 채팅 버튼 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-5 right-5 p-4 bg-blue-500 text-white rounded-full shadow-lg transition-all hover:bg-blue-600">
        💬
      </button>

      {/* 채팅창 */}
      {isOpen && (
        <div className="fixed bottom-20 left-5 w-[800px] max-w-[90vw] bg-white shadow-xl border border-gray-300 rounded-lg flex flex-col">
          <div className="p-6 bg-gray-100 border-b text-xl font-semibold flex justify-between items-center">
            Chatbot
            <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-gray-700">
              ✖
            </button>
          </div>

          <div className="p-6 flex flex-col space-y-3 max-h-[600px] overflow-y-auto">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`p-4 rounded-xl max-w-[70%] text-lg leading-relaxed ${
                    msg.role === "user"
                      ? "bg-blue-500 text-white rounded-br-none"
                      : "bg-gray-100 text-gray-900 rounded-bl-none"
                  }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            <div ref={chatEndRef}></div>
          </div>

          {/* 입력 필드 - 더 큰 패딩과 폰트 크기 */}
          <div className="p-6 border-t flex items-center bg-white">
            <input
              type="text"
              className="flex-grow border border-gray-300 rounded-lg px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Type a message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            <button onClick={sendMessage} className="ml-4 bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 text-lg">
              ➤
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
