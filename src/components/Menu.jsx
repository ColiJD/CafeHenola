"use client";

import React from "react";
import "@/style/menu.css"; // Asumiendo que @ apunta a raíz del proyecto
import Link from "next/link";
import Image from "next/image";
import { menuItems } from "@/lib/menu";





export default function Menu() {
  return (
    <main className="menu-container">
      {menuItems.map(({ id, name, image, link }) => (
        <Link key={id} href={link} className="menu-card">
          {/* Si la imagen es importada, usa Image con src importado.
              Si es string, también funciona */}
          <Image
            src={image}
            alt={name}
            className="menu-card-image"
            width={320}
            height={140}
            style={{ objectFit: "cover" }}
            priority={id === 1} // ejemplo: prioridad para la primera imagen
          />
          <h2 className="menu-card-title">{name}</h2>
        </Link>
      ))}
    </main>
  );
}
