/**
 * Graph Explorer Sidebar Component
 *
 * Interactive controls for the graph explorer
 * Query form, add node form, and results display
 */

import { useState } from 'react';

interface GraphData {
  nodes: any[];
  edges: any[];
  stats: {
    nodeCount: number;
    edgeCount: number;
    nodeTypes: string[];
  };
}

interface NodeTypes {
  [key: string]: string;
}

const NODE_COLORS: NodeTypes = {
  Video: "#4CAF50",
  Scene: "#2196F3",
  Detection: "#FF9800",
  AIModel: "#9C27B0",
  Project: "#F44336",
  Asset: "#00BCD4",
  User: "#607D8B",
};

export default function GraphSidebar({ graphData }: { graphData: GraphData }) {
  const [queryResult, setQueryResult] = useState<string>('');
  const [addNodeResult, setAddNodeResult] = useState<string>('');
  const [query, setQuery] = useState<string>(`MATCH (n)
RETURN n
LIMIT 5`);
  const [nodeLabel, setNodeLabel] = useState<string>('');
  const [nodeTitle, setNodeTitle] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleRunQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setQueryResult('');

    try {
      const response = await fetch("/dev/api/graph-query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query }),
      });

      const result = await response.json();
      setQueryResult(JSON.stringify(result, null, 2));
    } catch (error) {
      setQueryResult(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nodeLabel || !nodeTitle) return;

    setLoading(true);
    setAddNodeResult('');

    // Create node ID
    const nodeId = `${nodeLabel.toLowerCase()}_${Date.now()}`;

    // Generate proper Cypher query with parameters
    const createQuery = `CREATE (n:${nodeLabel} {id: $id, title: $title, createdAt: $now}) RETURN n`;

    try {
      const response = await fetch("/dev/api/graph-query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: createQuery,
          params: {
            id: nodeId,
            title: nodeTitle,
            now: new Date().toISOString()
          }
        }),
      });

      const result = await response.json();
      setAddNodeResult(JSON.stringify(result, null, 2) + '\n\n✅ Node created! Refresh the page to see it in the graph.');

      // Clear form
      setNodeLabel('');
      setNodeTitle('');
    } catch (error) {
      setAddNodeResult(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      background: '#1e293b',
      borderRadius: '0.5rem',
      padding: '1rem',
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
    }}>
      <h2 style={{ margin: 0, color: '#94a3b8', fontSize: '1rem' }}>Node Types</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {graphData.stats.nodeTypes.map((type) => (
          <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span
              style={{
                width: '16px',
                height: '16px',
                borderRadius: '4px',
                backgroundColor: NODE_COLORS[type] || '#9E9E9E'
              }}
            ></span>
            <span style={{ fontSize: '0.875rem' }}>{type}</span>
          </div>
        ))}
      </div>

      <h2 style={{ margin: 0, color: '#94a3b8', fontSize: '1rem' }}>Run Query</h2>
      <form onSubmit={handleRunQuery} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          rows={4}
          placeholder="MATCH (n)&#10;RETURN n&#10;LIMIT 5"
          style={{
            background: '#0f172a',
            border: '1px solid #334155',
            borderRadius: '0.25rem',
            color: '#e2e8f0',
            padding: '0.5rem',
            fontFamily: 'monospace',
            fontSize: '0.875rem',
            resize: 'vertical',
          }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            background: loading ? '#4b5563' : '#3b82f6',
            border: 'none',
            borderRadius: '0.25rem',
            color: 'white',
            padding: '0.5rem 1rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: 500,
          }}
        >
          {loading ? '⏳ Running...' : '🔍 Run Query'}
        </button>
      </form>

      {queryResult && (
        <div style={{
          background: '#0f172a',
          borderRadius: '0.25rem',
          padding: '0.5rem',
          minHeight: '100px',
          maxHeight: '300px',
          overflow: 'auto',
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: '#3b82f6' }}>Query Result:</h3>
          <pre style={{ fontSize: '0.75rem', margin: 0 }}>{queryResult}</pre>
        </div>
      )}

      <h2 style={{ margin: 0, color: '#94a3b8', fontSize: '1rem' }}>Add Node</h2>
      <form onSubmit={handleAddNode} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <input
          type="text"
          value={nodeLabel}
          onChange={(e) => setNodeLabel(e.target.value)}
          placeholder="Label (e.g., Video, Scene)"
          required
          style={{
            background: '#0f172a',
            border: '1px solid #334155',
            borderRadius: '0.25rem',
            color: '#e2e8f0',
            padding: '0.5rem',
            fontSize: '0.875rem',
          }}
        />
        <input
          type="text"
          value={nodeTitle}
          onChange={(e) => setNodeTitle(e.target.value)}
          placeholder="Title/Name"
          required
          style={{
            background: '#0f172a',
            border: '1px solid #334155',
            borderRadius: '0.25rem',
            color: '#e2e8f0',
            padding: '0.5rem',
            fontSize: '0.875rem',
          }}
        />
        <button
          type="submit"
          disabled={loading || !nodeLabel || !nodeTitle}
          style={{
            background: loading || !nodeLabel || !nodeTitle ? '#4b5563' : '#10b981',
            border: 'none',
            borderRadius: '0.25rem',
            color: 'white',
            padding: '0.5rem 1rem',
            cursor: loading || !nodeLabel || !nodeTitle ? 'not-allowed' : 'pointer',
            fontWeight: 500,
          }}
        >
          {loading ? '⏳ Adding...' : '➕ Add Node'}
        </button>
      </form>

      {addNodeResult && (
        <div style={{
          background: '#0f172a',
          borderRadius: '0.25rem',
          padding: '0.5rem',
          minHeight: '100px',
          maxHeight: '300px',
          overflow: 'auto',
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: '#10b981' }}>Result:</h3>
          <pre style={{ fontSize: '0.75rem', margin: 0 }}>{addNodeResult}</pre>
        </div>
      )}

      <h2 style={{ margin: 0, color: '#94a3b8', fontSize: '1rem' }}>Database Info</h2>
      <div style={{
        background: '#0f172a',
        borderRadius: '0.25rem',
        padding: '0.5rem',
      }}>
        <p style={{ marginBottom: '0.5rem' }}>📁 Database: <code style={{ color: '#3b82f6', background: '#1e293b', padding: '0.125rem 0.25rem', borderRadius: '0.125rem', fontSize: '0.75rem' }}>data/app.db</code></p>
        <p style={{ marginBottom: '0.5rem' }}>🔗 SQL-Studio: Open <code style={{ color: '#3b82f6', background: '#1e293b', padding: '0.125rem 0.25rem', borderRadius: '0.125rem', fontSize: '0.75rem' }}>data/app.db</code></p>
        <p>🚀 Demo: <code style={{ color: '#3b82f6', background: '#1e293b', padding: '0.125rem 0.25rem', borderRadius: '0.125rem', fontSize: '0.75rem' }}>npx tsx scripts/graph-demo.ts</code></p>
      </div>
    </div>
  );
}