<?php

namespace App\Services\Orcamento;

use App\Services\Orcamento\Contracts\OrcamentoServiceContract;

class OrcamentoService implements OrcamentoServiceContract
{

    public function __construct() {}

    public function gerarOrcamento(array $utensilios)
    {
        $tipo = data_get($utensilios, 'tipo');
        unset($utensilios['tipo']);
        unset($utensilios['nome']);
        unset($utensilios['data_locacao']);

        $valores = [];

        $listaUtensilios = config('utensilios.utensilios.' . $tipo);
        $listaUtensiliosAlias = config('utensilios.utensilios.alias');
        $numero = 0;
        $totalOrcamento = 0;
        foreach ($utensilios as $key => $qtd) {
            $numero++;
            if (filled($qtd)) {
                $alias = data_get($listaUtensiliosAlias, $key, '');
                $total =  data_get($listaUtensilios, $key) * $qtd;
                $totalOrcamento += $total;
                $valores[$alias] = ['numero' => $numero, 'qtd' => $qtd, 'preco' => data_get($listaUtensilios, $key) ,'valor' => $total];
            }
        }

        $valores['totalOrcamento'] = $totalOrcamento;

        return $valores;
    }
}
