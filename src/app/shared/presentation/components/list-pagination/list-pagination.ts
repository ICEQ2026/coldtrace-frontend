import { NgClass } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';

/**
 * @summary Presents shared list pagination controls.
 */
@Component({
  selector: 'app-list-pagination',
  imports: [NgClass, MatIcon, TranslatePipe],
  templateUrl: './list-pagination.html',
  styleUrl: './list-pagination.css',
})
export class ListPagination {
  readonly page = input(1);
  readonly total = input.required<number>();
  readonly pageSize = input(10);
  readonly pageChange = output<number>();

  protected readonly pageCount = computed(() =>
    Math.max(Math.ceil(this.total() / this.pageSize()), 1),
  );
  protected readonly currentPage = computed(() =>
    Math.min(Math.max(this.page(), 1), this.pageCount()),
  );
  protected readonly pageStart = computed(() =>
    this.total() ? (this.currentPage() - 1) * this.pageSize() + 1 : 0,
  );
  protected readonly pageEnd = computed(() =>
    Math.min(this.currentPage() * this.pageSize(), this.total()),
  );
  protected readonly visiblePages = computed<(number | string)[]>(() => {
    const totalPages = this.pageCount();
    const activePage = this.currentPage();

    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    if (activePage <= 4) {
      return [1, 2, 3, 4, 5, 'end-ellipsis', totalPages];
    }

    if (activePage >= totalPages - 3) {
      return [
        1,
        'start-ellipsis',
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    }

    return [
      1,
      'start-ellipsis',
      activePage - 1,
      activePage,
      activePage + 1,
      'end-ellipsis',
      totalPages,
    ];
  });

  protected goToPage(page: number | string): void {
    const nextPage = Math.min(Math.max(Number(page), 1), this.pageCount());
    this.pageChange.emit(nextPage);
  }

  protected isNumber(page: number | string): page is number {
    return typeof page === 'number';
  }
}
