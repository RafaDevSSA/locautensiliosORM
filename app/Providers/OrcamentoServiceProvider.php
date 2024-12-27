<?php

namespace app\Providers;

use App\Services\Orcamento\Contracts\OrcamentoServiceContract;
use App\Services\Orcamento\OrcamentoService;
use Illuminate\Contracts\Support\DeferrableProvider;
use Illuminate\Support\ServiceProvider;

class OrcamentoServiceProvider extends ServiceProvider implements DeferrableProvider
{
    /**
     * Register the application services.
     */
    public function register(): void
    {
        $this->app->bind(
            OrcamentoServiceContract::class,
            OrcamentoService::class
        );
    }

    /**
     * Get the services provided by the provider.
     */
    public function provides(): array
    {
        return [
            OrcamentoServiceContract::class,
        ];
    }
}
