
# Fix: Certificate Preview Overflowing on Mobile

## Problem
The `CertificateScaled` component has a bug: the container div with `w-full overflow-hidden` expands to 920px because its child is 920px wide. When `useEffect` reads `containerRef.current.offsetWidth`, it gets 920, so `scale` calculates to 1 (no scaling). The certificate renders at full size and overflows the dialog.

## Solution
Two changes in `src/pages/Certificates.tsx`:

### 1. Fix the CertificateScaled component (lines 35-53)
- Add `max-w-full` to the container so it respects the dialog width instead of expanding to 920px
- Change `transformOrigin` from `"top right"` to `"top center"` so scaling is visually centered
- These two changes ensure the container measures the actual available width and the certificate scales down to fit

### 2. No other files need changes

## Technical Detail
```text
Before:
  Container (w-full) -> expands to 920px -> scale = 920/920 = 1 -> no scaling

After:
  Container (w-full max-w-full) -> constrained to dialog width (~370px) -> scale = 370/920 = 0.4 -> scales down
```
