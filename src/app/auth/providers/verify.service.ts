import { Injectable } from '@angular/core';
import { RequestorService } from '../../core/providers/requestor.service';
import { Verify } from '../../common/vendure-types';
import { map } from 'rxjs/operators';
import { gql } from 'apollo-angular';

@Injectable()
export class VerifyService {
  VERIFY_MUTATION = gql`
    mutation ($token: String!) {
      verifyCustomerAccount(token: $token, password: "") {
        __typename
        ... on CurrentUser {
          id
          identifier
          channels {
            id
            token
            code
            permissions
          }
        }
        ... on VerificationTokenInvalidError {
          errorCode
          message
        }
        ... on VerificationTokenExpiredError {
          errorCode
          message
        }
        ... on MissingPasswordError {
          errorCode
          message
        }
        ... on NativeAuthStrategyError {
          errorCode
          message
        }
        ... on PasswordAlreadySetError {
          errorCode
          message
        }
      }
    }
  `;

  constructor(private requestor: RequestorService) {}

  verify(token: string, password: string) {
    const verifyMutationVariable = {
      token,
      password: password || '',
    };
    return this.requestor
      .mutate<Verify.Mutation, Verify.Variables>(
        this.VERIFY_MUTATION,
        verifyMutationVariable
      )
      .pipe(map((res) => res.verifyCustomerAccount));
  }
}
