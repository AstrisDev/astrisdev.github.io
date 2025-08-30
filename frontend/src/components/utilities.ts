import React from 'react';
import { FieldPathByValue, FieldValues } from 'react-hook-form';
import { FormHandle } from './FormHandle';

// Normal React.memo does not type well with functional components that have type parameters
export const typedMemo: <T>(c: T) => T = React.memo;

/**
 * Simple wrapper around formHandle.setValue.
 * Workaround for the not smart enough typechecker.
 */
export function setFormValue<TFormData extends FieldValues, TValue>(
  formHandle: FormHandle<TFormData>,
  path: FieldPathByValue<TFormData, TValue>,
  value: TValue,
) {
  formHandle.setValue(path, value as never);
}
