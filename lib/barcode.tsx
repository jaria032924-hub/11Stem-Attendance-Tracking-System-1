// Barcode generation utilities using JsBarcode
export function generateBarcodeDataURL(
  value: string,
  options?: {
    format?: string
    width?: number
    height?: number
    displayValue?: boolean
  },
): string {
  // Create a canvas element
  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")

  if (!ctx) {
    throw new Error("Could not get canvas context")
  }

  const { format = "CODE128", width = 2, height = 100, displayValue = true } = options || {}

  // Simple barcode generation using canvas
  // This is a basic implementation - in production you'd use a library like JsBarcode
  const barWidth = width
  const barHeight = height
  const textHeight = displayValue ? 20 : 0

  canvas.width = value.length * barWidth * 8 // Approximate width
  canvas.height = barHeight + textHeight

  // Fill background
  ctx.fillStyle = "white"
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // Draw bars (simplified pattern)
  ctx.fillStyle = "black"
  let x = 0

  // Create a simple pattern based on the value
  for (let i = 0; i < value.length; i++) {
    const charCode = value.charCodeAt(i)
    const pattern = charCode % 8 // Simple pattern generation

    for (let j = 0; j < 8; j++) {
      if ((pattern >> j) & 1) {
        ctx.fillRect(x, 0, barWidth, barHeight)
      }
      x += barWidth
    }
  }

  // Add text if requested
  if (displayValue) {
    ctx.fillStyle = "black"
    ctx.font = "14px monospace"
    ctx.textAlign = "center"
    ctx.fillText(value, canvas.width / 2, barHeight + 16)
  }

  return canvas.toDataURL("image/png")
}

export function downloadBarcode(lrn: string, studentName: string) {
  const dataURL = generateBarcodeDataURL(lrn)
  const link = document.createElement("a")
  link.download = `barcode-${lrn}-${studentName.replace(/\s+/g, "_")}.png`
  link.href = dataURL
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function printStudentCard(student: {
  lrn: string
  name: string
  grade: string
  section: string
}) {
  const barcodeDataURL = generateBarcodeDataURL(student.lrn)

  const printWindow = window.open("", "_blank")
  if (!printWindow) {
    alert("Please allow popups to print student cards")
    return
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Student ID Card - ${student.name}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 20px;
          background: white;
        }
        .card {
          width: 3.375in;
          height: 2.125in;
          border: 2px solid #333;
          border-radius: 8px;
          padding: 16px;
          margin: 0 auto;
          background: white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        .header {
          text-align: center;
          border-bottom: 1px solid #ddd;
          padding-bottom: 8px;
          margin-bottom: 8px;
        }
        .school-name {
          font-size: 14px;
          font-weight: bold;
          color: #333;
          margin: 0;
        }
        .student-info {
          flex: 1;
        }
        .student-name {
          font-size: 16px;
          font-weight: bold;
          margin: 4px 0;
          color: #333;
        }
        .student-details {
          font-size: 12px;
          color: #666;
          margin: 2px 0;
        }
        .barcode-section {
          text-align: center;
          margin-top: 8px;
        }
        .barcode {
          max-width: 100%;
          height: auto;
        }
        .lrn {
          font-size: 10px;
          font-family: monospace;
          margin-top: 4px;
          color: #333;
        }
        @media print {
          body { margin: 0; padding: 10px; }
          .card { box-shadow: none; }
        }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h3 class="school-name">SCHOOL ATTENDANCE SYSTEM</h3>
        </div>
        <div class="student-info">
          <div class="student-name">${student.name}</div>
          <div class="student-details">Grade: ${student.grade}</div>
          <div class="student-details">Section: ${student.section}</div>
        </div>
        <div class="barcode-section">
          <img src="${barcodeDataURL}" alt="Barcode" class="barcode" />
          <div class="lrn">LRN: ${student.lrn}</div>
        </div>
      </div>
      <script>
        window.onload = function() {
          window.print();
          window.onafterprint = function() {
            window.close();
          };
        };
      </script>
    </body>
    </html>
  `

  printWindow.document.write(html)
  printWindow.document.close()
}
