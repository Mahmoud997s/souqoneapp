import React from 'react';
import { UnifiedBottomBar } from '../navigation/UnifiedBottomBar';
import { useServicesBottomBar } from '../../hooks/useDepartmentBottomBar';

export const ServicesBottomBar = () => {
  const {
    tabs,
    activeTab,
    handleTabPress,
    handlePostPress,
    activeColor,
    activeBgColor,
    scrollAware,
  } = useServicesBottomBar();

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
