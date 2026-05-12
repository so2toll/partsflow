/**
 * Team Form Component
 *
 * Form for creating a new team and optionally assigning it to a project.
 * Includes team name input and optional project selection dropdown.
 */

import { useState } from "react";

interface TeamFormProps {
  organizationId: string;
  projects: Array<{ id: string; name: string }>;
  onSuccess?: (team: { id: string; name: string }) => void;
  onError?: (error: string) => void;
}

const TeamForm = ({
  organizationId,
  projects,
  onSuccess,
  onError,
}: TeamFormProps) => {
  const [teamName, setTeamName] = useState("");
  const [selectedProject, setSelectedProject] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!teamName.trim()) {
      const errorMsg = "Team name is required";
      setError(errorMsg);
      onError?.(errorMsg);
      return;
    }

    setLoading(true);

    try {
      // Create team
      const response = await fetch("/api/teams/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: teamName.trim(),
          organizationId,
          projectId: selectedProject || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create team");
      }

      const data = await response.json();
      onSuccess?.(data);
      setTeamName("");
      setSelectedProject("");
    } catch (err: any) {
      const errorMsg = err.message || "An error occurred creating the team";
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "10px 14px",
    border: "2px solid #e2e8f0",
    borderRadius: "8px",
    fontSize: "14px",
    backgroundColor: "#f7fafc",
    transition: "all 0.2s",
  };

  const labelStyle = {
    display: "block",
    marginBottom: "6px",
    fontSize: "13px",
    fontWeight: "600",
    color: "#4a5568",
  };

  return (
    <div style={{ padding: "20px", backgroundColor: "white", borderRadius: "12px" }}>
      <h3
        style={{
          fontSize: "18px",
          fontWeight: "700",
          margin: "0 0 16px 0",
          color: "#2d3748",
        }}
      >
        Create New Team
      </h3>

      <form onSubmit={handleSubmit}>
        {error && (
          <div
            style={{
              padding: "10px 14px",
              marginBottom: "16px",
              backgroundColor: "#fed7d7",
              color: "#c53030",
              borderRadius: "8px",
              fontSize: "13px",
            }}
          >
            {error}
          </div>
        )}

        <div style={{ marginBottom: "16px" }}>
          <label style={labelStyle} htmlFor="teamName">
            Team Name
          </label>
          <input
            id="teamName"
            type="text"
            placeholder="e.g., Content Team, Video Editors"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
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

        <div style={{ marginBottom: "20px" }}>
          <label style={labelStyle} htmlFor="project">
            Assign to Project <span style={{ fontWeight: "400", color: "#718096" }}>(optional)</span>
          </label>
          <select
            id="project"
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            disabled={loading}
            style={{
              ...inputStyle,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            <option value="">No project (can assign later)</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "12px",
            fontSize: "14px",
            fontWeight: "600",
            color: "white",
            backgroundColor: loading ? "#a0aec0" : "#667eea",
            border: "none",
            borderRadius: "8px",
            cursor: loading ? "not-allowed" : "pointer",
            transition: "all 0.2s",
          }}
          onMouseOver={(e) => {
            if (!loading) {
              e.currentTarget.style.backgroundColor = "#5a67d8";
            }
          }}
          onMouseOut={(e) => {
            if (!loading) {
              e.currentTarget.style.backgroundColor = "#667eea";
            }
          }}
        >
          {loading ? "Creating Team..." : "Create Team"}
        </button>
      </form>
    </div>
  );
};

export default TeamForm;
