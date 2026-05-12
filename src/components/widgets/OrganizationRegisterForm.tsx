/**
 * Organization-Aware Registration Form Component
 *
 * Email/Password registration with organization creation
 * Creates: Organization node, User node, First project
 */

import { useState } from "react";
import { signUpWithPassword } from "../../lib/auth/auth-client";

interface OrganizationRegisterFormProps {
  redirectUrl?: string;
}

const OrganizationRegisterForm = ({
  redirectUrl = "/app/dashboard"
}: OrganizationRegisterFormProps) => {
  const [organizationName, setOrganizationName] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate organization name
    if (!organizationName.trim()) {
      setError("Organization name is required");
      return;
    }

    // Validate passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    // Validate password length
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    try {
      // Step 1: Create user account with Better Auth
      const result = await signUpWithPassword(email, password, name);

      if (result.error) {
        setError(result.error.message || "Registration failed");
        setLoading(false);
        return;
      }

      console.log("[OrgRegister] User account created, setting up organization...");

      // Step 2: Create organization, user node, and first project in graph
      try {
        const response = await fetch("/api/register/setup-organization", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            name,
            organizationName,
          }),
          credentials: "include",
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to setup organization");
        }

        const orgData = await response.json();
        console.log("[OrgRegister] Organization setup complete:", orgData);
      } catch (orgError: any) {
        console.error("[OrgRegister] Organization setup error:", orgError);
        // Continue anyway - user account is created
        setError("Account created but organization setup failed. Please contact support.");
        setLoading(false);
        return;
      }

      // Redirect on success
      console.log("[OrgRegister] Redirecting to", redirectUrl);
      window.location.href = redirectUrl;
    } catch (err: any) {
      console.error("[OrgRegister] Registration error:", err);
      setError(err.message || "An error occurred during registration");
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "12px 16px",
    fontSize: "16px",
    border: "2px solid #e2e8f0",
    borderRadius: "10px",
    outline: "none",
    transition: "all 0.3s",
    backgroundColor: "#f7fafc",
  };

  const labelStyle = {
    display: "block",
    marginBottom: "8px",
    fontSize: "14px",
    fontWeight: "500" as const,
    color: "#4a5568",
  };

  return (
    <div className="organization-register-form">
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
          <label style={labelStyle}>Organization Name</label>
          <input
            style={inputStyle}
            onFocus={(e) => {
              e.target.style.borderColor = "#667eea";
              e.target.style.backgroundColor = "#fff";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#e2e8f0";
              e.target.style.backgroundColor = "#f7fafc";
            }}
            type="text"
            placeholder="Enter your organization name (e.g., Acme Studios)"
            name="organizationName"
            value={organizationName}
            onChange={(e) => setOrganizationName(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        <div className="form-group" style={{ marginBottom: "20px" }}>
          <label style={labelStyle}>Full Name</label>
          <input
            style={inputStyle}
            onFocus={(e) => {
              e.target.style.borderColor = "#667eea";
              e.target.style.backgroundColor = "#fff";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#e2e8f0";
              e.target.style.backgroundColor = "#f7fafc";
            }}
            type="text"
            placeholder="Enter your full name"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        <div className="form-group" style={{ marginBottom: "20px" }}>
          <label style={labelStyle}>Email Address</label>
          <input
            style={inputStyle}
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
          <label style={labelStyle}>Password</label>
          <input
            style={inputStyle}
            onFocus={(e) => {
              e.target.style.borderColor = "#667eea";
              e.target.style.backgroundColor = "#fff";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#e2e8f0";
              e.target.style.backgroundColor = "#f7fafc";
            }}
            type="password"
            placeholder="Create a password (min 8 characters)"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            minLength={8}
          />
        </div>

        <div className="form-group" style={{ marginBottom: "20px" }}>
          <label style={labelStyle}>Confirm Password</label>
          <input
            style={inputStyle}
            onFocus={(e) => {
              e.target.style.borderColor = "#667eea";
              e.target.style.backgroundColor = "#fff";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#e2e8f0";
              e.target.style.backgroundColor = "#f7fafc";
            }}
            type="password"
            placeholder="Confirm your password"
            name="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
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
          {loading ? "Creating account..." : "Create Account & Organization"}
        </button>
      </form>
    </div>
  );
};

export default OrganizationRegisterForm;
