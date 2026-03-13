export function exportToCSV(filename: string, rows: any[]) {
  if (!rows || rows.length === 0) return

  const separator = ','
  const keys = Object.keys(rows[0])

  const csvContent = [
    keys.join(separator),
    ...rows.map((row) =>
      keys
        .map((k) => {
          let cell = row[k] === null || row[k] === undefined ? '' : String(row[k])
          cell = cell.replace(/"/g, '""')
          if (/[",\n]/.test(cell)) {
            cell = `"${cell}"`
          }
          return cell
        })
        .join(separator),
    ),
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
