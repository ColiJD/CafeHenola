"use client"
import { useState } from "react";
import "../style/Header.css";
import Link from "next/link";
export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <header className="header">
        <h1 className="title">Cafe Henola</h1>
        <button
          aria-label="Toggle menu"
          onClick={() => setMenuOpen(!menuOpen)}
          className="burger-button"
        >
          <div className="bar"></div>
          <div className="bar"></div>
          <div className="bar"></div>
        </button>
      </header>

      <nav className={`side-menu ${menuOpen ? "open" : ""}`}>
        <ul className="menu-list">
          <li><Link href="/">Inicio</Link></li>
          <li><Link href="/compra">Compra Directa</Link></li>
          <li><Link href="/cliente">Clientes</Link></li>
          <li><Link href="/cliente">Productos</Link></li>
        </ul>
      </nav>

      {menuOpen && <div className="backdrop" onClick={() => setMenuOpen(false)} />}
    </>
  );
}
