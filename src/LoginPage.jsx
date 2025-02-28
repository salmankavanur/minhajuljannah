import { useState } from "preact/hooks";
import { useHistory } from "preact-router";

export function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const history = useHistory();

  const handleLogin = () => {
    // Simplified authentication logic (you can replace it with real logic)
    if (username === "admin" && password === "admin123") {
      localStorage.setItem("isAuthenticated", "true");
      history.push("/admin"); // Redirect to admin panel
    } else {
      setLoginError("Invalid username or password");
    }
  };

  return (
    <div className="login-page">
      <h2>Login</h2>
      <input
        type="text"
        placeholder="Username"
        value={username}
        onInput={(e) => setUsername(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onInput={(e) => setPassword(e.target.value)}
      />
      <button onClick={handleLogin}>Login</button>
      {loginError && <p className="error">{loginError}</p>}
    </div>
  );
}
