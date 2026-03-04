const fs = require('fs');
const path = require('path');

const cssPath = path.join(process.cwd(), 'src', 'index.css');
let css = fs.readFileSync(cssPath, 'utf8');

// Replace the root block
const rootRegex = /:root\s*\{[\s\S]*?\}\s*\/\* ===== LIGHT THEME ===== \*\//;
const newRoot = `:root {
  /* Backgrounds */
  --bg-primary: #09090B;
  --bg-secondary: #09090B;
  --bg-card: #18181b;
  --bg-card-hover: #27272a;
  --bg-glass: rgba(255, 255, 255, 0.015);
  --bg-glass-hover: rgba(255, 255, 255, 0.03);
  --bg-input: #09090B;

  /* Text */
  --text-primary: #F8FAFC;
  --text-secondary: #94A3B8;
  --text-muted: #475569;
  --text-dim: #334155;
  --text-inverse: #09090B;

  /* Neon Accent (A COR DA ZETA) */
  --accent: #A855F7;
  --accent-hover: #9333EA;
  --accent-dim: #7E22CE;
  --accent-light: rgba(168, 85, 247, 0.15);
  --accent-glow: rgba(168, 85, 247, 0.3);

  /* Secondary Neon (deprecated) */
  --neon-secondary: transparent;
  --neon-secondary-dim: transparent;
  --neon-secondary-light: transparent;
  --neon-secondary-glow: transparent;

  /* Semantic */
  --success: #10B981;
  --success-bg: rgba(16, 185, 129, 0.15);
  --danger: #EF4444;
  --danger-bg: rgba(239, 68, 68, 0.15);
  --warning: #F59E0B;
  --info: #3B82F6;

  /* Borders / UI */
  --border: rgba(255, 255, 255, 0.08);
  --border-light: rgba(255, 255, 255, 0.04);

  /* Typography */
  --font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-display: 'Inter', sans-serif;
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
  --font-size-2xl: 1.5rem;
  --font-size-3xl: 2rem;
  --font-size-4xl: 2.5rem;
  --font-size-5xl: 3.5rem;
  --font-size-hero: 4.5rem;

  /* Spacing */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.25rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-10: 2.5rem;
  --space-12: 3rem;
  --space-16: 4rem;
  --space-20: 5rem;

  /* Radius (Geometria Cirurgica) */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --radius-full: 9999px;

  /* Shadows */
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.6);
  --shadow-glow: 0 0 15px rgba(168, 85, 247, 0.3);
  --shadow-glow-strong: 0 0 25px rgba(168, 85, 247, 0.6);
  --shadow-glow-cyan: transparent;

  /* Glassmorphism 2.0 */
  --glass-blur: blur(24px);
  --glass-border: 1px solid var(--border);

  /* Transitions */
  --transition-fast: 150ms ease;
  --transition-base: 250ms ease;
  --transition-slow: 400ms ease;
}

/* ===== LIGHT THEME ===== */`;
css = css.replace(rootRegex, newRoot);

// Replace the radial gradient background with the structural line background
const bgRegex = /body::before\s*\{[\s\S]*?\}\s*body\.light-theme::before\s*\{[\s\S]*?\}/;
const newBg = `/* Textura Ambiente OBRIGATÓRIA: Padrão sutil "Linhas de Fluxo" no background */
body::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: repeating-linear-gradient(
    0deg,
    rgba(255, 255, 255, 0.015) 0px,
    rgba(255, 255, 255, 0.015) 1px,
    transparent 1px,
    transparent 40px
  );
  pointer-events: none;
  z-index: -1;
}

body.light-theme::before {
  opacity: 0;
}`;
css = css.replace(bgRegex, newBg);

// Replace gradient text fallback
css = css.replace(/background: linear-gradient\(135deg, var\(--accent\), var\(--neon-secondary\)\);/g, 'color: var(--accent);');
// Remove gradient from primary btn fallback
css = css.replace(/background: linear-gradient\(135deg, var\(--accent\) 0%, var\(--accent-hover\) 100%\);/g, 'background: var(--accent);');
// Remove neon gradient fallback
css = css.replace(/background: linear-gradient\(135deg, var\(--accent\), var\(--accent-dim\)\);/g, 'background: var(--accent);');

fs.writeFileSync(cssPath, css, 'utf8');
console.log('CSS updated successfully');
