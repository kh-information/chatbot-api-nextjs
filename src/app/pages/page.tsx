// export default function Home() {
//     return (
//       <div className="flex min-h-screen items-center justify-center bg-blue-500 text-white text-2xl">
//         적용 완료! 🎉
//       </div>
//     );
//   }
  
import ChatWidget from "../components/ChatWidget";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 text-gray-900 text-2xl">
      <h1>Next.js Chatbot (App Router) 🚀</h1>
      <ChatWidget />
    </div>
  );
}
