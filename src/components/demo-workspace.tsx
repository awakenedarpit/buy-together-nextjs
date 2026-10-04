"use client";

import Link from "next/link";
import { useMemo, useState, useSyncExternalStore, type FormEvent } from "react";
import { ArrowLeft, ArrowUpRight, Boxes, ClipboardList, Minus, Plus, RotateCcw, Trash2, UsersRound } from "lucide-react";
import { parseRequirementsFallback, type Requirement } from "@/lib/requirements-parser";
import { BrandMark } from "@/components/workspace-nav";

type DemoItem = Requirement & { id: string; request: string; owner: string };
type DemoView = "member" | "group";
const STORAGE_KEY = "buy-together-guest-demo-v1";
const SAMPLE_ITEMS: DemoItem[] = [
  { id: "sample-riya-1", owner: "Riya", request: "2 A4 notebooks and 1 blue pen", name: "notebook", quantity: 2, unit: "piece", variant: "a4" },
  { id: "sample-riya-2", owner: "Riya", request: "2 A4 notebooks and 1 blue pen", name: "pen", quantity: 1, unit: "piece", variant: "blue" },
  { id: "sample-kabir-1", owner: "Kabir", request: "3 A4 notebooks and 2 pencils", name: "notebook", quantity: 3, unit: "piece", variant: "a4" },
  { id: "sample-kabir-2", owner: "Kabir", request: "3 A4 notebooks and 2 pencils", name: "pencil", quantity: 2, unit: "piece", variant: null },
  { id: "sample-maya-1", owner: "Maya", request: "1 pack of sticky notes and 2 black markers", name: "sticky note", quantity: 1, unit: "pack", variant: null },
  { id: "sample-maya-2", owner: "Maya", request: "1 pack of sticky notes and 2 black markers", name: "marker", quantity: 2, unit: "piece", variant: "black" },
];

function amount(quantity: number, unit: string) {
  return `${quantity} ${quantity === 1 ? unit : `${unit}${unit === "piece" ? "s" : ""}`}`;
}
function newId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
function parseGuestItems(raw: string): DemoItem[] {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is DemoItem => Boolean(item && typeof item === "object" && typeof item.id === "string" && item.owner === "You" && typeof item.request === "string" && typeof item.name === "string" && Number.isInteger(item.quantity) && item.quantity > 0 && typeof item.unit === "string"));
  } catch {
    return [];
  }
}
function subscribeDemo(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("buy-together-demo-updated", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("buy-together-demo-updated", callback);
  };
}
function getDemoSnapshot() {
  return localStorage.getItem(STORAGE_KEY) ?? "[]";
}
function saveGuestItems(items: DemoItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("buy-together-demo-updated"));
}

export function DemoWorkspace({ view }: { view: DemoView }) {
  const serializedItems = useSyncExternalStore(subscribeDemo, getDemoSnapshot, () => "[]");
  const items = useMemo(() => parseGuestItems(serializedItems), [serializedItems]);
  const [draft, setDraft] = useState("");
  const [notice, setNotice] = useState("");
  const isGroup = view === "group";

  const groupItems = useMemo(() => [...SAMPLE_ITEMS, ...items], [items]);
  const groupTotals = useMemo(() => {
    const totals = new Map<string, { name: string; variant: string | null; unit: string; quantity: number; owners: Set<string> }>();
    for (const item of groupItems) {
      const key = `${item.name.toLowerCase()}|${(item.variant ?? "").toLowerCase()}|${item.unit.toLowerCase()}`;
      const current = totals.get(key) ?? { name: item.name, variant: item.variant, unit: item.unit, quantity: 0, owners: new Set<string>() };
      current.quantity += item.quantity;
      current.owners.add(item.owner);
      totals.set(key, current);
    }
    return [...totals.values()].sort((a, b) => b.quantity - a.quantity);
  }, [groupItems]);
  const ownTotal = items.reduce((sum, item) => sum + item.quantity, 0);
  const allTotal = groupItems.reduce((sum, item) => sum + item.quantity, 0);

  function addRequirement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;
    const parsed = parseRequirementsFallback(text);
    if (parsed.length === 0) {
      setNotice("We couldn't spot an item in that phrase. Try “2 notebooks and 1 blue pen”.");
      return;
    }
    saveGuestItems([...parsed.map((item) => ({ ...item, id: newId(), owner: "You", request: text })), ...items]);
    setDraft("");
    setNotice(`${parsed.length} ${parsed.length === 1 ? "item" : "items"} added to your browser-only demo list.`);
  }

  function changeQuantity(id: string, delta: number) {
    saveGuestItems(items.map((item) => item.id === id ? { ...item, quantity: Math.max(1, Math.min(1000, item.quantity + delta)) } : item));
  }
  function removeItem(id: string) {
    saveGuestItems(items.filter((item) => item.id !== id));
    setNotice("Item removed from this browser's demo list.");
  }
  function resetDemo() {
    saveGuestItems([]);
    setNotice("Your local demo list has been reset. Sample group data stays available.");
  }

  return <main className="workspace-page demo-workspace">
    <header className="workspace-nav demo-nav">
      <BrandMark />
      <nav className="workspace-links" aria-label="Demo navigation">
        <Link className={!isGroup ? "workspace-link active" : "workspace-link"} href="/demo"><ClipboardList size={16} /> My demo list</Link>
        <Link className={isGroup ? "workspace-link active" : "workspace-link"} href="/demo/group"><UsersRound size={16} /> Group view</Link>
      </nav>
      <div className="demo-nav-actions"><span className="guest-pill">GUEST DEMO · NO ACCOUNT</span><Link href="/register" className="button button-dark button-small">Create account <ArrowUpRight size={14} /></Link></div>
    </header>

    <div className="workspace-content demo-content">
      <div className="demo-banner"><span className="demo-banner-dot" /> This is a private demo on this device. Changes stay in this browser and are not sent to the group database.</div>
      {!isGroup ? <>
        <div className="page-welcome"><div><span className="page-kicker">GUEST WALKTHROUGH</span><h1>Try the list, no sign-in needed.</h1><p>Add a sample request and see it roll into your browser-only totals.</p></div><span className="date-chip">DEMO MODE</span></div>
        <section className="composer-panel"><div className="panel-heading"><div><span className="section-kicker"><Plus size={14} /> TRY IT YOURSELF</span><h2>What do you need?</h2><p>Type a natural request in English or Hinglish.</p></div><div className="ai-badge"><span className="pulse-dot" /> Quick parser</div></div>
          <form className="composer-form" onSubmit={addRequirement}><label className="sr-only" htmlFor="guest-requirements">What do you need?</label><textarea id="guest-requirements" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="bhai 2 notebook aur ek blue pen" maxLength={1000} required rows={3} /><div className="composer-footer"><span className="composer-hint">English or Hinglish — your list stays on this device</span><button className="button button-primary" type="submit"><Plus size={15} /> Add to demo list</button></div>{notice && <p className="form-alert success" role="status">{notice}</p>}</form>
        </section>
        <section className="summary-stats"><article className="stat-card"><div className="stat-icon stat-violet"><ClipboardList size={18} /></div><div><span>Your demo items</span><strong>{items.length}</strong></div></article><article className="stat-card"><div className="stat-icon stat-mint"><Boxes size={18} /></div><div><span>Your requested quantity</span><strong>{ownTotal}</strong></div></article><article className="stat-card"><div className="stat-icon stat-sand"><UsersRound size={18} /></div><div><span>Sample group quantity</span><strong>{allTotal}</strong></div><Link href="/demo/group" aria-label="Open sample group totals"><ArrowUpRight size={17} /></Link></article></section>
        <section className="list-section"><div className="list-heading"><div><span className="section-kicker">YOUR LOCAL DEMO</span><h2>Items you’ve added <span className="count-pill">{items.length}</span></h2></div>{items.length > 0 && <button className="demo-reset" type="button" onClick={resetDemo}><RotateCcw size={14} /> Reset my demo</button>}</div>
          {items.length === 0 ? <div className="empty-state"><div className="empty-illustration"><ClipboardList size={26} /></div><h3>Your list starts here</h3><p>Try “bhai 2 notebook aur ek blue pen” above. It will only be saved in this browser.</p></div> : <div className="items-list">{items.map((item) => <article className="demo-own-item" key={item.id}><div className="demo-own-copy"><strong>{item.name}</strong><span>{item.variant || "Standard"} · From: “{item.request}”</span></div><div className="demo-quantity-control"><button type="button" aria-label={`Decrease ${item.name} quantity`} onClick={() => changeQuantity(item.id, -1)}><Minus size={14} /></button><strong>{amount(item.quantity, item.unit)}</strong><button type="button" aria-label={`Increase ${item.name} quantity`} onClick={() => changeQuantity(item.id, 1)}><Plus size={14} /></button></div><button className="demo-delete" type="button" aria-label={`Remove ${item.name}`} onClick={() => removeItem(item.id)}><Trash2 size={15} /></button></article>)}</div>}
        </section>
        <div className="demo-bottom-links"><Link href="/demo/group" className="button button-primary">See sample group totals <ArrowUpRight size={15} /></Link><Link href="/">Back to home</Link></div>
      </> : <>
        <div className="page-welcome"><div><span className="page-kicker">SAMPLE DATA · GUEST WALKTHROUGH</span><h1>The bigger picture.</h1><p>Fictional sample requests plus anything you added on this device.</p></div><span className="manager-chip"><span className="pulse-dot" /> SAMPLE GROUP</span></div>
        <section className="manager-stats"><article className="manager-stat-card"><span className="manager-stat-icon"><UsersRound size={18} /></span><div><small>SAMPLE PEOPLE</small><strong>{new Set(groupItems.map((item) => item.owner)).size}</strong><span>including your demo list</span></div></article><article className="manager-stat-card"><span className="manager-stat-icon mint"><Boxes size={18} /></span><div><small>ITEM LINES</small><strong>{groupItems.length}</strong><span>sampled requirements</span></div></article><article className="manager-stat-card"><span className="manager-stat-icon peach"><ClipboardList size={18} /></span><div><small>GROUP QUANTITY</small><strong>{allTotal}</strong><span>requested pieces</span></div></article></section>
        <section className="aggregate-panel"><div className="aggregate-head"><div><span className="section-kicker"><Boxes size={14} /> COMBINED SAMPLE NEEDS</span><h2>What the group could buy</h2><p>Matching items and options are added together.</p></div><span className="live-label"><span className="pulse-dot" /> LOCAL DEMO TOTALS</span></div>
          <div className="aggregate-grid">{groupTotals.map((entry) => <article className="aggregate-card" key={`${entry.name}-${entry.variant}-${entry.unit}`}><span className="aggregate-icon"><Boxes size={18} /></span><div className="aggregate-copy"><strong>{entry.name}</strong><span>{entry.variant || "Standard"} · {entry.owners.size} {entry.owners.size === 1 ? "person" : "people"}</span></div><div className="aggregate-amount"><strong>{entry.quantity}</strong><span>{entry.quantity === 1 ? entry.unit : `${entry.unit}${entry.unit === "piece" ? "s" : ""}`}</span></div></article>)}</div>
        </section>
        <section className="member-requests"><div className="list-heading"><div><span className="section-kicker">FICTIONAL SAMPLE REQUESTS</span><h2>Example items <span className="count-pill">{groupItems.length}</span></h2></div><span className="private-label">NOT REAL MEMBER DATA</span></div><div className="demo-sample-list">{groupItems.map((item) => <article className="demo-sample-row" key={item.id}><span className="avatar small-avatar">{item.owner.slice(0, 1)}</span><div><strong>{item.owner}</strong><span>{item.name}{item.variant ? ` · ${item.variant}` : ""} · {amount(item.quantity, item.unit)}</span></div><small>{item.request}</small></article>)}</div></section>
        <div className="demo-bottom-links"><Link href="/demo" className="button button-primary"><ArrowLeft size={15} /> Back to my demo list</Link><Link href="/register">Create a real account <ArrowUpRight size={14} /></Link></div>
      </>}
    </div>
  </main>;
}
