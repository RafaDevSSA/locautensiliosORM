<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class GerarOrcamentoRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     *
     * @return bool
     */
    public function authorize()
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array
     */
    public function rules()
    {
        return [
            'nome' => 'required',
            'data_locacao' => 'required',
            'tipo' => 'required',
            'prato_almoco' => 'nullable|integer',
            'prato_sobremesa' => 'nullable|integer',
            'taca' => 'nullable|integer',
            'talher_almoco' => 'nullable|integer',
            'talher_sobremesa' => 'nullable|integer',
            'rechoud_duplo' => 'nullable|integer',
            'rechoud_triplo' => 'nullable|integer',
            'travessa_m' => 'nullable|integer',
            'travessa_g' => 'nullable|integer',
        ];
    }

    public function messages()
    {
        return [];
    }
}
