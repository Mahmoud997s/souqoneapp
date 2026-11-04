import React from 'react';
import { UnifiedBottomBar } from '../navigation/UnifiedBottomBar';
import { type GlassSupport } from '../navigation/glassSupport';
import { useBusesBottomBar } from '../../hooks/useDepartmentBottomBar';

export const BusesBottomBar = ({ glassSupport }: { glassSupport?: GlassSupport }) => {
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
      glassSupport={glassSupport}
    />
  );
};
