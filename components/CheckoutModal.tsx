"use client";

import { FormEvent, useState } from "react";
import type { CartSnapshot, Order } from "@/lib/domain/types";
import { sendOtp as sendOtpService, verifyOtp as verifyOtpService } from "@/lib/services/otp";
import { createOrderAfterValidation } from "@/lib/services/order";

interface CheckoutModalProps {
  open: boolean;
  sessionId: string;
  cart: CartSnapshot;
  onClose: () => void;
  onOrderPlaced: (orderId: string) => void;
}

export function CheckoutModal({ open, sessionId, cart, onClose, onOrderPlaced }: CheckoutModalProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("123456");
  const [otpSent, setOtpSent] = useState(false);
  const [verified, setVerified] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  async function sendOtp() {
    setError(null);
    try {
      // Try API first
      try {
        const response = await fetch("/api/otp/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone })
        });

        if (response.ok) {
          setOtpSent(true);
          return;
        }
      } catch (apiError) {
        // API call failed, will use fallback
        console.debug("API call failed, using OTP service directly", apiError);
      }

      // Fallback: Use OTP service directly
      sendOtpService(phone);
      setOtpSent(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Enter a valid phone number before requesting OTP.");
    }
  }

  async function verify() {
    setError(null);
    try {
      // Try API first
      try {
        const response = await fetch("/api/otp/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone, otp })
        });

        if (response.ok) {
          const data = (await response.json()) as { verified: boolean; reason?: string };
          if (data.verified) {
            setVerified(true);
            return;
          } else {
            setError(data.reason ?? "OTP verification failed");
            return;
          }
        }
      } catch (apiError) {
        // API call failed, will use fallback
        console.debug("API call failed, using OTP service directly", apiError);
      }

      // Fallback: Use OTP service directly
      const result = verifyOtpService(phone, otp);
      if (result.verified) {
        setVerified(true);
      } else {
        setError(result.reason ?? "OTP verification failed");
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "OTP verification failed");
    }
  }

  async function placeOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!verified) {
      setError("Verify OTP before placing the order.");
      return;
    }

    try {
      // Try API first
      try {
        const response = await fetch(`/api/session/${sessionId}/order`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ customerName: name, customerPhone: phone })
        });

        if (response.ok) {
          const data = (await response.json()) as { order: Order };
          setOrder(data.order);
          onOrderPlaced(data.order.id);
          return;
        }
      } catch (apiError) {
        // API call failed, will use fallback
        console.debug("API call failed, using order service directly", apiError);
      }

      // Fallback: Use order service directly
      const order = createOrderAfterValidation({
        sessionId,
        customerName: name,
        customerPhone: phone
      });
      setOrder(order);
      onOrderPlaced(order.id);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Order validation failed. Please check the cart.");
    }
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="checkout-modal" role="dialog" aria-modal="true" aria-label="Checkout">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">OTP checkout</p>
            <h2>Validate and place order</h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close checkout">
            x
          </button>
        </div>

        {order ? (
          <div className="confirmation">
            <strong>Order placed</strong>
            <p>Order ID: {order.id}</p>
            <p>Estimated wait: {order.estimatedWaitMinutes} minutes</p>
            <p>Total: Rs. {order.totalAmount}</p>
            <button type="button" onClick={onClose}>
              Back to table
            </button>
          </div>
        ) : (
          <form onSubmit={placeOrder} className="checkout-form">
            <label>
              Name
              <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Customer name" />
            </label>
            <label>
              Phone
              <input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+919999999999" />
            </label>
            <button type="button" onClick={sendOtp}>
              {otpSent ? "OTP sent" : "Send OTP"}
            </button>
            <label>
              OTP
              <input value={otp} onChange={(event) => setOtp(event.target.value)} maxLength={6} />
            </label>
            <button type="button" onClick={verify}>
              {verified ? "OTP verified" : "Verify OTP"}
            </button>

            <div className="checkout-summary">
              <span>{cart.totalQuantity} items</span>
              <strong>Rs. {cart.total}</strong>
            </div>

            {error ? <p className="form-error">{error}</p> : null}

            <button className="checkout-button" type="submit">
              Place validated order
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
