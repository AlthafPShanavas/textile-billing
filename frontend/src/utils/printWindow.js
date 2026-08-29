// Opens a new window, writes the given HTML into it, and triggers the browser print dialog.
// Shared by the invoice/estimate receipt and the barcode label printer.
export const printHtml = (html) => {
  const printWindow = window.open('', '_blank', 'width=700,height=800');
  if (!printWindow) {
    alert('Pop-up blocked. Please allow pop-ups for this site to print.');
    return;
  }
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
    setTimeout(() => printWindow.close(), 500);
  }, 300);
};
