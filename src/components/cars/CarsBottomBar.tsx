import React from 'react';
import { UnifiedBottomBar } from '../navigation/UnifiedBottomBar';
import { useCarsBottomBar } from '../../hooks/useDepartmentBottomBar';

export const CarsBottomBar = () => {
  const {
    tabs,
    activeTab,
    handleTabPress,
    handlePostPress,
    activeColor,
    activeBgColor,
    scrollAware,
  } = useCarsBottomBar();

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
