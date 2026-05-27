"use client";

import type { CartSnapshot } from "@/lib/domain/types";

interface SharedCartProps {
  cart: CartSnapshot;
  onQuantityChange: (cartItemId: string, quantity: number) => void;
  onCheckout: () => void;
}

export function SharedCart({ cart, onQuantityChange, onCheckout }: SharedCartProps) {
  return (
    <aside className="panel cart-panel" aria-label="Shared table cart">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Shared state</p>
          <h2>Table cart</h2>
        </div>
        <span className="cart-count">{cart.totalQuantity}</span>
      </div>

      <div className="cart-lines">
        {cart.items.length === 0 ? (
          <div className="empty-state">
            <strong>No items yet</strong>
            <p>Ask Zara for a recommendation or add from the live menu.</p>
          </div>
        ) : (
          cart.items.map((line) => (
            <article key={line.id} className="cart-line">
              <img src={line.item.imageUrl} alt={line.item.name} />
              <div>
                <strong>{line.item.name}</strong>
                <span>Added by {line.addedBy}</span>
                <small>Rs. {line.lineTotal}</small>
              </div>
              <div className="stepper" aria-label={`Quantity for ${line.item.name}`}>
                <button type="button" onClick={() => onQuantityChange(line.id, line.quantity - 1)}>
                  -
                </button>
                <span>{line.quantity}</span>
                <button type="button" onClick={() => onQuantityChange(line.id, line.quantity + 1)}>
                  +
                </button>
              </div>
            </article>
          ))
        )}
      </div>

      <dl className="totals">
        <div>
          <dt>Subtotal</dt>
          <dd>Rs. {cart.subtotal}</dd>
        </div>
        <div>
          <dt>GST</dt>
          <dd>Rs. {cart.tax}</dd>
        </div>
        <div className="grand-total">
          <dt>Total</dt>
          <dd>Rs. {cart.total}</dd>
        </div>
      </dl>

      <button className="checkout-button" type="button" disabled={cart.items.length === 0} onClick={onCheckout}>
        Place order with OTP
      </button>
    </aside>
  );
}
