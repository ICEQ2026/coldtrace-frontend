import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApi } from '../../shared/infrastructure/base-api';
import { Organization } from '../domain/model/organization.entity';
import { Role } from '../domain/model/role.entity';
import { User } from '../domain/model/user.entity';
import { OrganizationsApiEndpoint } from './organizations-api-endpoint';
import { RolesApiEndpoint } from './roles-api-endpoint';
import { UsersApiEndpoint } from './users-api-endpoint';

@Injectable({ providedIn: 'root' })
export class IdentityAccessApi extends BaseApi {
  private readonly usersEndpoint: UsersApiEndpoint;
  private readonly organizationsEndpoint: OrganizationsApiEndpoint;
  private readonly rolesEndpoint: RolesApiEndpoint;

  constructor(httpClient: HttpClient) {
    super();
    this.usersEndpoint = new UsersApiEndpoint(httpClient);
    this.organizationsEndpoint = new OrganizationsApiEndpoint(httpClient);
    this.rolesEndpoint = new RolesApiEndpoint(httpClient);
  }

  getUsers(): Observable<User[]> {
    return this.usersEndpoint.getAll();
  }

  createUser(user: User): Observable<User> {
    return this.usersEndpoint.create(user);
  }

  getOrganizations(): Observable<Organization[]> {
    return this.organizationsEndpoint.getAll();
  }

  createOrganization(organization: Organization): Observable<Organization> {
    return this.organizationsEndpoint.create(organization);
  }

  getRoles(): Observable<Role[]> {
    return this.rolesEndpoint.getAll();
  }
}
