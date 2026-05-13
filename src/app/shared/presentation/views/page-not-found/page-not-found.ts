import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButton } from '@angular/material/button';
import { TranslatePipe } from '@ngx-translate/core';

/**
 * @summary Presents the page not found user interface in the shared bounded context.
 */
@Component({
  selector: 'app-page-not-found',
  imports: [
    TranslatePipe,
    MatButton
  ],
  templateUrl: './page-not-found.html',
  styleUrl: './page-not-found.css',
})
export class PageNotFound implements OnInit {
  protected invalidPath: string = '';

  private route: ActivatedRoute = inject(ActivatedRoute);
  private router: Router = inject(Router);

  /**
   * @summary Initializes the page not found view state.
   */
  ngOnInit(): void {
    this.invalidPath = this.route.snapshot.url.map(url => url.path).join('/');
  }

  protected navigateToHome(): void {
    this.router.navigate(['/identity-access/sign-in']).then();
  }
}
