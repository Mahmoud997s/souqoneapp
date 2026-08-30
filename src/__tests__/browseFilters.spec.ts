import fs from 'fs';
import path from 'path';

describe('browseFilters', () => {
  it('buses browse: filter sends governorateId (number) not string', () => {
    const filePath = path.join(__dirname, '../../app/buses/browse.tsx');
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Ensure the filter uses governorateId with the numeric ID
    expect(content).toContain('governorateId: item.id');
    // Ensure it no longer uses the string name
    expect(content).not.toContain('governorate: item.labelAr');
  });

  it('equipment browse: filter sends governorateId (number) not string', () => {
    const filePath = path.join(__dirname, '../../app/equipment/browse.tsx');
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Ensure the filter uses governorateId with the numeric ID
    expect(content).toContain('governorateId: item.id');
    // Ensure it no longer uses the string name
    expect(content).not.toContain('governorate: item.labelAr');
  });
});
