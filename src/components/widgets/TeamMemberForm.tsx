/**
 * Team Member Form Component
 *
 * Form for adding a member to a team with role selection.
 * Includes email input and role dropdown (Admin/User/Viewer).
 */

import { useState } from "react";

interface TeamMemberFormProps {
  teamId: string;
  teamName: string;
  onSuccess?: (member: { email: string; role: string }) => void;
  onError?: (error: string) => void;
}

const TEAM_ROLES = [
  { value: "User", label: "User - Can edit and view" },
  { value: "Admin", label: "Admin - Full team management" },
  { value: "Viewer", label: "Viewer - View only" },
];

const TeamMemberForm = ({
  teamId,
  teamName,
  onSuccess,
  onError,
}: TeamMemberFormProps) => {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("User");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Debug: log when component mounts
  console.log('[TeamMemberForm] Component mounted:', { teamId, teamName });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    // Validation
    if (!email.trim()) {
      const errorMsg = "Email is required";
      setError(errorMsg);
      onError?.(errorMsg);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      const errorMsg = "Please enter a valid email address";
      setError(errorMsg);
      onError?.(errorMsg);
      return;
    }

    setLoading(true);

    console.log(`[TeamMemberForm] Adding member to team ${teamId}:`, { email: email.trim(), role });

    try {
      // Add member to team
      const response = await fetch(`/api/teams/${teamId}/members/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          role,
        }),
      });

      console.log(`[TeamMemberForm] Response status:`, response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.log(`[TeamMemberForm] Error response:`, errorData);
        throw new Error(errorData.error || "Failed to add member");
      }

      const data = await response.json();
      console.log(`[TeamMemberForm] Success response:`, data);
      onSuccess?.(data);
      setSuccess(true);
      setEmail("");

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      const errorMsg = err.message || "An error occurred adding the member";
      console.error(`[TeamMemberForm] Error:`, errorMsg, err);
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "8px 12px",
    border: "2px solid #e2e8f0",
    borderRadius: "8px",
    fontSize: "14px",
    backgroundColor: "#f7fafc",
    transition: "all 0.2s",
  };

  const labelStyle = {
    display: "block",
    marginBottom: "4px",
    fontSize: "12px",
    fontWeight: "600",
    color: "#4a5568",
  };

  return (
    <div style={{ padding: "16px", backgroundColor: "#f7fafc", borderRadius: "8px" }}>
      <form onSubmit={handleSubmit}>
        {error && (
          <div
            style={{
              padding: "8px 12px",
              marginBottom: "12px",
              backgroundColor: "#fed7d7",
              color: "#c53030",
              borderRadius: "6px",
              fontSize: "12px",
            }}
          >
            {error}
          </div>
        )}

        {success && (
          <div
            style={{
              padding: "8px 12px",
              marginBottom: "12px",
              backgroundColor: "#c6f6d5",
              color: "#22543d",
              borderRadius: "6px",
              fontSize: "12px",
            }}
          >
            Member added successfully!
          </div>
        )}

        <div style={{ marginBottom: "12px" }}>
          <label style={labelStyle} htmlFor="memberEmail">
            User Email
          </label>
          <input
            id="memberEmail"
            type="email"
            placeholder="user@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            required
            style={inputStyle}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "#667eea";
              e.currentTarget.style.backgroundColor = "#fff";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "#e2e8f0";
              e.currentTarget.style.backgroundColor = "#f7fafc";
            }}
          />
        </div>

        <div style={{ marginBottom: "12px" }}>
          <label style={labelStyle} htmlFor="memberRole">
            Team Role
          </label>
          <select
            id="memberRole"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            disabled={loading}
            style={{
              ...inputStyle,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {TEAM_ROLES.map((teamRole) => (
              <option key={teamRole.value} value={teamRole.value}>
                {teamRole.label}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "8px 16px",
            fontSize: "13px",
            fontWeight: "600",
            color: "white",
            backgroundColor: loading ? "#a0aec0" : "#48bb78",
            border: "none",
            borderRadius: "6px",
            cursor: loading ? "not-allowed" : "pointer",
            transition: "all 0.2s",
          }}
          onMouseOver={(e) => {
            if (!loading) {
              e.currentTarget.style.backgroundColor = "#38a169";
            }
          }}
          onMouseOut={(e) => {
            if (!loading) {
              e.currentTarget.style.backgroundColor = "#48bb78";
            }
          }}
        >
          {loading ? "Adding..." : "Add Member"}
        </button>
      </form>
    </div>
  );
};

export default TeamMemberForm;
