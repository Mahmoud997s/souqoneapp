import React from 'react';
import { UnifiedBottomBar } from '../navigation/UnifiedBottomBar';
import { useJobsBottomBar } from '../../hooks/useDepartmentBottomBar';

export const JobsBottomBar = () => {
  const {
    tabs,
    activeTab,
    handleTabPress,
    handlePostPress,
    activeColor,
    activeBgColor,
    scrollAware,
  } = useJobsBottomBar();

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
