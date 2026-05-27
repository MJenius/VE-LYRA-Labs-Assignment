"use client";

import { useMemo, useState } from "react";
import type { MenuItem } from "@/lib/domain/types";

interface MenuGridProps {
  items: MenuItem[];
  onAddItem: (itemId: string) => void;
}

const categories = ["All", "AI Picks", "Veg Starters", "Non-Veg Starters", "Mains Veg", "Mains Non-Veg", "Beverages Cold", "Desserts"];

export function MenuGrid({ items, onAddItem }: MenuGridProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("AI Picks");

  const visibleItems = useMemo(() => {
    const normalized = query.toLowerCase().trim();
    return items
      .filter((item) => {
        if (category === "All") return true;
        if (category === "AI Picks") return item.popularScore >= 0.85 || item.tags.includes("chef-special");
        return item.category === category;
      })
      .filter((item) => {
        if (!normalized) return true;
        return [item.name, item.description, item.category, ...item.tags].join(" ").toLowerCase().includes(normalized);
      })
      .sort((left, right) => right.popularScore - left.popularScore);
  }, [category, items, query]);

  return (
    <section className="panel menu-panel" aria-label="Menu">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Live menu</p>
          <h2>Grounded item cards</h2>
        </div>
      </div>

      <label className="search-box">
        <span>Search menu</span>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="paneer, spicy, dairy-free" />
      </label>

      <div className="category-strip" aria-label="Menu categories">
        {categories.map((entry) => (
          <button
            key={entry}
            type="button"
            className={entry === category ? "active" : ""}
            onClick={() => setCategory(entry)}
          >
            {entry}
          </button>
        ))}
      </div>

      <div className="menu-grid">
        {visibleItems.map((item) => (
          <article key={item.id} className="menu-card">
            <img src={item.imageUrl} alt={item.name} />
            <div className="menu-card-body">
              <div>
                <span className="category-label">{item.category}</span>
                <h3>{item.name}</h3>
                <p>{item.description}</p>
              </div>
              <div className="tag-row">
                {item.tags.slice(0, 3).map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
              <div className="card-footer">
                <strong>Rs. {item.price}</strong>
                <button type="button" disabled={!item.available} onClick={() => onAddItem(item.id)}>
                  {item.available ? "Add" : "Unavailable"}
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
