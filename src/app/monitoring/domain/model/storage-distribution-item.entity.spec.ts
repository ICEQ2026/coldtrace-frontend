import { StorageDistributionItem } from './storage-distribution-item.entity';

describe('StorageDistributionItem', () => {
  it('should create an instance', () => {
    expect(
      new StorageDistributionItem({
        id: 1,
        label: 'Cold rooms',
        assetCount: 4,
        percentage: 80,
        color: '#2563eb',
      }),
    ).toBeTruthy();
  });
});
