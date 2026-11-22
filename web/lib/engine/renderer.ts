import { Offer, RenderOpts, Theme, THEMES } from "./types";
import { effectiveEndIso, offsetLabel, offsetStrToMinutes, fmtDateAtTz } from "./dates";
import { esc, bestText } from "./text";

export function discountPct(o: Offer): number {
  if (o.old > 0 && o.new > 0 && o.new < o.old) return Math.round((1 - o.new / o.old) * 100);
  return 0;
}

export function cur(o: Offer): string {
  return o.currency || "$";
}

export function campaignWord(o: Offer): string {
  const seg = String(o.ribbon || "").split("—")[0].trim();
  if (!seg) return "Black Friday";
  return seg.toLowerCase().replace(/(^|[\s\-])([a-z])/g, (_, a: string, b: string) => a + b.toUpperCase());
}

export function campaignLabel(o: Offer): string {
  const nm = String(o.name || "").trim(), rb = String(o.ribbon || "").split("—")[0].trim();
  return nm && rb ? nm + " — " + rb : nm || rb || "";
}

/** analytics runs ONLY in the exported page — never inside the builder preview.
    Guards: preview mode omits silently; otherwise it must look like a <script>
    snippet and stay under 4000 chars. */
function analyticsHtml(o: Offer, opts: RenderOpts): string {
  const a = String(o.analytics || "");
  if (!a) return "";
  if (opts.preview) return "";
  if (a.length > 4000) return "";
  if (a.indexOf("<scr" + "ipt") === -1) return "";
  return a;
}

export function watermarkBadge(): string {
  return '<a href="https://bfrocket-qmc2.zai-ai.site" target="_blank" rel="noopener" style="position:fixed;bottom:10px;right:12px;background:rgba(0,0,0,.75);color:#fff;font-size:11px;padding:6px 10px;border-radius:99px;text-decoration:none;font-family:system-ui">⚡ Built with BF Rocket — make yours in 5 min</a>';
}

/**
 * Renderer — builds the full standalone deal-page HTML.
 * Pure function: same offer + opts → same bytes, every time, on any machine.
 */
export function renderer(input: Offer, opts: RenderOpts = {}): string {
  const o: Offer = { ...input };
  if (o.logo && !/^data:image\//.test(o.logo)) o.logo = "";   // defense-in-depth: only image data URLs
  if (o.shot && !/^data:image\//.test(o.shot)) o.shot = "";
  const t: Theme = THEMES[o.theme] || THEMES.midnight;
  const pct = discountPct(o);
  const feats = (o.feats || []).filter(Boolean);
  const noCount = !!o.noCountdown;
  const watermark = !!opts.watermark;
  const badge = watermark ? watermarkBadge() : "";
  const logo = o.logo
    ? '<img src="' + o.logo + '" alt="logo" style="width:56px;height:56px;border-radius:14px;object-fit:cover;box-shadow:0 4px 20px rgba(0,0,0,.3)">'
    : '<div style="width:56px;height:56px;border-radius:14px;background:' + o.accent + ';display:flex;align-items:center;justify-content:center;font-size:26px">🔥</div>';
  const priceBlock =
    '<div id="priceRow" style="display:flex;align-items:baseline;gap:14px;flex-wrap:wrap;justify-content:center">' +
      (pct > 0 ? '<span style="font-size:26px;color:' + t.sub + ';text-decoration:line-through">' + cur(o) + o.old + '</span>' : '') +
      '<span style="font-size:64px;font-weight:900;letter-spacing:-2px;color:' + t.text + '">' + cur(o) + o.new + '</span>' +
      (pct > 0 ? '<span style="background:' + o.accent + ';color:' + bestText(o.accent) + ';font-weight:800;font-size:18px;padding:6px 14px;border-radius:10px">-' + pct + '%</span>' : '') +
    '</div>';
  const featsHtml = feats.length ? '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:12px;max-width:760px;margin:44px auto 0">' +
      feats.map((f) =>
        '<div style="background:' + t.panel + ';border:1px solid rgba(255,255,255,.07);border-radius:14px;padding:16px;text-align:left;font-size:14.5px;color:' + t.text + ';display:flex;gap:10px;align-items:flex-start"><span style="color:' + o.accent + ';font-weight:900">✓</span><span>' + esc(f) + '</span></div>'
      ).join("") + '</div>' : '';
  const tstm: string[] = [];
  if (o.t1) tstm.push(o.t1); if (o.t2) tstm.push(o.t2);
  const tstmHtml = tstm.length ? '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px;max-width:760px;margin:20px auto 0">' +
      tstm.map((x) => '<div style="background:' + t.panel + ';border-radius:14px;padding:18px;font-size:14px;color:' + t.text + ';font-style:italic">' + esc(x) + '</div>').join("") + '</div>' : '';
  const guar = o.guar ? '<div style="font-size:12.5px;color:' + t.sub + ';margin-top:10px">✓ Instant access &nbsp;·&nbsp; ✓ 30-day money-back guarantee</div>' : '';

  const cw = campaignWord(o);
  const title = pct > 0 ? '🔥 ' + o.name + ' — ' + pct + '% off ' + cw : '🔥 ' + o.name + ' — ' + cw;
  const descSnip = (o.tag || o.desc || '').slice(0, 155);

  // deadline: one absolute ISO instant (with offset) — identical countdown for every
  // visitor. Fallback when unset: next Cyber Monday (Nov 30), in the campaign's timezone.
  const endIso = effectiveEndIso(o);
  let endOff = offsetStrToMinutes(o.tz); if (endOff === null) endOff = -new Date().getTimezoneOffset();
  const endDisp = fmtDateAtTz(new Date(endIso).getTime(), endOff, true) + " (" + offsetLabel(endOff) + ")";

  return '<!DOCTYPE html>\n<html lang="' + esc(o.lang || "en") + '"><head><meta charset="UTF-8">' +
  '<meta name="viewport" content="width=device-width,initial-scale=1">' +
  '<title>' + esc(title) + '</title>' +
  '<meta name="description" content="' + esc(descSnip) + '">' +
  '<meta property="og:title" content="' + esc(title) + '">' +
  '<meta property="og:description" content="' + esc(descSnip) + '">' +
  '<meta property="og:type" content="website">' +
  (watermark
    ? ''
    : (o.pageUrl
        ? '<meta property="og:url" content="' + esc(o.pageUrl) + '">' +
          '<meta property="og:image" content="' + esc(o.pageUrl.replace(/\/+$/, "")) + '/og.png">' +
          '<meta name="twitter:image" content="' + esc(o.pageUrl.replace(/\/+$/, "")) + '/og.png">'
        : '<meta property="og:image" content="og.png">') +
      '<meta property="og:image:width" content="1200">' +
      '<meta property="og:image:height" content="630">' +
      '<meta name="twitter:card" content="summary_large_image">') +
  '<meta name="twitter:title" content="' + esc(title) + '">' +
  '<meta name="twitter:description" content="' + esc(descSnip) + '">' +
  '<style>' +
  '*{box-sizing:border-box;margin:0;padding:0}' +
  'html,body{height:100%}' +
  'body{background:' + t.bg + ';color:' + t.text + ';font-family:system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;-webkit-font-smoothing:antialiased}' +
  '.ribbon{background:' + o.accent + ';color:' + bestText(o.accent) + ';text-align:center;font-weight:800;font-size:13px;letter-spacing:1.5px;padding:10px 16px}' +
  '.ribbon .dot{display:inline-block;width:8px;height:8px;border-radius:50%;background:#fff;margin-right:8px;animation:p 1.2s infinite}' +
  '@keyframes p{0%,100%{opacity:1}50%{opacity:.3}}' +
  '.hero{max-width:860px;margin:0 auto;padding:64px 20px 48px;text-align:center}' +
  'h1{font-size:clamp(34px,6vw,58px);font-weight:900;letter-spacing:-1.5px;line-height:1.08;margin:20px 0 12px}' +
  '.tag{font-size:19px;color:' + t.sub + ';max-width:560px;margin:0 auto;line-height:1.5}' +
  '.desc{font-size:15.5px;color:' + t.sub + ';max-width:620px;margin:14px auto 0;line-height:1.6}' +
  '.count{display:flex;gap:10px;justify-content:center;margin:36px 0}' +
  '.cd{background:' + t.panel + ';border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:14px 0;min-width:84px}' +
  '.cd b{display:block;font-size:34px;font-weight:900;font-variant-numeric:tabular-nums}' +
  '.cd span{font-size:10.5px;text-transform:uppercase;letter-spacing:1.5px;color:' + t.sub + '}' +
  '.cta{display:inline-block;background:' + t.btn + ';color:' + t.btnText + ';font-weight:800;font-size:19px;padding:18px 44px;border-radius:16px;text-decoration:none;transition:transform .15s ease,box-shadow .15s ease;box-shadow:0 8px 30px rgba(0,0,0,.35)}' +
  '.cta:hover{transform:translateY(-2px);box-shadow:0 14px 40px rgba(0,0,0,.45)}' +
  '.dealend{display:none;background:' + t.panel + ';border:1px solid rgba(255,255,255,.1);color:' + t.sub + ';padding:16px 24px;border-radius:14px;font-size:16px;font-weight:700}' +
  '.sec{text-align:center;padding:10px 20px 70px}' +
  '.endline{text-align:center;color:' + t.sub + ';font-size:13px;margin-top:26px}' +
  '.foot{border-top:1px solid rgba(255,255,255,.07);padding:26px;text-align:center;color:' + t.sub + ';font-size:12.5px}' +
  '@media(max-width:640px){.cd{min-width:64px;padding:10px 0}.cd b{font-size:24px}.cta{width:100%;max-width:340px}}' +
  '</style></head><body>' +
  '<div class="ribbon"><span class="dot"></span>' + esc(o.ribbon || 'BLACK FRIDAY — LIMITED TIME') + '</div>' +
  '<div class="hero">' +
    '<div style="display:flex;justify-content:center">' + logo + '</div>' +
    '<h1>' + esc(o.name) + '</h1>' +
    '<div class="tag">' + esc(o.tag) + '</div>' +
    (o.desc ? '<div class="desc">' + esc(o.desc) + '</div>' : '') +
    (o.shot ? '<div style="margin:26px auto 0"><img src="' + o.shot + '" alt="product preview" style="max-width:min(540px,92%);max-height:300px;border-radius:16px;box-shadow:0 14px 44px rgba(0,0,0,.45);border:1px solid rgba(255,255,255,.12)"></div>' : '') +
    (noCount ? '' : '<div class="count" aria-hidden="true">' +
      '<div class="cd"><b id="cd-d">0</b><span>days</span></div>' +
      '<div class="cd"><b id="cd-h">0</b><span>hrs</span></div>' +
      '<div class="cd"><b id="cd-m">0</b><span>min</span></div>' +
      '<div class="cd"><b id="cd-s">0</b><span>sec</span></div>' +
    '</div>') +
    priceBlock +
    '<div style="margin-top:34px">' +
      '<a class="cta" id="mainCta" href="' + esc(o.url ? (/^https?:\/\//i.test(o.url) ? o.url : "https://" + o.url) : '#') + '"' + (o.url ? ' target="_blank" rel="noopener"' : '') + '>' + esc(o.cta || 'Grab the deal') + ' →</a>' +
      (noCount ? '' : ' <div class="dealend" id="dealEnd" role="status">⌛ The deal has ended — the price is back to normal.</div>') +
      guar +
    '</div>' +
  '</div>' +
  '<div class="sec">' + featsHtml + tstmHtml +
    (noCount ? '' : '<div class="endline">Offer ends <b id="endDate"></b>. When the timer hits zero, the price goes back up.</div>') +
  '</div>' +
  '<div class="foot">© ' + new Date().getFullYear() + ' ' + esc(o.name) + '</div>' +
  badge +
  '<script>\n' +
  'var end=new Date("' + esc(endIso) + '");\n' +
  'function pad(n){return n<10?"0"+n:""+n}\n' +
  'function q(id){return document.getElementById(id)}\n' +
  'function tick(){\n' +
  '  if(!q("cd-d")) return;   // evergreen variant has no countdown\n' +
  '  var diff=end-new Date();\n' +
  '  if(diff<=0){\n' +
  '    q("cd-d").parentNode.parentNode.style.display="none";\n' +
  '    var pr=q("priceRow"); if(pr){pr.style.display="none";}\n' +
  '    var de=q("dealEnd"); if(de){de.style.display="inline-block";}\n' +
  '    var c=q("mainCta"); if(c){c.style.display="none";}\n' +
  '    return;\n' +
  '  }\n' +
  '  var s=Math.floor(diff/1000),d=Math.floor(s/86400),h=Math.floor(s%86400/3600),m=Math.floor(s%3600/60);\n' +
  '  q("cd-d").textContent=d;\n' +
  '  q("cd-h").textContent=pad(h);\n' +
  '  q("cd-m").textContent=pad(m);\n' +
  '  q("cd-s").textContent=pad(s%60);\n' +
  '  setTimeout(tick,1000);\n' +
  '}\n' +
  'var en=q("endDate"); if(en) en.textContent=' + JSON.stringify(endDisp) + ';\n' +
  'tick();\n' +
  /* NOTE: the closing tags are split below so that server-side HTML injectors
     (which rewrite the first literal closing body tag they find) can never
     mutate this template string — a mutated string here once shipped broken JS. */
  '<\/script>\n' +
  analyticsHtml(o, opts) + '\n' +
  '</bo' + 'dy></ht' + 'ml>';
}
