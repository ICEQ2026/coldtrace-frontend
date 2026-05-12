import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApi } from '../../shared/infrastructure/base-api';
import { Report } from '../domain/model/report.entity';
import { ReportsApiEndpoint } from './reports-api-endpoint';

@Injectable({ providedIn: 'root' })
export class ReportsApi extends BaseApi {
  private readonly reportsEndpoint: ReportsApiEndpoint;

  constructor(httpClient: HttpClient) {
    super();
    this.reportsEndpoint = new ReportsApiEndpoint(httpClient);
  }

  getReports(): Observable<Report[]> {
    return this.reportsEndpoint.getAll();
  }

  createReport(report: Report): Observable<Report> {
    return this.reportsEndpoint.create(report);
  }
}
