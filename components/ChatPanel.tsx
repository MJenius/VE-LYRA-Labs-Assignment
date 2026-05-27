"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import type { AgentTraceStep, Intent, Recommendation, UpsellSuggestion } from "@/lib/domain/types";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  route?: Intent;
  suggestions?: Recommendation[];
  upsell?: UpsellSuggestion;
  trace?: AgentTraceStep[];
}

interface ChatPanelProps {
  messages: ChatMessage[];
  isThinking: boolean;
  onSend: (text: string) => void;
  onAddItem: (itemId: string) => void;
}

const quickPrompts = [
  "something spicy but not heavy",
  "light snack chahiye, dairy allergy hai",
  "we are 4 people, mix veg and non-veg",
  "best thing to order here",
  "drinks with our mains"
];

export function ChatPanel({ messages, isThinking, onSend, onAddItem }: ChatPanelProps) {
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isThinking]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    onSend(text);
  }

  return (
    <section className="panel chat-panel" aria-label="AI ordering chat">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Zara orchestrator</p>
          <h2>Order by conversation</h2>
        </div>
        <span className="latency-pill">Target &lt;3s</span>
      </div>

      <div className="quick-row" aria-label="Quick AI prompts">
        {quickPrompts.map((prompt) => (
          <button key={prompt} type="button" onClick={() => onSend(prompt)}>
            {prompt}
          </button>
        ))}
      </div>

      <div ref={scrollRef} className="message-list">
        {messages.map((message) => (
          <article key={message.id} className={`message ${message.role}`}>
            <p>{message.text}</p>
            {message.route ? <span className="route-label">route: {message.route}</span> : null}

            {message.suggestions?.length ? (
              <div className="suggestion-stack">
                {message.suggestions.map((suggestion) => (
                  <div key={suggestion.itemId} className="suggestion-card">
                    <img src={suggestion.imageUrl} alt={suggestion.name} />
                    <div>
                      <strong>{suggestion.name}</strong>
                      <span>Rs. {suggestion.price}</span>
                      <p>{suggestion.reason}</p>
                    </div>
                    <button type="button" onClick={() => onAddItem(suggestion.itemId)}>
                      Add
                    </button>
                  </div>
                ))}
              </div>
            ) : null}

            {message.upsell ? (
              <div className="upsell-card">
                <img src={message.upsell.imageUrl} alt={message.upsell.name} />
                <div>
                  <span>{message.upsell.trigger.replace("_", " ").toLowerCase()}</span>
                  <strong>{message.upsell.name}</strong>
                  <p>{message.upsell.message}</p>
                </div>
                <button type="button" onClick={() => onAddItem(message.upsell!.itemId)}>
                  Add Rs. {message.upsell.price}
                </button>
              </div>
            ) : null}

            {message.trace?.length ? (
              <details className="trace-box">
                <summary>Agent trace</summary>
                <ol>
                  {message.trace.map((step, index) => (
                    <li key={`${step.agent}-${index}`}>
                      {step.agent} · {step.latencyMs}ms
                    </li>
                  ))}
                </ol>
              </details>
            ) : null}
          </article>
        ))}

        {isThinking ? (
          <article className="message assistant pending">
            <p>Zara is routing this through the right agent...</p>
          </article>
        ) : null}
      </div>

      <form className="chat-input" onSubmit={submit}>
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Ask for spicy, light, group-friendly, dairy-free..."
          maxLength={500}
        />
        <button type="submit">Send</button>
      </form>
    </section>
  );
}
