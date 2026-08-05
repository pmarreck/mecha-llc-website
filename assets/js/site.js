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
  // Positions are hand-tuned for Inter 15px with tabular-nums: parens/hyphen
  // have narrower advance than digits, so cell widths are not uniform.
  function buildPhoneSvg() {
    const digits = flatDigits(); // ['2','0','3','5','7','0','4','0','9','6']

    // Explicit pixel x positions per glyph (left edge).
    // Digit advance ~9px (tabular-nums); paren advance ~5px; hyphen advance ~5px.
    // One ~5px visual gap appears naturally between ')' and '5' (the space).
    const cells = [
      { x: 0,   ch: '('        },
      { x: 5,   ch: digits[0]  }, // 2
      { x: 14,  ch: digits[1]  }, // 0
      { x: 23,  ch: digits[2]  }, // 3
      { x: 32,  ch: ')'        },
      { x: 42,  ch: digits[3]  }, // 5
      { x: 51,  ch: digits[4]  }, // 7
      { x: 60,  ch: digits[5]  }, // 0
      { x: 69,  ch: '-'        },
      { x: 74,  ch: digits[6]  }, // 4
      { x: 83,  ch: digits[7]  }, // 0
      { x: 92,  ch: digits[8]  }, // 9
      { x: 101, ch: digits[9]  }, // 6
    ];

    // Shuffle DOM order deterministically: reverse, then rotate. Result is
    // not alphabetical and not matched by common phone regexes when
    // concatenated.
    cells.reverse();
    const rotate = 5;
    const rotated = cells.slice(rotate).concat(cells.slice(0, rotate));

    const svgNS = 'http://www.w3.org/2000/svg';
    const width = 112;
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
    text.setAttribute('font-variant-numeric', 'tabular-nums');
    text.setAttribute('fill', 'currentColor');

    for (const cell of rotated) {
      const tspan = document.createElementNS(svgNS, 'tspan');
      tspan.setAttribute('x', String(cell.x));
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

  /* -------------------------------------------------
     2. Format ticker (home only)
     ------------------------------------------------- */
  const formats = [
    // Images
    {ext: "png", cat: "image"}, {ext: "jpg", cat: "image"}, {ext: "gif", cat: "image"},
    {ext: "bmp", cat: "image"}, {ext: "webp", cat: "image"}, {ext: "tiff", cat: "image"},
    {ext: "heic", cat: "image"}, {ext: "avif", cat: "image"}, {ext: "exr", cat: "image"},
    {ext: "jxl", cat: "image"}, {ext: "svg", cat: "image"}, {ext: "apng", cat: "image"},
    {ext: "qoi", cat: "image"}, {ext: "psd", cat: "image"}, {ext: "dng", cat: "image"},
    {ext: "ico", cat: "image"}, {ext: "icns", cat: "image"}, {ext: "dpx", cat: "image"},
    {ext: "tga", cat: "image"}, {ext: "pam", cat: "image"}, {ext: "cr2", cat: "image"},
    {ext: "nef", cat: "image"}, {ext: "arw", cat: "image"},
    // Video
    {ext: "mp4", cat: "video"}, {ext: "mkv", cat: "video"}, {ext: "mov", cat: "video"},
    {ext: "avi", cat: "video"}, {ext: "webm", cat: "video"}, {ext: "flv", cat: "video"},
    {ext: "mpg", cat: "video"}, {ext: "m2ts", cat: "video"}, {ext: "ts", cat: "video"},
    {ext: "3gp", cat: "video"}, {ext: "wmv", cat: "video"}, {ext: "swf", cat: "video"},
    {ext: "dv", cat: "video"}, {ext: "ivf", cat: "video"}, {ext: "rm", cat: "video"},
    {ext: "asf", cat: "video"}, {ext: "vob", cat: "video"},
    // Audio
    {ext: "mp3", cat: "audio"}, {ext: "flac", cat: "audio"}, {ext: "wav", cat: "audio"},
    {ext: "m4a", cat: "audio"}, {ext: "aiff", cat: "audio"}, {ext: "ogg", cat: "audio"},
    {ext: "opus", cat: "audio"}, {ext: "mid", cat: "audio"}, {ext: "ape", cat: "audio"},
    {ext: "wv", cat: "audio"}, {ext: "aac", cat: "audio"}, {ext: "ac3", cat: "audio"},
    {ext: "dts", cat: "audio"}, {ext: "dsf", cat: "audio"}, {ext: "mp2", cat: "audio"},
    {ext: "caf", cat: "audio"}, {ext: "wma", cat: "audio"}, {ext: "amr", cat: "audio"},
    {ext: "mod", cat: "audio"}, {ext: "xm", cat: "audio"}, {ext: "s3m", cat: "audio"},
    // Archives
    {ext: "zip", cat: "archive"}, {ext: "gz", cat: "archive"}, {ext: "bz2", cat: "archive"},
    {ext: "xz", cat: "archive"}, {ext: "zst", cat: "archive"}, {ext: "7z", cat: "archive"},
    {ext: "rar", cat: "archive"}, {ext: "tar", cat: "archive"}, {ext: "cab", cat: "archive"},
    {ext: "iso", cat: "archive"}, {ext: "dmg", cat: "archive"}, {ext: "rpm", cat: "archive"},
    {ext: "sit", cat: "archive"}, {ext: "wim", cat: "archive"}, {ext: "vmdk", cat: "archive"},
    {ext: "msi", cat: "archive"}, {ext: "br", cat: "archive"}, {ext: "kmz", cat: "archive"},
    // Documents
    {ext: "pdf", cat: "document"}, {ext: "docx", cat: "document"}, {ext: "xlsx", cat: "document"},
    {ext: "pptx", cat: "document"}, {ext: "doc", cat: "document"}, {ext: "xls", cat: "document"},
    {ext: "ppt", cat: "document"}, {ext: "odt", cat: "document"}, {ext: "epub", cat: "document"},
    {ext: "rtf", cat: "document"}, {ext: "pages", cat: "document"}, {ext: "sqlite", cat: "document"},
    {ext: "mdb", cat: "document"}, {ext: "dbf", cat: "document"},
    // Creative
    {ext: "ai", cat: "creative"}, {ext: "eps", cat: "creative"}, {ext: "sketch", cat: "creative"},
    {ext: "aep", cat: "creative"}, {ext: "prproj", cat: "creative"}, {ext: "indd", cat: "creative"},
    {ext: "idml", cat: "creative"}, {ext: "fcpxml", cat: "creative"}, {ext: "drp", cat: "creative"},
    // DAW / Music Production
    {ext: "flp", cat: "daw"}, {ext: "als", cat: "daw"}, {ext: "rpp", cat: "daw"},
    {ext: "cpr", cat: "daw"}, {ext: "ptx", cat: "daw"}, {ext: "band", cat: "daw"},
    {ext: "reason", cat: "daw"}, {ext: "logicx", cat: "daw"}, {ext: "song", cat: "daw"},
    // 3D / CAD
    {ext: "stl", cat: "3d/cad"}, {ext: "obj", cat: "3d/cad"}, {ext: "glb", cat: "3d/cad"},
    {ext: "gltf", cat: "3d/cad"}, {ext: "ply", cat: "3d/cad"}, {ext: "3mf", cat: "3d/cad"},
    {ext: "blend", cat: "3d/cad"}, {ext: "dwg", cat: "3d/cad"}, {ext: "step", cat: "3d/cad"},
    {ext: "dxf", cat: "3d/cad"},
    // Medical
    {ext: "dcm", cat: "medical"}, {ext: "dicom", cat: "medical"},
    {ext: "nii", cat: "medical"},
    // Scientific
    {ext: "hdf5", cat: "scientific"}, {ext: "parquet", cat: "scientific"},
    {ext: "netcdf", cat: "scientific"}, {ext: "fits", cat: "scientific"},
    {ext: "fasta", cat: "scientific"}, {ext: "fastq", cat: "scientific"},
    {ext: "shp", cat: "scientific"}, {ext: "pdb", cat: "scientific"},
    {ext: "cif", cat: "scientific"},
    // Financial
    {ext: "qbw", cat: "financial"}, {ext: "qbb", cat: "financial"},
    {ext: "ofx", cat: "financial"}, {ext: "qif", cat: "financial"},
    {ext: "nacha", cat: "financial"}, {ext: "mt940", cat: "financial"},
    {ext: "bai2", cat: "financial"},
    // Fonts
    {ext: "ttf", cat: "font"}, {ext: "otf", cat: "font"},
    {ext: "woff", cat: "font"}, {ext: "woff2", cat: "font"},
    // Executables
    {ext: "exe", cat: "executable"}, {ext: "elf", cat: "executable"},
    {ext: "wasm", cat: "executable"}, {ext: "class", cat: "executable"},
    {ext: "dll", cat: "executable"}, {ext: "so", cat: "executable"},
    {ext: "beam", cat: "executable"},
    // Crypto
    {ext: "pem", cat: "crypto"}, {ext: "der", cat: "crypto"}, {ext: "crt", cat: "crypto"},
    // Email
    {ext: "eml", cat: "email"}, {ext: "mbox", cat: "email"},
    // Text/Data
    {ext: "json", cat: "text"}, {ext: "xml", cat: "text"}, {ext: "csv", cat: "text"},
    {ext: "toml", cat: "text"}, {ext: "html", cat: "text"},
    {ext: "md", cat: "text"}, {ext: "kml", cat: "text"},
    // Network
    {ext: "pcap", cat: "network"}, {ext: "pcapng", cat: "network"},
    // Games
    {ext: "nes", cat: "game"}, {ext: "sfc", cat: "game"}, {ext: "n64", cat: "game"},
    {ext: "gb", cat: "game"}, {ext: "gba", cat: "game"}, {ext: "nds", cat: "game"},
    {ext: "gen", cat: "game"}, {ext: "chd", cat: "game"}, {ext: "wad", cat: "game"},
    {ext: "bsp", cat: "game"}, {ext: "vpk", cat: "game"},
  ];

  function startTicker() {
    const track = document.getElementById('ticker-track');
    if (!track) return; // only exists on home

    const currentEl = track.children[0];
    const nextEl    = track.children[1];
    const catEl     = document.getElementById('ticker-cat');
    if (!currentEl || !nextEl || !catEl) return;

    let idx = 0;
    currentEl.textContent = '.' + formats[0].ext;
    catEl.textContent = formats[0].cat;

    function cycle() {
      const nextIdx = (idx + 1) % formats.length;
      nextEl.textContent = '.' + formats[nextIdx].ext;

      track.style.transform = 'translateY(-2.2em)';

      setTimeout(() => {
        // Instant reset after animation completes
        track.style.transition = 'none';
        track.style.transform = 'translateY(0)';
        currentEl.textContent = '.' + formats[nextIdx].ext;
        catEl.textContent = formats[nextIdx].cat;
        // Force reflow, then restore transition
        void track.offsetWidth;
        track.style.transition = '';
      }, 250);

      idx = nextIdx;
    }

    setInterval(cycle, 500);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startTicker);
  } else {
    startTicker();
  }

  /* -------------------------------------------------
     3. Scroll fade-ins
     ------------------------------------------------- */
  function initFadeIns() {
    const elements = document.querySelectorAll('.reveal');
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      // Content starts visible; no transform animations are added.
      return;
    }

    if (!('IntersectionObserver' in window)) {
      // Content starts visible when the observer feature is unavailable.
      return;
    }

    elements.forEach((el) => el.classList.add('reveal-pending'));

    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          entry.target.classList.remove('reveal-pending');
          io.unobserve(entry.target);
        }
      }
    }, {
      threshold: 0.15,
      rootMargin: '0px 0px -10% 0px',
    });

    elements.forEach((el) => io.observe(el));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFadeIns);
  } else {
    initFadeIns();
  }

  /* -------------------------------------------------
     4. Cursor-proximity edge light on cards
     ------------------------------------------------- */
  function initEdgeLight() {
    if (window.matchMedia('(pointer: coarse)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const cards = Array.from(document.querySelectorAll('.card, .app-card'));
    if (cards.length === 0) return;

    let pending = false;
    let lastX = 0, lastY = 0;

    function update() {
      pending = false;
      for (const card of cards) {
        const r = card.getBoundingClientRect();
        const x = lastX - r.left;
        const y = lastY - r.top;
        const cx = r.width / 2;
        const cy = r.height / 2;
        const dist = Math.hypot(x - cx, y - cy);
        const maxRadius = Math.max(r.width, r.height) * 1.2;
        const glow = Math.max(0, 1 - dist / maxRadius);
        card.style.setProperty('--mx', `${x}px`);
        card.style.setProperty('--my', `${y}px`);
        card.style.setProperty('--glow', glow.toFixed(3));
      }
    }

    window.addEventListener('mousemove', (e) => {
      lastX = e.clientX;
      lastY = e.clientY;
      if (!pending) {
        pending = true;
        requestAnimationFrame(update);
      }
    }, { passive: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEdgeLight);
  } else {
    initEdgeLight();
  }
})();
