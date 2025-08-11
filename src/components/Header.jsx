"use client";
import { useState } from "react";
import "../style/Header.css";
import Link from "next/link";
export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  // Función para cerrar menú
  const cerrarMenu = () => setMenuOpen(false);
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
          <li>
            <Link href="/" onClick={cerrarMenu}>
              Inicio
            </Link>
          </li>
          <li>
            <Link href="/compra" onClick={cerrarMenu}>
              Compra Directa
            </Link>
          </li>
          <li>
            <Link href="/cliente" onClick={cerrarMenu}>
              Clientes
            </Link>
          </li>
          <li>
            <Link href="/producto" onClick={cerrarMenu}>
              Productos
            </Link>
          </li>
          <li>
            <Link href="/eventos" onClick={cerrarMenu}>
              Eventos
            </Link>
          </li>
        </ul>
      </nav>

      {menuOpen && (
        <div className="backdrop" onClick={() => setMenuOpen(false)} />
      )}
    </>
  );
}
