"use client";
import { useRef, useState } from "react";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleUpload = async () => {
    if (!file) return;

    // Basic client-side validation (optional)
    const allowed = [
      "text/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];
    const maxSizeMB = 25;
    if (!allowed.includes(file.type) && !file.name.match(/\.(csv|xlsx|xls)$/i)) {
      setMessage("❌ Please upload a CSV/XLSX/XLS file.");
      return;
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      setMessage(`❌ File too large. Max ${maxSizeMB}MB.`);
      return;
    }

    setLoading(true);
    setMessage("Starting upload...");

    try {
      const formData = new FormData();
      formData.append("file", file);

      setMessage("Uploading file...");
      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      setMessage("Processing response...");

      const contentType = response.headers.get("content-type") || "";
      const contentDisposition = response.headers.get("content-disposition") || "";

      const isAttachment = /attachment/i.test(contentDisposition);
      const looksLikeFile =
        isAttachment ||
        contentType.startsWith("text/plain") ||
        contentType === "application/octet-stream";

      if (response.ok && looksLikeFile) {
        // Download branch
        const blob = await response.blob();

        // Try to pull filename from Content-Disposition
        let filename = `financial-analysis-${Date.now()}.txt`;
        const match = contentDisposition.match(/filename\*?=(?:UTF-8'')?["']?([^"';]+)["']?/i);
        if (match && match[1]) {
          filename = decodeURIComponent(match[1]);
        }

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);

        setMessage("✅ Analysis complete! File downloaded.");
        // reset chooser
        setFile(null);
        if (inputRef.current) inputRef.current.value = "";
        setLoading(false);
        return;
      }

      // If API replies with JSON (success or error)
      let text = await response.text();
      try {
        const json = JSON.parse(text);
        if (response.ok) {
          // Your API might return a message or a URL
          setMessage(json.message || "✅ Analysis complete!");
        } else {
          setMessage(`❌ Error: ${json.error || json.message || "Unknown error."}`);
        }
      } catch {
        // Not JSON (and not a file): show raw text
        setMessage(response.ok ? text : `❌ Server error: ${text}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setMessage(`❌ Network error: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: "50px auto", padding: 20, fontFamily: "Arial" }}>
      <h1>Analyst.ai</h1>
      <p>Upload your Excel file to generate a financial analysis</p>

      <div style={{ border: "2px dashed #ccc", padding: 40, textAlign: "center", margin: "20px 0" }}>
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={(e) => {
            const f = e.target.files?.[0] || null;
            setFile(f);
            setMessage("");
          }}
        />
        {file && <p>Selected: {file.name}</p>}
      </div>

      <button
        onClick={handleUpload}
        disabled={!file || loading}
        style={{
          background: "#0070f3",
          color: "white",
          padding: "10px 20px",
          border: "none",
          borderRadius: 5,
          cursor: loading ? "not-allowed" : "pointer",
          marginBottom: 20,
        }}
      >
        {loading ? "Processing..." : "Create Analysis"}
      </button>

      {message && (
        <div
          style={{
            padding: 10,
            background: message.includes("❌") ? "#fee" : "#efe",
            border: "1px solid #ccc",
            borderRadius: 5,
          }}
        >
          {message}
        </div>
      )}
    </div>
  );
}
