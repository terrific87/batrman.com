# My Care Graph · Fastest Health Trajectory Score

Standalone static prototype. Run `python3 -m http.server 8000 --bind 127.0.0.1` from the repository root and visit `/my-care-graph/`. No installation or build required. Run the algorithm checks with `node --test my-care-graph/scoring.test.mjs`.

All records and findings are fictional. Algorithm version 0.1.0 is unvalidated; the interface always displays **Prototype score**. It is not a diagnosis or a clinical risk model. Linear thresholds, freshness windows and weights are explicitly provisional; they need clinical validation before use with patients. Extreme readings and sleep duration outside the simplified range require independent interpretation. No score can override a clinical finding.

`scoring.mjs` contains configurable rules, grouping, freshness and domain weights. The UI exposes domain weights. Rule changes require a new algorithm version and validation. `data.mjs` contains the fictional dated source records, preserved device identity and independently displayed clinical/dental findings. `app.mjs` provides record inspection and scenario switching; `style.css` defines palette tokens.

One available indicator is selected per correlated group in rule order. Domain scores average available groups; the overall score reweights available domains. Coverage measures available groups against expected groups using configured domain weights. Missing, invalid, future and stale records do not become zero health scores. Stale records remain inspectable. Zero total weight or no current records produces no score.

Six-month change uses only indicators selected at both dates; wearable indicators additionally require the same device identity. Both comparison scores use identical matched indicators and current weights. Missing comparators, newly available evidence, device switches and selection changes reduce comparison coverage instead of being represented as health improvement. Device metadata is preserved but no cross-device calibration is claimed. Dental findings are never scored; important clinical findings remain independent.

Design reference status: fas-test.ie returned HTTP 403 during development. The palette is sampled from the supplied fastest-care-graph.pdf: #170a2e background, #241040 cards, #43187a primary panels, #fed55c highlights, #ff8945 accents. The supplied PDF is the visual reference; no exact live-site match is claimed. Browser font loading is optional; local system font fallbacks are supplied.
