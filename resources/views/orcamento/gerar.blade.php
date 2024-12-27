<!-- resources/views/orcamentos/create.blade.php -->
<x-app-layout>
    <div class="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div class="max-w-4xl mx-auto">
            <div class="text-center">
                <h2 class="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                    Vamos gerar mais um orçamento ?
                </h2>
                <p class="mt-4 text-lg text-gray-600">
                    Preencha o formulário abaixo.
                </p>
            </div>

            <div class="mt-12 bg-white shadow-xl rounded-lg">
                <div class="p-6 sm:p-8">
                    <form method="POST" class="space-y-6" action={{route("orcamento.gerar")}}>
                        @csrf

                        <!-- Informações Pessoais -->
                        <div class="bg-gray-50 p-6 rounded-lg">
                            <h3 class="text-lg font-medium text-gray-900 mb-4">Informações Pessoais</h3>
                            <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                <div>
                                    <label for="nome" class="block text-sm font-medium text-gray-700">Nome
                                        Completo</label>
                                    <input type="text" name="nome" id="nome"
                                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        required>
                                    @error('nome')
                                        <p class="mt-1 text-sm text-red-600">{{ $message }}</p>
                                    @enderror
                                </div>

                                <div>
                                    <label for="email" class="block text-sm font-medium text-gray-700">Data do evento</label>
                                    <input type="date" name="data_locacao" id="data_locacao"
                                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        required>
                                    @error('data-locacao')
                                        <p class="mt-1 text-sm text-red-600">{{ $message }}</p>
                                    @enderror
                                </div>
                            </div>
                        </div>

                        <!-- Detalhes do Projeto -->
                        <div class="bg-gray-50 p-6 rounded-lg">
                            <h3 class="text-lg font-medium text-gray-900 mb-4">Itens desejados</h3>

                            <div class="space-y-6">
                                <div class="grid grid-cols-1 gap-6 sm:grid-cols-3">
                                    <div>
                                        <label for="prato_almoco"
                                            class="block text-sm font-medium text-gray-700">Pratos Jantar/Almoço com
                                            talher</label>
                                        <select name="prato_almoco" id="prato_almoco"
                                            class="mt-1  rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                                            <option value="">Selecione uma opção</option>
                                            @for ($i = 1; $i <= data_get($quantidades, 'prato_almoco', 200); $i++)
                                                <option value="{{ $i }}">{{ $i }}</option>
                                            @endfor
                                        </select>
                                    </div>
                                    <div>
                                        <label for="prato_sobremesa"
                                            class="block text-sm font-medium text-gray-700">Pratos Sobremesa com
                                            talher</label>
                                        <select name="prato_sobremesa" id="prato_sobremesa"
                                            class="mt-1 block rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                                            <option value="">Selecione uma opção</option>
                                            @for ($i = 1; $i <= data_get($quantidades, 'prato_sobremesa', 200); $i++)
                                                <option value="{{ $i }}">{{ $i }}</option>
                                            @endfor
                                        </select>
                                    </div>

                                    <div>
                                        <label for="taca"
                                            class="block text-sm font-medium text-gray-700">Taças</label>
                                        <select name="taca" id="taca"
                                            class="mt-1 block  rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                                            <option value="">Selecione uma opção</option>
                                            @for ($i = 1; $i <= data_get($quantidades, 'taca', 200); $i++)
                                                <option value="{{ $i }}">{{ $i }}</option>
                                            @endfor
                                        </select>
                                    </div>

                                </div>
                                <div class="grid grid-cols-1 gap-6 sm:grid-cols-3">
                                    <div>
                                        <label for="talher_almoco"
                                            class="block text-sm font-medium text-gray-700">Talher Almoço</label>
                                        <select name="talher_almoco" id="talher_almoco"
                                            class="mt-1 block rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                                            <option value="">Selecione uma opção</option>
                                            @for ($i = 1; $i <= data_get($quantidades, 'talher_almoco', 200); $i++)
                                                <option value="{{ $i }}">{{ $i }}</option>
                                            @endfor
                                        </select>
                                    </div>
                                    <div>
                                        <label for="talher_sobremesa"
                                            class="block text-sm font-medium text-gray-700">Talher Sobremesa</label>
                                        <select name="talher_sobremesa" id="talher_sobremesa"
                                            class="mt-1 block  rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                                            <option value="">Selecione uma opção</option>
                                            @for ($i = 1; $i <= data_get($quantidades, 'talher_sobremesa', 200); $i++)
                                                <option value="{{ $i }}">{{ $i }}</option>
                                            @endfor
                                        </select>
                                    </div>

                                    <div>
                                        <label for="rechoud_duplo"
                                            class="block text-sm font-medium text-gray-700">Rechoud Duplo</label>
                                        <select name="rechoud_duplo" id="rechoud_duplo"
                                            class="mt-1 block  rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                                            <option value="">Selecione uma opção</option>
                                            @for ($i = 1; $i <= data_get($quantidades, 'rechoud_duplo', 200); $i++)
                                                <option value="{{ $i }}">{{ $i }}</option>
                                            @endfor
                                        </select>
                                    </div>
                                </div>

                                <div class="grid grid-cols-1 gap-6 sm:grid-cols-3">
                                    <div>
                                        <label for="rechoud_triplo"
                                            class="block text-sm font-medium text-gray-700">Rechoud Triplo</label>
                                        <select name="rechoud_triplo" id="rechoud_triplo"
                                            class="mt-1 block  rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                                            <option value="">Selecione uma opção</option>
                                            @for ($i = 1; $i <= data_get($quantidades, 'rechoud_triplo', 200); $i++)
                                                <option value="{{ $i }}">{{ $i }}</option>
                                            @endfor
                                        </select>
                                    </div>
                                    <div>
                                        <label for="travessa_g" class="block text-sm font-medium text-gray-700">Travessa
                                            G</label>
                                        <select name="travessa_g" id="travessa_g"
                                            class="mt-1 block  rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                                            <option value="">Selecione uma opção</option>
                                            @for ($i = 1; $i <= data_get($quantidades, 'travessa_g', 200); $i++)
                                                <option value="{{ $i }}">{{ $i }}</option>
                                            @endfor
                                        </select>
                                    </div>

                                    <div>
                                        <label for="travessa_m" class="block text-sm font-medium text-gray-700">Travessa
                                            M</label>
                                        <select name="travessa_m" id="travessa_m"
                                            class="mt-1 block  rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                                            <option value="">Selecione uma opção</option>
                                            @for ($i = 1; $i <= data_get($quantidades, 'travessa_m', 200); $i++)
                                                <option value="{{ $i }}">{{ $i }}</option>
                                            @endfor
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label for="tipo" class="block text-sm font-medium text-gray-700">Tipo do
                                        orçamento</label>
                                    <select name="tipo" id="tipo"
                                        class="mt-1 block  rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                                        <option value="">Selecione uma opção</option>
                                        @foreach ($tipoOrcamento as $tipo)
                                            <option value="{{ $tipo }}">{{ $tipo }}</option>
                                        @endforeach
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div class="flex items-center justify-end">
                            <button type="submit"
                                class="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                                Solicitar Orçamento
                            </button>
                        </div>
                </div>


                </form>
            </div>
        </div>
    </div>
    </div>
</x-app-layout>
