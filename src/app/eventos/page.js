"use client";

import { useEffect, useState } from "react";
import "../../style/eventos.css";

export default function EventosPage() {
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/eventos")
      .then((res) => res.json())
      .then((data) => {
        setEventos(data);
        setLoading(false);
      });
  }, []);

  if (loading)
    return <div className="eventos-loading">Cargando eventos...</div>;

  return (
    <div className="eventos-container">
      <h1 className="eventos-title">Historial de Compras</h1>
      <div className="overflow-auto">
        <table className="eventos-table">
          <thead>
            <tr>
              <th>Numero</th>
              <th>Fecha</th>
              <th>Movimiento</th>
              <th>Cliente</th>
              <th>Tipo Café</th>
              <th>Cantidad QQ</th>
              <th>Total Lps</th>
              <th>Retención</th>
              <th>Comprado en</th>
              <th>Descripción</th>
            </tr>
          </thead>
          <tbody className="tarjeta-body">
            {eventos.map((evento, idx) => (
              <tr key={idx} className="tarjeta">
                <td data-label="Numero">{evento.id}</td>
                <td data-label="Fecha">
                  {new Date(evento.fecha).toLocaleDateString("es-HN")}
                </td>
                <td data-label="Movimiento">{evento.movimiento}</td>
                <td data-label="Cliente">{evento.cliente}</td>
                <td data-label="Tipo Café">{evento.tipoCafe}</td>
                <td data-label="Cantidad QQ" className="eventos-right">
                  {evento.cantidadQQ}
                </td>
                <td data-label="Total Lps" className="eventos-right">
                  {evento.totalLps}
                </td>
                <td data-label="Retención" className="eventos-right">
                  {evento.retencionLps}
                </td>
                <td data-label="Comprado en">{evento.formaPago || "-"}</td>
                <td data-label="Descripción">{evento.descripcion}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
