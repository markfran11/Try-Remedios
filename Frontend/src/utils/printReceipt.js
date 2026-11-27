export function printReceipt(elementId) {
  const el = document.getElementById(elementId);
  if (!el) {
    console.warn(`printReceipt: element #${elementId} not found`);
    return;
  }

  // Remove any stale print frame
  const old = document.getElementById("__receipt_print_frame__");
  if (old) old.remove();

  // Clone the receipt element and strip every <button> from the clone
  const clone = el.cloneNode(true);
  clone.querySelectorAll("button").forEach((btn) => btn.remove());
  // Also remove any element that only contains buttons (e.g. the action div)
  clone.querySelectorAll("div").forEach((div) => {
    if (div.children.length === 0 && div.textContent.trim() === "") div.remove();
  });

  // Build the authorized signature block
  const signatureBlock = `
    <div class="auth-sig">
      <div class="auth-sig-line"></div>
      <p class="auth-sig-label">Authorized Signature</p>
    </div>
  `;

  const iframe = document.createElement("iframe");
  iframe.id = "__receipt_print_frame__";
  iframe.style.cssText =
    "position:fixed;top:-9999px;left:-9999px;width:800px;height:600px;border:none;";
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument ?? iframe.contentWindow.document;
  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <title>Receipt — Remedios</title>
        <style>
          *, *::before, *::after { box-sizing: border-box; }

          body {
            margin: 0;
            padding: 24px 28px;
            font-family: "Segoe UI", system-ui, -apple-system, sans-serif;
            font-size: 11pt;
            color: #1d241d;
          }

          /* ── Store header ── */
          .receipt-store {
            text-align: center;
            margin-bottom: 14px;
            padding-bottom: 12px;
            border-bottom: 1px dashed #8a8f8a;
          }
          .receipt-store strong {
            display: block;
            font-size: 17pt;
            letter-spacing: 0.5px;
          }
          .receipt-store span {
            font-size: 9.5pt;
            color: #6a736a;
          }

          /* ── panel-head (receipt # row) — hide the button wrapper ── */
          .panel-head {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
          }
          .panel-head h2 { margin: 0; font-size: 12pt; }

          /* ── Meta key-value ── */
          dl.meta {
            display: grid;
            grid-template-columns: auto 1fr;
            gap: 4px 16px;
            margin: 0 0 14px;
            font-size: 10pt;
          }
          dt { color: #6a736a; }
          dd { margin: 0; }

          /* ── Items table ── */
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10pt;
            margin-bottom: 6px;
          }
          th {
            background: #e6e8e6;
            text-align: left;
            padding: 6px 8px;
            font-weight: 600;
          }
          td {
            padding: 6px 8px;
            border-bottom: 1px solid #e6e8e6;
          }

          /* ── Total ── */
          .total {
            text-align: right;
            font-weight: 700;
            font-size: 12pt;
            margin: 8px 0 0;
          }

          /* ── Thank-you footer ── */
          .receipt-thanks {
            text-align: center;
            font-size: 9pt;
            color: #6a736a;
            font-style: italic;
            margin-top: 10px;
            padding-top: 10px;
            border-top: 1px dashed #8a8f8a;
          }

          /* ── Badges ── */
          .badge {
            display: inline-block;
            padding: 1px 8px;
            border-radius: 999px;
            font-size: 8pt;
            font-weight: 600;
            border: 1px solid currentColor;
          }

          /* ── Authorized Signature ── */
          .auth-sig {
            margin-top: 36px;
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            padding-right: 8px;
          }
          .auth-sig-line {
            width: 220px;
            border-bottom: 1px solid #1d241d;
            margin-bottom: 6px;
          }
          .auth-sig-label {
            margin: 0;
            font-size: 9.5pt;
            color: #1d241d;
            text-align: center;
            width: 220px;
          }

          /* Suppress anything left over that shouldn't print */
          button { display: none !important; }
        </style>
      </head>
      <body>
        ${clone.innerHTML}
        ${signatureBlock}
      </body>
    </html>
  `);
  doc.close();

  iframe.contentWindow.focus();

  setTimeout(() => {
    iframe.contentWindow.print();
    setTimeout(() => iframe.remove(), 1500);
  }, 350);
}
