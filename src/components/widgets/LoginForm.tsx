/**
 * Better Auth Login Form Component
 * Email/Password authentication form
 */

import { useState } from "react";
import { signInWithPassword } from "../../lib/auth/auth-client";

interface LoginFormProps {
  redirectUrl?: string;
}

const LoginForm = ({ redirectUrl = "/app/dashboard" }: LoginFormProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signInWithPassword(email, password);

      if (result.error) {
        setError(result.error.message || "Invalid email or password");
        setLoading(false);
        return;
      }

      // Redirect on success
      window.location.href = redirectUrl;
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || "An error occurred during login");
      setLoading(false);
    }
  };

  return (
    <div className="login-form">
      <form onSubmit={handleSubmit}>
        {error && (
          <div
            style={{
              padding: "12px 16px",
              marginBottom: "20px",
              backgroundColor: "#fed7d7",
              color: "#c53030",
              borderRadius: "10px",
              fontSize: "14px",
            }}
          >
            {error}
          </div>
        )}

        <div className="form-group" style={{ marginBottom: "20px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontSize: "14px",
              fontWeight: "500",
              color: "#4a5568",
            }}
          >
            Email Address
          </label>
          <input
            style={{
              width: "100%",
              padding: "12px 16px",
              fontSize: "16px",
              border: "2px solid #e2e8f0",
              borderRadius: "10px",
              outline: "none",
              transition: "all 0.3s",
              backgroundColor: "#f7fafc",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "#667eea";
              e.target.style.backgroundColor = "#fff";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#e2e8f0";
              e.target.style.backgroundColor = "#f7fafc";
            }}
            type="email"
            placeholder="Enter your email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        <div className="form-group" style={{ marginBottom: "20px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontSize: "14px",
              fontWeight: "500",
              color: "#4a5568",
            }}
          >
            Password
          </label>
          <input
            style={{
              width: "100%",
              padding: "12px 16px",
              fontSize: "16px",
              border: "2px solid #e2e8f0",
              borderRadius: "10px",
              outline: "none",
              transition: "all 0.3s",
              backgroundColor: "#f7fafc",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "#667eea";
              e.target.style.backgroundColor = "#fff";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#e2e8f0";
              e.target.style.backgroundColor = "#f7fafc";
            }}
            type="password"
            placeholder="Enter your password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            minLength={8}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "14px",
            fontSize: "16px",
            fontWeight: "600",
            color: "white",
            background: loading
              ? "#a0aec0"
              : "linear-gradient(135deg, #667eea 0%, #7cd1f9 100%)",
            border: "none",
            borderRadius: "10px",
            cursor: loading ? "not-allowed" : "pointer",
            transition: "transform 0.2s, box-shadow 0.2s",
            boxShadow: loading
              ? "none"
              : "0 4px 15px rgba(102, 126, 234, 0.4)",
          }}
          onMouseOver={(e) => {
            if (!loading) {
              (e.target as HTMLButtonElement).style.transform =
                "translateY(-2px)";
              (e.target as HTMLButtonElement).style.boxShadow =
                "0 6px 20px rgba(102, 126, 234, 0.4)";
            }
          }}
          onMouseOut={(e) => {
            if (!loading) {
              (e.target as HTMLButtonElement).style.transform =
                "translateY(0)";
              (e.target as HTMLButtonElement).style.boxShadow =
                "0 4px 15px rgba(102, 126, 234, 0.4)";
            }
          }}
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>
    </div>
  );
};

export default LoginForm;
