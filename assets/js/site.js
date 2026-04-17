/* Mecha LLC — site.js
   Features loaded on every page:
     1. Phone obfuscation (all pages)
     2. Format ticker (home only; no-op elsewhere)
     3. Scroll fade-ins (all pages)
     4. Cursor-proximity edge light on cards (all pages, pointer:fine only)
*/
(() => {
  'use strict';

  /* -------------------------------------------------
     1. Phone obfuscation
     ------------------------------------------------- */
  // Digits are stored as individual characters. Country code and area code
  // are assembled at click-time to produce "tel:+1..." navigation. Source
  // HTML never contains the contiguous number.
  const PHONE = {
    cc: ['1'],
    parts: [
      { chars: ['2', '0', '3'] },
      { chars: ['5', '7', '0'] },
      { chars: ['4', '0', '9', '6'] },
    ],
  };

  function flatDigits() {
    const all = [];
    for (const p of PHONE.parts) all.push(...p.chars);
    return all;
  }

  // Visual layout: "(" "2" "0" "3" ")" " " "5" "7" "0" "-" "4" "0" "9" "6"
  // Structural chars + digits share a single SVG; visual order is set by
  // the x attribute on each <tspan>, while DOM order is scrambled.
  function buildPhoneSvg() {
    const digits = flatDigits(); // ['2','0','3','5','7','0','4','0','9','6']
    const structural = [
      { ch: '(', xCh: 0  },
      { ch: ')', xCh: 4  },
      { ch: '-', xCh: 9  },
    ];

    // Visual arrangement in character cells (0-based columns):
    // 0 "("  1 "2"  2 "0"  3 "3"  4 ")"  5 " "  6 "5"  7 "7"  8 "0"
    // 9 "-" 10 "4" 11 "0" 12 "9" 13 "6"
    const cells = [
      { xCh: 1,  ch: digits[0] },
      { xCh: 2,  ch: digits[1] },
      { xCh: 3,  ch: digits[2] },
      { xCh: 6,  ch: digits[3] },
      { xCh: 7,  ch: digits[4] },
      { xCh: 8,  ch: digits[5] },
      { xCh: 10, ch: digits[6] },
      { xCh: 11, ch: digits[7] },
      { xCh: 12, ch: digits[8] },
      { xCh: 13, ch: digits[9] },
    ];

    const allCells = cells.concat(structural);
    // Shuffle DOM order deterministically: reverse, then rotate. Result is
    // not alphabetical and not matched by common phone regexes when
    // concatenated.
    allCells.reverse();
    const rotate = 5;
    const rotated = allCells.slice(rotate).concat(allCells.slice(0, rotate));

    const CHAR_W = 9; // px advance per character cell in our chosen font/size
    const svgNS = 'http://www.w3.org/2000/svg';
    const width = 14 * CHAR_W;
    const height = 20;

    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('width', String(width));
    svg.setAttribute('height', String(height));
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.setAttribute('role', 'link');
    svg.setAttribute('tabindex', '0');
    svg.style.cursor = 'pointer';
    svg.style.verticalAlign = 'middle';

    const text = document.createElementNS(svgNS, 'text');
    text.setAttribute('y', '15');
    text.setAttribute('font-family', "Inter, system-ui, sans-serif");
    text.setAttribute('font-size', '15');
    text.setAttribute('fill', 'currentColor');

    for (const cell of rotated) {
      const tspan = document.createElementNS(svgNS, 'tspan');
      tspan.setAttribute('x', String(cell.xCh * CHAR_W));
      tspan.textContent = cell.ch;
      text.appendChild(tspan);
    }

    svg.appendChild(text);

    const assembleTelUrl = () => {
      const digitsStr = flatDigits().join('');
      return 'tel:+' + PHONE.cc.join('') + digitsStr;
    };

    const activate = () => { window.location.href = assembleTelUrl(); };
    svg.addEventListener('click', activate);
    svg.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(); }
    });

    return svg;
  }

  function mountPhone() {
    document.querySelectorAll('[data-phone]').forEach((el) => {
      if (el.children.length > 0) return; // already mounted
      el.appendChild(buildPhoneSvg());
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountPhone);
  } else {
    mountPhone();
  }

  // Ticker, fade-ins, and edge-light are added in later tasks.
})();
