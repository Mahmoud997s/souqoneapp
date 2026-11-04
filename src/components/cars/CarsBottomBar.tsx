import React from 'react';
import { UnifiedBottomBar } from '../navigation/UnifiedBottomBar';
import { type GlassSupport } from '../navigation/glassSupport';
import { useCarsBottomBar } from '../../hooks/useDepartmentBottomBar';

export const CarsBottomBar = ({ glassSupport }: { glassSupport?: GlassSupport }) => {
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
      glassSupport={glassSupport}
    />
  );
};
