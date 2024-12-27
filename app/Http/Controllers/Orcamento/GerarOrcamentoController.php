<?php

namespace App\Http\Controllers\Orcamento;

use App\Http\Controllers\Controller;
use App\Http\Requests\GerarOrcamentoRequest;
use App\Services\Orcamento\Contracts\OrcamentoServiceContract;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Exception;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\View\View;
use Throwable;

class GerarOrcamentoController extends Controller
{
    /**
     * Construct of GerarOrcamentoController
     */
    public function __construct(
        private OrcamentoServiceContract $orcamentoService
    ) {}

    /**
     * Gerar Orcamento
     *
     * @return RedirectResponse|View
     */
    public function __invoke(GerarOrcamentoRequest $request)
    {
        try {
            $data = $request->validated();
            $nomeCliente = data_get($data, 'nome');
            $dataCliente = data_get($data, 'data_locacao');
            $valores = $this->orcamentoService->gerarOrcamento($data);
            $totalOrcamento = data_get($valores, 'totalOrcamento');

            $hoje = Carbon::now();
            $dataFormatada = Carbon::parse($hoje)->translatedFormat('F j, Y');

            unset($valores['totalOrcamento']);

            $promocional = data_get($data, 'tipo') === 'promocional';
           // return view('orcamento.pdf',  compact('valores', 'nomeCliente', 'dataCliente', 'promocional', 'totalOrcamento', 'dataFormatada'));
            $pdf = Pdf::loadView('orcamento.pdf',  compact('valores', 'nomeCliente', 'dataCliente', 'promocional', 'totalOrcamento', 'dataFormatada'));
            return $pdf->download($nomeCliente . '-' . $dataCliente . '.pdf');
        } catch (Exception | Throwable $exception) {
            Log::debug('erro', [$exception->getMessage()]);
            return redirect()->back()->withErrors([$exception->getMessage()]);
        }
    }
}
