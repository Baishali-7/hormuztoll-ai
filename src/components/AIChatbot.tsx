import * as React from "react";
import { useState, useRef, useEffect } from "react";

// Simple SVG icons to replace lucide-react
const MessageSquare = ({ className = "" }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
    />
  </svg>
);

const Send = ({ className = "" }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
    />
  </svg>
);

const X = ({ className = "" }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);

const Bot = ({ className = "" }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
    />
  </svg>
);

const User = ({ className = "" }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
    />
  </svg>
);

// Mock data (assuming these are defined elsewhere)
const ships = [
  { type: "tanker", status: "underway" },
  { type: "tanker", status: "underway" },
  { type: "cargo", status: "anchored" },
  { type: "container", status: "underway" },
  // Add more mock data as needed
];

const hormuzChokepoint = {
  congestionLevel: "Moderate",
  transitCount24h: 45,
  avgTransitTime: "4.5 hours",
  riskLevel: "Low",
  alerts: [
    { message: "Normal traffic conditions" },
    { message: "No security incidents reported" },
  ],
};

interface Message {
  role: "user" | "assistant";
  content: string;
}

const generateResponse = (input: string): string => {
  const q = input.toLowerCase();
  const tankers = ships.filter((s) => s.type === "tanker").length;
  const cargo = ships.filter((s) => s.type === "cargo").length;
  const containers = ships.filter((s) => s.type === "container").length;
  const underway = ships.filter((s) => s.status === "underway").length;

  if (q.includes("congestion") || q.includes("traffic") || q.includes("busy"))
    return `Current traffic density in the Strait of Hormuz region is **${hormuzChokepoint.congestionLevel}**. There have been **${hormuzChokepoint.transitCount24h} transits** in the last 24 hours with an average transit time of **${hormuzChokepoint.avgTransitTime}**. Traffic is slightly above the seasonal average — expect peak congestion around 14:00 UTC.`;

  if (
    q.includes("how many") ||
    q.includes("ship count") ||
    q.includes("vessels")
  )
    return `Currently tracking **${
      ships.length
    } vessels** in the Persian Gulf region:\n- **${tankers}** tankers\n- **${cargo}** cargo vessels\n- **${containers}** container ships\n\n**${underway}** are currently underway and **${
      ships.length - underway
    }** are anchored or moored.`;

  if (q.includes("route") || q.includes("busiest") || q.includes("lane"))
    return `The **busiest shipping lane** is the Hormuz Traffic Separation Scheme (TSS), handling the majority of inbound/outbound crude oil traffic. The **Bandar Abbas → Fujairah** corridor is currently seeing the highest density. Key routes also include the Gulf Main Corridor connecting Kuwait/Dammam to the Strait.`;

  if (
    q.includes("risk") ||
    q.includes("alert") ||
    q.includes("danger") ||
    q.includes("safe")
  )
    return `Current risk assessment for the Strait of Hormuz:\n- **Risk Level**: ${
      hormuzChokepoint.riskLevel
    }\n- **Congestion**: ${
      hormuzChokepoint.congestionLevel
    }\n\nAlerts:\n${hormuzChokepoint.alerts
      .map((a) => `- ${a.message}`)
      .join(
        "\n"
      )}\n\nNo major security incidents reported in the last 24 hours.`;

  if (q.includes("tanker"))
    return `There are **${tankers} tankers** currently in the region. Notable vessels include **PERSIAN STAR** (en route to Fujairah at 12.3 kn) and **HORMUZ TITAN** (heading to Singapore at 11.8 kn). Tanker traffic represents the majority of Hormuz Strait transits, carrying approximately 20-21 million barrels of crude oil per day.`;

  if (q.includes("weather") || q.includes("condition"))
    return `Current maritime conditions in the Strait of Hormuz:\n- **Visibility**: Good (>10 nm)\n- **Sea State**: Calm (wave height <1m)\n- **Wind**: NW 8-12 knots\n- **Temperature**: 34°C\n\nConditions are favorable for navigation. No weather advisories in effect.`;

  if (q.includes("help") || q.includes("what can"))
    return `I'm your **Maritime Intelligence Assistant** for the Strait of Hormuz region. You can ask me about:\n- 🚢 Current ship count and vessel types\n- 📊 Traffic congestion and density\n- 🛣️ Busiest shipping routes\n- ⚠️ Risk levels and alerts\n- 🌊 Weather and sea conditions\n- ⛽ Tanker operations\n\nTry asking: *"Is there congestion right now?"*`;

  return `Based on current maritime intelligence, the **Persian Gulf region** is operating at normal-to-moderate traffic levels. The Strait of Hormuz is handling **${
    hormuzChokepoint.transitCount24h
  } transits/day** with ${hormuzChokepoint.congestionLevel.toLowerCase()} congestion. Would you like details on a specific vessel, route, or risk assessment?`;
};

export default function AIChatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Welcome to **Hormuz AI Maritime Monitor**. I can provide real-time intelligence on ship traffic, congestion, and risk assessments. How can I help?",
    },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = () => {
    if (!input.trim()) return;
    const userMsg: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: generateResponse(input) },
      ]);
      setTyping(false);
    }, 800 + Math.random() * 600);
  };

  const suggestions = [
    "Is there congestion?",
    "How many ships?",
    "What's the risk level?",
  ];

  return (
    <>
      {/* Toggle button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-[1000] w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
        >
          <MessageSquare className="w-5 h-5" />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-5 right-5 z-[1000] w-[360px] h-[480px] bg-white border border-gray-200 rounded-xl shadow-2xl flex flex-col overflow-hidden animate-slide-up">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-semibold text-gray-900">
                Hormuz AI Assistant
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-2 ${
                  msg.role === "user" ? "justify-end" : ""
                }`}
              >
                {msg.role === "assistant" && (
                  <Bot className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                )}
                <div
                  className={`max-w-[85%] text-xs leading-relaxed px-3 py-2 rounded-lg ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white rounded-br-none"
                      : "bg-gray-100 text-gray-900 rounded-bl-none"
                  }`}
                >
                  {msg.content.split("\n").map((line, j) => (
                    <p key={j} className={j > 0 ? "mt-1" : ""}>
                      {line.split(/(\*\*.*?\*\*)/).map((seg, k) =>
                        seg.startsWith("**") && seg.endsWith("**") ? (
                          <strong key={k} className="font-semibold">
                            {seg.slice(2, -2)}
                          </strong>
                        ) : (
                          <span key={k}>{seg}</span>
                        )
                      )}
                    </p>
                  ))}
                </div>
                {msg.role === "user" && (
                  <User className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
                )}
              </div>
            ))}
            {typing && (
              <div className="flex gap-2">
                <Bot className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <div className="bg-gray-100 px-3 py-2 rounded-lg rounded-bl-none">
                  <span className="text-xs text-gray-600">
                    Analyzing data...
                  </span>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Quick suggestions */}
          {messages.length <= 2 && (
            <div className="px-4 pb-2 flex gap-1.5 flex-wrap">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setInput(s);
                  }}
                  className="text-[10px] px-2 py-1 rounded-full bg-gray-100 text-gray-600 hover:text-gray-900 hover:bg-gray-200 transition-colors border border-gray-200"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="border-t border-gray-200 p-3 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Ask about maritime traffic..."
              className="flex-1 text-xs bg-gray-100 text-gray-900 px-3 py-2 rounded-md border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-600 placeholder:text-gray-500"
            />
            <button
              onClick={send}
              disabled={!input.trim()}
              className="w-8 h-8 rounded-md bg-blue-600 text-white flex items-center justify-center disabled:opacity-40 hover:opacity-90 transition-opacity"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
