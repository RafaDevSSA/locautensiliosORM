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
                <form method="POST" class="space-y-6">
                    @csrf

                    <!-- Informações Pessoais -->
                    <div class="bg-gray-50 p-6 rounded-lg">
                        <h3 class="text-lg font-medium text-gray-900 mb-4">Informações Pessoais</h3>
                        <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <div>
                                <label for="nome" class="block text-sm font-medium text-gray-700">Nome Completo</label>
                                <input type="text" name="nome" id="nome"
                                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    required>
                                @error('nome')
                                    <p class="mt-1 text-sm text-red-600">{{ $message }}</p>
                                @enderror
                            </div>

                            <div>
                                <label for="email" class="block text-sm font-medium text-gray-700">Data de Locação</label>
                                <input type="date" name="data-locacao" id="data-locacao"
                                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    required>
                                @error('data-locacao')
                                    <p class="mt-1 text-sm text-red-600">{{ $message }}</p>
                                @enderror
                            </div>

                            <div>
                                <label for="telefone" class="block text-sm font-medium text-gray-700">Telefone</label>
                                <input type="tel" name="telefone" id="telefone"
                                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    required>
                                @error('telefone')
                                    <p class="mt-1 text-sm text-red-600">{{ $message }}</p>
                                @enderror
                            </div>

                            <div>
                                <label for="empresa" class="block text-sm font-medium text-gray-700">Empresa (opcional)</label>
                                <input type="text" name="empresa" id="empresa"
                                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                            </div>
                        </div>
                    </div>

                    <!-- Detalhes do Projeto -->
                    <div class="bg-gray-50 p-6 rounded-lg">
                        <h3 class="text-lg font-medium text-gray-900 mb-4">Detalhes do Projeto</h3>

                        <div class="space-y-6">
                            <div>
                                <label for="tipo_projeto" class="block text-sm font-medium text-gray-700">Tipo de Projeto</label>
                                <select name="tipo_projeto" id="tipo_projeto"
                                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                                    <option value="">Selecione uma opção</option>
                                    <option value="website">Website</option>
                                    <option value="aplicativo">Aplicativo</option>
                                    <option value="ecommerce">E-commerce</option>
                                    <option value="sistema">Sistema Personalizado</option>
                                    <option value="outro">Outro</option>
                                </select>
                            </div>

                            <div>
                                <label for="prazo" class="block text-sm font-medium text-gray-700">Prazo Desejado</label>
                                <select name="prazo" id="prazo"
                                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                                    <option value="">Selecione uma opção</option>
                                    <option value="urgente">Urgente (até 15 dias)</option>
                                    <option value="30dias">30 dias</option>
                                    <option value="60dias">60 dias</option>
                                    <option value="90dias">90 dias ou mais</option>
                                </select>
                            </div>

                            <div>
                                <label for="orcamento" class="block text-sm font-medium text-gray-700">Faixa de Orçamento</label>
                                <select name="orcamento" id="orcamento"
                                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                                    <option value="">Selecione uma opção</option>
                                    <option value="ate_5000">Até R$ 5.000</option>
                                    <option value="5000_15000">R$ 5.000 a R$ 15.000</option>
                                    <option value="15000_30000">R$ 15.000 a R$ 30.000</option>
                                    <option value="acima_30000">Acima de R$ 30.000</option>
                                </select>
                            </div>

                            <div>
                                <label for="descricao" class="block text-sm font-medium text-gray-700">
                                    Descrição do Projeto
                                </label>
                                <textarea id="descricao" name="descricao" rows="4"
                                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    placeholder="Descreva os detalhes do seu projeto..."></textarea>
                            </div>

                            <div class="space-y-4">
                                <div class="flex items-start">
                                    <div class="flex items-center h-5">
                                        <input id="funcionalidades" name="funcionalidades[]" type="checkbox" value="design_responsivo"
                                            class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                                    </div>
                                    <div class="ml-3 text-sm">
                                        <label for="funcionalidades" class="font-medium text-gray-700">Design Responsivo</label>
                                    </div>
                                </div>

                                <div class="flex items-start">
                                    <div class="flex items-center h-5">
                                        <input id="funcionalidades" name="funcionalidades[]" type="checkbox" value="painel_admin"
                                            class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                                    </div>
                                    <div class="ml-3 text-sm">
                                        <label for="funcionalidades" class="font-medium text-gray-700">Painel Administrativo</label>
                                    </div>
                                </div>

                                <div class="flex items-start">
                                    <div class="flex items-center h-5">
                                        <input id="funcionalidades" name="funcionalidades[]" type="checkbox" value="integracao_apis"
                                            class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                                    </div>
                                    <div class="ml-3 text-sm">
                                        <label for="funcionalidades" class="font-medium text-gray-700">Integração com APIs</label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="flex items-center justify-end">
                        <button type="submit"
                            class="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                            Solicitar Orçamento
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>
</x-app-layout>
