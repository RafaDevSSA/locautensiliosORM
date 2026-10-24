/*
 * Utilitários compartilhados das telas "inteligentes".
 * Funciona no navegador (window.LocaUtils) e no Node (require), para poder ser testado.
 * Todas as datas trafegam como string ISO "AAAA-MM-DD" e são tratadas por partes,
 * sem passar por `new Date(string)`, o que evita o erro de fuso horário (dia -1 / +1).
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.LocaUtils = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const pad2 = (n) => String(n).padStart(2, '0');

  // ---------- Datas ----------
  function isoDeData(d) {
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  }

  function hojeISO(referencia) {
    return isoDeData(referencia || new Date());
  }

  function partesISO(iso) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
    if (!m) return null;
    return { ano: +m[1], mes: +m[2], dia: +m[3] };
  }

  function dataValida(ano, mes, dia) {
    const d = new Date(ano, mes - 1, dia);
    return d.getFullYear() === ano && d.getMonth() === mes - 1 && d.getDate() === dia;
  }

  function formatarDataBR(iso) {
    const p = partesISO(iso);
    if (!p) return '';
    return `${pad2(p.dia)}/${pad2(p.mes)}/${p.ano}`;
  }

  function somarDias(iso, dias) {
    const p = partesISO(iso);
    if (!p) return '';
    return isoDeData(new Date(p.ano, p.mes - 1, p.dia + dias));
  }

  const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho',
    'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

  function mesAno(referencia) {
    const d = referencia || new Date();
    const mes = MESES[d.getMonth()];
    return `${mes.charAt(0).toUpperCase()}${mes.slice(1)}, ${d.getFullYear()}`;
  }

  // ---------- Dinheiro ----------
  function formatarMoeda(valor) {
    return (Number(valor) || 0).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  // Converte "1.234,56", "1234.56", "R$ 12", "12,5" em número.
  function lerNumeroBR(texto) {
    if (typeof texto === 'number') return texto;
    let s = String(texto || '').replace(/R\$\s*/gi, '').trim();
    if (!s) return NaN;
    if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
    else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');
    const n = parseFloat(s);
    return Number.isFinite(n) ? n : NaN;
  }

  // ---------- Número por extenso (até 999.999.999) ----------
  const UN = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove', 'dez',
    'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
  const DZ = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
  const CT = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos',
    'setecentos', 'oitocentos', 'novecentos'];

  function ate999(x) {
    if (x === 0) return '';
    if (x === 100) return 'cem';
    const c = Math.floor(x / 100);
    const r = x % 100;
    const partes = [];
    if (c) partes.push(CT[c]);
    if (r) {
      if (r < 20) partes.push(UN[r]);
      else {
        const d = Math.floor(r / 10);
        const u = r % 10;
        partes.push(u ? `${DZ[d]} e ${UN[u]}` : DZ[d]);
      }
    }
    return partes.join(' e ');
  }

  function numeroPorExtenso(numero) {
    let n = Math.floor(Math.abs(Number(numero) || 0));
    if (n === 0) return 'zero';
    if (n > 999999999) return String(n);

    const escalas = [
      [1e6, 'milhão', 'milhões'],
      [1e3, 'mil', 'mil']
    ];
    const blocos = [];
    for (const [valor, singular, plural] of escalas) {
      const q = Math.floor(n / valor);
      n %= valor;
      if (!q) continue;
      let texto;
      if (valor === 1e3) texto = q === 1 ? 'mil' : `${ate999(q)} mil`;
      else texto = `${ate999(q)} ${q === 1 ? singular : plural}`;
      blocos.push({ texto, resto: n });
    }
    if (n) blocos.push({ texto: ate999(n), resto: 0 });

    let saida = blocos[0].texto;
    for (let i = 1; i < blocos.length; i++) {
      const resto = blocos[i - 1].resto;
      const conector = resto < 100 || resto % 100 === 0 ? ' e ' : ' ';
      saida += conector + blocos[i].texto;
    }
    return saida;
  }

  function valorPorExtenso(valor) {
    const total = Math.round((Number(valor) || 0) * 100);
    const reais = Math.floor(total / 100);
    const centavos = total % 100;

    let texto = '';
    if (reais > 0 || centavos === 0) {
      texto = numeroPorExtenso(reais);
      if (reais >= 1e6 && reais % 1e6 === 0) texto += ' de';
      texto += reais === 1 ? ' real' : ' reais';
    }
    if (centavos > 0) {
      const c = `${numeroPorExtenso(centavos)} ${centavos === 1 ? 'centavo' : 'centavos'}`;
      texto = texto ? `${texto} e ${c}` : c;
    }
    return texto;
  }

  // ---------- Texto ----------
  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Normaliza para comparação: minúsculas, sem acentos, espaços simples.
  function normalizar(s) {
    return String(s || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function capitalizarNome(s) {
    const minusculas = new Set(['de', 'da', 'do', 'das', 'dos', 'e']);
    return String(s || '').toLowerCase().split(/\s+/).filter(Boolean).map((p, i) =>
      i > 0 && minusculas.has(p) ? p : p.charAt(0).toUpperCase() + p.slice(1)
    ).join(' ');
  }

  return {
    isoDeData, hojeISO, partesISO, dataValida, formatarDataBR, somarDias, mesAno, MESES,
    formatarMoeda, lerNumeroBR, numeroPorExtenso, valorPorExtenso,
    escapeHtml, normalizar, capitalizarNome
  };
});
