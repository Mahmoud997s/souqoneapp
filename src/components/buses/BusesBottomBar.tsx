import React from 'react';
import { UnifiedBottomBar } from '../navigation/UnifiedBottomBar';
import { useBusesBottomBar } from '../../hooks/useDepartmentBottomBar';

export const BusesBottomBar = () => {
  const {
    tabs,
    activeTab,
    handleTabPress,
    handlePostPress,
    activeColor,
    activeBgColor,
    scrollAware,
  } = useBusesBottomBar();

  return (
    <UnifiedBottomBar
      tabs={tabs}
      activeTab={activeTab}
      onTabPress={handleTabPress}
      onPostPress={handlePostPress}
      activeColor={activeColor}
      activeBgColor={activeBgColor}
      scrollAware={scrollAware}
    />
  );
};
