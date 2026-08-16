import React from 'react';
import { UnifiedBottomBar } from '../navigation/UnifiedBottomBar';
import { useEquipmentBottomBar } from '../../hooks/useDepartmentBottomBar';

export const EquipmentBottomBar = () => {
  const {
    tabs,
    activeTab,
    handleTabPress,
    handlePostPress,
    activeColor,
    activeBgColor,
    scrollAware,
  } = useEquipmentBottomBar();

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

