/**
 * @deprecated Este componente ya no está en uso activo.
 * El componente vigente es DynamicInputMUI.tsx (versión Material-UI).
 * Ver ConversacionCotizacion.tsx: import { DynamicInput } from './DynamicInputMUI'
 *
 * Este archivo se mantiene como referencia hasta ser eliminado.
 * TODO: Eliminar en siguiente limpieza de código muerto.
 *
 * DynamicInput - Componente que renderiza el tipo de input apropiado según el paso
 * 
 * Maneja 11 tipos de input diferentes:
 * - text: Input de texto simple
 * - email: Input de email con validación
 * - phone: Input de teléfono con formato
 * - select: Selector dropdown (ej: ciudades)
 * - radio: Opciones de selección única
 * - buttons: Botones grandes para selección (mejor UX móvil)
 * - number: Input numérico
 * - textarea: Área de texto multi-línea
 * - checkbox: Selección múltiple
 * - date: Selector de fecha
 * - dimensions: 3 inputs numéricos (largo × ancho × alto en cm)
 * 
 * UX: Auto-focus al aparecer, validación en tiempo real, feedback visual
 * Accesibilidad: Labels apropiados, ARIA, navegación con teclado
 * 
 * @component
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import type { PasoConfig, OpcionInput } from '@/types';

interface DynamicInputProps {
  /** Configuración del paso actual */
  config: PasoConfig;
  /** Callback cuando se envía el valor */
  onSubmit: (valor: any) => Promise<void>;
  /** Estado de loading (guardando en BD) */
  isLoading: boolean;
  /** Valor inicial (si existe) */
  defaultValue?: any;
}

/**
 * DynamicInput - Selector de tipo de input según configuración
 * 
 * UX: Auto-focus, validación visual, botón deshabilitado si inválido
 */
export function DynamicInput({ config, onSubmit, isLoading, defaultValue }: DynamicInputProps) {
  const [valor, setValor] = useState<any>(defaultValue || '');
  const [error, setError] = useState<string | null>(null);
  const [expandedInfo, setExpandedInfo] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(null);

  // UX: Auto-focus al montar componente para flujo natural
  useEffect(() => {
    inputRef.current?.focus();
  }, [config.id]);

  // Reset valor y panel de info cuando cambia el paso
  useEffect(() => {
    setValor(defaultValue || '');
    setError(null);
    setExpandedInfo(null);
  }, [config.id, defaultValue]);

  /**
   * Validar valor localmente con Zod
   */
  const validar = (val: any): boolean => {
    try {
      config.validacion.parse(val);
      setError(null);
      return true;
    } catch (err: any) {
      setError(err.errors?.[0]?.message || 'Valor inválido');
      return false;
    }
  };

  /**
   * Verificar si el valor actual es válido (incluso si está vacío)
   */
  const esValorValido = (): boolean => {
    try {
      config.validacion.parse(valor);
      return true;
    } catch {
      return false;
    }
  };

  /**
   * Manejar submit del formulario
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar antes de enviar
    if (!validar(valor)) {
      return;
    }

    try {
      await onSubmit(valor);
      // Reset después de enviar exitosamente
      setValor('');
      setError(null);
    } catch (err) {
      setError('Error al guardar. Intenta nuevamente.');
    }
  };

  /**
   * Renderizar input según tipo
   */
  const renderInput = () => {
    const { tipoInput, opciones } = config;

    switch (tipoInput) {
      case 'text':
      case 'email':
      case 'phone':
        return (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type={tipoInput === 'email' ? 'email' : tipoInput === 'phone' ? 'tel' : 'text'}
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            onBlur={() => validar(valor)}
            placeholder={
              config.placeholder ||
              (tipoInput === 'email' ? 'ejemplo@empresa.com' :
              tipoInput === 'phone' ? '+573001234567' :
              'Escribe aquí...')
            }
            disabled={isLoading}
            className="w-full px-6 py-4 border-2 border-gray-300 rounded-xl 
                     focus:border-blue-500 focus:ring-4 focus:ring-blue-100 
                     disabled:bg-gray-100 disabled:cursor-not-allowed
                     text-lg transition-all duration-200 bg-white shadow-sm
                     hover:border-gray-400 hover:shadow-md
                     min-h-[56px] font-medium" // UX: Mínimo 56px para fácil tap en móvil
            aria-label={config.pregunta}
            aria-invalid={!!error}
            aria-describedby={error ? `${config.id}-error` : undefined}
          />
        );

      case 'number':
        return (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="number"
            value={valor}
            onChange={(e) => setValor(parseFloat(e.target.value) || 0)}
            onBlur={() => validar(valor)}
            placeholder="0"
            disabled={isLoading}
            step="0.01"
            min="0"
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg 
                     focus:border-blue-500 focus:ring-2 focus:ring-blue-200 
                     disabled:bg-gray-100 disabled:cursor-not-allowed
                     text-base transition-all duration-200
                     min-h-[48px]"
            aria-label={config.pregunta}
            aria-invalid={!!error}
            aria-describedby={error ? `${config.id}-error` : undefined}
          />
        );

      case 'textarea':
        return (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            onBlur={() => validar(valor)}
            placeholder="Escribe aquí..."
            disabled={isLoading}
            rows={3}
            className="w-full px-6 py-4 border-2 border-gray-300 rounded-xl 
                     focus:border-blue-500 focus:ring-4 focus:ring-blue-100 
                     disabled:bg-gray-100 disabled:cursor-not-allowed
                     text-lg transition-all duration-200 bg-white shadow-sm
                     hover:border-gray-400 hover:shadow-md font-medium
                     resize-none min-h-[120px]"
            aria-label={config.pregunta}
            aria-invalid={!!error}
            aria-describedby={error ? `${config.id}-error` : undefined}
          />
        );

      case 'select':
        // UX: Dropdown nativo para selección de ciudades
        return (
          <select
            ref={inputRef as React.RefObject<HTMLSelectElement>}
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            onBlur={() => validar(valor)}
            disabled={isLoading}
            className="w-full px-6 py-4 border-2 border-gray-300 rounded-xl 
                     focus:border-blue-500 focus:ring-4 focus:ring-blue-100 
                     disabled:bg-gray-100 disabled:cursor-not-allowed
                     text-lg transition-all duration-200 shadow-sm
                     hover:border-gray-400 hover:shadow-md font-medium
                     min-h-[56px] bg-white cursor-pointer"
            aria-label={config.pregunta}
            aria-invalid={!!error}
            aria-describedby={error ? `${config.id}-error` : undefined}
          >
            <option value="" disabled>
              Selecciona una opción...
            </option>
            {opciones?.map((opcion) => (
              <option key={opcion.value} value={opcion.value}>
                {opcion.label}
              </option>
            ))}
          </select>
        );

      case 'radio':
        return (
          <div className="space-y-3" role="radiogroup" aria-label={config.pregunta}>
            {opciones?.map((opcion) => (
              <label
                key={opcion.value}
                className="flex items-center p-4 border-2 border-gray-300 rounded-lg cursor-pointer
                         hover:border-blue-400 hover:bg-blue-50 transition-all duration-200
                         has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50"
              >
                <input
                  type="radio"
                  name={config.campoFormulario}
                  value={opcion.value}
                  checked={valor === opcion.value}
                  onChange={(e) => setValor(e.target.value)}
                  disabled={isLoading}
                  className="w-5 h-5 text-blue-500 focus:ring-2 focus:ring-blue-200"
                />
                <span className="ml-3 text-base font-medium">{opcion.label}</span>
              </label>
            ))}
          </div>
        );

      case 'buttons': {
        // Verificar si alguna opción tiene datos enriquecidos
        const tieneInfo = opciones?.some(o => o.subtexto || o.descripcion);

        if (!tieneInfo) {
          // Render simple para opciones sin descripción
          return (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="group" aria-label={config.pregunta}>
              {opciones?.map((opcion) => (
                <button
                  key={opcion.value}
                  type="button"
                  onClick={() => setValor(opcion.value)}
                  disabled={isLoading}
                  className={`
                    px-6 py-4 rounded-lg text-base font-medium
                    transition-all duration-200 min-h-[56px] border-2
                    ${valor === opcion.value
                      ? 'bg-blue-500 text-white border-blue-500 shadow-lg'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                    }
                    disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-200
                  `}
                  aria-pressed={valor === opcion.value}
                >
                  {opcion.label}
                </button>
              ))}
            </div>
          );
        }

        // Render enriquecido: tarjetas con subtexto + panel de info expandible
        const infoOpcion = opciones?.find(o => o.value === expandedInfo);

        return (
          <div className="space-y-3" role="group" aria-label={config.pregunta}>
            {/* Grid de tarjetas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {opciones?.map((opcion) => {
                const isSelected = valor === opcion.value;
                const isExpanded = expandedInfo === opcion.value;

                return (
                  <div
                    key={opcion.value}
                    className={`
                      relative rounded-xl border-2 transition-all duration-200
                      ${isSelected
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm'
                      }
                      ${isLoading ? 'opacity-50' : ''}
                    `}
                  >
                    {/* Área principal clickeable — selecciona la opción */}
                    <button
                      type="button"
                      onClick={() => {
                        if (!isLoading) setValor(opcion.value);
                      }}
                      disabled={isLoading}
                      className="w-full text-left p-4 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-inset rounded-xl"
                      aria-pressed={isSelected}
                    >
                      <div className="flex items-start gap-3">
                        {/* Icono grande */}
                        {opcion.icon && (
                          <span className="text-3xl flex-shrink-0 mt-0.5" aria-hidden="true">
                            {opcion.icon}
                          </span>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className={`font-semibold text-sm leading-tight ${
                            isSelected ? 'text-blue-700' : 'text-gray-800'
                          }`}>
                            {opcion.label}
                          </div>
                          {opcion.subtexto && (
                            <div className="text-xs text-gray-500 mt-1 leading-snug">
                              {opcion.subtexto}
                            </div>
                          )}
                        </div>
                        {/* Check de selección */}
                        {isSelected && (
                          <span className="flex-shrink-0 text-blue-500 text-lg" aria-hidden="true">✓</span>
                        )}
                      </div>
                    </button>

                    {/* Botón de info — no propaga el click al padre */}
                    {(opcion.descripcion || opcion.checklist) && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedInfo(isExpanded ? null : opcion.value);
                        }}
                        className={`
                          w-full px-4 pb-3 pt-1 text-xs flex items-center gap-1
                          border-t transition-colors duration-150
                          ${isExpanded
                            ? 'text-blue-600 border-blue-200 bg-blue-50/50'
                            : 'text-gray-400 border-gray-100 hover:text-blue-500'
                          }
                          rounded-b-xl
                        `}
                        aria-expanded={isExpanded}
                        aria-label={`${isExpanded ? 'Ocultar' : 'Ver'} información sobre ${opcion.label}`}
                      >
                        <span>{isExpanded ? '▲' : 'ⓘ'}</span>
                        <span>{isExpanded ? 'Ocultar' : '¿Qué incluye esto?'}</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Panel de información expandida — ancho completo */}
            {infoOpcion && (
              <div className="rounded-xl border-2 border-blue-200 bg-blue-50 p-4 space-y-3 text-sm animate-in fade-in duration-200">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{infoOpcion.icon}</span>
                  <span className="font-semibold text-blue-800">{infoOpcion.label}</span>
                </div>

                {infoOpcion.descripcion && (
                  <p className="text-gray-700 leading-relaxed">{infoOpcion.descripcion}</p>
                )}

                {infoOpcion.ejemplos && (
                  <div>
                    <span className="font-medium text-gray-700">Ejemplos: </span>
                    <span className="text-gray-600">{infoOpcion.ejemplos}</span>
                  </div>
                )}

                {infoOpcion.checklist && infoOpcion.checklist.length > 0 && (
                  <div>
                    <p className="font-medium text-gray-700 mb-2">¿Cómo saber si esta es tu opción?</p>
                    <ul className="space-y-1">
                      {infoOpcion.checklist.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-gray-600">
                          <span className="text-green-500 flex-shrink-0 mt-0.5">✓</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      }

      case 'checkbox':
        return (
          <div className="space-y-3" role="group" aria-label={config.pregunta}>
            {opciones?.map((opcion) => {
              const valorArray = Array.isArray(valor) ? valor : [];
              const isChecked = valorArray.includes(opcion.value);

              return (
                <label
                  key={opcion.value}
                  className="flex items-center p-4 border-2 border-gray-300 rounded-lg cursor-pointer
                           hover:border-blue-400 hover:bg-blue-50 transition-all duration-200
                           has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50"
                >
                  <input
                    type="checkbox"
                    value={opcion.value}
                    checked={isChecked}
                    onChange={(e) => {
                      const newValor = e.target.checked
                        ? [...valorArray, opcion.value]
                        : valorArray.filter(v => v !== opcion.value);
                      setValor(newValor);
                    }}
                    disabled={isLoading}
                    className="w-5 h-5 text-blue-500 rounded focus:ring-2 focus:ring-blue-200"
                  />
                  <span className="ml-3 text-base font-medium">{opcion.label}</span>
                </label>
              );
            })}
          </div>
        );

      case 'date':
        // UX: Date picker nativo HTML5
        return (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="date"
            value={valor instanceof Date ? valor.toISOString().split('T')[0] : valor}
            onChange={(e) => setValor(new Date(e.target.value))}
            onBlur={() => validar(valor)}
            min={new Date().toISOString().split('T')[0]} // No permitir fechas pasadas
            disabled={isLoading}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg 
                     focus:border-blue-500 focus:ring-2 focus:ring-blue-200 
                     disabled:bg-gray-100 disabled:cursor-not-allowed
                     text-base transition-all duration-200
                     min-h-[48px]"
            aria-label={config.pregunta}
            aria-invalid={!!error}
            aria-describedby={error ? `${config.id}-error` : undefined}
          />
        );

      case 'dimensions':
        // UX: 3 inputs numéricos en grid para dimensiones (largo × ancho × alto)
        const dims = valor || { dimLargoCm: 0, dimAnchoCm: 0, dimAltoCm: 0 };
        return (
          <div className="w-full space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Input Largo */}
              <div className="flex flex-col">
                <label htmlFor="dimLargoCm" className="text-sm font-medium text-gray-700 mb-2">
                  Largo (cm)
                </label>
                <input
                  id="dimLargoCm"
                  ref={inputRef as React.RefObject<HTMLInputElement>}
                  type="number"
                  value={dims.dimLargoCm || ''}
                  onChange={(e) => {
                    const newDims = { ...dims, dimLargoCm: parseFloat(e.target.value) || 0 };
                    setValor(newDims);
                  }}
                  onBlur={() => validar(valor)}
                  placeholder="0"
                  disabled={isLoading}
                  step="0.01"
                  min="0"
                  className="w-full px-6 py-4 border-2 border-gray-300 rounded-xl 
                           focus:border-blue-500 focus:ring-4 focus:ring-blue-100 
                           disabled:bg-gray-100 disabled:cursor-not-allowed
                           text-lg transition-all duration-200 bg-white shadow-sm
                           hover:border-gray-400 hover:shadow-md font-medium"
                  aria-label="Largo en centímetros"
                  aria-invalid={!!error}
                />
              </div>

              {/* Input Ancho */}
              <div className="flex flex-col">
                <label htmlFor="dimAnchoCm" className="text-sm font-medium text-gray-700 mb-2">
                  Ancho (cm)
                </label>
                <input
                  id="dimAnchoCm"
                  type="number"
                  value={dims.dimAnchoCm || ''}
                  onChange={(e) => {
                    const newDims = { ...dims, dimAnchoCm: parseFloat(e.target.value) || 0 };
                    setValor(newDims);
                  }}
                  onBlur={() => validar(valor)}
                  placeholder="0"
                  disabled={isLoading}
                  step="0.01"
                  min="0"
                  className="w-full px-6 py-4 border-2 border-gray-300 rounded-xl 
                           focus:border-blue-500 focus:ring-4 focus:ring-blue-100 
                           disabled:bg-gray-100 disabled:cursor-not-allowed
                           text-lg transition-all duration-200 bg-white shadow-sm
                           hover:border-gray-400 hover:shadow-md font-medium"
                  aria-label="Ancho en centímetros"
                  aria-invalid={!!error}
                />
              </div>

              {/* Input Alto */}
              <div className="flex flex-col">
                <label htmlFor="dimAltoCm" className="text-sm font-medium text-gray-700 mb-2">
                  Alto (cm)
                </label>
                <input
                  id="dimAltoCm"
                  type="number"
                  value={dims.dimAltoCm || ''}
                  onChange={(e) => {
                    const newDims = { ...dims, dimAltoCm: parseFloat(e.target.value) || 0 };
                    setValor(newDims);
                  }}
                  onBlur={() => validar(valor)}
                  placeholder="0"
                  disabled={isLoading}
                  step="0.01"
                  min="0"
                  className="w-full px-6 py-4 border-2 border-gray-300 rounded-xl 
                           focus:border-blue-500 focus:ring-4 focus:ring-blue-100 
                           disabled:bg-gray-100 disabled:cursor-not-allowed
                           text-lg transition-all duration-200 bg-white shadow-sm
                           hover:border-gray-400 hover:shadow-md font-medium"
                  aria-label="Alto en centímetros"
                  aria-invalid={!!error}
                />
              </div>
            </div>
            
            {/* Ayuda visual: Cálculo de volumen */}
            {dims.dimLargoCm > 0 && dims.dimAnchoCm > 0 && dims.dimAltoCm > 0 && (
              <div className="text-sm text-gray-600 bg-blue-50 px-4 py-2 rounded-lg">
                Volumen aproximado: {((dims.dimLargoCm * dims.dimAnchoCm * dims.dimAltoCm) / 1000000).toFixed(2)} m³
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  // UX: Para radio, buttons, checkbox - auto-submit al seleccionar
  const autoSubmit = ['radio', 'buttons'].includes(config.tipoInput);

  // Auto-submit cuando se selecciona opción (solo para radio/buttons)
  useEffect(() => {
    if (autoSubmit && valor && !isLoading) {
      const timer = setTimeout(() => {
        if (validar(valor)) {
          onSubmit(valor);
        }
      }, 300); // UX: Pequeño delay para feedback visual

      return () => clearTimeout(timer);
    }
  }, [valor, autoSubmit, isLoading]);

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-4">
      {/* Input dinámico */}
      {renderInput()}

      {/* Error message */}
      {error && (
        <div
          id={`${config.id}-error`}
          className="text-red-600 text-sm font-medium"
          role="alert"
          aria-live="polite"
        >
          {error}
        </div>
      )}

      {/* Botón continuar (solo para inputs que no son auto-submit) */}
      {!autoSubmit && (
        <button
          type="submit"
          disabled={isLoading || !esValorValido()}
          className="w-full px-8 py-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl
                   font-bold text-xl min-h-[64px] shadow-lg
                   hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl hover:scale-[1.02]
                   active:scale-95
                   disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed disabled:shadow-none
                   transition-all duration-300
                   focus:ring-4 focus:ring-blue-300 focus:ring-offset-2"
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Guardando...
            </span>
          ) : (
            'Continuar'
          )}
        </button>
      )}
    </form>
  );
}
