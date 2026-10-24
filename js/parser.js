/*
 * Parser de texto livre para orçamentos e contratos (100% no navegador, sem API externa).
 *
 *   LocaParser.interpretarOrcamento(texto, { hoje, catalogo })
 *   LocaParser.interpretarContrato(texto, { hoje, catalogo })
 *
 * A ideia é "separação inteligente": o texto é quebrado em blocos (vírgula, ponto e vírgula,
 * quebra de linha, " e " antes de número) e cada bloco é reconhecido por padrões:
 * data, desconto, CPF, RG, valor, multa, duração, retirada, endereço, nome e itens.
 * Tudo o que o parser não tiver certeza vira aviso para o usuário revisar.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./utils.js'), require('./catalogo.js'));
  } else {
    root.LocaParser = factory(root.LocaUtils, root.LocaCatalogo);
  }
})(typeof self !== 'undefined' ? self : this, function (U, CATALOGO_PADRAO) {
  'use strict';

  const { normalizar, lerNumeroBR, isoDeData, dataValida, somarDias, capitalizarNome,
    numeroPorExtenso, formatarMoeda } = U;

  // ---------- Pedaços de expressão regular ----------
  const NUM = '(\\d{1,3}(?:\\.\\d{3})+(?:,\\d+)?|\\d+(?:[.,]\\d+)?)';
  const L = 'a-zà-ÿ';
  const SEM_LETRA_ANTES = `(?<![${L}])`;
  const SEM_LETRA_DEPOIS = `(?![${L}])`;
  const MESES_RE = 'janeiro|fevereiro|mar[çc]o|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro';
  const MESES = { janeiro: 1, fevereiro: 2, marco: 3, abril: 4, maio: 5, junho: 6, julho: 7,
    agosto: 8, setembro: 9, outubro: 10, novembro: 11, dezembro: 12 };
  const DIAS_SEMANA = { domingo: 0, segunda: 1, terca: 2, quarta: 3, quinta: 4, sexta: 5, sabado: 6 };
  const RUA_ANTES = '(?<!(?:rua|av\\.?|avenida|travessa|tv\\.?|pra[çc]a|alameda|estrada|rodovia|r\\.)\\s+)';

  const PALAVRAS_NUMERO = { um: 1, uma: 1, dois: 2, duas: 2, tres: 3, quatro: 4, cinco: 5, seis: 6,
    sete: 7, oito: 8, nove: 9, dez: 10, onze: 11, doze: 12, quinze: 15, vinte: 20, trinta: 30,
    quarenta: 40, cinquenta: 50, sessenta: 60, setenta: 70, oitenta: 80, noventa: 90, cem: 100,
    duzentos: 200, trezentos: 300, quinhentos: 500 };

  const STOP = new Set(['de', 'da', 'do', 'das', 'dos', 'com', 'e', 'a', 'o', 'as', 'os', 'um',
    'uma', 'para', 'em', 'no', 'na', 'nos', 'nas', 'pra']);

  const ROTULOS = new Set(['inicio', 'data', 'dia', 'retirada', 'retirar', 'devolucao', 'valor',
    'total', 'multa', 'cpf', 'rg', 'locatario', 'cliente', 'nome', 'endereco', 'residente',
    'mora', 'morador', 'orcamento', 'contrato', 'locacao', 'desconto', 'por', 'ate', 'durante',
    'duracao', 'aluguel', 'itens', 'item', 'preco', 'locador', 'contratante', 'ao', 'aos']);

  // ---------- Ferramentas de texto ----------
  function tirar(texto, re) {
    const m = re.exec(texto);
    if (!m) return { m: null, texto };
    return { m, texto: `${texto.slice(0, m.index)} ; ${texto.slice(m.index + m[0].length)}` };
  }

  function dividirBlocos(texto) {
    return texto
      .replace(/(\d),(\d)/g, '$1\u0001$2')
      .split(/[;\n]+|,|\s[-–—]\s|\s+e\s+(?=\d)/i)
      .map((s) => s.replace(/\u0001/g, ',').replace(/\s+/g, ' ').replace(/^[\s:\-–—]+|[\s:\-–—]+$/g, ''))
      .filter((s) => /[\p{L}\d]/u.test(s));
  }

  function ehRotulo(bloco) {
    const palavras = normalizar(bloco).split(/[^a-z0-9]+/).filter(Boolean);
    return palavras.length > 0 && palavras.every((p) => ROTULOS.has(p) || STOP.has(p));
  }

  // Ponto final de frase vira separador de bloco; abreviações (Av., R., un.) são preservadas.
  const ABREVIACOES = new Set(['av', 'r', 'tv', 'dr', 'dra', 'sr', 'sra', 'prof', 'cj', 'ap', 'apt',
    'qd', 'lt', 'bl', 'jd', 'est', 'n', 'km', 'pc', 'un', 'unid', 'qtd', 'qtde', 'no', 'nº', 'ltda']);

  function prepararTexto(texto) {
    return String(texto || '')
      .replace(/\r/g, '')
      .replace(/([^\s.;]+)\.(?=\s|$)/g, (todo, palavra) => {
        const base = normalizar(palavra).replace(/[^a-zº]/g, '');
        return ABREVIACOES.has(base) ? todo : `${palavra};`;
      });
  }

  function limparNome(s) {
    let nome = String(s || '').replace(/[:\-–]+\s*$/, '').replace(/^\s*[:\-–]+/, '')
      .replace(/\s+/g, ' ').trim();
    nome = nome.replace(new RegExp(`^(?:para|pra|de)\\s+`, 'i'), '');
    nome = nome.replace(new RegExp(`\\s+(?:dia|desconto|cpf|rg|data|para|com)${SEM_LETRA_DEPOIS}.*$`, 'i'), '');
    return capitalizarNome(nome.trim());
  }

  // ---------- Datas ----------
  function acharDatas(texto, hojeData) {
    const hoje = hojeData || new Date();
    const hojeISO = isoDeData(hoje);
    const achados = [];

    function resolver(dia, mes, ano) {
      let a = ano;
      if (a === undefined) {
        a = hoje.getFullYear();
        if (dataValida(a, mes, dia) && isoDeData(new Date(a, mes - 1, dia)) < hojeISO) a += 1;
      } else if (a < 100) {
        a += 2000;
      }
      return dataValida(a, mes, dia) ? isoDeData(new Date(a, mes - 1, dia)) : null;
    }

    function registrar(m, iso) {
      if (!iso) return;
      const inicio = m.index;
      const fim = m.index + m[0].length;
      if (achados.some((x) => inicio < x.fim && fim > x.inicio)) return;
      achados.push({ iso, inicio, fim, texto: m[0] });
    }

    function varrer(re, resolverMatch) {
      const g = new RegExp(re.source, re.flags.includes('g') ? re.flags : `${re.flags}g`);
      let m;
      while ((m = g.exec(texto)) !== null) registrar(m, resolverMatch(m));
    }

    varrer(/(?<![\d\/])(?:dia\s+)?(\d{1,2})\/(\d{1,2})(?:\/(\d{4}|\d{2}))?(?![\d\/])/i,
      (m) => resolver(+m[1], +m[2], m[3] ? +m[3] : undefined));
    varrer(/(?<![\d\/])(\d{1,2})-(\d{1,2})-(\d{4})(?!\d)/,
      (m) => resolver(+m[1], +m[2], +m[3]));
    varrer(new RegExp(`${RUA_ANTES}(?<![\\d])(?:dia\\s+)?(\\d{1,2})\\s+de\\s+(${MESES_RE})(?:\\s+(?:de\\s+)?(\\d{4}))?(?!\\d)`, 'i'),
      (m) => resolver(+m[1], MESES[normalizar(m[2])], m[3] ? +m[3] : undefined));
    varrer(new RegExp(`${SEM_LETRA_ANTES}dia\\s+(\\d{1,2})(?![\\d\\/])(?!\\s*de\\s+(?:${MESES_RE}))`, 'i'), (m) => {
      const dia = +m[1];
      let mes = hoje.getMonth() + 1;
      let ano = hoje.getFullYear();
      if (dia < hoje.getDate()) {
        mes += 1;
        if (mes > 12) { mes = 1; ano += 1; }
      }
      return dataValida(ano, mes, dia) ? isoDeData(new Date(ano, mes - 1, dia)) : null;
    });
    varrer(new RegExp(`${SEM_LETRA_ANTES}(depois\\s+de\\s+amanh[ãa]|amanh[ãa]|hoje)${SEM_LETRA_DEPOIS}`, 'i'), (m) => {
      const t = normalizar(m[1]);
      const dias = t === 'hoje' ? 0 : t.startsWith('depois') ? 2 : 1;
      return somarDias(hojeISO, dias);
    });
    varrer(new RegExp(`${SEM_LETRA_ANTES}(segunda|ter[çc]a|quarta|quinta|sexta|s[áa]bado|domingo)(?:-feira)?${SEM_LETRA_DEPOIS}`, 'i'), (m) => {
      const alvo = DIAS_SEMANA[normalizar(m[1]).replace('ç', 'c')];
      let delta = (alvo - hoje.getDay() + 7) % 7;
      if (delta === 0) delta = 7;
      return somarDias(hojeISO, delta);
    });

    return achados.sort((a, b) => a.inicio - b.inicio);
  }

  const LIGACAO_ANTES = new RegExp(`(?:${SEM_LETRA_ANTES}(?:a\\s+partir\\s+de|desde|d[eo]|no|na|em|para|pro|pra|at[eé]|ao|à|a)\\s+(?:o\\s+)?)+$`, 'i');

  function removerTrechos(texto, trechos) {
    let saida = texto;
    [...trechos].sort((a, b) => b.inicio - a.inicio).forEach((t) => {
      const ligacao = LIGACAO_ANTES.exec(saida.slice(0, t.inicio));
      const inicio = ligacao ? t.inicio - ligacao[0].length : t.inicio;
      saida = `${saida.slice(0, inicio)} ; ${saida.slice(t.fim)}`;
    });
    return saida;
  }

  // ---------- Catálogo ----------
  function singular(t) {
    if (/^\d+$/.test(t) || t.length <= 3) return t;
    if (/(oes|aes)$/.test(t)) return `${t.slice(0, -3)}ao`;
    if (/(res|zes)$/.test(t)) return t.slice(0, -2);
    if (/ns$/.test(t)) return `${t.slice(0, -2)}m`;
    if (t.endsWith('s') && !t.endsWith('ss')) return t.slice(0, -1);
    return t;
  }

  function tokens(s) {
    return normalizar(s)
      .replace(/(\d)([a-z])/g, '$1 $2')
      .replace(/([a-z])(\d)/g, '$1 $2')
      .split(/[^a-z0-9]+/)
      .filter(Boolean)
      .map(singular)
      .filter((t) => !STOP.has(t));
  }

  function similaridade(a, b) {
    const A = new Set(a);
    const B = new Set(b);
    if (!A.size || !B.size) return 0;
    let inter = 0;
    A.forEach((x) => { if (B.has(x)) inter += 1; });
    return inter / (A.size + B.size - inter);
  }

  function casarCatalogo(descricao, catalogo) {
    const lista = catalogo || CATALOGO_PADRAO;
    const tokDesc = tokens(descricao);
    let melhor = null;
    lista.forEach((item) => {
      const refs = [item.nome, ...(item.apelidos || [])];
      const pontos = Math.max(...refs.map((r) => similaridade(tokDesc, tokens(r))));
      if (!melhor || pontos > melhor.pontos) melhor = { item, pontos };
    });
    return melhor && melhor.pontos >= 0.6 ? melhor : null;
  }

  function tamanhosConhecidos(catalogo) {
    const set = new Set(['29']);
    (catalogo || CATALOGO_PADRAO).forEach((i) => (i.nome.match(/\d+/g) || []).forEach((n) => set.add(n)));
    return set;
  }

  // ---------- Itens ----------
  function interpretarItem(bloco, catalogo, avisos) {
    let s = ` ${bloco} `.replace(/\s+/g, ' ');
    let quantidade = null;
    let preco = null;
    let totalInformado = null;
    let m;

    const remover = (re) => { s = s.replace(re, ' '); };

    // preço total do item
    m = new RegExp(`${SEM_LETRA_ANTES}total\\s*(?:de\\s*)?(?:R\\$\\s*)?${NUM}`, 'i').exec(s);
    if (m) { totalInformado = lerNumeroBR(m[1]); remover(m[0]); }

    // preço unitário com R$
    if (totalInformado === null) {
      m = new RegExp(`R\\$\\s*${NUM}`, 'i').exec(s);
      if (m) { preco = lerNumeroBR(m[1]); remover(m[0]); }
    }

    // preço unitário com marcador (a 2,50 / por 2,50 / valor 2,50)
    if (preco === null && totalInformado === null) {
      m = new RegExp(`(?:${SEM_LETRA_ANTES}(?:a|por|valor|pre[çc]o|à)|(?<=\\s)x)\\s+(?:de\\s+)?${NUM}(?![\\d])(?!\\s*(?:cm|mm|ml|litros?|l${SEM_LETRA_DEPOIS}|%))`, 'i').exec(s);
      if (m) { preco = lerNumeroBR(m[1]); remover(m[0]); }
    }

    // quantidade explícita (qtd 100) ou no fim (100 un)
    m = new RegExp(`${SEM_LETRA_ANTES}(?:qtd|qtde|quantidade)\\s*[:\\-]?\\s*(\\d+)`, 'i').exec(s);
    if (m) { quantidade = +m[1]; remover(m[0]); }
    if (quantidade === null) {
      m = new RegExp(`(\\d+)\\s*(?:un\\.?|unid(?:ades?|\\.)?|pe[çc]as?|pcs)\\s*$`, 'i').exec(s);
      if (m) { quantidade = +m[1]; remover(m[0]); }
    }

    // quantidade no começo (100 pratos / 100x pratos / 100 un pratos / cem pratos)
    if (quantidade === null) {
      m = /^\s*(\d+)\s*(?:x|un\.?|unid(?:ades?|\.)?|p[çc]s?|pe[çc]as?)?\s+(?!(?:cm|mm|ml|litros?|l)(?![a-zà-ÿ]))(\S.*)$/i.exec(s);
      if (m) { quantidade = +m[1]; s = ` ${m[2]} `; }
    }
    if (quantidade === null) {
      m = /^\s*([a-zà-ÿ]+)\s+(\S.*)$/i.exec(s);
      if (m && PALAVRAS_NUMERO[normalizar(m[1])]) { quantidade = PALAVRAS_NUMERO[normalizar(m[1])]; s = ` ${m[2]} `; }
    }

    // número solto no fim = preço (se for decimal ou não parecer tamanho de peça)
    if (preco === null && totalInformado === null) {
      m = new RegExp(`\\s${NUM}\\s*$`).exec(s);
      if (m && /[a-zà-ÿ]/i.test(s.slice(0, m.index))) {
        const bruto = m[1];
        const ehTamanho = tamanhosConhecidos(catalogo).has(bruto);
        if (!ehTamanho || /[.,]/.test(bruto)) { preco = lerNumeroBR(bruto); s = s.slice(0, m.index); }
      }
    }

    // limpeza da descrição
    s = s.replace(/\bcada(?:\s+um)?\b/gi, ' ')
      .replace(/\b(?:a\s+)?unidade\b/gi, ' ')
      .replace(/(?:^|\s)(?:un|unid)\.?(?=\s|$)/gi, ' ')
      .replace(/^\s*(?:de|x|[-:])\s+/i, ' ')
      .replace(/\s+(?:a|por|x|de|com|[-:])\s*$/i, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!/[a-zà-ÿ]/i.test(s)) {
      avisos.push(`Não entendi o item "${bloco}".`);
      return null;
    }

    if (quantidade === null) {
      quantidade = 1;
      avisos.push(`Quantidade não informada em "${bloco}"; usei 1.`);
    }
    if (totalInformado !== null && quantidade > 0) preco = totalInformado / quantidade;

    const achado = casarCatalogo(s, catalogo);
    let descricao;
    let plural;
    if (achado) {
      descricao = achado.item.nome;
      plural = achado.item.plural || achado.item.nome;
      if (preco === null && achado.item.preco != null) preco = achado.item.preco;
    } else {
      descricao = s.charAt(0).toUpperCase() + s.slice(1);
      plural = s;
    }

    return {
      descricao,
      descricaoPlural: plural,
      quantidade,
      preco,
      doCatalogo: Boolean(achado),
      bruto: bloco
    };
  }

  function interpretarItens(blocos, catalogo, avisos) {
    return blocos
      .filter((b) => !ehRotulo(b))
      .map((b) => interpretarItem(b, catalogo, avisos))
      .filter(Boolean);
  }

  function pareceItemOuRotulo(bloco, catalogo) {
    return ehRotulo(bloco) || Boolean(casarCatalogo(bloco, catalogo));
  }

  // ---------- CPF ----------
  function validarCPF(cpf) {
    const d = String(cpf).replace(/\D/g, '');
    if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
    const digito = (base) => {
      let soma = 0;
      for (let i = 0; i < base.length; i++) soma += +base[i] * (base.length + 1 - i);
      const r = (soma * 10) % 11;
      return r === 10 ? 0 : r;
    };
    return digito(d.slice(0, 9)) === +d[9] && digito(d.slice(0, 10)) === +d[10];
  }

  function formatarCPF(cpf) {
    const d = String(cpf).replace(/\D/g, '');
    return d.length === 11 ? `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}` : cpf;
  }

  // ---------- Orçamento ----------
  function interpretarOrcamento(texto, opcoes) {
    const hoje = (opcoes && opcoes.hoje) || new Date();
    const catalogo = (opcoes && opcoes.catalogo) || CATALOGO_PADRAO;
    const avisos = [];
    const r = { cliente: '', dataLocacao: '', desconto: null, itens: [], avisos };
    let t = prepararTexto(texto);
    if (!t.trim()) return r;

    // desconto
    let x = tirar(t, new RegExp(`desconto\\s*(?:de|:)?\\s*${NUM}\\s*%?`, 'i'));
    if (!x.m) x = tirar(t, new RegExp(`${NUM}\\s*%\\s*(?:de\\s+)?desconto`, 'i'));
    if (x.m) {
      r.desconto = lerNumeroBR(x.m[1]);
      t = x.texto;
      if (r.desconto < 5 || r.desconto > 100) {
        avisos.push(`Desconto de ${r.desconto}% fora do permitido (5% a 100%); confira.`);
      }
    }

    // data
    const datas = acharDatas(t, hoje);
    if (datas.length) {
      r.dataLocacao = datas[0].iso;
      t = removerTrechos(t, [datas[0]]);
      if (datas.length > 1) avisos.push('Mais de uma data no texto; usei a primeira como data de locação.');
    } else {
      avisos.push('Data de locação não encontrada.');
    }

    // cliente
    x = tirar(t, new RegExp(`${SEM_LETRA_ANTES}(?:cliente|nome(?:\\s+do\\s+cliente)?|or[çc]amento\\s+(?:para|pra|de))\\s*[:\\-]?\\s*([^\\d,;\\n]+?)(?=\\s*(?:[,;\\n]|\\d|$|\\s(?:dia|desconto|cpf|rg|data|para|com)${SEM_LETRA_DEPOIS}))`, 'i'));
    if (x.m) {
      r.cliente = limparNome(x.m[1]);
      t = x.texto;
    }

    const blocos = dividirBlocos(t);
    if (!r.cliente) {
      const i = blocos.findIndex((b) => !/\d/.test(b) && !pareceItemOuRotulo(b, catalogo));
      if (i === 0 || (i > 0 && blocos.slice(0, i).every((b) => ehRotulo(b)))) {
        r.cliente = limparNome(blocos[i]);
        blocos.splice(i, 1);
      }
    }
    if (!r.cliente) avisos.push('Nome do cliente não encontrado.');

    r.itens = interpretarItens(blocos, catalogo, avisos);
    if (!r.itens.length) avisos.push('Nenhum item encontrado.');
    r.itens.forEach((i) => {
      if (i.preco === null) avisos.push(`Preço não informado para "${i.descricao}".`);
    });
    return r;
  }

  // ---------- Contrato ----------
  function textoItensContrato(itens) {
    const partes = itens.map((i) => {
      const nome = i.quantidade > 1 ? i.descricaoPlural : i.descricao.charAt(0).toLowerCase() + i.descricao.slice(1);
      return `${i.quantidade} (${numeroPorExtenso(i.quantidade)}) ${nome}`;
    });
    const lista = partes.length > 1 ? `${partes.slice(0, -1).join(', ')} e ${partes[partes.length - 1]}` : partes[0];
    return `O presente contrato tem como objetos ${lista}, todos em bom estado de conservação e limpeza, de propriedade do(a) LOCADOR, que serão locados ao LOCATÁRIO.`;
  }

  const FIM_TRECHO = `(?=\\s*(?:;|\\n|$|,\\s*(?:valor|cpf|rg|multa|in[ií]cio|retirada|por\\s+\\d|durante|itens?|aluguel|\\d+\\s+(?:pratos?|ta[çc]as?|r[eé]chaud\\w*|ramekin\\w*|travessas?|talheres))))`;

  function interpretarContrato(texto, opcoes) {
    const hoje = (opcoes && opcoes.hoje) || new Date();
    const catalogo = (opcoes && opcoes.catalogo) || CATALOGO_PADRAO;
    const avisos = [];
    const r = {
      locatario: { nome: '', cpf: '', rg: '', endereco: '' },
      inicio: '', fim: '', duracaoDias: null, localRetirada: '', valor: null, multaAtraso: null,
      dataContrato: '', itens: [], descItens: '', avisos
    };
    let t = prepararTexto(texto);
    if (!t.trim()) return r;
    let x;

    // CPF
    x = tirar(t, new RegExp(`${SEM_LETRA_ANTES}cpf\\s*(?:n[ºo°.]*)?\\s*[:\\-]?\\s*(\\d{3}\\.?\\d{3}\\.?\\d{3}-?\\d{2})(?!\\d)`, 'i'));
    if (!x.m) x = tirar(t, /(?<![\d.])(\d{3}\.\d{3}\.\d{3}-\d{2})(?!\d)/);
    if (!x.m) x = tirar(t, /(?<![\d.,\-\/])(\d{11})(?!\d)/);
    if (x.m) {
      r.locatario.cpf = formatarCPF(x.m[1]);
      t = x.texto;
      if (!validarCPF(x.m[1])) avisos.push(`CPF ${r.locatario.cpf} parece inválido (dígito verificador); confira.`);
    }

    // RG
    x = tirar(t, new RegExp(`${SEM_LETRA_ANTES}rg${SEM_LETRA_DEPOIS}\\s*(?:n[ºo°.]*)?\\s*[:\\-]?\\s*(\\d[\\dxX.\\-]{4,14})`, 'i'));
    if (x.m) {
      r.locatario.rg = x.m[1].replace(/[.\-]+$/, '');
      t = x.texto;
    }

    // multa
    x = tirar(t, new RegExp(`${SEM_LETRA_ANTES}multa(?:\\s+(?:por\\s+atraso|de\\s+atraso|di[aá]ria))?\\s*(?:de|:)?\\s*(?:R\\$\\s*)?${NUM}(?:\\s*(?:por\\s+dia|\\/dia|ao\\s+dia|reais))?`, 'i'));
    if (x.m) {
      r.multaAtraso = lerNumeroBR(x.m[1]);
      t = x.texto;
    }

    // valor do aluguel
    x = tirar(t, new RegExp(`${SEM_LETRA_ANTES}(?:valor|aluguel|pre[çc]o|total|custo)(?:\\s+do\\s+aluguel|\\s+total)?\\s*(?:de|:|é|=)?\\s*(?:R\\$\\s*)?${NUM}(?:\\s*reais)?`, 'i'));
    if (!x.m) x = tirar(t, new RegExp(`R\\$\\s*${NUM}`, 'i'));
    if (!x.m) x = tirar(t, new RegExp(`${NUM}\\s*reais`, 'i'));
    if (x.m) {
      r.valor = lerNumeroBR(x.m[1]);
      t = x.texto;
    }

    // datas
    let datas = acharDatas(t, hoje);
    const rotuloContrato = /data\s+(?:do|de)\s+contrato\s*[:\-]?\s*$/i;
    const dContrato = datas.find((d) => rotuloContrato.test(t.slice(Math.max(0, d.inicio - 30), d.inicio)));
    if (dContrato) {
      r.dataContrato = dContrato.iso;
      const antes = t.slice(Math.max(0, dContrato.inicio - 30), dContrato.inicio);
      const rot = rotuloContrato.exec(antes);
      dContrato.inicio -= rot[0].length;
      t = removerTrechos(t, [dContrato]);
      datas = acharDatas(t, hoje);
    }
    if (datas.length) {
      r.inicio = datas[0].iso;
      const usados = [datas[0]];
      if (datas.length > 1) {
        r.fim = datas[1].iso;
        usados.push(datas[1]);
        if (datas.length > 2) avisos.push('Mais de duas datas no texto; usei as duas primeiras (início e devolução).');
      }
      t = removerTrechos(t, usados);
    }

    // duração
    x = tirar(t, new RegExp(`${SEM_LETRA_ANTES}(?:por|durante|dura[çc][aã]o(?:\\s+de)?|prazo(?:\\s+de)?)\\s*(\\d+)\\s*(dias?|di[aá]rias?|semanas?)${SEM_LETRA_DEPOIS}`, 'i'));
    if (!x.m) x = tirar(t, new RegExp(`(?<![\\d.,])(\\d+)\\s*(dias?|di[aá]rias?|semanas?)${SEM_LETRA_DEPOIS}`, 'i'));
    if (x.m) {
      r.duracaoDias = +x.m[1] * (/^semana/i.test(x.m[2]) ? 7 : 1);
      t = x.texto;
    }
    if (!r.duracaoDias && r.inicio && r.fim) {
      const p = (iso) => { const [a, m, d] = iso.split('-').map(Number); return Date.UTC(a, m - 1, d); };
      const dias = Math.round((p(r.fim) - p(r.inicio)) / 86400000) + 1;
      if (dias >= 1) r.duracaoDias = dias;
      else avisos.push('A data de devolução é anterior ao início; confira as datas.');
    }
    if (r.duracaoDias && r.inicio) r.fim = somarDias(r.inicio, r.duracaoDias - 1);

    // local de retirada
    x = tirar(t, new RegExp(`${SEM_LETRA_ANTES}(?:retirad[ao]|retira|buscar|busca|local\\s+de\\s+retirada)${SEM_LETRA_DEPOIS}\\s*(?:[;:\\-]\\s*)*(?:(?:no|na|em|do|da|pelo|pela)${SEM_LETRA_DEPOIS}\\s+)?(?:local\\s+)?([^;\\n]+?)${FIM_TRECHO}`, 'i'));
    if (x.m && /[a-zà-ÿ]{3}/i.test(x.m[1])) {
      r.localRetirada = x.m[1].trim().replace(/[.,;]+$/, '');
      t = x.texto;
    }

    // endereço do locatário
    x = tirar(t, new RegExp(`${SEM_LETRA_ANTES}(?:endere[çc]o|resid(?:ente|e|indo)|mor(?:a|ador|ando)|domiciliad[oa])${SEM_LETRA_DEPOIS}\\s*(?:[:\\-]\\s*)?(?:(?:em|na|no|à|a|do|da)${SEM_LETRA_DEPOIS}\\s+)?([^;\\n]+?)${FIM_TRECHO}`, 'i'));
    if (!x.m) {
      x = tirar(t, new RegExp(`${SEM_LETRA_ANTES}((?:rua|r\\.|avenida|av\\.?|pra[çc]a|alameda|estrada|rodovia|loteamento|condom[ií]nio|conjunto|quadra)\\s+[^;\\n]+?)${FIM_TRECHO}`, 'i'));
    }
    if (x.m) {
      r.locatario.endereco = x.m[1].trim().replace(/[.,;]+$/, '');
      t = x.texto;
    }

    // nome do locatário
    x = tirar(t, new RegExp(`${SEM_LETRA_ANTES}(?:locat[aá]rio|contratante|cliente|nome(?:\\s+do\\s+cliente)?|contrato\\s+(?:para|pra|com))\\s*[:\\-]?\\s*([^\\d,;\\n]+?)(?=\\s*(?:[,;\\n]|\\d|$|\\s(?:dia|cpf|rg|data|para|com)${SEM_LETRA_DEPOIS}))`, 'i'));
    if (x.m) {
      r.locatario.nome = limparNome(x.m[1]);
      t = x.texto;
    }

    const blocos = dividirBlocos(t);
    if (!r.locatario.nome) {
      const i = blocos.findIndex((b) => !/\d/.test(b) && !pareceItemOuRotulo(b, catalogo));
      if (i === 0 || (i > 0 && blocos.slice(0, i).every((b) => ehRotulo(b)))) {
        r.locatario.nome = limparNome(blocos[i]);
        blocos.splice(i, 1);
      }
    }

    r.itens = interpretarItens(blocos, catalogo, avisos);
    if (r.itens.length) r.descItens = textoItensContrato(r.itens);

    if (r.valor === null && r.itens.length && r.itens.every((i) => i.preco !== null)) {
      r.valor = Math.round(r.itens.reduce((s, i) => s + i.preco * i.quantidade, 0) * 100) / 100;
      avisos.push(`Valor calculado pela soma dos itens: R$ ${formatarMoeda(r.valor)}.`);
    }

    if (!r.locatario.nome) avisos.push('Nome do locatário não encontrado.');
    if (!r.locatario.cpf) avisos.push('CPF não encontrado.');
    if (!r.locatario.rg) avisos.push('RG não encontrado.');
    if (!r.locatario.endereco) avisos.push('Endereço do locatário não encontrado.');
    if (!r.inicio) avisos.push('Data de início não encontrada.');
    if (!r.duracaoDias) avisos.push('Duração não encontrada.');
    if (!r.localRetirada) avisos.push('Local de retirada não encontrado.');
    if (r.valor === null) avisos.push('Valor do aluguel não encontrado.');
    if (!r.itens.length) avisos.push('Nenhum item encontrado; o texto padrão da cláusula 1 foi mantido.');
    return r;
  }

  return {
    interpretarOrcamento, interpretarContrato, acharDatas, casarCatalogo,
    validarCPF, formatarCPF, textoItensContrato, dividirBlocos
  };
});
