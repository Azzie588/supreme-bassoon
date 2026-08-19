import { useState } from "preact/hooks";
import { api, ApiError } from "../api";

export function Login(props: { onLogin: () => void }) {
  const [passphrase, setPassphrase] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: Event) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.post("/auth/login", { passphrase });
      props.onLogin();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div class="login-wrap">
      <form class="login-card" onSubmit={submit}>
        <h2 style={{ marginTop: 0 }}>Money Dashboard</h2>
        <div class="field">
          <label for="passphrase">Passphrase</label>
          <input
            id="passphrase"
            type="password"
            autoFocus
            value={passphrase}
            onInput={(e) => setPassphrase((e.currentTarget as HTMLInputElement).value)}
          />
        </div>
        {error && <p class="error-text">{error}</p>}
        <div class="actions-row">
          <button type="submit" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </div>
      </form>
    </div>
  );
}
