import {
  Control,
  FieldValues,
  FormState,
  UseFormRegister,
  UseFormReset,
  UseFormSetValue,
  UseFormTrigger,
  UseFormWatch,
} from 'react-hook-form';

export interface FormHandle<TFormData extends FieldValues> {
  reset: UseFormReset<TFormData>;
  trigger: UseFormTrigger<TFormData>;
  control: Control<TFormData>;
  register: UseFormRegister<TFormData>;
  setValue: UseFormSetValue<TFormData>;
  formState: FormState<TFormData>;
  watch: UseFormWatch<TFormData>;
}
