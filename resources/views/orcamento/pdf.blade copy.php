<!-- resources/views/orcamentos/show.blade.php -->
<!DOCTYPE html>
<html lang="pt-BR">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Orçamento - Loca Utensílios</title>
    @vite('resources/css/app.css')
</head>

<body class="bg-white p-8">
    <div class="max-w-3xl mx-auto">
        <!-- Cabeçalho com Logo e Informações de Contato -->
        <div class="flex justify-between items-start mb-8">
            <!-- Logo -->
            <div class="w-32 h-32">
                <img src="{{ asset('images/logo.png') }}" alt="Loc Utensílios Logo" class="w-full h-full">
            </div>

            <!-- Informações de Contato -->
            <div class="text-right">
                <p class="text-lg font-medium">@LOCAUTENSILIOS</p>
                <p class="text-gray-600">WhatsApp: (71)999851506</p>
            </div>
        </div>

        <!-- Título e Data -->
        <div class="flex justify-between items-center mb-8">
            <h1 class="text-4xl font-bold">Orçamento</h1>
            <p class="text-lg">Novembro, 2024</p>
        </div>

        <!-- Informações do Cliente -->
        <div class="mb-8 space-y-2">
            <div>
                <p class="text-lg">Nome cliente:
                    <span class="border-b border-black">{{ $nomeCliente ?? '____________________' }}</span>
                </p>
            </div>
            <div>
                <p class="text-lg">Data de locação:
                    <span class="border-b border-black">{{ $dataCliente ?? '____________________' }}</span>
                </p>
            </div>
        </div>

        <!-- Tabela de Produtos -->
        <div class="mb-8">
            <table class="w-full">
                <thead>
                    <tr class="bg-black text-white">
                        <th class="py-2 px-4 text-left">Nº</th>
                        <th class="py-2 px-4 text-left">Descrição do Produto</th>
                        <th class="py-2 px-4 text-right">Preço</th>
                        <th class="py-2 px-4 text-right">Qt.</th>
                        <th class="py-2 px-4 text-right">Total</th>
                    </tr>
                </thead>
                <tbody class="divide-y">
                    @foreach ($valores ?? [] as $key => $item)
                        <tr class="border-b">
                            <td class="py-3 px-4">{{ data_get($item, 'numero') }}</td>
                            <td class="py-3 px-4">{{ $key }}</td>
                            <td class="py-3 px-4 text-right">R${{ number_format( data_get($item, 'preco') , 2, ',', '.') }}</td>
                            <td class="py-3 px-4 text-right">{{ data_get($item, 'qtd')  }}</td>
                            <td class="py-3 px-4 text-right">R${{ number_format( data_get($item, 'valor') , 2, ',', '.') }}</td>
                        </tr>
                    @endforeach

                    <!-- Exemplo de linha estática -->
                    @if (empty($valores))
                        <tr class="border-b">
                            <td class="py-3 px-4">1</td>
                            <td class="py-3 px-4">Prato de almoço 26 com talheres</td>
                            <td class="py-3 px-4 text-right">R$2,00</td>
                            <td class="py-3 px-4 text-right">50</td>
                            <td class="py-3 px-4 text-right">R$100,00</td>
                        </tr>
                        <tr class="border-b">
                            <td class="py-3 px-4">2</td>
                            <td class="py-3 px-4">Taças modelo Nadir paulista</td>
                            <td class="py-3 px-4 text-right">R$1,00</td>
                            <td class="py-3 px-4 text-right">50</td>
                            <td class="py-3 px-4 text-right">R$50,00</td>
                        </tr>
                        <tr class="border-b">
                            <td class="py-3 px-4">3</td>
                            <td class="py-3 px-4">Rechaud triplo</td>
                            <td class="py-3 px-4 text-right">R$50,00</td>
                            <td class="py-3 px-4 text-right">2</td>
                            <td class="py-3 px-4 text-right">R$100,00</td>
                        </tr>
                    @endif
                </tbody>
            </table>
        </div>



        <!-- Valor Promocional -->
        @if ($promocional)
            <div class="flex justify-end">
                <div class="bg-yellow-200 px-4 py-2 inline-block">
                    <p class="text-lg">
                        Valor promocional:
                        <span class="font-bold">R${{ number_format($totalOrcamento, 2, ',', '.') }}</span>
                    </p>
                </div>
            </div>
        @else
            <!-- Valor normal -->
            <div class="flex justify-end">
                <div class="px-4 py-2 inline-block">
                    <p class="text-lg">
                        Valor:
                        <span class="font-bold">R${{ number_format($totalOrcamento, 2, ',', '.') }}</span>
                    </p>
                </div>
            </div>
        @endif

    </div>
</body>

</html>
