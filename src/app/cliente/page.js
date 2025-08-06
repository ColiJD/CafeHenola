"use client";
import { useState, useEffect } from "react";
import "../../style/cliente.css"; // Importa el CSS

const departamentos = [
  "Atlántida",
  "Choluteca",
  "Colón",
  "Comayagua",
  "Copán",
  "Cortés",
  "El Paraíso",
  "Francisco Morazán",
  "Gracias a Dios",
  "Intibucá",
  "Islas de la Bahía",
  "La Paz",
  "Lempira",
  "Ocotepeque",
  "Olancho",
  "Santa Bárbara",
  "Valle",
  "Yoro",
];

const municipiosPorDepartamento = {
  Atlántida: [
    "La Ceiba",
    "El Porvenir",
    "Esparta",
    "Jutiapa",
    "La Masica",
    "San Francisco",
    "Tela",
    "Arizona",
  ],
  Choluteca: [
    "Choluteca",
    "Apacilagua",
    "Concepción de María",
    "Duyure",
    "El Corpus",
    "El Triunfo",
    "Marcovia",
    "Morolica",
    "Namasigüe",
    "Orocuina",
    "Pespire",
    "San Antonio de Flores",
    "San Isidro",
    "San José",
    "San Marcos de Colón",
    "Santa Ana de Yusguare",
  ],
  Colón: [
    "Trujillo",
    "Balfate",
    "Bonito Oriental",
    "Iriona",
    "Limón",
    "Sabá",
    "Santa Fe",
    "Santa Rosa de Aguán",
    "Sonaguera",
    "Tocoa",
  ],
  Comayagua: [
    "Comayagua",
    "Ajuterique",
    "El Rosario",
    "Esquías",
    "Humuya",
    "La Libertad",
    "Lamaní",
    "La Trinidad",
    "Lejamaní",
    "Meámbar",
    "Minas de Oro",
    "Ojos de Agua",
    "San Jerónimo",
    "San José de Comayagua",
    "San José del Potrero",
    "San Luis",
    "San Sebastián",
    "Siguatepeque",
    "Taulabé",
    "Villa de San Antonio",
  ],
  Copán: [
    "Santa Rosa de Copán",
    "Cabañas",
    "Concepción",
    "Copán Ruinas",
    "Corquín",
    "Cucuyagua",
    "Dolores",
    "Dulce Nombre",
    "El Paraíso",
    "Florida",
    "La Jigua",
    "La Unión",
    "Nueva Arcadia",
    "San Agustín",
    "San Antonio",
    "San Jerónimo",
    "San José",
    "San Juan de Opoa",
    "San Nicolás",
    "San Pedro",
    "Santa Rita",
    "Trinidad de Copán",
    "Veracruz",
  ],
  Cortés: [
    "San Pedro Sula",
    "Choloma",
    "La Lima",
    "Omoa",
    "Pimienta",
    "Potrerillos",
    "Puerto Cortés",
    "San Antonio de Cortés",
    "San Francisco de Yojoa",
    "San Manuel",
    "Santa Cruz de Yojoa",
    "Villanueva",
  ],
  "El Paraíso": [
    "Yuscarán",
    "Alauca",
    "Danlí",
    "El Paraíso",
    "Guinope",
    "Jacaleapa",
    "Liure",
    "Morocelí",
    "Oropolí",
    "Potrerillos",
    "San Antonio de Flores",
    "San Lucas",
    "San Matías",
    "Soledad",
    "Teupasenti",
    "Texiguat",
    "Vado Ancho",
    "Yauyupe",
    "Trojes",
  ],
  "Francisco Morazán": [
    "Distrito Central",
    "Alubarén",
    "Cedros",
    "Curarén",
    "El Porvenir",
    "Guaimaca",
    "La Libertad",
    "La Venta",
    "Lepaterique",
    "Maraita",
    "Marale",
    "Nueva Armenia",
    "Ojojona",
    "Orica",
    "Reitoca",
    "Sabanagrande",
    "San Antonio de Oriente",
    "San Buenaventura",
    "San Ignacio",
    "San Juan de Flores",
    "San Miguelito",
    "Santa Ana",
    "Santa Lucía",
    "Talanga",
    "Tatumbla",
    "Valle de Ángeles",
    "Villa de San Francisco",
    "Vallecillo",
  ],
  "Gracias a Dios": [
    "Puerto Lempira",
    "Ahuas",
    "Brus Laguna",
    "Juan Francisco Bulnes",
    "Ramón Villeda Morales",
    "Wampusirpi",
  ],
  Intibucá: [
    "La Esperanza",
    "Camasca",
    "Colomoncagua",
    "Concepción",
    "Dolores",
    "Intibucá",
    "Jesús de Otoro",
    "Magdalena",
    "Masaguara",
    "San Antonio",
    "San Isidro",
    "San Juan",
    "San Marcos de la Sierra",
    "San Miguelito",
    "Santa Lucía",
    "Yamaranguila",
  ],
  "Islas de la Bahía": ["Roatán", "Guanaja", "José Santos Guardiola", "Utila"],
  "La Paz": [
    "La Paz",
    "Aguanqueterique",
    "Cabañas",
    "Cane",
    "Chinacla",
    "Guajiquiro",
    "Lauterique",
    "Marcala",
    "Mercedes de Oriente",
    "Opatoro",
    "San Antonio del Norte",
    "San José",
    "San Juan",
    "San Pedro de Tutule",
    "Santa Ana",
    "Santa Elena",
    "Santa María",
    "Santiago de Puringla",
    "Yarula",
  ],
  Lempira: [
    "Gracias",
    "Belén",
    "Candelaria",
    "Cololaca",
    "Erandique",
    "Gualcince",
    "Guarita",
    "La Campa",
    "La Iguala",
    "Las Flores",
    "La Unión",
    "La Virtud",
    "Lepaera",
    "Mapulaca",
    "Piraera",
    "San Andrés",
    "San Francisco",
    "San Juan Guarita",
    "San Manuel Colohete",
    "San Rafael",
    "San Sebastián",
    "Santa Cruz",
    "Talgua",
    "Tambla",
    "Tomalá",
    "Valladolid",
    "Virginia",
  ],
  Ocotepeque: [
    "Ocotepeque",
    "Belén Gualcho",
    "Concepción",
    "Dolores Merendón",
    "Fraternidad",
    "La Encarnación",
    "La Labor",
    "Lucerna",
    "Mercedes",
    "San Fernando",
    "San Francisco del Valle",
    "San Jorge",
    "San Marcos",
    "Santa Fe",
    "Sensenti",
    "Sinuapa",
  ],
  Olancho: [
    "Juticalpa",
    "Campamento",
    "Catacamas",
    "Concordia",
    "Dulce Nombre de Culmí",
    "El Rosario",
    "Esquipulas del Norte",
    "Gualaco",
    "Guarizama",
    "Guata",
    "Guayape",
    "Jano",
    "La Unión",
    "Mangulile",
    "Manto",
    "Salamá",
    "San Esteban",
    "San Francisco de Becerra",
    "San Francisco de la Paz",
    "Santa María del Real",
    "Silca",
    "Yocón",
  ],
  "Santa Bárbara": [
    "Santa Bárbara",
    "Arada",
    "Atima",
    "Azacualpa",
    "Ceguaca",
    "Concepción del Norte",
    "Concepción del Sur",
    "Chinda",
    "El Níspero",
    "Gualala",
    "Ilama",
    "Las Vegas",
    "Macuelizo",
    "Naranjito",
    "Nuevo Celilac",
    "Petoa",
    "Protección",
    "Quimistán",
    "San Francisco de Ojuera",
    "San José de Colinas",
    "San Luis",
    "San Marcos",
    "San Nicolás",
    "San Pedro Zacapa",
    "Santa Rita",
    "Trinidad",
  ],
  Valle: [
    "Nacaome",
    "Alianza",
    "Amapala",
    "Aramecina",
    "Caridad",
    "Goascorán",
    "Langue",
    "San Francisco de Coray",
    "San Lorenzo",
  ],
  Yoro: [
    "Yoro",
    "Arenal",
    "El Negrito",
    "El Progreso",
    "Jocón",
    "Morazán",
    "Olanchito",
    "Santa Rita",
    "Sulaco",
    "Victoria",
    "Yorito",
  ],
};

export default function ClienteForm() {
  const [clienteCedula, setClienteCedula] = useState("");
  const [clienteNombre, setClienteNombre] = useState("");
  const [clienteApellido, setClienteApellido] = useState("");
  const [clienteDirecion, setClienteDirecion] = useState("");
  const [clienteDepartament, setClienteDepartament] = useState("");
  const [clienteMunicipio, setClienteMunicipio] = useState("");
  const [claveIHCAFE, setClaveIHCAFE] = useState("");
  const [clienteTelefono, setClienteTelefono] = useState("");
  const [clienteRTN, setClienteRTN] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setClienteMunicipio("");
  }, [clienteDepartament]);

  async function handleSubmit(e) {
    e.preventDefault();
    setMensaje("");
    setError("");

    const data = {
      clienteCedula,
      clienteNombre,
      clienteApellido,
      clienteDirecion,
      clienteMunicipio,
      clienteDepartament,
      claveIHCAFE: claveIHCAFE ? Number(claveIHCAFE) : null,
      clienteTelefono,
      clienteRTN: clienteRTN ? Number(clienteRTN) : null,
    };

    try {
      const res = await fetch("/api/clientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        setMensaje("Cliente creado con éxito");
        setClienteCedula("");
        setClienteNombre("");
        setClienteApellido("");
        setClienteDirecion("");
        setClienteDepartament("");
        setClienteMunicipio("");
        setClaveIHCAFE("");
        setClienteTelefono("");
        setClienteRTN("");
      } else {
        const err = await res.json();
        setError("Error: " + (err.error || "No se pudo crear el cliente"));
      }
    } catch (err) {
      setError("Error de red o servidor");
    }
  }

  return (
    <form className="cliente-form" onSubmit={handleSubmit}>
      <h2 style={{ textAlign: "center", marginBottom: "1rem" }}>Cliente</h2>
      <input
        type="text"
        placeholder="Cédula"
        value={clienteCedula}
        onChange={(e) => setClienteCedula(e.target.value)}
        maxLength={13}
        required
      />
      <input
        type="text"
        placeholder="Nombre"
        value={clienteNombre}
        onChange={(e) => setClienteNombre(e.target.value)}
        maxLength={20}
        required
      />
      <input
        type="text"
        placeholder="Apellido"
        value={clienteApellido}
        onChange={(e) => setClienteApellido(e.target.value)}
        maxLength={20}
        required
      />
      <input
        type="text"
        placeholder="Dirección"
        value={clienteDirecion}
        onChange={(e) => setClienteDirecion(e.target.value)}
        maxLength={200}
        required
      />

      <select
        value={clienteDepartament}
        onChange={(e) => setClienteDepartament(e.target.value)}
        required
      >
        <option value="">Seleccione departamento</option>
        {departamentos.map((dep) => (
          <option key={dep} value={dep}>
            {dep}
          </option>
        ))}
      </select>

      <select
        value={clienteMunicipio}
        onChange={(e) => setClienteMunicipio(e.target.value)}
        disabled={!clienteDepartament}
        required
      >
        <option value="">Seleccione municipio</option>
        {(municipiosPorDepartamento[clienteDepartament] || []).map((mun) => (
          <option key={mun} value={mun}>
            {mun}
          </option>
        ))}
      </select>

      <input
        type="number"
        placeholder="Clave IHCAFE"
        value={claveIHCAFE}
        onChange={(e) => setClaveIHCAFE(e.target.value)}
      />
      <input
        type="text"
        placeholder="Teléfono"
        value={clienteTelefono}
        onChange={(e) => setClienteTelefono(e.target.value)}
        maxLength={13}
      />
      <input
        type="number"
        placeholder="RTN"
         maxLength={1}
        value={clienteRTN}
        onChange={(e) => setClienteRTN(e.target.value)}
      />

      <button type="submit">Crear Cliente</button>

      {mensaje && <p className="message">{mensaje}</p>}
      {error && <p className="error">{error}</p>}
    </form>
  );
}
