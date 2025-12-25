import { getSAPClient } from '../client.ts';
import type {
    SAPUnitOfMeasurementGroup,
} from '../types.ts';

// Fields to retrieve from SAP for UoM Groups
const SELECT_FIELDS = [
  'AbsEntry',
  'BaseUoM',
  'UoMGroupDefinitionCollection',
];

/**
 * Service for SAP Unit of Measurement Group operations (NO caching)
 * MasterItemService handles caching of combined data
 */
export class UoMService {
  private client = getSAPClient();

  /**
   * Fetch all UoM groups from SAP (no cache)
   */
  async getAllUoMGroups(): Promise<SAPUnitOfMeasurementGroup[]> {
    try {
      return await this.client.fetchAllSAPData<SAPUnitOfMeasurementGroup>({
        endpoint: '/UnitOfMeasurementGroups',
        selectFields: SELECT_FIELDS,
        pageSize: 100,
      });
    } catch (error) {
      console.error('Failed to fetch UoM groups from SAP:', error);
      return [];
    }
  }

  /**
   * Get UoM group by AbsEntry (no cache)
   */
  async getUoMGroupByAbsEntry(absEntry: number): Promise<SAPUnitOfMeasurementGroup | null> {
    try {
      return await this.client.fetchSAPEntity<SAPUnitOfMeasurementGroup>(
        '/UnitOfMeasurementGroups',
        absEntry
      );
    } catch (error) {
      console.error(`Failed to fetch UoM group ${absEntry}:`, error);
      return null;
    }
  }
}

// Singleton instance
let uomServiceInstance: UoMService | null = null;

export function getUoMService(): UoMService {
  if (!uomServiceInstance) {
    uomServiceInstance = new UoMService();
  }
  return uomServiceInstance;
}
