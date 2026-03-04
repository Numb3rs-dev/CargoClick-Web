'use client';

import React from 'react';
import { colors } from '@/lib/theme/colors';
import { fieldStyle, labelStyle, errorStyle, helpText as helpTextStyle } from './FormStyles';

/* ═══════════════════════════════════════════════════════════════════════════════
   FormField — wrapper estándar: label + input + error + help
   
   Elimina la repetición de <div><label/><input/><FieldError/></div> que aparece
   ~80 veces en nuestros formularios operacionales.
   
   Uso (campo de texto simple):
     <FormField label="Nombre" error={errors.nombre}>
       <input value={v} onChange={…} style={fieldStyle} />
     </FormField>
   
   Uso (campo con select):
     <FormField label="Estado" required error={errors.estado}>
       <select value={v} onChange={…} style={fieldStyle}>…</select>
     </FormField>
   
   Uso inline (render prop alternativo — controla el input directamente):
     <FormField label="Peso" error={errors.peso} suffix="kg" />
   ═══════════════════════════════════════════════════════════════════════════════ */

export interface FormFieldProps {
  /** Texto del label */
  label:      string;
  /** Agrega asterisco rojo al label */
  required?:  boolean;
  /** Mensaje de error (se muestra debajo del input) */
  error?:     string;
  /** Texto de ayuda (debajo del input, solo si no hay error) */
  help?:      string;
  /** Contenido hijo (el input/select/textarea) */
  children:   React.ReactNode;
  /** Estilos extra para el wrapper div */
  sx?:        React.CSSProperties;
}

export function FormField({
  label,
  required,
  error,
  help,
  children,
  sx,
}: FormFieldProps) {
  return (
    <div style={sx}>
      <label style={labelStyle}>
        {label}
        {required && <span style={{ color: colors.error }}> *</span>}
      </label>
      {children}
      {error && <p style={errorStyle}>{error}</p>}
      {!error && help && <p style={helpTextStyle}>{help}</p>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   InputField — FormField + input integrado (atajo para el caso más común)
   
   Uso:
     <InputField
       label="Número ID" required
       value={nit} onChange={e => setNit(e.target.value)}
       error={errors.nit}
       placeholder="900123456"
     />
   ═══════════════════════════════════════════════════════════════════════════════ */

export interface InputFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'style'> {
  label:     string;
  required?: boolean;
  error?:    string;
  help?:     string;
  /** Estilos extra sobre fieldStyle */
  inputSx?:  React.CSSProperties;
  /** Estilos sobre el wrapper */
  sx?:       React.CSSProperties;
}

export function InputField({
  label, required, error, help, inputSx, sx,
  ...inputProps
}: InputFieldProps) {
  return (
    <FormField label={label} required={required} error={error} help={help} sx={sx}>
      <input
        {...inputProps}
        style={{
          ...fieldStyle,
          ...(error ? { borderColor: colors.error } : {}),
          ...inputSx,
        }}
      />
    </FormField>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   SelectField — FormField + select integrado
   
   Uso:
     <SelectField
       label="Tipo ID" required
       value={tipoId} onChange={e => setTipoId(e.target.value)}
       error={errors.tipoId}
       options={[{ value: 'N', label: 'NIT' }, { value: 'C', label: 'CC' }]}
     />
   ═══════════════════════════════════════════════════════════════════════════════ */

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectFieldProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'style'> {
  label:      string;
  required?:  boolean;
  error?:     string;
  help?:      string;
  options:    SelectOption[];
  /** Placeholder como primera opción deshabilitada */
  placeholder?: string;
  inputSx?:   React.CSSProperties;
  sx?:        React.CSSProperties;
}

export function SelectField({
  label, required, error, help, options, placeholder, inputSx, sx,
  ...selectProps
}: SelectFieldProps) {
  return (
    <FormField label={label} required={required} error={error} help={help} sx={sx}>
      <select
        {...selectProps}
        style={{
          ...fieldStyle,
          cursor: 'pointer',
          ...(error ? { borderColor: colors.error } : {}),
          ...inputSx,
        }}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </FormField>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   TextareaField — FormField + textarea integrado
   
   Uso:
     <TextareaField
       label="Observaciones"
       value={obs} onChange={e => setObs(e.target.value)}
       rows={3}
     />
   ═══════════════════════════════════════════════════════════════════════════════ */

export interface TextareaFieldProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'style'> {
  label:     string;
  required?: boolean;
  error?:    string;
  help?:     string;
  inputSx?:  React.CSSProperties;
  sx?:       React.CSSProperties;
}

export function TextareaField({
  label, required, error, help, inputSx, sx,
  ...textareaProps
}: TextareaFieldProps) {
  return (
    <FormField label={label} required={required} error={error} help={help} sx={sx}>
      <textarea
        {...textareaProps}
        style={{
          ...fieldStyle,
          resize: 'vertical' as const,
          ...(error ? { borderColor: colors.error } : {}),
          ...inputSx,
        }}
      />
    </FormField>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   DateField — FormField + input date/datetime-local
   
   Uso:
     <DateField
       label="Fecha de despacho" type="datetime-local"
       value={toDatetimeLocal(despacho)}
       onChange={e => setDespacho(e.target.value)}
       error={errors.despacho}
     />
   ═══════════════════════════════════════════════════════════════════════════════ */

export interface DateFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'style' | 'type'> {
  label:     string;
  required?: boolean;
  error?:    string;
  help?:     string;
  /** 'date' | 'datetime-local' | 'time' — default: 'date' */
  type?:     'date' | 'datetime-local' | 'time';
  inputSx?:  React.CSSProperties;
  sx?:       React.CSSProperties;
}

export function DateField({
  label, required, error, help, type = 'date', inputSx, sx,
  ...inputProps
}: DateFieldProps) {
  return (
    <FormField label={label} required={required} error={error} help={help} sx={sx}>
      <input
        type={type}
        {...inputProps}
        style={{
          ...fieldStyle,
          ...(error ? { borderColor: colors.error } : {}),
          ...inputSx,
        }}
      />
    </FormField>
  );
}
