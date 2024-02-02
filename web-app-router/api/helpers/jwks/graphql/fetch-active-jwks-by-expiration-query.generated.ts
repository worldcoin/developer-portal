/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from '@/graphql/graphql';

import { GraphQLClient } from 'graphql-request';
import { GraphQLClientRequestHeaders } from 'graphql-request/build/cjs/types';
import gql from 'graphql-tag';
export type FetchActiveJwKsByExpirationQueryVariables = Types.Exact<{
  expires_at: Types.Scalars['timestamptz'];
}>;


export type FetchActiveJwKsByExpirationQuery = { __typename?: 'query_root', jwks: Array<{ __typename?: 'jwks', id: string, kms_id?: string | null, expires_at: any }> };


export const FetchActiveJwKsByExpirationDocument = gql`
    query FetchActiveJWKsByExpiration($expires_at: timestamptz!) {
  jwks(where: {expires_at: {_gt: $expires_at}}, order_by: {expires_at: desc}) {
    id
    kms_id
    expires_at
  }
}
    `;

export type SdkFunctionWrapper = <T>(action: (requestHeaders?:Record<string, string>) => Promise<T>, operationName: string, operationType?: string) => Promise<T>;


const defaultWrapper: SdkFunctionWrapper = (action, _operationName, _operationType) => action();

export function getSdk(client: GraphQLClient, withWrapper: SdkFunctionWrapper = defaultWrapper) {
  return {
    FetchActiveJWKsByExpiration(variables: FetchActiveJwKsByExpirationQueryVariables, requestHeaders?: GraphQLClientRequestHeaders): Promise<FetchActiveJwKsByExpirationQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<FetchActiveJwKsByExpirationQuery>(FetchActiveJwKsByExpirationDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'FetchActiveJWKsByExpiration', 'query');
    }
  };
}
export type Sdk = ReturnType<typeof getSdk>;