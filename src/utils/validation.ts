export interface ValidationRule<T> {
  validate: (value: T) => boolean;
  message: string;
}

export interface ValidationSchema<T> {
  [key: string]: ValidationRule<any>[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export function validateForm<T extends Record<string, any>>(
  data: T,
  schema: ValidationSchema<T>
): ValidationResult {
  const errors: Record<string, string> = {};

  Object.entries(schema).forEach(([field, rules]) => {
    const value = data[field];
    
    for (const rule of rules) {
      if (!rule.validate(value)) {
        errors[field] = rule.message;
        break; // Stop at first error for this field
      }
    }
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

// Common validation rules
export const validationRules = {
  required: <T>(value: T): ValidationRule<T> => ({
    validate: (val) => val !== null && val !== undefined && val !== '',
    message: 'Este campo é obrigatório',
  }),

  minLength: (min: number): ValidationRule<string> => ({
    validate: (value) => typeof value === 'string' && value.length >= min,
    message: `Deve ter pelo menos ${min} caracteres`,
  }),

  maxLength: (max: number): ValidationRule<string> => ({
    validate: (value) => typeof value === 'string' && value.length <= max,
    message: `Deve ter no máximo ${max} caracteres`,
  }),

  email: (): ValidationRule<string> => ({
    validate: (value) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return typeof value === 'string' && emailRegex.test(value);
    },
    message: 'Email inválido',
  }),

  positive: (): ValidationRule<number> => ({
    validate: (value) => typeof value === 'number' && value > 0,
    message: 'Deve ser um número positivo',
  }),

  min: (min: number): ValidationRule<number> => ({
    validate: (value) => typeof value === 'number' && value >= min,
    message: `Deve ser maior ou igual a ${min}`,
  }),

  max: (max: number): ValidationRule<number> => ({
    validate: (value) => typeof value === 'number' && value <= max,
    message: `Deve ser menor ou igual a ${max}`,
  }),
};