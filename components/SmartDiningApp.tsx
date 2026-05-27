"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChatPanel, type ChatMessage } from "@/components/ChatPanel";
import { CheckoutModal } from "@/components/CheckoutModal";
import { MenuGrid } from "@/components/MenuGrid";
import { SharedCart } from "@/components/SharedCart";
import type { CartSnapshot, MenuItem, OrchestratorResponse, TableSession, UpsellSuggestion } from "@/lib/domain/types";

interface SmartDiningAppProps {
  tableId: string;
}

const emptyCart = (sessionId = ""): CartSnapshot => ({
  sessionId,
  items: [],
  subtotal: 0,
  tax: 0,
  total: 0,
  totalQuantity: 0
});

export function SmartDiningApp({ tableId }: SmartDiningAppProps) {
  const [session, setSession] = useState<TableSession | null>(null);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartSnapshot>(emptyCart());
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const channelRef = useRef<BroadcastChannel | null>(null);

  const displayName = useMemo(() => {
    if (typeof window === "undefined") return "Guest";
    const existing = window.localStorage.getItem("smart-dining-name");
    if (existing) return existing;
    const generated = `Guest ${Math.floor(100 + Math.random() * 900)}`;
    window.localStorage.setItem("smart-dining-name", generated);
    return generated;
  }, []);

  const broadcastCart = useCallback(
    (nextCart: CartSnapshot) => {
      channelRef.current?.postMessage({ type: "cart:update", tableId, cart: nextCart });
      window.localStorage.setItem(`smart-dining-cart-${tableId}`, JSON.stringify(nextCart));
    },
    [tableId]
  );

  const applyCart = useCallback(
    (nextCart: CartSnapshot, shouldBroadcast = true) => {
      setCart(nextCart);
      if (shouldBroadcast) broadcastCart(nextCart);
    },
    [broadcastCart]
  );

  useEffect(() => {
    channelRef.current = new BroadcastChannel(`smart-dining-${tableId}`);
    channelRef.current.onmessage = (event: MessageEvent<{ type: string; tableId: string; cart: CartSnapshot }>) => {
      if (event.data.type === "cart:update" && event.data.tableId === tableId) {
        applyCart(event.data.cart, false);
      }
    };

    return () => channelRef.current?.close();
  }, [applyCart, tableId]);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      try {
        const [sessionResponse, menuResponse] = await Promise.all([
          fetch(`/api/table/${tableId}/session?displayName=${encodeURIComponent(displayName)}`),
          fetch("/api/menu")
        ]);

        if (!sessionResponse.ok || !menuResponse.ok) throw new Error("Unable to start table session");

        const sessionJson = (await sessionResponse.json()) as { session: TableSession };
        const menuJson = (await menuResponse.json()) as { items: MenuItem[] };
        if (cancelled) return;

        setSession(sessionJson.session);
        setMenu(menuJson.items);
        setCart(emptyCart(sessionJson.session.id));
        setMessages([
          {
            id: "welcome",
            role: "assistant",
            text:
              "Hi, I am Zara. Tell me the vibe today and I will route it to the right dining agent: spicy, light, filling, dessert, drinks, or group order."
          }
        ]);
      } catch (bootError) {
        setError(bootError instanceof Error ? bootError.message : "Unable to start the app");
      }
    }

    boot();
    return () => {
      cancelled = true;
    };
  }, [displayName, tableId]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!session || !text.trim()) return;
      setIsThinking(true);
      setError(null);
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        text
      };
      setMessages((current) => [...current, userMessage]);

      try {
        const response = await fetch(`/api/session/${session.id}/ai/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tableId, text, speaker: displayName })
        });

        if (!response.ok) throw new Error("AI orchestration failed");
        const data = (await response.json()) as OrchestratorResponse;
        applyCart(data.cart);
        setMessages((current) => [
          ...current,
          {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            text: data.message,
            route: data.route,
            suggestions: data.suggestions,
            upsell: data.upsell,
            trace: data.agentTrace
          }
        ]);
      } catch (chatError) {
        setError(chatError instanceof Error ? chatError.message : "Zara could not respond");
      } finally {
        setIsThinking(false);
      }
    },
    [applyCart, displayName, session, tableId]
  );

  const addItem = useCallback(
    async (itemId: string, source: "menu" | "chat" | "upsell" = "menu") => {
      if (!session) return;
      setError(null);

      try {
        const response = await fetch(`/api/session/${session.id}/cart`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ itemId, quantity: 1, addedBy: displayName })
        });

        if (!response.ok) throw new Error("Could not add item");
        const data = (await response.json()) as { cart: CartSnapshot; upsell?: UpsellSuggestion };
        applyCart(data.cart);

        const added = menu.find((item) => item.id === itemId);
        setMessages((current) => [
          ...current,
          {
            id: `cart-${Date.now()}`,
            role: "assistant",
            text: `${added?.name ?? "Item"} added from ${source}. Shared cart updated for Table ${tableId}.`,
            upsell: data.upsell
          }
        ]);
      } catch (addError) {
        setError(addError instanceof Error ? addError.message : "Could not add item");
      }
    },
    [applyCart, displayName, menu, session, tableId]
  );

  const updateCartQuantity = useCallback(
    async (cartItemId: string, quantity: number) => {
      if (!session) return;

      const response = await fetch(`/api/session/${session.id}/cart/${cartItemId}`, {
        method: quantity <= 0 ? "DELETE" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: quantity <= 0 ? undefined : JSON.stringify({ quantity })
      });

      const data = (await response.json()) as { cart: CartSnapshot };
      applyCart(data.cart);
    },
    [applyCart, session]
  );

  return (
    <main className="app-shell">
      <section className="top-bar" aria-label="Table session status">
        <div>
          <p className="eyebrow">AI-first dining session</p>
          <h1>Table {tableId}</h1>
        </div>
        <div className="status-cluster">
          <span>{session?.activeUsers.length || 1} diner online</span>
          <span>RAG grounded</span>
          <span>Mock OTP: 123456</span>
        </div>
      </section>

      {error ? <div className="error-banner">{error}</div> : null}

      <section className="workspace-grid">
        <ChatPanel
          messages={messages}
          isThinking={isThinking}
          onSend={sendMessage}
          onAddItem={(itemId) => addItem(itemId, "chat")}
        />
        <MenuGrid items={menu} onAddItem={(itemId) => addItem(itemId, "menu")} />
        <SharedCart
          cart={cart}
          onQuantityChange={updateCartQuantity}
          onCheckout={() => setCheckoutOpen(true)}
        />
      </section>

      {session ? (
        <CheckoutModal
          open={checkoutOpen}
          sessionId={session.id}
          cart={cart}
          onClose={() => setCheckoutOpen(false)}
          onOrderPlaced={(orderId) => {
            setMessages((current) => [
              ...current,
              {
                id: `order-${Date.now()}`,
                role: "assistant",
                text: `Order ${orderId} placed. Kitchen has the validated cart and your table can track status from here.`
              }
            ]);
          }}
        />
      ) : null}
    </main>
  );
}
