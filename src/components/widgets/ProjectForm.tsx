/**
 * Project Form Component
 *
 * Form for creating a new project.
 * Includes project name input and optional description.
 */

import { useState } from "react";

interface ProjectFormProps {
  onSuccess?: (project: { id: string; name: string }) => void;
  onError?: (error: string) => void;
}

const ProjectForm = ({
  onSuccess,
  onError,
}: ProjectFormProps) => {
  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!projectName.trim()) {
      const errorMsg = "Project name is required";
      setError(errorMsg);
      onError?.(errorMsg);
      return;
    }

    setLoading(true);

    try {
      // Create project
      const response = await fetch("/api/projects/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: projectName.trim(),
          description: description.trim() || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create project");
      }

      const data = await response.json();
      onSuccess?.(data.project);
      setProjectName("");
      setDescription("");
    } catch (err: any) {
      const errorMsg = err.message || "An error occurred creating the project";
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
        Create New Project
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
          <label style={labelStyle} htmlFor="projectName">
            Project Name
          </label>
          <input
            id="projectName"
            type="text"
            placeholder="e.g., Marketing Videos, Product Demos"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
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
          <label style={labelStyle} htmlFor="description">
            Description <span style={{ fontWeight: "400", color: "#718096" }}>(optional)</span>
          </label>
          <textarea
            id="description"
            placeholder="Brief description of the project..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={loading}
            rows={3}
            style={{
              ...inputStyle,
              resize: "vertical",
              minHeight: "80px",
            }}
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
          {loading ? "Creating Project..." : "Create Project"}
        </button>
      </form>
    </div>
  );
};

export default ProjectForm;
