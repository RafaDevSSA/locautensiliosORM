/*
 * Módulo compartilhado de contratos (contrato.html, contrato-inteligente.html e lista-contratos.html).
 * Funciona no navegador (window.LocaContrato) e no Node (require), para poder ser testado.
 *
 * Formato dos dados de um contrato ("dados"), salvo por inteiro no Firestore:
 *   locador   { nome, nacionalidade, estadoCivil, cpf, rg, endereco }
 *   locatario { nome, cpf, rg, endereco }
 *   locacao   { descItens, dataInicio (AAAA-MM-DD), duracaoDias, localRetirada, valorAluguel,
 *               taxaDano, multaAtraso, dataContrato (AAAA-MM-DD), cidade, estado }
 * Com esses dados o texto e o PDF são regerados exatamente como no primeiro uso.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./utils.js'));
  else root.LocaContrato = factory(root.LocaUtils);
})(typeof self !== 'undefined' ? self : this, function (U) {
  'use strict';

  const SCHEMA_VERSION = 2;
  const G = typeof window !== 'undefined' ? window : {};

  // [grupo, campo, id do input nos formulários, tipo: 's' texto | 'n' número | 'i' inteiro]
  const MAPA = [
    ['locador', 'nome', 'locador-nome', 's'],
    ['locador', 'nacionalidade', 'locador-nacionalidade', 's'],
    ['locador', 'estadoCivil', 'locador-estado-civil', 's'],
    ['locador', 'cpf', 'locador-cpf', 's'],
    ['locador', 'rg', 'locador-rg', 's'],
    ['locador', 'endereco', 'locador-endereco', 's'],
    ['locatario', 'nome', 'locatario-nome', 's'],
    ['locatario', 'cpf', 'locatario-cpf', 's'],
    ['locatario', 'rg', 'locatario-rg', 's'],
    ['locatario', 'endereco', 'locatario-endereco', 's'],
    ['locacao', 'descItens', 'desc-itens', 's'],
    ['locacao', 'dataInicio', 'data-inicio', 's'],
    ['locacao', 'duracaoDias', 'duracao-dias', 'i'],
    ['locacao', 'localRetirada', 'local-retirada', 's'],
    ['locacao', 'valorAluguel', 'valor-aluguel', 'n'],
    ['locacao', 'taxaDano', 'taxa-dano', 's'],
    ['locacao', 'multaAtraso', 'multa-atraso', 'n'],
    ['locacao', 'dataContrato', 'data-contrato', 's'],
    ['locacao', 'cidade', 'cidade-contrato', 's'],
    ['locacao', 'estado', 'estado-contrato', 's']
  ];

  function vazio() {
    const dados = { locador: {}, locatario: {}, locacao: {} };
    MAPA.forEach(([g, c, , t]) => { dados[g][c] = t === 's' ? '' : 0; });
    return dados;
  }

  // Garante que todos os campos existem com o tipo certo (dados vindos do Firestore podem estar incompletos).
  function normalizar(origem) {
    const dados = vazio();
    MAPA.forEach(([g, c, , t]) => {
      const v = origem && origem[g] ? origem[g][c] : undefined;
      if (t === 's') dados[g][c] = v == null ? '' : String(v);
      else if (t === 'i') dados[g][c] = parseInt(v, 10) || 0;
      else dados[g][c] = parseFloat(v) || 0;
    });
    return dados;
  }

  // ---------- Formulário <-> dados ----------
  function lerFormulario(doc) {
    const dados = vazio();
    MAPA.forEach(([g, c, id, t]) => {
      const el = doc.getElementById(id);
      const v = el ? String(el.value) : '';
      if (t === 's') dados[g][c] = v.trim();
      else if (t === 'i') dados[g][c] = parseInt(v, 10) || 0;
      else dados[g][c] = parseFloat(v) || 0;
    });
    return dados;
  }

  function preencherFormulario(doc, dados) {
    const d = normalizar(dados);
    MAPA.forEach(([g, c, id, t]) => {
      const el = doc.getElementById(id);
      if (!el) return;
      const v = d[g][c];
      el.value = t !== 's' && !v ? '' : String(v);
    });
  }

  // ---------- Texto do contrato ----------
  const esc = (s) => U.escapeHtml(s).replace(/\r?\n/g, '<br>');

  function dataFimISO(dados) {
    const l = dados.locacao;
    return l.dataInicio && l.duracaoDias > 0 ? U.somarDias(l.dataInicio, l.duracaoDias - 1) : '';
  }

  function gerarHTML(entrada) {
    const dados = normalizar(entrada);
    const lr = dados.locador;
    const lt = dados.locatario;
    const l = dados.locacao;
    const dias = l.duracaoDias;
    const diasTxt = `${dias} (${U.numeroPorExtenso(dias)}) ${dias === 1 ? 'dia' : 'dias'}`;

    return `
                <div class="contract-title">CONTRATO DE LOCAÇÃO DE UTENSILIOS PARA EVENTOS</div>

                <p>Pelo presente instrumento, de um lado, ${esc(lr.nome)}, ${esc(lr.nacionalidade)}, ${esc(lr.estadoCivil)}, inscrita no CPF sob o nº ${esc(lr.cpf)} e no RG nº ${esc(lr.rg)}, residente e domiciliado(a) à ${esc(lr.endereco)}, doravante denominado(a) LOCADOR(a) e de outro lado ${esc(lt.nome)}, inscrito(a) no CPF sob o nº ${esc(lt.cpf)} e no RG nº ${esc(lt.rg)}, residente e domiciliado à ${esc(lt.endereco)}, doravante denominado LOCATÁRIO, têm, entre si, justo e acertado o presente contrato de locação de utensílios que se regerá pelas cláusulas e condições descritas a seguir.</p>

                <p><strong>Cláusula 1ª.</strong> ${esc(l.descItens)}</p>

                <p><strong>Cláusula 2ª.</strong> É vedado ao(à) LOCATÁRIO transferir, sublocar, ceder ou emprestar os bens ora locados a terceiros.</p>

                <p><strong>Cláusula 3ª.</strong> A locação terá duração de ${diasTxt}, com início em ${U.formatarDataBR(l.dataInicio)}, quando os bens serão retirados pelo LOCATÁRIO no endereço indicado pelo LOCADOR, qual seja, ${esc(l.localRetirada)}, e finalizando no dia ${U.formatarDataBR(dataFimISO(dados))} quando os bens serão entregues pelo LOCATÁRIO.</p>

                <p><strong>Cláusula 4ª.</strong> O valor do aluguel será de R$ ${U.formatarMoeda(l.valorAluguel)} (${U.valorPorExtenso(l.valorAluguel)}), 50% sendo paga no ato lavrado deste contrato e 50% restantes a ser pago pelo(a) LOCATÁRIO no momento da entrega dos bens.</p>

                <p><strong>Cláusula 5ª.</strong> Ao final da locação os bens deverão ser devolvidos pelo(a) LOCATÁRIO(a) nas mesmas condições de limpeza e conservação em que foram recebidos, sob pena de responder por perdas e danos além dos custos de limpeza.</p>

                <p><strong>Cláusula 6ª.</strong> ${esc(l.taxaDano)}</p>

                <p><strong>Cláusula 7ª.</strong> Caso o prazo para devolução dos bens, especificado na cláusula terceira, não seja respeitado pelo(a) LOCATÁRIO, que deixar de disponibilizar os bens para retirada, este(a) incorrerá em multa de R$ ${U.formatarMoeda(l.multaAtraso)} (${U.valorPorExtenso(l.multaAtraso)}) por dia de atraso.</p>

                <p>Por estarem assim justos e contratados, firmam o presente instrumento em duas vias de igual teor.</p>

                <p>${esc(l.cidade)} - ${esc(l.estado)}, ${U.formatarDataBR(l.dataContrato)}.</p>

                <div class="signatures">
                    <div class="signature-line">
                        <div class="line"></div>
                        <div>Assinatura do locador</div>
                    </div>

                    <div class="signature-line">
                        <div class="line"></div>
                        <div>Assinatura do locatário</div>
                    </div>
                </div>
            `;
  }

  function primeiroNome(dados) {
    const n = String((dados.locatario && dados.locatario.nome) || '').trim().split(/\s+/)[0] || 'cliente';
    return n.replace(/[\\/:*?"<>|]+/g, '') || 'cliente';
  }

  function nomeArquivo(dados, referencia) {
    return `CONTRATO_${primeiroNome(dados)}_${U.hojeISO(referencia)}.pdf`;
  }

  // ---------- PDF (somente navegador) ----------
  // Resolve com o nome do arquivo gerado; rejeita se as bibliotecas não carregaram ou a captura falhar.
  function gerarPDF(entrada) {
    return new Promise((resolve, reject) => {
      try {
        if (!G.jspdf || !G.html2canvas) {
          throw new Error('Bibliotecas de PDF não carregadas. Verifique a conexão e recarregue a página.');
        }
        const dados = normalizar(entrada);
        const { jsPDF } = G.jspdf;

        const el = document.createElement('div');
        el.style.width = '210mm';
        el.style.padding = '20mm';
        el.style.backgroundColor = 'white';
        el.style.position = 'absolute';
        el.style.left = '-9999px';
        el.style.textAlign = 'justify';
        el.style.fontFamily = "'Times New Roman', Times, serif";
        el.style.lineHeight = '1.5';
        el.innerHTML = gerarHTML(dados);
        document.body.appendChild(el);

        G.html2canvas(el, { scale: 2, useCORS: true, logging: false }).then((canvas) => {
          document.body.removeChild(el);

          const imgData = canvas.toDataURL('image/jpeg', 1.0);
          const pdf = new jsPDF('p', 'mm', 'a4');
          const pageWidth = pdf.internal.pageSize.getWidth();
          const pageHeight = pdf.internal.pageSize.getHeight();
          const imgWidth = pageWidth;
          const imgHeight = canvas.height * imgWidth / canvas.width;

          let heightLeft = imgHeight;
          let position = 0;
          pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
          while (heightLeft > 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
          }

          const nome = nomeArquivo(dados);
          pdf.save(nome);
          resolve(nome);
        }).catch((e) => {
          if (el.parentNode) el.parentNode.removeChild(el);
          reject(e);
        });
      } catch (e) {
        reject(e);
      }
    });
  }

  // ---------- Firestore ----------
  // Documento salvo: campos antigos (nome, data, itens) continuam, para não quebrar registros e telas antigas.
  function paraFirestore(entrada) {
    const dados = normalizar(entrada);
    return {
      nome: primeiroNome(dados),
      data: U.formatarDataBR(dados.locacao.dataInicio),
      itens: dados.locacao.descItens,
      schemaVersion: SCHEMA_VERSION,
      locador: dados.locador,
      locatario: dados.locatario,
      locacao: dados.locacao,
      dataFim: dataFimISO(dados)
    };
  }

  function paraData(t) {
    if (!t) return null;
    if (typeof t.toDate === 'function') return t.toDate();
    return t instanceof Date ? t : null;
  }

  // Converte um documento do Firestore para o modelo usado na tela de gestão.
  // "completo" = tem todos os dados e pode ser regerado; registros antigos só têm nome, data e itens.
  function deFirestore(id, d) {
    d = d || {};
    const completo = Number(d.schemaVersion) >= SCHEMA_VERSION && !!d.locatario && !!d.locacao;
    return {
      id,
      completo,
      dados: completo ? normalizar({ locador: d.locador, locatario: d.locatario, locacao: d.locacao }) : null,
      legado: { nome: d.nome || '', data: d.data || '', itens: d.itens || '' },
      criadoEm: paraData(d.criadoEm),
      ultimoPdfEm: paraData(d.ultimoPdfEm),
      pdfCount: Number(d.pdfCount) || 0
    };
  }

  // ---------- Situação do contrato ----------
  function diasEntre(aISO, bISO) {
    const a = U.partesISO(aISO);
    const b = U.partesISO(bISO);
    if (!a || !b) return 0;
    return Math.round((Date.UTC(b.ano, b.mes - 1, b.dia) - Date.UTC(a.ano, a.mes - 1, a.dia)) / 86400000);
  }

  // status: 'agendado' | 'andamento' | 'encerrado' | 'legado'
  function situacao(registro, hoje) {
    hoje = hoje || U.hojeISO();
    if (!registro.completo) return { status: 'legado', dataFim: '', progresso: 0, devolveHoje: false };
    const l = registro.dados.locacao;
    const fim = dataFimISO(registro.dados);
    if (!l.dataInicio || !fim) return { status: 'legado', dataFim: '', progresso: 0, devolveHoje: false };
    if (hoje < l.dataInicio) return { status: 'agendado', dataFim: fim, progresso: 0, devolveHoje: false };
    if (hoje > fim) return { status: 'encerrado', dataFim: fim, progresso: 1, devolveHoje: false };
    const total = Math.max(1, l.duracaoDias);
    return {
      status: 'andamento',
      dataFim: fim,
      progresso: Math.min(1, (diasEntre(l.dataInicio, hoje) + 1) / total),
      devolveHoje: hoje === fim
    };
  }

  // ---------- Aviso na tela (somente navegador) ----------
  function toast(mensagem, tipo) {
    let area = document.getElementById('toast-area');
    if (!area) {
      area = document.createElement('div');
      area.id = 'toast-area';
      area.setAttribute('role', 'status');
      area.setAttribute('aria-live', 'polite');
      document.body.appendChild(area);
    }
    const t = document.createElement('div');
    t.className = `toast ${tipo || 'ok'}`;
    t.textContent = mensagem;
    area.appendChild(t);
    setTimeout(() => t.classList.add('saindo'), (tipo === 'erro' ? 7000 : 4000));
    setTimeout(() => t.remove(), (tipo === 'erro' ? 7400 : 4400));
  }

  return {
    SCHEMA_VERSION, MAPA, vazio, normalizar, lerFormulario, preencherFormulario,
    gerarHTML, nomeArquivo, primeiroNome, gerarPDF, dataFimISO,
    paraFirestore, deFirestore, situacao, toast
  };
});
