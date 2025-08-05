// ==================== PARTICIPANTES INICIALES ====================
const defaultParticipants = [
  { name: 'Mario', gold: 0, silver: 0, bronze: 0 },
  { name: 'Sara', gold: 0, silver: 0, bronze: 0 },
  { name: 'Mateo', gold: 0, silver: 0, bronze: 0 },
  { name: 'Nil', gold: 0, silver: 0, bronze: 0 }
];

let participants = [];
let editIndex = null;

// ========== LOCAL STORAGE UTILITIES ==========
function loadParticipants() {
  const data = localStorage.getItem('olimpMartinez2025');
  return data ? JSON.parse(data) : defaultParticipants.slice();
}
function saveParticipants() {
  localStorage.setItem('olimpMartinez2025', JSON.stringify(participants));
}

// ========== ORDENAMIENTO ESTABLE Y JERÁRQUICO ==========
function sortParticipants(list) {
  return list
    .map((p, i) => ({ ...p, origIdx: i }))
    .sort((a, b) => {
      if (b.gold !== a.gold) return b.gold - a.gold;
      if (b.silver !== a.silver) return b.silver - a.silver;
      if (b.bronze !== a.bronze) return b.bronze - a.bronze;
      return a.origIdx - b.origIdx;
    })
    .map(({ origIdx, ...rest }) => rest);
}

// ========== RENDERIZADO DE LA TABLA ==========
function renderTable() {
  // Guardar posiciones antiguas de los participantes por nombre para detectar subidas/bajadas
  if (!window.__lastOrder) window.__lastOrder = [];
  const prevOrder = window.__lastOrder.slice();

  const tbody = document.querySelector('#rankingTable tbody');
  // 1. Guardar posiciones actuales de las filas (por nombre)
  const oldPositions = {};
  Array.from(tbody.children).forEach(tr => {
    const name = tr.children[1]?.textContent;
    if (name) oldPositions[name] = tr.getBoundingClientRect().top;
  });

  // Renderizar nueva tabla
  tbody.innerHTML = '';
  const sorted = sortParticipants(participants);
  const trs = [];
  sorted.forEach((p, idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="pos-cell">${
        idx === 0 ? '<span class="medal-table">🥇</span>' :
        idx === 1 ? '<span class="medal-table">🥈</span>' :
        idx === 2 ? '<span class="medal-table">🥉</span>' :
        (idx + 1) + 'º'
      }</td>
      <td>${p.name}</td>
      <td>${p.gold}</td>
      <td>${p.silver}</td>
      <td>${p.bronze}</td>
      <td><button class="icon-btn edit-btn" title="Editar"><span aria-hidden="true">✏️</span></button></td>
      <td><button class="icon-btn delete-btn" title="Eliminar"><span aria-hidden="true">🗑️</span></button></td>
    `;
    tr.querySelector('.edit-btn').onclick = () => openEditModal(sorted, idx);
    tr.querySelector('.delete-btn').onclick = (event) => {
      const origIdx = participants.findIndex(x =>
        x.name === p.name && x.gold === p.gold && x.silver === p.silver && x.bronze === p.bronze
      );
      if (origIdx !== -1) {
        if (confirm(`¿Eliminar a "${p.name}"?`)) {
          const row = event.target.closest('tr');
          row.classList.add('row-pop-shrink');
          row.addEventListener('animationend', function handler() {
            row.removeEventListener('animationend', handler);
            participants.splice(origIdx, 1);
            saveParticipants();
            renderTable();
            renderPodium();
          });
        }
      }
    };

    // Detectar cambio de posición
    const prevIdx = prevOrder.indexOf(p.name);
    const posCell = tr.querySelector('.pos-cell .medal-table');
    if (prevIdx !== -1 && prevIdx !== idx) {
      if (prevIdx > idx) {
        tr.classList.add('row-up');
        setTimeout(() => tr.classList.remove('row-up'), 1200);
        if (posCell) {
          posCell.classList.remove('medal-animate');
          void posCell.offsetWidth;
          posCell.classList.add('medal-animate');
          setTimeout(() => posCell.classList.remove('medal-animate'), 900);
        }
      } else if (prevIdx < idx) {
        tr.classList.add('row-down');
        setTimeout(() => tr.classList.remove('row-down'), 1200);
        if (posCell) {
          posCell.classList.remove('medal-animate');
          void posCell.offsetWidth;
          posCell.classList.add('medal-animate');
          setTimeout(() => posCell.classList.remove('medal-animate'), 900);
        }
      }
    }
    // Animar medallas de la tabla para top 3 siempre
    if (idx <= 2) {
      const posCell = tr.querySelector('.pos-cell .medal-table');
      if (posCell) {
        posCell.classList.remove('medal-animate');
        void posCell.offsetWidth;
        posCell.classList.add('medal-animate');
        setTimeout(() => posCell.classList.remove('medal-animate'), 900);
      }
    }
    trs.push(tr);
    tbody.appendChild(tr);
  });

  // 3. Animar movimiento FLIP
  trs.forEach(tr => {
    const name = tr.children[1]?.textContent;
    if (!name) return;
    const oldTop = oldPositions[name];
    const newTop = tr.getBoundingClientRect().top;
    // --- Animación especial si es el recién añadido ---
    if (window.__newlyAddedName === name && oldTop === undefined) {
      // Si no existía antes, animar desde abajo
      const lastRow = trs[trs.length - 1];
      if (lastRow && lastRow !== tr) {
        const from = lastRow.getBoundingClientRect().top;
        const delta = from - newTop;
        tr.style.transition = 'none';
        tr.style.transform = `translateY(${delta}px)`;
        requestAnimationFrame(() => {
          tr.style.transition = 'transform 0.6s cubic-bezier(.4,2,.6,1)';
          tr.style.transform = '';
        });
      }
    } else if (oldTop !== undefined) {
      // Animación FLIP normal
      const delta = oldTop - newTop;
      if (delta !== 0) {
        tr.style.transition = 'none';
        tr.style.transform = `translateY(${delta}px)`;
        requestAnimationFrame(() => {
          tr.style.transition = 'transform 0.5s cubic-bezier(.4,2,.6,1)';
          tr.style.transform = '';
        });
      }
    }
  });
  renderPodium();
  // Guardar el nuevo orden para la próxima comparación
  window.__lastOrder = sorted.map(p => p.name);
  // Limpiar el flag del participante añadido
  window.__newlyAddedName = undefined;
}

// ========== PODIO ==========
function renderPodium() {
  const sorted = sortParticipants(participants);
  // Guardar el podio anterior
  if (!window.__lastPodium) window.__lastPodium = [null, null, null];
  const prev = window.__lastPodium;
  const curr = [sorted[0]?.name || null, sorted[1]?.name || null, sorted[2]?.name || null];

  // 1. Confeti si hay nuevo primero
  if (curr[0] && curr[0] !== prev[0]) {
    launchConfetti();
  }

  // 2. Shake si alguien sale del podio
  [0, 1, 2].forEach(i => {
    if (prev[i] && !curr.includes(prev[i])) {
      // Buscar el rectángulo del podio anterior y aplicar shake
      const spots = ['first-place', 'second-place', 'third-place'];
      for (const spot of spots) {
        const el = document.getElementById(spot).parentElement;
        if (el && el.textContent.includes(prev[i])) {
          el.classList.remove('shake-podium');
          void el.offsetWidth;
          el.classList.add('shake-podium');
        }
      }
    }
  });


  // 4. Animación de nombres (slide)
  function animateSlide(id, newName, fallback) {
    const el = document.getElementById(id).querySelector('.podium-name');
    const medal = document.getElementById(id).parentElement.querySelector('p');
    const current = el.textContent;
    if (current === (newName || fallback)) return;
    // Animar medalla
    if (medal) {
      medal.classList.remove('medal-animate');
      void medal.offsetWidth;
      medal.classList.add('medal-animate');
      setTimeout(() => medal.classList.remove('medal-animate'), 900);
    }
    // Animar salida del nombre
    el.classList.remove('slide-in-left');
    el.classList.add('slide-out-right');
    // Cuando termina la animación de salida, cambia el texto y anima la entrada
    el.addEventListener('animationend', function handler() {
      el.removeEventListener('animationend', handler);
      el.classList.remove('slide-out-right');
      el.textContent = newName || fallback;
      el.classList.add('slide-in-left');
      // Quitar la clase de entrada tras la animación
      el.addEventListener('animationend', function handler2() {
        el.removeEventListener('animationend', handler2);
        el.classList.remove('slide-in-left');
      });
    });
  }
  animateSlide('first-place', sorted[0]?.name, 'Primero');
  animateSlide('second-place', sorted[1]?.name, 'Segundo');
  animateSlide('third-place', sorted[2]?.name, 'Tercero');

  // Actualizar el podio anterior
  window.__lastPodium = curr;
}

// Confeti animado (canvas simple)
function launchConfetti() {
  if (document.getElementById('confetti-canvas')) return; // Evitar duplicados
  const canvas = document.createElement('canvas');
  canvas.id = 'confetti-canvas';
  canvas.style.position = 'fixed';
  canvas.style.left = 0;
  canvas.style.top = 0;
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = 9999;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  const W = window.innerWidth, H = window.innerHeight;
  canvas.width = W; canvas.height = H;
  // Confeti particles
  const colors = ['#ffcc80','#ffeb99','#ff7eb3','#ff758c','#29b6f6','#ffab40','#fff'];
  const confetti = Array.from({length: 80}, () => ({
    x: Math.random()*W,
    y: Math.random()*-H*0.3,
    r: 7+Math.random()*7,
    d: 3+Math.random()*3,
    color: colors[Math.floor(Math.random()*colors.length)],
    tilt: Math.random()*10-5,
    tiltAngle: 0
  }));
  let angle = 0;
  function draw() {
    ctx.clearRect(0,0,W,H);
    angle += 0.01;
    for (const p of confetti) {
      p.y += Math.cos(angle+p.d)+2+p.d/2;
      p.x += Math.sin(angle)*2;
      p.tiltAngle += 0.1;
      p.tilt = Math.sin(p.tiltAngle)*8;
      ctx.beginPath();
      ctx.lineWidth = p.r;
      ctx.strokeStyle = p.color;
      ctx.moveTo(p.x+p.tilt+2, p.y);
      ctx.lineTo(p.x, p.y+p.tilt+8);
      ctx.stroke();
    }
  }
  function animate() {
    draw();
    // Solo borra el canvas cuando todas las partículas salieron de abajo
    if (confetti.some(p => p.y < H + 20)) {
      requestAnimationFrame(animate);
    } else {
      canvas.remove();
    }
  }
  animate();
}


// ========== AGREGAR PARTICIPANTE ==========
document.getElementById('addForm').onsubmit = function(e) {
  e.preventDefault();
  const name = document.getElementById('nameInput').value.trim();
  const gold = parseInt(document.getElementById('goldInput').value, 10);
  const silver = parseInt(document.getElementById('silverInput').value, 10);
  const bronze = parseInt(document.getElementById('bronzeInput').value, 10);

  if (!name) return;
  participants.push({ name, gold, silver, bronze });
  saveParticipants();

  // --- Animación especial para el nuevo participante ---
  // Guardar el nombre recién añadido en window para usarlo en renderTable
  window.__newlyAddedName = name;
  renderTable();
  this.reset();
};

// ========== MODAL EDICIÓN ==========
function openEditModal(sorted, idx) {
  // Añadir pelota de playa decorativa si no existe
  setTimeout(() => {
    const modal = document.querySelector('.modal-content');
    if (modal && !modal.querySelector('.palmtree')) {
      const palmtree = document.createElement('img');
      palmtree.src = 'palmera.png';
      palmtree.alt = 'Palmera';
      palmtree.className = 'palmtree';
      modal.appendChild(palmtree);
    }
    if (modal && !modal.querySelector('.modal-ball')) {
      const ball = document.createElement('img');
      ball.src = 'pelota.png';
      ball.alt = 'Pelota de playa';
      ball.className = 'modal-ball';
      modal.appendChild(ball);
    }
    // Pelota abajo a la derecha
    if (modal && !modal.querySelector('.modal-ball')) {
      const ball = document.createElement('img');
      ball.src = 'pelota.png';
      ball.alt = 'Pelota de playa';
      ball.className = 'modal-ball';
      modal.appendChild(ball);
    }
  }, 10);

  const modal = document.getElementById('editModal');
  modal.style.display = "flex";
  const p = sorted[idx];
  editIndex = participants.findIndex(x =>
    x.name === p.name && x.gold === p.gold && x.silver === p.silver && x.bronze === p.bronze
  );
  document.getElementById('editName').value = p.name;
  document.getElementById('editGold').value = p.gold;
  document.getElementById('editSilver').value = p.silver;
  document.getElementById('editBronze').value = p.bronze;
}

document.getElementById('closeModal').onclick = function() {
  document.getElementById('editModal').style.display = "none";
};

window.onclick = function(event) {
  const modal = document.getElementById('editModal');
  if (event.target === modal) {
    modal.style.display = "none";
  }
};

document.getElementById('editForm').onsubmit = function(e) {
  e.preventDefault();
  if (editIndex !== null) {
    participants[editIndex] = {
      name: document.getElementById('editName').value.trim(),
      gold: parseInt(document.getElementById('editGold').value, 10),
      silver: parseInt(document.getElementById('editSilver').value, 10),
      bronze: parseInt(document.getElementById('editBronze').value, 10)
    };
    saveParticipants();
    renderTable();
    document.getElementById('editModal').style.display = "none";
  }
};

// ========== EXPORTAR A CSV ==========
document.getElementById('exportButton').onclick = function () {
  const rows = [["Nombre", "Oro", "Plata", "Bronce"]];
  participants.forEach(p => rows.push([p.name, p.gold, p.silver, p.bronze]));
  const csv = rows.map(r => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "participantes.csv";
  a.click();
  URL.revokeObjectURL(url);
};

// ========== REINICIAR TABLA ==========
document.getElementById('resetButton').onclick = function () {
  if (confirm("¿Seguro que deseas reiniciar la tabla?")) {
    participants = defaultParticipants.slice();
    saveParticipants();
    renderTable();
    renderPodium();
    launchFireworks();
  }
};

// ====== FIREWORKS ANIMATION ======
function launchFireworks() {
  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.left = 0;
  canvas.style.top = 0;
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = 3000;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  const colors = ['#ff3', '#f36', '#3cf', '#6f3', '#fc3', '#f39', '#39f', '#fff', '#f60'];
  let fireworks = [];
  // Generar una tanda de fuegos artificiales
  function createFireworks() {
    const arr = [];
    for (let i = 0; i < 7 + Math.random() * 4; i++) {
      const x = Math.random() * (canvas.width * 0.8) + canvas.width * 0.1;
      const y = Math.random() * (canvas.height * 0.2) + canvas.height * 0.07;
      const fw = { x, y, particles: [] };
      for (let j = 0; j < 26 + Math.random() * 10; j++) {
        const angle = (Math.PI * 2 * j) / (26 + Math.random() * 10);
        const speed = 2.2 + Math.random() * 3.2;
        fw.particles.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          alpha: 1,
          color: colors[Math.floor(Math.random() * colors.length)],
          radius: 2.1 + Math.random() * 1.7
        });
      }
      arr.push(fw);
    }
    return arr;
  }
  // Primera tanda
  fireworks = createFireworks();
  let frame = 0;
  let secondWaveLaunched = false;
  const totalFrames = 130; // ~2.2 segundos a 60fps
  function draw() {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    fireworks.forEach(fw => {
      fw.particles.forEach(p => {
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI*2);
        ctx.fillStyle = p.color;
        ctx.fill();
      });
      fw.particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.97;
        p.vy *= 0.97;
        p.vy += 0.02;
        p.alpha *= 0.97 - Math.random()*0.01;
      });
    });
    // Segunda tanda a mitad de la animación
    if (!secondWaveLaunched && frame === Math.floor(totalFrames/2)) {
      fireworks = fireworks.concat(createFireworks());
      secondWaveLaunched = true;
    }
    frame++;
    if (frame < totalFrames) {
      requestAnimationFrame(draw);
    } else {
      canvas.remove();
    }
    ctx.globalAlpha = 1;
  }
  draw();
}


// ========== ANUNCIAR GANADOR ==========
document.getElementById('announceWinnerBtn')?.addEventListener('click', function() {
  // Intenta obtener el nombre del podio directamente del DOM
  let winnerName = '';
  const podiumFirst = document.querySelector('.podium .podium-name.podium-1');
  if (podiumFirst && podiumFirst.textContent.trim()) {
    winnerName = podiumFirst.textContent.trim();
  } else {
    const sorted = sortParticipants(participants);
    if (sorted.length > 0) {
      winnerName = sorted[0].name;
    }
  }
  if (winnerName) {
    sessionStorage.setItem('winnerName', winnerName);
  } else {
    sessionStorage.removeItem('winnerName');
  }
  const main = document.querySelector('main');
  const btn = this;
  if (!main || btn.disabled) return;
  btn.disabled = true;
  // Desplazamiento suave al inicio
  window.scrollTo({top: 0, behavior: 'smooth'});
  
  // Esperar a que termine el scroll (1s) + 1 segundo adicional
  setTimeout(() => {
    // Aplicar animación de salida
    main.classList.add('slide-out-right-page');
    
    // Animar imagen superior (logo) y título principal
    const logoImg = document.querySelector('#logo') || document.querySelector('header img');
    if (logoImg) logoImg.classList.add('slide-out-right-page');
    
    const mainTitle = document.querySelector('header h1') || 
                     document.querySelector('.main-title') || 
                     document.querySelector('.header-title');
    if (mainTitle) mainTitle.classList.add('slide-out-right-page');
    
    // Cambiar de página después de la animación
    setTimeout(() => {
      window.location.href = 'ganador.html';
    }, 600); // Tiempo de la animación
  }, 1000); // 1 segundo de espera después del scroll
});

// ====// ====== ANIMACIÓN DE ELIMINACIÓN ======
// ===== ANIMACIÓN DE DESINTEGRACIÓN POLVO =====
function dustDisintegrateRow(row) {
  if (!row) return;
  row.classList.add('row-deleting');
  const rowRect = row.getBoundingClientRect();
  // Para cada celda, crear partículas
  Array.from(row.children).forEach(td => {
    const tdRect = td.getBoundingClientRect();
    // Tomar color del texto o fondo
    const color = window.getComputedStyle(td).color || '#bbb';
    // Generar partículas
    for (let i = 0; i < 18; i++) {
      const particle = document.createElement('div');
      particle.className = 'dust-particle';
      // Posición relativa a la celda
      const relX = Math.random() * tdRect.width;
      const relY = Math.random() * tdRect.height;
      particle.style.left = (tdRect.left - rowRect.left + relX) + 'px';
      particle.style.top = (tdRect.top - rowRect.top + relY) + 'px';
      particle.style.setProperty('--dust-color', color);
      // Trayectoria aleatoria
      const angle = (Math.random() - 0.5) * Math.PI;
      const dist = 30 + Math.random()*50;
      const dx = Math.cos(angle) * dist;
      const dy = 40 + Math.random()*60;
      particle.style.setProperty('--dust-x', `${dx}px`);
      particle.style.setProperty('--dust-y', `${dy}px`);
      particle.style.setProperty('--dust-scale', 1.1 + Math.random()*0.8);
      row.appendChild(particle);
      setTimeout(() => particle.remove(), 850);
    }
    td.style.opacity = '0.2';
  });
}

// ========== GUARDAR DATOS EN NETLIFY ==========
const urlGuardar = '/.netlify/functions/guardar';

async function guardarDatos(data) {
  try {
    const response = await fetch(urlGuardar, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    alert(result.message || 'Datos guardados');
  } catch (e) {
    alert('Error al guardar los datos');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const btnGuardar = document.getElementById('guardarButton');
  if (btnGuardar) {
    btnGuardar.addEventListener('click', () => {
      guardarDatos(participants);
    });
  }
});

// ========== INICIALIZACIÓN ==========
function init() {
  participants = loadParticipants();
  renderTable();
}
document.addEventListener('DOMContentLoaded', init);
