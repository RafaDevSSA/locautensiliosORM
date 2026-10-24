/*
 * Catálogo de itens da LOCAUTENSÍLIOS usado pelo parser de texto livre.
 * Para cadastrar um item novo, basta acrescentar um objeto na lista:
 *   nome     -> como aparece no orçamento (singular)
 *   plural   -> como aparece na cláusula do contrato quando há mais de uma unidade
 *   apelidos -> jeitos curtos de escrever o item (o parser ignora acentos e plural)
 *   preco    -> preço unitário padrão; null = só preenche se o texto informar o preço
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.LocaCatalogo = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  return [
    {
      nome: 'Prato de porcelana 26 cm',
      plural: 'pratos de porcelana 26 cm',
      apelidos: ['prato', 'prato raso', 'prato 26'],
      preco: null
    },
    {
      nome: 'Prato de porcelana 26 cm com talheres',
      plural: 'pratos de porcelana 26 cm com talheres',
      apelidos: ['prato com talher', 'prato com talheres', 'prato completo', 'kit prato'],
      preco: null
    },
    {
      nome: 'Prato de porcelana 16 cm com garfo de sobremesa',
      plural: 'pratos de porcelana 16 cm com garfo de sobremesa',
      apelidos: ['prato sobremesa', 'prato de sobremesa', 'prato 16'],
      preco: null
    },
    {
      nome: 'Taça modelo Nadir paulista',
      plural: 'taças modelo Nadir paulista',
      apelidos: ['taca', 'taca nadir', 'taca paulista'],
      preco: null
    },
    {
      nome: 'Réchaud',
      plural: 'réchauds',
      apelidos: ['rechaud', 'reshaud', 'rechau'],
      preco: null
    },
    {
      nome: 'Réchaud raso 9L',
      plural: 'réchauds rasos 9L',
      apelidos: ['rechaud raso', 'rechaud 9l', 'rechaud 9 litros'],
      preco: null
    },
    {
      nome: 'Ramekin',
      plural: 'ramekins',
      apelidos: ['ramequim', 'ramequin', 'ramekim'],
      preco: null
    },
    {
      nome: 'Travessa porcelana 1L',
      plural: 'travessas de porcelana 1L',
      apelidos: ['travessa', 'travessa 1l'],
      preco: null
    }
  ];
});
