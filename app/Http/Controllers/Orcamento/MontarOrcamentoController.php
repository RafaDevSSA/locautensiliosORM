<?php

namespace App\Http\Controllers\Orcamento;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\View\View;

class MontarOrcamentoController
{
    /**
     * Construct of GerarOrcamentoController
     */
    public function __construct(
    ) {
    }

    /**
     * Gerar Orcamento
     *
     * @return RedirectResponse|View
     */
    public function __invoke()
    {
        $quantidades = config('utensilios.utensilios.quantidades');
        $tipoOrcamento = config('utensilios.utensilios.tipo_orcamento');
        return view('orcamento.gerar')->with(compact('quantidades', 'tipoOrcamento'));
    }
}
