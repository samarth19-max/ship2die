import { ZipEntry } from "./types";

/* ---------------- hand-rolled ZIP (stored / no compression) ----------------
   Works in Node and the browser alike — used by /api/pack and the builder. */

let CRC_TABLE: Uint32Array | null = null;
function crcTable(): Uint32Array {
  if (CRC_TABLE) return CRC_TABLE;
  CRC_TABLE = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) { c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1); }
    CRC_TABLE[n] = c >>> 0;
  }
  return CRC_TABLE;
}

export function crc32(bytes: Uint8Array): number {
  const t = crcTable();
  let c = 0xFFFFFFFF;
  for (let i = 0; i < bytes.length; i++) { c = t[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8); }
  return (c ^ 0xFFFFFFFF) >>> 0;
}

function dosDateTime(d: Date = new Date()): [number, number] {
  return [
    (d.getHours() << 11) | (d.getMinutes() << 5) | Math.floor(d.getSeconds() / 2),
    (((d.getFullYear() - 1980) & 0x7f) << 9) | ((d.getMonth() + 1) << 5) | d.getDate(),
  ];
}

/** minimal ZIP writer: local file headers + central directory + EOCD, every entry stored */
export function zipStore(files: ZipEntry[]): Uint8Array {
  const enc = new TextEncoder();
  const names = files.map((f) => enc.encode(f.name));
  const datas = files.map((f) => (f.data instanceof Uint8Array) ? f.data : enc.encode(String(f.data)));
  const dt = dosDateTime();
  const offs: number[] = [], crcs: number[] = [];
  let total = 0;
  for (let i = 0; i < files.length; i++) {
    offs.push(total);
    crcs.push(crc32(datas[i]));
    total += 30 + names[i].length + datas[i].length;
  }
  const cdStart = total;
  for (let i = 0; i < files.length; i++) { total += 46 + names[i].length; }
  total += 22;
  const buf = new Uint8Array(total), dv = new DataView(buf.buffer);
  let p = 0;
  const w16 = (v: number) => { dv.setUint16(p, v, true); p += 2; };
  const w32 = (v: number) => { dv.setUint32(p, v >>> 0, true); p += 4; };
  const wb = (b: Uint8Array) => { buf.set(b, p); p += b.length; };
  for (let i = 0; i < files.length; i++) {
    w32(0x04034b50); w16(20); w16(0x0800); w16(0); w16(dt[0]); w16(dt[1]);
    w32(crcs[i]); w32(datas[i].length); w32(datas[i].length); w16(names[i].length); w16(0);
    wb(names[i]); wb(datas[i]);
  }
  for (let i = 0; i < files.length; i++) {
    w32(0x02014b50); w16(20); w16(20); w16(0x0800); w16(0); w16(dt[0]); w16(dt[1]);
    w32(crcs[i]); w32(datas[i].length); w32(datas[i].length); w16(names[i].length);
    w16(0); w16(0); w16(0); w16(0); w32(0); w32(offs[i]); wb(names[i]);
  }
  w32(0x06054b50); w16(0); w16(0); w16(files.length); w16(files.length);
  w32(total - cdStart - 22); w32(cdStart); w16(0);   // cd size excludes this 22-byte EOCD
  return buf;
}
