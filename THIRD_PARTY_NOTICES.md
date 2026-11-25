# Third-party notices

## React Bits

The following files are adapted from ideas and source code in [React Bits](https://github.com/DavidHDev/react-bits):

- `src/components/effects/BlurText.tsx` (BlurText)
- `src/components/effects/ClickSpark.tsx` (ClickSpark)
- `src/components/effects/DecryptedText.tsx` (DecryptedText)
- `src/components/effects/GlobalPixelTrail.tsx` (PixelTrail)
- `src/components/effects/InteractiveDotGrid.tsx` (DotGrid)
- `src/components/effects/Magnetic.tsx` (Magnet)
- `src/components/effects/PixelReveal.tsx` (PixelTrail and PixelTransition)
- `src/components/CircularGallery.tsx`
- `src/components/FlowingMenu.tsx`

Those adapted portions remain subject to the upstream MIT + Commons Clause License Condition v1.0 and are excluded from any broader permission that would conflict with that condition.

Copyright (c) 2026 David Haz

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, and distribute the Software as part of an application, website, or product, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

You may use this Software, including for any commercial purpose, so long as you do not sell, sublicense, or redistribute the components themselves, whether alone, in a bundle, or as a ported version.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## Kokonut UI

`src/components/effects/DynamicText.tsx` is ported from Dynamic Text in [Kokonut UI](https://github.com/kokonut-labs/kokonutui) by @dorianbaffier, under the MIT License:

```text
MIT License

Copyright (c) 2025 kokonutUI

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Written for this site

The other files in `src/components/effects/` (`DustDissolve.ts`, `GlobalFlowingLights.tsx`, `SceneLineOrnaments.tsx`, `WeightWave.tsx`) carry no third-party component code. `DustDissolve.ts` uses the modern-screenshot and three.js packages.

## Package dependencies

React, Vite, Motion, Three.js, OGL, GSAP, Wouter, Phosphor Icons, Fontsource packages, Playwright, and their transitive dependencies retain their own licenses. See `package-lock.json` and the packages' distributed license files for exact versions and terms.
