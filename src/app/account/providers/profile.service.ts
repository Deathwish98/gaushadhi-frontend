import { Injectable } from '@angular/core';
import { RequestorService } from '../../core/providers/requestor.service';

import {
  Mutation, Query
} from '../../common/vendure-types';
import { map, tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { GET_ACTIVE_CUSTOMER } from '../../common/documents.graph';
import { gql } from 'apollo-angular';
import {
  ERROR_RESULT_FRAGMENT,
  SUCCESS_FRAGMENT,
} from '../../common/framents.graph';

export type updatedControl = {
  fieldEdited: string;
  fieldNewValue: number;
};

@Injectable({
  providedIn: 'root',
})
export class ProfileService {
  UPDATE_CUSTOMER_PROFILE_MUTATION = gql`
    mutation UpdateCustomerDetails(
      $updateCustomerInput: UpdateCustomerInput!
    ) {
      updateCustomer(input: $updateCustomerInput) {
        title
        firstName
        lastName
        phoneNumber
      }
    }
  `;

  REQUEST_EMAIL_ADDRESS_UPDATE_MUTATION = gql`
    mutation requestChangeEmailAddress(
      $password: String!
      $newEmailAddress: String!
    ) {
      requestUpdateCustomerEmailAddress(
        password: $password
        newEmailAddress: $newEmailAddress
      ) {
        ... on Success {
          success
        }
        ... on ErrorResult {
          errorCode
          message
        }
      }
    }
  `;

  VERIFY_CHANGE_EMAIL_ADDRESS_MUTATION = gql`
    mutation changeEmailAddress($token: String!) {
      updateCustomerEmailAddress(token: $token) {
        ... on Success {
          success
        }
        ... on ErrorResult {
          message
          errorCode
        }
      }
    }
  `;

  CHANGE_PASSWORD_MUTATION = gql`
    mutation updateCustomerPassword(
      $currentPassword: String!
      $newPassword: String!
    ) {
      updateCustomerPassword(
        currentPassword: $currentPassword
        newPassword: $newPassword
      ) {
        __typename
        ...Success
        ...ErrorResult
      }
    }
    ${SUCCESS_FRAGMENT}
    ${ERROR_RESULT_FRAGMENT}
  `;

  constructor(private requestor: RequestorService) {}

  getProfileData(): Observable<Query["activeCustomer"]> {
    return this.requestor
      .query(GET_ACTIVE_CUSTOMER, {
        includeAddress: false,
        includeProfile: true,
        includeOrder: false,
      })
      .pipe(
        map((res) => res.activeCustomer)
      );
  }

  updateCustomerProfile(
    updatedControls: Array<updatedControl>
  ): Observable<Mutation["updateCustomer"]> {
    const updateProfileMutationVariable: any = {
      updateCustomerInput: {},
      // hasUpdatedTitle: false,
      // hasUpdatedFirstName: false,
      // hasUpdatedLastName: false,
      // hasUpdatedPhoneNumber: false,
    };

    updatedControls.forEach((updatedControl) => {
      updateProfileMutationVariable.updateCustomerInput[
        updatedControl.fieldEdited
      ] = updatedControl.fieldNewValue;

      // switch (updatedControl.fieldEdited) {
      //   case 'firstName':
      //     updateProfileMutationVariable.hasUpdatedFirstName = true;
      //     break;
      //   case 'lastName':
      //     updateProfileMutationVariable.hasUpdatedLastName = true;
      //     break;
      //   case 'phoneNumber':
      //     updateProfileMutationVariable.hasUpdatedPhoneNumber = true;
      //     break;
      //   case 'title':
      //     updateProfileMutationVariable.hasUpdatedTitle = true;
      //     break;
      // }
    });

    return this.requestor
      .mutate(
        this.UPDATE_CUSTOMER_PROFILE_MUTATION,
        updateProfileMutationVariable
      )
      .pipe(map((res) => res.updateCustomer));
  }

  requestEmailUpdate({
    password,
    newEmailAddress,
  }: {
    password: string;
    newEmailAddress: string;
  }): Observable<Mutation["requestUpdateCustomerEmailAddress"]> {
    const requestEmailUpdateMutationVariable: any = {
      password,
      newEmailAddress,
    };

    return this.requestor
      .mutate(
        this.REQUEST_EMAIL_ADDRESS_UPDATE_MUTATION,
        requestEmailUpdateMutationVariable
      )
      .pipe(map((res) => res.requestUpdateCustomerEmailAddress));
  }

  changeEmail(token: string): Observable<Mutation["updateCustomerEmailAddress"]>{
    return this.requestor
      .mutate(this.VERIFY_CHANGE_EMAIL_ADDRESS_MUTATION, { token })
      .pipe(map((res) => res.updateCustomerEmailAddress));
  }

  changePassword({
    currentPassword,
    newPassword,
  }: Record<'currentPassword' | 'newPassword', string>): Observable<Mutation["updateCustomerPassword"]> {
    return this.requestor
      .mutate(this.CHANGE_PASSWORD_MUTATION, {
        currentPassword,
        newPassword,
      })
      .pipe(map((res) => res.updateCustomerPassword));
  }
}
