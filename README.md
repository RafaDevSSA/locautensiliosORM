# locautensiliosORM
Gestão de contratos e orçamentos da Loca Utensilios

## Versões inteligentes (texto livre)

- `orcamento-inteligente.html` e `contrato-inteligente.html`: preenchem o formulário a partir de um texto livre. As versões clássicas (`orcamento.html`, `contrato.html`) continuam intactas.
- Tudo roda no navegador (HTML/JS puro, sem API externa), então a hospedagem continua gratuita.
- `js/parser.js` interpreta o texto; `js/catalogo.js` é o catálogo de itens (para cadastrar item novo, acrescente um objeto na lista); `js/utils.js` tem datas, moeda e valor por extenso.
- Testes do parser: `node --test tests/parser.test.js`
