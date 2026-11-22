import { BfDays, FinalCountdown } from "@/components/Countdown";

export default function Landing() {
  return (
    <>
      <nav className="lnav">
        <div className="wrap navin">
          <a className="logo" href="/">🚀 <span>BF Rocket</span></a>
          <div className="sp" />
          <a className="navlink" href="#demo">Live demo</a>
          <a className="navlink" href="#features">Features</a>
          <a className="navlink" href="#pricing">Pricing</a>
          <a className="navlink" href="#faq">FAQ</a>
          <a className="btn primary" href="/builder">Build my deal page — free</a>
        </div>
      </nav>

      <header className="hero">
        <div className="wrap">
          <span className="rib"><span className="dot" /> <span id="ribTxt">BLACK FRIDAY 2026 · ONE OFFER IN, ONE PUBLISH PACK OUT</span></span>
          <h1>Enter your offer once.<br /><span className="grad">Publish it without the mistakes.</span></h1>
          <p className="sub">
            Enter your offer once and every piece stays consistent: the page&apos;s buy button opens <b>your checkout link</b>, the launch
            posts point to <b>your page URL</b>, and the deadline ends at the same instant in every visitor&apos;s timezone. Before you
            publish, a pre-flight review runs the tool checks — and the short list only you can do, like <b>opening your checkout to
            confirm it charges the price you entered</b>. Then take one download with everything you need to publish.
          </p>
          <div className="heroc">
            <a className="btn primary big" href="/builder">⚡ Build my deal page — free</a>
            <a className="btn big" href="/examples/snapshot.html" target="_blank" rel="noopener">See a finished deal page</a>
          </div>
          <div className="micro">No signup · no code · free tier exports the HTML page (small badge, 1 of 4 themes) — PRO removes both and adds the campaign pack</div>
          <div className="bfdays">Black Friday is <BfDays /> — enough time to enter your offer once and publish it right.</div>

          <div className="demo" id="demo">
            <div className="framehead">
              <span className="fdot" style={{ background: "#ff5f57" }} /><span className="fdot" style={{ background: "#febc2e" }} /><span className="fdot" style={{ background: "#28c840" }} />
              <span className="fakeurl">bfrocket — live demo, go ahead and type in it</span>
            </div>
            <div className="framebody">
              <iframe src="/builder?demo=1" title="BF Rocket live demo" loading="lazy" />
            </div>
            <div className="zoomhint">☝ That&apos;s the actual product, running live in this page. Enter your offer once — every piece updates from the same details.</div>
          </div>
        </div>
      </header>

      <section id="features">
        <div className="wrap">
          <div className="kicker">What you get</div>
          <h2>The countdown, the crossed-out price, the share banner,<br />the launch posts. Already built.</h2>
          <p className="lead">BF Rocket isn&apos;t a bloated page builder. It does one job: turn your offer into a deal page you can ship tonight — with everything around it consistent.</p>
          <div className="grid">
            <div className="card"><div className="ic">⏳</div><h3>Live countdown that sells</h3><p>Pick your timezone — every visitor sees the countdown end at the same instant. When it hits zero, the page swaps the discounted price for a clean &quot;deal ended&quot; state, automatically.</p></div>
            <div className="card"><div className="ic">💥</div><h3>Strikethrough pricing + % badge</h3><p>Old price crossed out, new price huge, discount badge loud. Quick chips calculate -30% to -80% for you.</p></div>
            <div className="card"><div className="ic">🎨</div><h3>4 pro themes</h3><p>Midnight, Ember, Snow and Neon — tuned color systems, mobile-perfect, contrast-safe on any accent color you pick.</p></div>
            <div className="card"><div className="ic">🖼</div><h3>Share banner, generated</h3><p>A 1200×630 social image with your branding, discount and logo — generated from the same offer entry, so it always matches the page.</p></div>
            <div className="card"><div className="ic">📣</div><h3>Launch posts, written for you</h3><p>X post, Reddit post, Discord blurb and email blast — filled with YOUR offer. Posts point at your page URL; before it&apos;s live they&apos;re clearly marked DRAFT.</p></div>
            <div className="card"><div className="ic">🧪</div><h3>Pre-flight review</h3><p>Before anything goes public: the tool checks what it can (links, prices, deadline, math), and hands you the short list only you can do — like opening your checkout to confirm the charge.</p></div>
          </div>
        </div>
      </section>

      <section style={{ background: "var(--panel)", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}>
        <div className="wrap">
          <div className="kicker">How it works</div>
          <h2>From zero to publish pack in 3 steps</h2>
          <div className="steps">
            <div className="step"><div className="n">1</div><h3>Enter the offer once</h3><p>Product, prices, checkout link, deadline with its timezone. <b>~3 minutes.</b> No account, nothing to install — it runs in your browser and autosaves.</p></div>
            <div className="step"><div className="n">2</div><h3>Review before you publish</h3><p>The pre-flight review checks links, prices and deadline — and tells you honestly what only you can verify: <b>open your checkout and confirm it charges the price you entered.</b></p></div>
            <div className="step"><div className="n">3</div><h3>Download the pack</h3><p>One ZIP: the page, the share banner, launch copy, and a publishing checklist. Free tier exports the standalone HTML page — <b>PRO adds the pack</b>.</p></div>
          </div>
        </div>
      </section>

      <section id="pricing" className="center">
        <div className="wrap">
          <div className="kicker">Pricing hypothesis</div>
          <h2>One price for the pack — that&apos;s the hypothesis.</h2>
          <p className="lead">We&apos;re testing a single launch price for the complete campaign pack. No subscription, no per-page fees — one download per campaign, yours forever.</p>
          <div className="pricecard">
            <span className="tag99">BLACK FRIDAY LAUNCH PRICE</span>
            <div className="priceline"><span className="old">$49</span><span className="new">$19</span></div>
            <div className="micro" style={{ marginBottom: 6 }}>$19 until Nov 30 · $49 after — one-time, yours forever</div>
            <ul className="plist">
              <li>Campaign pack: page, og.png, launch copy, publish checklist</li>
              <li>Launch posts link to YOUR page URL — DRAFT-marked until it&apos;s live</li>
              <li>Timezone-correct deadline on every piece</li>
              <li>All 4 themes, no watermark, unlimited pages</li>
              <li className="free">Free tier: build & preview, 1 of 4 themes, small badge on export, three page variants (BF / Cyber Monday / evergreen) — try before you buy</li>
            </ul>
            <div className="fine" style={{ margin: "0 0 18px" }}>A landing-page designer can charge $300–500. Page builders charge $19–49 <b>every month</b>. This is $19, once.</div>
            <a className="btn primary big" id="buyBtn" href="/builder?buy=1">Unlock PRO — $19</a>
            <div className="fine">Launch-price hypothesis — checkout is not wired into this build yet, so nothing charges today.</div>
          </div>
        </div>
      </section>

      <section id="faq">
        <div className="wrap">
          <div className="kicker">FAQ</div>
          <h2>Questions, answered</h2>
          <div className="faq">
            <div className="qa"><h3>What exactly is in the pack vs the free export?</h3><p>Free: the standalone HTML page you can host anywhere. PRO pack: the same page plus og.png (share banner), launch-copy.txt (posts filled with your offer) and publish-checklist.txt.</p></div>
            <div className="qa"><h3>Does the tool change my checkout or disable my payment link?</h3><p>No — it never touches your provider. The pre-flight review asks YOU to open the checkout and confirm the charge. Hiding the button on the page does not disable the payment link.</p></div>
            <div className="qa"><h3>What if my page URL isn&apos;t decided yet?</h3><p>Posts are generated as drafts with a [PUBLISH-THEN-REPLACE] placeholder. Publish the page, paste its URL into the builder, re-download the pack — done.</p></div>
            <div className="qa"><h3>Which payment providers work as my checkout link?</h3><p>Anything with a URL: Lemon Squeezy, Stripe payment links, Gumroad, Polar, Paddle, Whop… the buy button simply opens your link. You keep 100% of the payment relationship.</p></div>
            <div className="qa"><h3>What happens when the countdown ends?</h3><p>The countdown and the discounted price disappear, and the page shows a clean &quot;the deal has ended — the price is back to normal&quot; message. You can leave it running after the sale without embarrassment.</p></div>
            <div className="qa"><h3>Do you store my product data or my logo?</h3><p>No. Everything runs in your browser and saves to your own device&apos;s local storage. Your images are embedded into your HTML file. There&apos;s no server on our side holding your data.</p></div>
            <div className="qa"><h3>Can I use it again next year?</h3><p>Yes — one-time purchase, unlimited pages, forever. Update the prices next November and ship the same day.</p></div>
            <div className="qa"><h3>Why a tool and not a template?</h3><p>Because you&apos;ll fiddle with a template for three hours and still miss the countdown logic, the OG tags and the mobile layout. BF Rocket is opinionated on purpose: good defaults, zero decisions, live in minutes.</p></div>
            <div className="qa"><h3>Why not Carrd, Framer or Canva?</h3><p>You&apos;d still be making every design decision and hand-wiring countdown logic into a generic template. Canva gives you images, not a page. Countdown widgets need a site you already have. BF Rocket is the bundle: the page as one HTML file, the campaign as one download — decided for you.</p></div>
            <div className="qa"><h3>Can I put the page on my own domain?</h3><p>Yes — and you should for a big sale. Deploy with Netlify Drop, then in the Netlify dashboard open Domain settings → Add a domain and point the DNS records it shows you. Five minutes, free.</p></div>
            <div className="qa"><h3>What if something breaks on Friday night?</h3><p>Your exported page is a plain HTML file — open it, click through it, host it on a free preview URL and test the whole flow before the sale. And if the tool itself fails you, the 30-day refund is unconditional (see the refund page).</p></div>
            <div className="qa"><h3>Can I add product screenshots?</h3><p>Yes — upload one product image and it&apos;s placed front and center on the page; your logo and accent color carry the brand everywhere else. Want more image slots? Tell us — it decides what gets built next.</p></div>
            <div className="qa"><h3>What happens after I pay — and what if I lose my work?</h3><p>A license key arrives by email instantly; paste it into the Unlock PRO modal and the watermark disappears. Your work autosaves in your browser, and “Save project” exports it as a file you can reload anywhere. For belt-and-braces, download the ⬇ Offline builder — the whole tool as one file that runs with no internet.</p></div>
          </div>
        </div>
      </section>

      <section className="final">
        <div className="wrap">
          <div className="kicker">Your countdown starts now</div>
          <h2>The easiest traffic you&apos;ll ever get<br />is here for <span style={{ color: "var(--accent2)" }}>days</span>, not weeks.</h2>
          <FinalCountdown />
          <div className="micro" style={{ marginBottom: 22 }}>…until Cyber Monday ends (11:59 PM, US Eastern) — the biggest sales weekend of the year. Enter your offer once and publish it right.</div>
          <a className="btn primary big" href="/builder">⚡ Build my deal page now</a>
        </div>
      </section>

      <footer className="lfoot">
        <div className="wrap">© 2026 BF Rocket · a solo-founder product · <a href="/builder">builder</a> · <a href="/refund.html">refunds</a> · <a href="/terms.html">terms</a> · <a href="/privacy.html">privacy</a> · built fast during the <a href="https://www.ship-or-die.com/100k-hackathon">Ship or Die</a> hackathon</div>
      </footer>
    </>
  );
}
