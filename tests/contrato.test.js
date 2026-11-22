// Rode com: node --test tests/
const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../js/contrato.js');

const exemplo = () => ({
  locador: { nome: 'Raiana Araújo Valério', nacionalidade: 'brasileira', estadoCivil: 'casado(a)', cpf: '111', rg: '222', endereco: 'Rua A' },
  locatario: { nome: 'João da Silva', cpf: '529.982.247-25', rg: '1234567', endereco: 'Rua das Flores 10' },
  locacao: {
    descItens: '80 pratos com talheres', dataInicio: '2026-11-30', duracaoDias: 2, localRetirada: 'Linha Verde',
    valorAluguel: 350, taxaDano: 'Taxas de dano.', multaAtraso: 50, dataContrato: '2026-11-22', cidade: 'Camaçari', estado: 'BA'
  }
});

// Formulário falso: só precisa de getElementById com { value }.
function formularioFalso() {
  const els = {};
  C.MAPA.forEach(([, , id]) => { els[id] = { value: '' }; });
  return { els, getElementById: (id) => els[id] || null };
}

test('formulário -> dados -> formulário preserva todos os campos', () => {
  const f = formularioFalso();
  C.preencherFormulario(f, exemplo());
  assert.deepEqual(C.lerFormulario(f), exemplo());
});

test('lerFormulario converte números e ignora espaços nas pontas', () => {
  const f = formularioFalso();
  C.preencherFormulario(f, exemplo());
  f.els['valor-aluguel'].value = '1234.5';
  f.els['duracao-dias'].value = '3';
  f.els['locatario-nome'].value = '  Maria  ';
  const d = C.lerFormulario(f);
  assert.equal(d.locacao.valorAluguel, 1234.5);
  assert.equal(d.locacao.duracaoDias, 3);
  assert.equal(d.locatario.nome, 'Maria');
});

test('gerarHTML monta as cláusulas com valores, datas e extenso', () => {
  const html = C.gerarHTML(exemplo());
  assert.match(html, /João da Silva/);
  assert.match(html, /2 \(dois\) dias/);
  assert.match(html, /início em 30\/11\/2026/);
  assert.match(html, /finalizando no dia 01\/12\/2026/);
  assert.match(html, /R\$ 350,00 \(trezentos e cinquenta reais\)/);
  assert.match(html, /Camaçari - BA, 22\/11\/2026/);
});

test('gerarHTML escapa HTML digitado nos campos', () => {
  const d = exemplo();
  d.locatario.nome = '<img src=x onerror=alert(1)>';
  const html = C.gerarHTML(d);
  assert.ok(!html.includes('<img'));
  assert.match(html, /&lt;img/);
});

test('gerarHTML é idêntico para os mesmos dados (regerar = mesmo contrato)', () => {
  assert.equal(C.gerarHTML(exemplo()), C.gerarHTML(C.normalizar(JSON.parse(JSON.stringify(exemplo())))));
});

test('paraFirestore guarda tudo e mantém os campos antigos', () => {
  const doc = C.paraFirestore(exemplo());
  assert.equal(doc.schemaVersion, 2);
  assert.equal(doc.nome, 'João');
  assert.equal(doc.data, '30/11/2026');
  assert.equal(doc.itens, '80 pratos com talheres');
  assert.equal(doc.dataFim, '2026-12-01');
  assert.deepEqual(doc.locatario, exemplo().locatario);
  assert.deepEqual(doc.locacao, exemplo().locacao);
});

test('deFirestore: registro novo é completo e regerável; antigo não', () => {
  const novo = C.deFirestore('a1', { ...C.paraFirestore(exemplo()), pdfCount: 3 });
  assert.equal(novo.completo, true);
  assert.deepEqual(novo.dados, exemplo());
  assert.equal(novo.pdfCount, 3);

  const antigo = C.deFirestore('b2', { nome: 'Ana', data: '10/10/2025', itens: '50 taças' });
  assert.equal(antigo.completo, false);
  assert.equal(antigo.dados, null);
  assert.deepEqual(antigo.legado, { nome: 'Ana', data: '10/10/2025', itens: '50 taças' });
});

test('situacao: agendado, em andamento, devolve hoje, encerrado e antigo', () => {
  const r = C.deFirestore('x', C.paraFirestore(exemplo())); // 30/11 a 01/12
  assert.equal(C.situacao(r, '2026-11-29').status, 'agendado');
  const ini = C.situacao(r, '2026-11-30');
  assert.equal(ini.status, 'andamento');
  assert.equal(ini.progresso, 0.5);
  assert.equal(ini.devolveHoje, false);
  const fim = C.situacao(r, '2026-12-01');
  assert.equal(fim.status, 'andamento');
  assert.equal(fim.devolveHoje, true);
  assert.equal(fim.progresso, 1);
  assert.equal(C.situacao(r, '2026-12-02').status, 'encerrado');
  assert.equal(C.situacao(C.deFirestore('y', { nome: 'Ana' }), '2026-12-02').status, 'legado');
});

test('nomeArquivo usa o primeiro nome do locatário e remove caracteres inválidos', () => {
  const d = exemplo();
  d.locatario.nome = 'Zé/Maria Souza';
  assert.equal(C.nomeArquivo(d, new Date(2026, 10, 22)), 'CONTRATO_ZéMaria_2026-11-22.pdf');
  d.locatario.nome = '';
  assert.equal(C.nomeArquivo(d, new Date(2026, 10, 22)), 'CONTRATO_cliente_2026-11-22.pdf');
});
