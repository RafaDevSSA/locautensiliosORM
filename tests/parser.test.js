// Rode com: node --test tests/
const test = require('node:test');
const assert = require('node:assert/strict');
const U = require('../js/utils.js');
const P = require('../js/parser.js');

// Sábado, 24/10/2026 (data fixa para os testes ficarem determinísticos)
const hoje = new Date(2026, 9, 24);
const orc = (t) => P.interpretarOrcamento(t, { hoje });
const con = (t) => P.interpretarContrato(t, { hoje });

test('utils: número e valor por extenso', () => {
  assert.equal(U.numeroPorExtenso(0), 'zero');
  assert.equal(U.numeroPorExtenso(100), 'cem');
  assert.equal(U.numeroPorExtenso(101), 'cento e um');
  assert.equal(U.numeroPorExtenso(1000), 'mil');
  assert.equal(U.numeroPorExtenso(1001), 'mil e um');
  assert.equal(U.numeroPorExtenso(1250), 'mil duzentos e cinquenta');
  assert.equal(U.numeroPorExtenso(2500), 'dois mil e quinhentos');
  assert.equal(U.numeroPorExtenso(350), 'trezentos e cinquenta');
  assert.equal(U.numeroPorExtenso(1000000), 'um milhão');
  assert.equal(U.valorPorExtenso(350), 'trezentos e cinquenta reais');
  assert.equal(U.valorPorExtenso(1), 'um real');
  assert.equal(U.valorPorExtenso(12.5), 'doze reais e cinquenta centavos');
  assert.equal(U.valorPorExtenso(0.5), 'cinquenta centavos');
  assert.equal(U.valorPorExtenso(1250), 'mil duzentos e cinquenta reais');
});

test('utils: datas sem erro de fuso e virada de mês', () => {
  assert.equal(U.formatarDataBR('2026-11-30'), '30/11/2026');
  assert.equal(U.somarDias('2026-11-30', 1), '2026-12-01');
  assert.equal(U.somarDias('2026-12-31', 1), '2027-01-01');
  assert.equal(U.lerNumeroBR('1.250,50'), 1250.5);
  assert.equal(U.lerNumeroBR('2,5'), 2.5);
  assert.equal(U.lerNumeroBR('2.50'), 2.5);
  assert.equal(U.lerNumeroBR('1.250'), 1250);
});

test('orçamento: exemplo completo', () => {
  const r = orc('Maria Souza, 15/11, 100 pratos de porcelana 26cm a 2,50, 100 taças Nadir a 3, 20 réchauds a 12, desconto 10%');
  assert.equal(r.cliente, 'Maria Souza');
  assert.equal(r.dataLocacao, '2026-11-15');
  assert.equal(r.desconto, 10);
  assert.equal(r.itens.length, 3);
  assert.deepEqual(r.itens.map((i) => [i.descricao, i.quantidade, i.preco]), [
    ['Prato de porcelana 26 cm', 100, 2.5],
    ['Taça modelo Nadir paulista', 100, 3],
    ['Réchaud', 20, 12]
  ]);
  assert.deepEqual(r.avisos, []);
});

test('orçamento: rótulos explícitos e quebras de linha', () => {
  const r = orc('Orçamento para José da Silva\ndia 5 de dezembro\n50 pratos 26cm com talheres x 4,00\n30 ramequins por R$ 1,5\n10% de desconto');
  assert.equal(r.cliente, 'José da Silva');
  assert.equal(r.dataLocacao, '2026-12-05');
  assert.equal(r.desconto, 10);
  assert.deepEqual(r.itens.map((i) => i.descricao), ['Prato de porcelana 26 cm com talheres', 'Ramekin']);
  assert.equal(r.itens[1].preco, 1.5);
});

test('orçamento: preço decimal com vírgula não quebra o bloco', () => {
  const r = orc('Ana, 10/11, 200 pratos a 2,50, 50 taças a 1,75');
  assert.deepEqual(r.itens.map((i) => i.preco), [2.5, 1.75]);
});

test('orçamento: " e " antes de número separa itens', () => {
  const r = orc('Ana 10/11 100 pratos a 2 e 50 taças a 3');
  assert.equal(r.itens.length, 2);
  assert.equal(r.itens[1].quantidade, 50);
});

test('orçamento: preço total do item e preço ausente', () => {
  const r = orc('Carlos, 12/12, 100 pratos total 250, 20 réchauds');
  assert.equal(r.itens[0].preco, 2.5);
  assert.equal(r.itens[1].preco, null);
  assert.ok(r.avisos.some((a) => a.includes('Preço não informado')));
});

test('orçamento: quantidade ausente assume 1 com aviso', () => {
  const r = orc('Carlos, 12/12, réchaud a 15');
  assert.equal(r.itens[0].quantidade, 1);
  assert.ok(r.avisos.some((a) => a.includes('Quantidade não informada')));
});

test('orçamento: item fora do catálogo mantém o texto digitado', () => {
  const r = orc('Carlos, 12/12, 40 taças de champagne a 4, 10 pratos raso 29cm a 3');
  assert.equal(r.itens[0].descricao, 'Taças de champagne');
  assert.equal(r.itens[0].doCatalogo, false);
  assert.equal(r.itens[1].doCatalogo, false);
});

test('orçamento: tamanho da peça não é confundido com preço', () => {
  const r = orc('Carlos, 12/12, 100 pratos 26');
  assert.equal(r.itens[0].preco, null);
  const r2 = orc('Carlos, 12/12, 20 réchaud raso 9L 12');
  assert.equal(r2.itens[0].descricao, 'Réchaud raso 9L');
  assert.equal(r2.itens[0].preco, 12);
});

test('orçamento: quantidade com x, un e por extenso', () => {
  const r = orc('Bia, 3/12, 100x taça a 2, 50 un prato a 1, cem ramekin a 1');
  assert.deepEqual(r.itens.map((i) => i.quantidade), [100, 50, 100]);
});

test('orçamento: desconto fora da faixa gera aviso', () => {
  const r = orc('Bia, 3/12, 10 pratos a 2, desconto 3%');
  assert.equal(r.desconto, 3);
  assert.ok(r.avisos.some((a) => a.includes('fora do permitido')));
});

test('datas: relativas e dias da semana', () => {
  assert.equal(P.acharDatas('amanhã', hoje)[0].iso, '2026-10-25');
  assert.equal(P.acharDatas('depois de amanhã', hoje)[0].iso, '2026-10-26');
  assert.equal(P.acharDatas('hoje', hoje)[0].iso, '2026-10-24');
  assert.equal(P.acharDatas('sábado', hoje)[0].iso, '2026-10-31'); // hoje é sábado → próximo
  assert.equal(P.acharDatas('sexta-feira', hoje)[0].iso, '2026-10-30');
  assert.equal(P.acharDatas('domingo', hoje)[0].iso, '2026-10-25');
});

test('datas: dia/mês sem ano vai para o próximo ano se já passou', () => {
  assert.equal(P.acharDatas('15/11', hoje)[0].iso, '2026-11-15');
  assert.equal(P.acharDatas('10/01', hoje)[0].iso, '2027-01-10');
  assert.equal(P.acharDatas('dia 3', hoje)[0].iso, '2026-11-03');
  assert.equal(P.acharDatas('dia 28', hoje)[0].iso, '2026-10-28');
  assert.equal(P.acharDatas('15 de novembro', hoje)[0].iso, '2026-11-15');
  assert.equal(P.acharDatas('15/11/2027', hoje)[0].iso, '2027-11-15');
  assert.equal(P.acharDatas('15/11/27', hoje)[0].iso, '2027-11-15');
  assert.equal(P.acharDatas('20-12-2026', hoje)[0].iso, '2026-12-20');
});

test('datas: dia inexistente é ignorado e rua "7 de Setembro" não vira data', () => {
  assert.equal(P.acharDatas('31/11', hoje).length, 0);
  assert.equal(P.acharDatas('Rua 7 de Setembro', hoje).length, 0);
});

test('CPF: validação e formatação', () => {
  assert.equal(P.validarCPF('529.982.247-25'), true);
  assert.equal(P.validarCPF('52998224725'), true);
  assert.equal(P.validarCPF('111.111.111-11'), false);
  assert.equal(P.validarCPF('123.456.789-00'), false);
  assert.equal(P.formatarCPF('52998224725'), '529.982.247-25');
});

test('contrato: exemplo completo', () => {
  const r = con('Locatário João Silva, CPF 529.982.247-25, RG 1234567, Rua das Flores 10 Camaçari. 80 pratos com talheres, início 20/11 por 2 dias, retirada na Linha Verde, valor R$ 350');
  assert.equal(r.locatario.nome, 'João Silva');
  assert.equal(r.locatario.cpf, '529.982.247-25');
  assert.equal(r.locatario.rg, '1234567');
  assert.equal(r.locatario.endereco, 'Rua das Flores 10 Camaçari');
  assert.equal(r.inicio, '2026-11-20');
  assert.equal(r.duracaoDias, 2);
  assert.equal(r.fim, '2026-11-21');
  assert.equal(r.localRetirada, 'Linha Verde');
  assert.equal(r.valor, 350);
  assert.equal(r.itens.length, 1);
  assert.match(r.descItens, /80 \(oitenta\) pratos de porcelana 26 cm com talheres/);
  assert.deepEqual(r.avisos, []);
});

test('contrato: intervalo de datas calcula a duração', () => {
  const r = con('Maria Souza, cpf 52998224725, rg 99887766, endereço Av. Brasil 100, de 20/11 a 22/11, retirada na loja, 100 pratos, valor 400, multa 30');
  assert.equal(r.inicio, '2026-11-20');
  assert.equal(r.fim, '2026-11-22');
  assert.equal(r.duracaoDias, 3);
  assert.equal(r.multaAtraso, 30);
  assert.equal(r.locatario.endereco, 'Av. Brasil 100');
  assert.equal(r.valor, 400);
});

test('contrato: duração em semanas e data do contrato', () => {
  const r = con('Pedro Alves, 52998224725, dia 20/11 por 1 semana, data do contrato 24/10, retirada na Linha Verde, 10 taças, valor 100');
  assert.equal(r.duracaoDias, 7);
  assert.equal(r.fim, '2026-11-26');
  assert.equal(r.dataContrato, '2026-10-24');
  assert.equal(r.inicio, '2026-11-20');
});

test('contrato: valor calculado pela soma dos itens quando não informado', () => {
  const r = con('Pedro Alves, cpf 52998224725, rg 123456, endereço Rua A 1, 20/11 por 1 dia, retirada loja, 100 pratos a 2,50, 50 taças a 3');
  assert.equal(r.valor, 400);
  assert.ok(r.avisos.some((a) => a.includes('soma dos itens')));
});

test('contrato: CPF inválido gera aviso mas é preenchido', () => {
  const r = con('Pedro Alves, cpf 123.456.789-00, 20/11 por 1 dia, 10 taças, valor 100');
  assert.equal(r.locatario.cpf, '123.456.789-00');
  assert.ok(r.avisos.some((a) => a.includes('inválido')));
});

test('contrato: campos ausentes viram avisos, sem quebrar', () => {
  const r = con('10 pratos');
  assert.ok(r.avisos.length >= 5);
  assert.equal(r.itens.length, 1);
});

test('texto vazio não quebra', () => {
  assert.equal(orc('').itens.length, 0);
  assert.equal(con('   ').itens.length, 0);
});

test('orçamento: lista separada por hífen e preço solto no fim', () => {
  const r = orc('joana paula 12/12/2026 - 80 pratos de sobremesa 16cm 1,50 - 80 taças 2,00 - 10 réchauds raso 9L 15,00');
  assert.equal(r.cliente, 'Joana Paula');
  assert.deepEqual(r.itens.map((i) => [i.descricao, i.quantidade, i.preco]), [
    ['Prato de porcelana 16 cm com garfo de sobremesa', 80, 1.5],
    ['Taça modelo Nadir paulista', 80, 2],
    ['Réchaud raso 9L', 10, 15]
  ]);
});

test('orçamento: "Para Fulano no dia X:" tira o "Para" e a pontuação', () => {
  const r = orc('Para Roberto Carlos no dia 20 de novembro: 200 pratos com talheres a R$ 3,50 e 100 taças a R$ 2');
  assert.equal(r.cliente, 'Roberto Carlos');
  assert.equal(r.dataLocacao, '2026-11-20');
  assert.deepEqual(r.itens.map((i) => i.quantidade), [200, 100]);
});

test('contrato: texto longo em frase corrida', () => {
  const r = con('Contrato para Ana Paula Costa CPF 529.982.247-25 RG 12.345.678-9 residente na Rua Sete de Setembro, 45, Centro, Camaçari. Retirada no dia 15/11 na Loja Centro. 120 pratos de porcelana 26 cm com talheres e 60 taças. Devolução 17/11. Valor total R$ 1.250,00. Multa de R$ 60 por dia.');
  assert.equal(r.locatario.nome, 'Ana Paula Costa');
  assert.equal(r.locatario.rg, '12.345.678-9');
  assert.equal(r.locatario.endereco, 'Rua Sete de Setembro, 45, Centro, Camaçari');
  assert.equal(r.localRetirada, 'Loja Centro');
  assert.equal(r.duracaoDias, 3);
  assert.equal(r.valor, 1250);
  assert.equal(r.multaAtraso, 60);
  assert.deepEqual(r.itens.map((i) => i.quantidade), [120, 60]);
});

test('contrato: campos com rótulo, um por linha', () => {
  const r = con('locatário: Pedro Santos\ncpf: 52998224725\nrg: 4455667788\nendereço: Rua Colônia Boa União, Catu de Abrantes\nretirada: Linha Verde\n100 pratos 26cm\nvalor: 300\ndia 14/11 por 3 dias');
  assert.equal(r.locatario.nome, 'Pedro Santos');
  assert.equal(r.locatario.endereco, 'Rua Colônia Boa União, Catu de Abrantes');
  assert.equal(r.localRetirada, 'Linha Verde');
  assert.equal(r.valor, 300);
  assert.equal(r.duracaoDias, 3);
  assert.equal(r.itens.length, 1);
});

test('contrato: "valor 90 reais" não vira item', () => {
  const r = con('Lucas Mendes cpf 529.982.247-25 rg 5544332 mora na Av. Brasil 10; 30 taças; início sábado; 2 dias; retirada na Linha Verde; valor 90 reais');
  assert.equal(r.valor, 90);
  assert.equal(r.itens.length, 1);
  assert.equal(r.inicio, '2026-10-31');
});
