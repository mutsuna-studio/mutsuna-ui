// Original SVG fixtures: no external requests or third-party assets.
function samplePdf() {
  const content = "BT /F1 18 Tf 40 740 Td (Chat screen sketch - sample document) Tj ET";
  const objects = ["<< /Type /Catalog /Pages 2 0 R >>", "<< /Type /Pages /Kids [3 0 R] /Count 1 >>", "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>", "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>", `<< /Length ${content.length} >>\nstream\n${content}\nendstream`];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => { offsets.push(pdf.length); pdf += `${index + 1} 0 obj\n${object}\nendobj\n`; });
  const xref = pdf.length;
  pdf += `xref\n0 6\n0000000000 65535 f \n${offsets.slice(1).map(offset => `${String(offset).padStart(10, "0")} 00000 n \n`).join("")}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return `data:application/pdf,${encodeURIComponent(pdf)}`;
}
export const chatSamplePdf = samplePdf();
export const chatSampleImage = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="480" height="320" viewBox="0 0 480 320"><rect width="480" height="320" fill="#dceaf0"/><circle cx="364" cy="78" r="28" fill="#f5d49b"/><path d="M0 260 160 90 340 320H0" fill="#71978c"/><path d="m150 320 170-182 160 132v50" fill="#436a61"/><path d="m118 134 42-44 46 55-39-15-23 14" fill="#f5f8f6"/></svg>')}`;
export const chatSampleScreen = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="480" height="320" viewBox="0 0 480 320"><rect width="480" height="320" rx="16" fill="#f6f7f8"/><path d="M0 16Q0 0 16 0h100v320H16Q0 320 0 304Z" fill="#e5e9ed"/><rect x="20" y="24" width="72" height="12" rx="6" fill="#768491"/><rect x="20" y="64" width="80" height="24" rx="6" fill="#c6d3de"/><rect x="20" y="104" width="60" height="8" rx="4" fill="#a9b4be"/><rect x="20" y="128" width="72" height="8" rx="4" fill="#a9b4be"/><rect x="140" y="26" width="160" height="12" rx="6" fill="#566775"/><rect x="140" y="70" width="248" height="62" rx="12" fill="white"/><rect x="154" y="84" width="208" height="8" rx="4" fill="#c3cdd5"/><rect x="154" y="102" width="150" height="8" rx="4" fill="#dbe1e6"/><rect x="208" y="154" width="248" height="62" rx="12" fill="#d4e6de"/><rect x="222" y="170" width="208" height="8" rx="4" fill="#91b3a4"/><rect x="222" y="188" width="140" height="8" rx="4" fill="#aac8bb"/><rect x="140" y="260" width="316" height="40" rx="12" fill="white" stroke="#dbe1e6"/><rect x="418" y="268" width="24" height="24" rx="6" fill="#658b7b"/></svg>')}`;
