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

/**
 * @summary Groups identity access API operations used by application stores and views.
 */
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

  /**
   * @summary Fetches users from the API endpoint.
   */
  getUsers(): Observable<User[]> {
    return this.usersEndpoint.getAll();
  }

  /**
   * @summary Persists a user through the API endpoint.
   */
  createUser(user: User): Observable<User> {
    return this.usersEndpoint.create(user);
  }

  /**
   * @summary Updates a user through the API endpoint.
   */
  updateUser(user: User): Observable<User> {
    return this.usersEndpoint.update(user, user.id);
  }

  /**
   * @summary Fetches organizations from the API endpoint.
   */
  getOrganizations(): Observable<Organization[]> {
    return this.organizationsEndpoint.getAll();
  }

  /**
   * @summary Persists an organization through the API endpoint.
   */
  createOrganization(organization: Organization): Observable<Organization> {
    return this.organizationsEndpoint.create(organization);
  }

  /**
   * @summary Fetches roles from the API endpoint.
   */
  getRoles(): Observable<Role[]> {
    return this.rolesEndpoint.getAll();
  }

  /**
   * @summary Updates a role through the API endpoint.
   */
  updateRole(role: Role): Observable<Role> {
    return this.rolesEndpoint.update(role, role.id);
  }
}
