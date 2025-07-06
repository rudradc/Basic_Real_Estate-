import React, { useEffect, useState } from "react";
import { AuthClient } from "@dfinity/auth-client";
import { HttpAgent, Actor } from "@dfinity/agent";
import { idlFactory } from "../../declarations/icp_real_estate_backend";
import { Principal } from "@dfinity/principal";

const canisterId = import.meta.env.VITE_CANISTER_ID_ICP_REAL_ESTATE_BACKEND;
const isLocal = import.meta.env.VITE_DFX_NETWORK === "local";

// Create agent & actor
let agent = new HttpAgent();
if (isLocal) {
  agent.fetchRootKey(); // Trust self-signed cert in local dev
}
let backend = Actor.createActor(idlFactory, {
  agent,
  canisterId,
});

function App() {
  const [properties, setProperties] = useState([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [userPrincipal, setUserPrincipal] = useState("");

  // Load properties from backend
  const loadProperties = async () => {
    try {
      const props = await backend.get_properties();
      setProperties(props);
    } catch (e) {
      console.error("Error loading properties:", e);
    }
  };

  // Add new property
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

  // Login with Internet Identity
  const loginWithII = async () => {
    const authClient = await AuthClient.create();
    await authClient.login({
      identityProvider: isLocal
        ? `http://localhost:4943?canisterId=${import.meta.env.VITE_CANISTER_ID_INTERNET_IDENTITY}`
        : "https://identity.ic0.app",
      onSuccess: async () => {
        const identity = authClient.getIdentity();
        const principal = identity.getPrincipal().toText();
        setUserPrincipal(principal);

        // Replace agent with authenticated one
        agent = new HttpAgent({ identity });
        if (isLocal) {
          await agent.fetchRootKey();
        }
        backend = Actor.createActor(idlFactory, {
          agent,
          canisterId,
        });

        await loadProperties();
      },
    });
  };

  useEffect(() => {
    loadProperties();
  }, []);

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>🏡 ICP Virtual Real Estate</h1>

      {userPrincipal ? (
        <p>✅ Logged in as: {userPrincipal}</p>
      ) : (
        <button onClick={loginWithII}>🔐 Sign in with Internet Identity</button>
      )}

      <div style={{ marginTop: "20px", marginBottom: "1rem" }}>
        <input
          placeholder="Property name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ marginRight: "10px" }}
        />
        <input
          type="number"
          placeholder="Price"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          style={{ marginRight: "10px" }}
        />
        <button onClick={addProperty}>Add Property</button>
      </div>

      <h2>📋 Property Listings</h2>
      <ul>
        {properties.map((p, i) => (
          <li key={i} style={{ marginBottom: "8px" }}>
            🏠 <strong>{p.name}</strong> — 💰 {p.price.toString()} — 👤{" "}
            {Principal.from(p.owner).toText()} —{" "}
            {p.is_leased ? "🔒 Leased" : "🟢 Available"}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
