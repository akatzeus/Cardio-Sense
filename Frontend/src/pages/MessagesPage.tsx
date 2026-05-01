import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const API_URL = "http://localhost:5000";

const MessagesPage = () => {
  const [searchParams] = useSearchParams();
  const initialRelId = searchParams.get("rel_id");

  const [conversations, setConversations] = useState<any[]>([]);
  const [activeRel, setActiveRel] = useState<number | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loadingConversations, setLoadingConversations] = useState(true);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const token = sessionStorage.getItem("access_token");
  const currentUserId = sessionStorage.getItem("user_id")
    ? Number(sessionStorage.getItem("user_id"))
    : null;

  // Fetch all accepted conversations
  const fetchConversations = async () => {
    try {
      const res = await fetch(`${API_URL}/messages/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load conversations");
      const data = await res.json();
      setConversations(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingConversations(false);
    }
  };

  // Fetch messages for a specific rel_id
  const fetchMessages = async (relId: number) => {
    const res = await fetch(`${API_URL}/messages/${relId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to load messages");
    const data = await res.json();
    setMessages(data.messages);
  };

  // Send a new message
  const sendMessage = async () => {
    if (!input.trim() || !activeRel) return;

    try {
      await fetch(`${API_URL}/messages/${activeRel}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: input }),
      });
      setInput("");
      await fetchMessages(activeRel);
      await fetchConversations(); // update sidebar last message
    } catch (err) {
      console.error("Send failed", err);
    }
  };

  // Auto-select conversation from URL
  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (conversations.length === 0) return;
    if (initialRelId) {
      const conv = conversations.find(c => c.rel_id === Number(initialRelId));
      if (conv) {
        setActiveRel(conv.rel_id);
        fetchMessages(conv.rel_id);
      }
    } else if (conversations.length > 0 && !activeRel) {
      setActiveRel(conversations[0].rel_id);
      fetchMessages(conversations[0].rel_id);
    }
  }, [conversations, initialRelId]);

  // Poll for new messages
  useEffect(() => {
    if (!activeRel) return;
    const interval = setInterval(() => {
      fetchMessages(activeRel);
      fetchConversations();
    }, 3000);
    return () => clearInterval(interval);
  }, [activeRel]);

  // Auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Helper to get other person's name for active conversation
  const otherPerson = conversations.find(c => c.rel_id === activeRel)?.other_name || "Doctor";

  return (
    <DashboardLayout>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[80vh]">
        {/* Conversations sidebar */}
        <Card className="lg:col-span-1 overflow-y-auto">
          <CardContent className="p-4 space-y-2">
            <h2 className="font-semibold mb-2">Conversations</h2>
            {loadingConversations && <p className="text-muted-foreground">Loading...</p>}
            {!loadingConversations && conversations.length === 0 && (
              <p className="text-muted-foreground">No conversations yet.</p>
            )}
            {conversations.map((conv) => (
              <div
                key={conv.rel_id}
                onClick={() => {
                  setActiveRel(conv.rel_id);
                  fetchMessages(conv.rel_id);
                }}
                className={`p-3 rounded-lg cursor-pointer border transition-all ${
                  activeRel === conv.rel_id
                    ? "bg-primary/10 border-primary/30"
                    : "hover:bg-muted"
                }`}
              >
                <p className="font-medium">{conv.other_name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {conv.last_message || "No messages yet"}
                </p>
                {conv.unread > 0 && (
                  <span className="inline-block mt-1 text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">
                    {conv.unread} new
                  </span>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Chat window */}
        <Card className="lg:col-span-3 flex flex-col">
          <CardContent className="flex flex-col h-full p-4">
            {!activeRel ? (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                Select a conversation to start messaging
              </div>
            ) : (
              <>
                {/* Chat header */}
                <div className="border-b pb-3 mb-3">
                  <h3 className="font-semibold">{otherPerson}</h3>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                  {messages.map((msg) => {
                    const isMine = msg.sender_id === currentUserId;
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-xs p-3 rounded-xl ${
                            isMine
                              ? "bg-primary text-primary-foreground rounded-br-none"
                              : "bg-muted text-foreground rounded-bl-none"
                          }`}
                        >
                          <p className="text-sm">{msg.content}</p>
                          <p
                            className={`text-xs mt-1 ${
                              isMine ? "text-primary-foreground/70" : "text-muted-foreground"
                            }`}
                          >
                            {new Date(msg.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={chatEndRef} />
                </div>

                {/* Input */}
                <div className="flex gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type a message..."
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  />
                  <Button onClick={sendMessage}>Send</Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default MessagesPage;