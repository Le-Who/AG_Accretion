# Pair Bloom safety and balance

## Root cause

Previously every pair chose its landing point independently, checking only the Queen and perimeter. Multiple results could overlap each other or bystanders. Collision separation and ordinary merge shockwaves then displaced neighbouring slimes. The old geometry tests covered a single slime beside the Queen, not competing landing sites.

## Resolution

Bloom now searches deterministic, nonoverlapping landing sites with 12px perimeter clearance, considering bystanders and already reserved results. A pair without a safe site stays playable for a later activation. No successful pair means no charge consumption.

The existing 650ms animation is atomic: bystander physics and launches are held, so reserved sites cannot become occupied during travel. This invariant replaces the need to relocate results at the last frame. Danger/combo/cooldown time is held with physics and resumes with the same remaining values; overflow is still detected, not cleared. Bloom and its immediate merge descendants emit visual effects but no physical shockwaves.

Charge: ordinary merge +6%, Sun/Moon merge +10%, Queen evolution +15%. Bloom results and their subsequent automatic chain do not recharge the ability until the player launches again. The pill shows actual charge with a 400ms visual fill transition; readiness depends on actual charge, not animation time.

A maximum-level Queen absorbs at most one maximum-level slime per activation and gains +0.5× to the run score multiplier. Her radius and tier do not increase. The bonus multiplies merge/evolution score alongside temporary combo and resets on restart. It is visible in score details.

Desktop uses symmetric grid tracks: the actual Next canvas, rather than its label group, is centered. Harmony is left; score, Bloom, settings are right. Mobile layout is preserved.

Verification: regression tests cover reserved results, unmoved bystanders, blocked pairs remaining dynamic, persistent hazard, timer hold/resume, slower charge, no Bloom self-recharge, single-Titan absorption, scoring and restart. Browser checks cover 601/768/1024/1440px desktop centering, 390px mobile overflow and the full ascension/reset path. Late-game economy still warrants playtesting across complete runs; these are initial explicit tuning values, not analytics-derived targets.
