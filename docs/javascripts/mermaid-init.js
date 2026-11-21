// Render Mermaid fenced code blocks in the MkDocs Material documentation.
document.addEventListener('DOMContentLoaded', () => {
  if (window.mermaid) {
    window.mermaid.initialize({ startOnLoad: true, securityLevel: 'strict' });
  }
});
