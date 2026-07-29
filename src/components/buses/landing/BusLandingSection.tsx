import React from 'react';
import { useBuses } from '../../../hooks/useBuses';
import { BusHorizontalList } from './BusHorizontalList';

interface Props {
  title: string;
  subTitle?: string;
  emptyText: string;
  onSeeAll: () => void;
  onPressItem: (item: any) => void;
  queryParams: any; // Using any for simplicity as per useBuses config type
}

export function BusLandingSection({
  title,
  subTitle,
  emptyText,
  onSeeAll,
  onPressItem,
  queryParams
}: Props) {
  const { data = [], isLoading } = useBuses(queryParams);

  if (!isLoading && (!data || data.length === 0)) {
    return null;
  }

  return (
    <BusHorizontalList
      title={title}
      subTitle={subTitle}
      data={data}
      isLoading={isLoading}
      emptyText={emptyText}
      onSeeAll={onSeeAll}
      onPressItem={onPressItem}
    />
  );
}
