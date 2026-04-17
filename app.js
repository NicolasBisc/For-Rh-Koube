/* ================================================================
   KOUBE QUÍMICA — RH EXPERIENCE
   app.js

   Módulos:
   1. BRAND       — paleta de cores (edite aqui)
   2. Sparkles    — partículas de fundo
   3. Canvas      — setup e resize
   4. HeartParticle — classe com física realista
   5. Animation   — loop requestAnimationFrame
   6. Reveal      — lógica do clique e ondas de corações
   ================================================================ */

/* ── 1. PALETA DA MARCA (edite aqui para mudar tudo) ─────────── */
const BRAND = {
  green      : '#2ECC40',
  greenLight : '#6FE47E',
  red        : '#E5232A',
  white      : '#F2F2F0',
  gold       : '#E8C96A',
  teal       : '#2ECCB5',   // acento especial pós-revelação
};

/* ── 2. SPARKLES DE FUNDO ─────────────────────────────────────── */
(function createSparkles() {
  const colors = [BRAND.green, BRAND.greenLight, BRAND.white];
  const count  = window.innerWidth < 600 ? 18 : 34;

  for (let i = 0; i < count; i++) {
    const el   = document.createElement('div');
    el.className = 'sparkle';
    const size = 1.5 + Math.random() * 3;
    const color = colors[Math.floor(Math.random() * colors.length)];
    const dur  = (3.5 + Math.random() * 5).toFixed(2);
    const del  = (Math.random() * 6).toFixed(2);

    el.style.width     = size + 'px';
    el.style.height    = size + 'px';
    el.style.left      = (Math.random() * 100) + 'vw';
    el.style.top       = (Math.random() * 100) + 'vh';
    el.style.background = color;
    el.style.setProperty('--dur', dur + 's');
    el.style.setProperty('--del', del + 's');

    document.body.appendChild(el);
  }
})();

/* ── 3. CANVAS SETUP ──────────────────────────────────────────── */
const canvas = document.getElementById('hearts-canvas');
const ctx    = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

/* ── 4. CLASSE HEARTPARTICLE ──────────────────────────────────── */
class HeartParticle {
  /**
   * @param {boolean} burst — true = impulso explosivo, false = flutuação suave
   * @param {number}  originX — fração horizontal da origem (0–1)
   * @param {number}  originY — fração vertical da origem (0–1)
   */
  constructor(burst = false, originX = 0.5, originY = 0.55) {
    /* Posição de origem */
    this.x = canvas.width  * (originX + (Math.random() - 0.5) * 0.35);
    this.y = canvas.height * (originY + (Math.random() - 0.5) * 0.25);

    /* Velocidade inicial */
    const angle = -(Math.PI * 0.15 + Math.random() * Math.PI * 0.7) - Math.PI / 2;
    const speed = burst
      ? 2.8 + Math.random() * 7
      : 1.2 + Math.random() * 3.2;

    this.vx = Math.cos(angle) * speed * (Math.random() < 0.5 ? 1 : -1);
    this.vy = Math.sin(angle) * speed;

    /* Física */
    this.gravity  = 0.028 + Math.random() * 0.025;
    this.airDrag  = 0.994;

    /* Geometria */
    this.size = burst
      ? 9  + Math.random() * 22
      : 5  + Math.random() * 14;

    /* Cor — distribuição: 60% verde, 18% verde claro, 12% branco, 7% vermelho, 3% dourado */
    const r = Math.random();
    this.color =
      r < 0.60 ? BRAND.green
    : r < 0.78 ? BRAND.greenLight
    : r < 0.90 ? BRAND.white
    : r < 0.97 ? BRAND.red
               : BRAND.gold;

    /* Opacidade */
    this.alpha    = 0;
    this.alphaMax = 0.6 + Math.random() * 0.4;

    /* Vida */
    this.life    = 100 + Math.random() * 140;
    this.age     = 0;

    /* Rotação */
    this.rot  = (Math.random() - 0.5) * 1.0;
    this.rotV = (Math.random() - 0.5) * 0.022;

    /* Ondulação lateral */
    this.wobble      = Math.random() * Math.PI * 2;
    this.wobbleSpeed = 0.03 + Math.random() * 0.025;
    this.wobbleAmp   = 0.25 + Math.random() * 0.3;

    /* Escala pulsante suave */
    this.scale      = 1;
    this.scalePulse = Math.random() * Math.PI * 2;
  }

  update() {
    this.age++;
    const progress = this.age / this.life;

    /* Movimento */
    this.wobble += this.wobbleSpeed;
    this.x  += this.vx + Math.sin(this.wobble) * this.wobbleAmp;
    this.y  += this.vy;
    this.vy += this.gravity;
    this.vx *= this.airDrag;
    this.rot += this.rotV;

    /* Pulso de escala suave */
    this.scalePulse += 0.06;
    this.scale = 1 + Math.sin(this.scalePulse) * 0.06;

    /* Fade in — primeiros 18% de vida */
    if (progress < 0.18) {
      this.alpha = Math.min(
        this.alphaMax,
        this.alpha + (this.alphaMax / (this.life * 0.18))
      );
    }

    /* Fade out — últimos 38% de vida */
    if (progress > 0.62) {
      const fadeProgress = (progress - 0.62) / 0.38;
      this.alpha = Math.max(0, this.alphaMax * (1 - fadeProgress));
    }

    return this.age < this.life && this.alpha > 0.008;
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.scale(this.scale, this.scale);
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle   = this.color;

    /* Sombra suave */
    ctx.shadowBlur  = 8;
    ctx.shadowColor = this.color;

    /* Coração com curvas de Bézier precisas */
    const s = this.size;
    ctx.beginPath();
    ctx.moveTo(0, s * 0.28);

    /* Lado esquerdo */
    ctx.bezierCurveTo(
      -s * 0.04, -s * 0.05,
      -s * 0.50, -s * 0.22,
      -s * 0.50,  s * 0.08
    );
    ctx.bezierCurveTo(
      -s * 0.50,  s * 0.40,
      -s * 0.24,  s * 0.65,
       0,         s * 0.92
    );

    /* Lado direito */
    ctx.bezierCurveTo(
       s * 0.24,  s * 0.65,
       s * 0.50,  s * 0.40,
       s * 0.50,  s * 0.08
    );
    ctx.bezierCurveTo(
       s * 0.50, -s * 0.22,
       s * 0.04, -s * 0.05,
       0,         s * 0.28
    );

    ctx.fill();
    ctx.restore();
  }
}

/* ── 5. LOOP DE ANIMAÇÃO ──────────────────────────────────────── */
let particles = [];
let rafId     = null;

function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  particles = particles.filter(function(p) {
    const alive = p.update();
    if (alive) p.draw();
    return alive;
  });

  if (particles.length > 0) {
    rafId = requestAnimationFrame(animate);
  } else {
    rafId = null;
  }
}

/**
 * Dispara uma onda de corações
 * @param {number}  count  — quantidade de corações
 * @param {boolean} burst  — impulso forte (true) ou flutuante (false)
 * @param {number}  ox     — fração horizontal da origem
 * @param {number}  oy     — fração vertical da origem
 */
function spawnWave(count, burst, ox, oy) {
  ox = ox !== undefined ? ox : 0.5;
  oy = oy !== undefined ? oy : 0.55;
  for (var i = 0; i < count; i++) {
    particles.push(new HeartParticle(burst, ox, oy));
  }
  if (!rafId) rafId = requestAnimationFrame(animate);
}

/* ── 6. LÓGICA DE REVELAÇÃO ───────────────────────────────────── */
const btn         = document.getElementById('btn-reveal');
const msgMain     = document.getElementById('msg-main');
const msgOrnament = document.getElementById('msg-ornament');
const msgAssina   = document.getElementById('msg-assinatura');
const msgTags     = document.getElementById('msg-tags');

let fired = false;

btn.addEventListener('click', function() {
  if (fired) return;
  fired = true;

  /* ── Atualiza botão ─── */
  btn.style.transition   = 'opacity 0.4s ease, transform 0.4s ease';
  btn.style.opacity      = '0.55';
  btn.style.pointerEvents = 'none';
  btn.style.transform    = 'scale(0.95)';

  const btnEmoji = btn.querySelector('.btn-emoji');
  const btnText  = btn.querySelector('.btn-text');
  if (btnEmoji) btnEmoji.textContent = '🌿';
  if (btnText)  btnText.textContent  = 'Recebida! ';

  /* ── Mensagem principal ─── */
  msgMain.innerHTML =
    'Para as profissionais do RH da <strong>Koube Química</strong>:<br>' +
    'vocês são simplesmente as melhores 🚀';
  msgMain.classList.add('show');

  /* ── Ornamento ─── */
  setTimeout(function() {
    if (msgOrnament) msgOrnament.classList.add('show');
  }, 520);

  /* ── Assinatura ─── */
  setTimeout(function() {
    if (msgAssina) {
      msgAssina.textContent = '— Com admiração, carinho e muita gratidão ✨';
      msgAssina.classList.add('show');
    }
  }, 760);

  /* ── Tags de elogio ─── */
  setTimeout(function() {
    if (msgTags) msgTags.classList.add('show');
  }, 1050);

  /* ── Ondas de corações (escalonadas) ─── */

  // Onda 1 — explosão central, forte
  spawnWave(75, true, 0.5, 0.55);

  // Onda 2 — lado esquerdo, suave
  setTimeout(function() {
    spawnWave(45, false, 0.35, 0.6);
  }, 420);

  // Onda 3 — lado direito, suave
  setTimeout(function() {
    spawnWave(45, false, 0.65, 0.6);
  }, 680);

  // Onda 4 — centro, média
  setTimeout(function() {
    spawnWave(55, true,  0.5, 0.52);
  }, 1000);

  // Onda 5 — espalhada, flutuante
  setTimeout(function() {
    spawnWave(35, false, 0.5, 0.65);
  }, 1500);

  // Onda 6 — final suave
  setTimeout(function() {
    spawnWave(25, false, 0.5, 0.58);
  }, 2100);
});
