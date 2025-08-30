import { SearchFormHandle } from 'model';
import React from 'react';
import { FormProvider } from 'react-hook-form';
import {
  ShopListSection,
  StampCategoryChooserSection,
  StampNameSection,
  StampSortSection,
  StampValueSection,
  StampYearSection,
} from './FormBits.tsx';

interface Props {
  handle: SearchFormHandle;
}

export const SearchOptionsForm: React.FC<Props> = React.memo(function SearchOptionsForm(props) {
  const handle = props.handle;
  return (
    <FormProvider {...handle.context}>
      <form noValidate={true}>
        <StampValueSection path="valueRange" />
        <StampYearSection path="yearRange" />
        <StampNameSection path="nameQuery" />
        <StampCategoryChooserSection path="category" />
        <ShopListSection fieldArray={handle.shopFieldArray} />
        <StampSortSection path="sort" />
      </form>
    </FormProvider>
  );
});
