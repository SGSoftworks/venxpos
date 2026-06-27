# Sistema de Exportación — saveFile()

## Arquitectura

```
saveFile(defaultName, content, mimeType)
  ├─ showSaveFilePicker disponible?
  │   ├─ Sí → diálogo nativo del SO
  │   │   ├─ Usuario elige carpeta + nombre → escribe archivo → ✅
  │   │   └─ Usuario cancela → ❌ (no se genera nada)
  │   └─ No → fallback ↓
  └─ Fallback: <a download> → descarga directa del navegador
```

## Uso

```ts
import { saveFile } from '../lib/saveFile';

// PDF
const pdfBlob = doc.output('arraybuffer') as ArrayBuffer;
await saveFile('reporte.pdf', new Uint8Array(pdfBlob), 'application/pdf');

// Excel
const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
await saveFile('datos.xlsx', new Uint8Array(buf), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
```

## Formatos soportados

| Tipo | MIME |
|------|------|
| PDF | `application/pdf` |
| Excel | `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` |
| CSV | `text/csv` |

## Compatibilidad

- **Tauri WebView** (Chromium): `showSaveFilePicker()` nativo
- **Chrome/Edge**: `showSaveFilePicker()` nativo
- **Firefox/Safari**: fallback `<a download>`
