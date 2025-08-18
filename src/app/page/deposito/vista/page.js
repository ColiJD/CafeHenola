"use client";
import { useEffect, useState } from "react";
import "@/style/vista.css";

export default function VistaDeposito() {
  const [depositos, setDepositos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchDepositos() {
      try {
        const res = await fetch(`/api/deposito`); // 🔹 ya no pasamos params
        if (!res.ok) throw new Error("Error al cargar depósitos");
        const data = await res.json();
        setDepositos(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchDepositos();
  }, []);

  if (loading) return <p>Cargando depósitos...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
  <div className="vista-deposito">
    <h2>Depósitos disponibles (vista SQL)</h2>
    {depositos.length === 0 ? (
      <p>No hay depósitos registrados en la vista.</p>
    ) : (
      <table>
        <thead>
          <tr>
            {Object.keys(depositos[0]).map((col) => (
              <th key={col}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {depositos.map((dep, i) => (
            <tr key={i}>
              {Object.values(dep).map((val, j) => (
                <td
                  key={j}
                  data-label={Object.keys(depositos[0])[j]} // 👈 aquí agregamos data-label
                >
                  {String(val)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    )}
  </div>
);

}
