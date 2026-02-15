import ChatWidget from "@/components/chat/ChatWidget";

export default function EmbedChat() {
  return (
    <>
      <style>{`body { background: transparent !important; }`}</style>
      <div className="w-screen h-screen bg-transparent">
        <ChatWidget />
      </div>
    </>
  );
}
