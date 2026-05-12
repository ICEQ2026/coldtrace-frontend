import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { Report } from '../domain/model/report.entity';
import { ReportResource, ReportsResponse } from './reports-response';

export class ReportAssembler implements BaseAssembler<Report, ReportResource, ReportsResponse> {
  toEntitiesFromResponse(response: ReportsResponse): Report[] {
    return response.reports.map((resource) => this.toEntityFromResource(resource));
  }

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
