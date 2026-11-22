import { Offer, PreflightCheck } from "./types";
import { discountPct, cur, campaignLabel } from "./renderer";
import { endInstant, fmtEndInTz, browserOffsetStr } from "./dates";

/**
 * Pre-flight review — two clearly separated sections:
 * 1. what this tool can verify (pass/fail), 2. what only the user can verify.
 * Pure function: takes the offer + whether an og.png was generated.
 */
export function preflightChecks(o: Offer, ogGenerated: boolean): PreflightCheck[] {
  const out: PreflightCheck[] = [];
  const u = String(o.url || "").trim();
  const uNoScheme = !!u && !/^https?:\/\//i.test(u);
  const uBad = !u || u === "#" || u.toLowerCase().indexOf("example.com") > -1 || uNoScheme;
  out.push({
    state: uBad ? "fail" : "pass", label: "Checkout link", focus: "f_url",
    detail: uBad
      ? (uNoScheme
          ? "“" + u + "” is missing https:// — the button would 404. Fixed automatically on export, but paste the full link to be sure."
          : (u
              ? "“" + u + "” is empty, # or a sample link — buyers can't actually pay"
              : "No checkout link — the page button would point at #"))
      : "Points at " + u,
  });
  const p = String(o.pageUrl || "").trim();
  const pOk = !!p && /^https?:\/\//i.test(p);
  out.push({
    state: pOk ? "pass" : "warn", label: "Public page URL", focus: "f_purl",
    detail: pOk
      ? "Share posts link to " + p
      : "Not decided yet — that's fine: it unlocks after you host. Share posts stay DRAFT with a placeholder until then.",
  });
  const d = endInstant(o);
  const dOk = !!d && d.getTime() > Date.now() + 3600000;
  out.push({
    state: d ? (dOk ? "pass" : "fail") : "fail", label: "Deadline", focus: "f_end",
    detail: !d
      ? "No deadline set"
      : dOk
        ? fmtEndInTz(o) + " — more than an hour away"
        : d.getTime() > Date.now()
          ? "Less than an hour away (" + fmtEndInTz(o) + ")"
          : "Already passed (" + fmtEndInTz(o) + ")",
  });
  const pct = discountPct(o);
  const priceOk = o.new > 0 && o.old > 0 && o.new < o.old && pct >= 1 && pct <= 99 && Math.round((1 - o.new / o.old) * 100) === pct;
  out.push({
    state: priceOk ? "pass" : "fail", label: "Prices", focus: "f_old",
    detail: priceOk
      ? cur(o) + o.old + " regular → " + cur(o) + o.new + " sale — the page badge shows -" + pct + "% (math re-checked)"
      : o.old > 0 && o.new >= o.old
        ? "Sale price " + cur(o) + o.new + " is not below regular price " + cur(o) + o.old
        : "Prices missing or invalid",
  });
  const cl = campaignLabel(o);
  out.push({
    state: cl ? "pass" : "fail", label: "Campaign label", focus: "f_name",
    detail: cl || "Empty — add a product name and/or a ribbon",
  });
  out.push({
    state: ogGenerated ? "pass" : "warn", label: "og.png", focus: "",
    detail: ogGenerated
      ? "Generated — the campaign pack bakes in a fresh copy; keep og.png beside index.html when you host"
      : "Not generated yet — the pack will include a fresh one, but remember og.png must sit beside your HTML when you host",
  });
  return out;
}

/** the "only you can check" list — depends on what the offer actually contains */
export function humanChecks(o: Offer): string[] {
  const list: string[] = [];
  list.push(
    "Open your checkout link (" + (o.url || "none set") + "), buy through it once, and confirm it actually charges " + cur(o) + o.new + "."
  );
  list.push(
    "Confirm your provider's discount/coupon is active until the deadline (" + (fmtEndInTz(o) || "no deadline set") + ")."
  );
  list.push(
    "Confirm the deadline timezone (" + (o.tz || browserOffsetStr()) + ") matches your provider's sale window."
  );
  if (o.guar) list.push("Your page prints a 30-day money-back guarantee — confirm you will actually honor it.");
  if (String(o.analytics || "").trim())
    list.push("Your analytics runs on YOUR exported page — your visitors' data is your responsibility (privacy notice / consent where required).");
  return list;
}
