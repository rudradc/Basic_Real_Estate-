import React, { useEffect, useState } from "react";
import { HttpAgent, Actor } from "@dfinity/agent";
import { idlFactory } from "../../declarations/icp_real_estate_backend";
import { Principal } from "@dfinity/principal";

// Use the backend canister ID from environment, or hardcode it
const canisterId = process.env.CANISTER_ID_ICP_REAL_ESTATE_BACKEND || "YOUR_CANISTER_ID_HERE";

// Setup HTTP agent and actor interface
const agent = new HttpAgent();

// ⚠️ Required for local development to trust the self-signed certificate
if (process.env.DFX_NETWORK === "local" || !process.env.DFX_NETWORK) {
  agent.fetchRootKey();
}

const backend = Actor.createActor(idlFactory, {
  agent,
  canisterId,
});

function App() {
  const [properties, setProperties] = useState([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");

  // Fetch properties from the backend
  const loadProperties = async () => {
    try {
      const props = await backend.get_properties();
      setProperties(props);
    } catch (e) {
      console.error("Error loading properties:", e);
    }
  };

  // Add a new property
  const addProperty = async () => {
    if (!name || !price) return;
    try {
      await backend.add_property(name, BigInt(price));
      setName("");
      setPrice("");
      await loadProperties();
    } catch (e) {
      console.error("Error adding property:", e);
    }
  };

  useEffect(() => {
    loadProperties();
  }, []);

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>🏡 ICP Virtual Real Estate</h1>

      <div style={{ marginBottom: "1rem" }}>
        <input
          style={{ marginRight: "10px" }}
          placeholder="Property name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          style={{ marginRight: "10px" }}
          type="number"
          placeholder="Price"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
        <button onClick={addProperty}>Add Property</button>
      </div>

      <h2>📋 Property Listings</h2>
      <ul>
        {properties.map((p, i) => (
          <li key={i} style={{ marginBottom: "8px" }}>
            🏠 <strong>{p.name}</strong> — 💰 {p.price.toString()} — 👤{" "}
            {Principal.from(p.owner).toText()} — {p.is_leased ? "🔒 Leased" : "🟢 Available"}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
