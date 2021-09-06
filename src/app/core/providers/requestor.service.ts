import { Injectable } from '@angular/core';
import { NetworkStatus, WatchQueryFetchPolicy } from '@apollo/client/core';
import { Apollo } from 'apollo-angular';
import { DocumentNode } from 'graphql';
import { Observable, of } from 'rxjs';
import { catchError, filter, map, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class RequestorService {
  private readonly context = {
    headers: {},
  };

  constructor(private apollo: Apollo) {}

  query<T = any, V = any>(
    query: DocumentNode,
    variables?: V,
    fetchPolicy?: WatchQueryFetchPolicy
  ): Observable<T> {
    return this.apollo
      .watchQuery<T, V>({
        query,
        variables,
        context: this.context,
        fetchPolicy: fetchPolicy || 'cache-and-network',
      })
      .valueChanges.pipe(
        tap(),
        filter((result) => result.networkStatus === NetworkStatus.ready),
        map((response) => response.data)
      );
  }

  mutate<T = any, V = any>(
    mutation: DocumentNode,
    variables?: V
  ): Observable<T> {
    return this.apollo
      .mutate<T, V>({
        mutation,
        variables,
        context: this.context,
      })
      .pipe(map((response) => response.data as T));
  }
}
