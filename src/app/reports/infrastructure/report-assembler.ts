import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { Report } from '../domain/model/report.entity';
import { ReportResource, ReportsResponse } from './reports-response';

/**
 * @summary Maps report data between domain entities and API resources.
 */
export class ReportAssembler implements BaseAssembler<Report, ReportResource, ReportsResponse> {
  /**
   * @summary Maps an API response envelope into domain entities.
   */
  toEntitiesFromResponse(response: ReportsResponse): Report[] {
    return response.reports.map((resource) => this.toEntityFromResource(resource));
  }

  /**
   * @summary Maps one API resource into a domain entity.
   */
  toEntityFromResource(resource: ReportResource): Report {
    return new Report(
      Number(resource.id),
      resource.organizationId,
      resource.uuid,
      resource.type,
      resource.title,
      resource.periodDate,
      resource.generatedAt,
    );
  }

  /**
   * @summary Maps one domain entity into an API resource.
   */
  toResourceFromEntity(entity: Report): ReportResource {
    return {
      id: entity.id,
      organizationId: entity.organizationId,
      uuid: entity.uuid,
      type: entity.type,
      title: entity.title,
      periodDate: entity.periodDate,
      generatedAt: entity.generatedAt,
    };
  }
}
