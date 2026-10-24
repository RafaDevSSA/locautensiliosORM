/* Pequenos helpers de interface usados pelas telas inteligentes. */
(function (root) {
  'use strict';

  function mostrarAvisos(el, avisos, msgOk) {
    el.className = 'avisos';
    el.textContent = '';
    if (!avisos.length) {
      el.classList.add('ok');
      el.textContent = msgOk;
      return;
    }
    el.classList.add('alerta');
    const titulo = document.createElement('strong');
    titulo.textContent = 'Revise antes de gerar:';
    const ul = document.createElement('ul');
    avisos.forEach((a) => {
      const li = document.createElement('li');
      li.textContent = a;
      ul.appendChild(li);
    });
    el.append(titulo, ul);
  }

  // estado: 'ok' (preenchido pelo texto), 'falta' (não encontrado) ou '' (sem marca)
  function marcarCampo(el, estado) {
    if (!el) return;
    el.classList.remove('campo-ok', 'campo-falta');
    if (estado === 'ok') el.classList.add('campo-ok');
    else if (estado === 'falta') el.classList.add('campo-falta');
  }

  function guardar(chave, valor) {
    try { localStorage.setItem(chave, valor); } catch (e) { /* armazenamento indisponível */ }
  }

  function ler(chave) {
    try { return localStorage.getItem(chave) || ''; } catch (e) { return ''; }
  }

  function debounce(fn, ms) {
    let t;
    return function (...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), ms);
    };
  }

  async function copiar(texto) {
    try {
      await navigator.clipboard.writeText(texto);
      return true;
    } catch (e) {
      const ta = document.createElement('textarea');
      ta.value = texto;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch (_) { ok = false; }
      ta.remove();
      return ok;
    }
  }

  root.LocaUI = { mostrarAvisos, marcarCampo, guardar, ler, debounce, copiar };
})(window);
