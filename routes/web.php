<?php

use App\Http\Controllers\Orcamento\GerarOrcamentoController;
use App\Http\Controllers\Orcamento\MontarOrcamentoController;
use App\Http\Controllers\ProfileController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/dashboard', function () {
    return view('dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::prefix('orcamento')->group(function () {
        Route::get('/', MontarOrcamentoController::class)->name('orcamento.montar');
        Route::post('/', GerarOrcamentoController::class)->name('orcamento.gerar');
    });
});


require __DIR__.'/auth.php';
