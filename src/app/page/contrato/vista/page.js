"use client";
import { useEffect, useState } from "react";
import "@/style/vista.css";

export default function VistaContrato() {
  const [contratos, setContratos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchContratos() {
      try {
        const res = await fetch(`/api/contratos`); // 🔹 tu endpoint que haga SELECT * FROM vw_SaldoPorContrato
        if (!res.ok) throw new Error("Error al cargar contratos");
        const data = await res.json();
        setContratos(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchContratos();
  }, []);

  if (loading) return <p>Cargando contratos...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

 return (
  <div className="vista-deposito">
    <h2>Contratos (Saldo por Contrato)</h2>
    {contratos.length === 0 ? (
      <p>No hay contratos registrados en la vista.</p>
    ) : (
      <table>
        <thead>
          <tr>
            {Object.keys(contratos[0]).map((col) => (
              <th key={col}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {contratos.map((c, i) => (
            <tr key={i}>
              {Object.values(c).map((val, j) => (
                <td
                  key={j}
                  data-label={Object.keys(contratos[0])[j]} // 👈 aquí agregamos data-label
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
