/* eslint-disable import/no-relative-parent-imports -- auto generated file */
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = {
  [K in keyof T]: T[K];
};
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]?: Maybe<T[SubKey]>;
};
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]: Maybe<T[SubKey]>;
};
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  _text: any;
  jsonb: any;
  numeric: any;
  timestamptz: any;
};

/** Boolean expression to compare columns of type "Boolean". All fields are combined with logical 'AND'. */
export type Boolean_Comparison_Exp = {
  _eq?: InputMaybe<Scalars["Boolean"]>;
  _gt?: InputMaybe<Scalars["Boolean"]>;
  _gte?: InputMaybe<Scalars["Boolean"]>;
  _in?: InputMaybe<Array<Scalars["Boolean"]>>;
  _is_null?: InputMaybe<Scalars["Boolean"]>;
  _lt?: InputMaybe<Scalars["Boolean"]>;
  _lte?: InputMaybe<Scalars["Boolean"]>;
  _neq?: InputMaybe<Scalars["Boolean"]>;
  _nin?: InputMaybe<Array<Scalars["Boolean"]>>;
};

export type DeleteImageOutput = {
  __typename?: "DeleteImageOutput";
  success?: Maybe<Scalars["Boolean"]>;
};

export type GetUploadedImageOutput = {
  __typename?: "GetUploadedImageOutput";
  url: Scalars["String"];
};

export type ImageGetAllUnverifiedImagesOutput = {
  __typename?: "ImageGetAllUnverifiedImagesOutput";
  hero_image_url?: Maybe<Scalars["String"]>;
  logo_img_url?: Maybe<Scalars["String"]>;
  showcase_img_urls?: Maybe<Array<Scalars["String"]>>;
};

export type ImageGetAppReviewImagesOutput = {
  __typename?: "ImageGetAppReviewImagesOutput";
  hero_image_url?: Maybe<Scalars["String"]>;
  logo_img_url?: Maybe<Scalars["String"]>;
  showcase_img_urls?: Maybe<Array<Scalars["String"]>>;
};

/** Boolean expression to compare columns of type "Int". All fields are combined with logical 'AND'. */
export type Int_Comparison_Exp = {
  _eq?: InputMaybe<Scalars["Int"]>;
  _gt?: InputMaybe<Scalars["Int"]>;
  _gte?: InputMaybe<Scalars["Int"]>;
  _in?: InputMaybe<Array<Scalars["Int"]>>;
  _is_null?: InputMaybe<Scalars["Boolean"]>;
  _lt?: InputMaybe<Scalars["Int"]>;
  _lte?: InputMaybe<Scalars["Int"]>;
  _neq?: InputMaybe<Scalars["Int"]>;
  _nin?: InputMaybe<Array<Scalars["Int"]>>;
};

export type InviteTeamMembersOutput = {
  __typename?: "InviteTeamMembersOutput";
  emails?: Maybe<Array<Scalars["String"]>>;
};

export type PresignedPostOutput = {
  __typename?: "PresignedPostOutput";
  stringifiedFields: Scalars["String"];
  url: Scalars["String"];
};

export type ResetApiOutput = {
  __typename?: "ResetAPIOutput";
  api_key: Scalars["String"];
};

export type ResetClientOutput = {
  __typename?: "ResetClientOutput";
  client_secret: Scalars["String"];
};

/** Boolean expression to compare columns of type "String". All fields are combined with logical 'AND'. */
export type String_Comparison_Exp = {
  _eq?: InputMaybe<Scalars["String"]>;
  _gt?: InputMaybe<Scalars["String"]>;
  _gte?: InputMaybe<Scalars["String"]>;
  /** does the column match the given case-insensitive pattern */
  _ilike?: InputMaybe<Scalars["String"]>;
  _in?: InputMaybe<Array<Scalars["String"]>>;
  /** does the column match the given POSIX regular expression, case insensitive */
  _iregex?: InputMaybe<Scalars["String"]>;
  _is_null?: InputMaybe<Scalars["Boolean"]>;
  /** does the column match the given pattern */
  _like?: InputMaybe<Scalars["String"]>;
  _lt?: InputMaybe<Scalars["String"]>;
  _lte?: InputMaybe<Scalars["String"]>;
  _neq?: InputMaybe<Scalars["String"]>;
  /** does the column NOT match the given case-insensitive pattern */
  _nilike?: InputMaybe<Scalars["String"]>;
  _nin?: InputMaybe<Array<Scalars["String"]>>;
  /** does the column NOT match the given POSIX regular expression, case insensitive */
  _niregex?: InputMaybe<Scalars["String"]>;
  /** does the column NOT match the given pattern */
  _nlike?: InputMaybe<Scalars["String"]>;
  /** does the column NOT match the given POSIX regular expression, case sensitive */
  _nregex?: InputMaybe<Scalars["String"]>;
  /** does the column NOT match the given SQL regular expression */
  _nsimilar?: InputMaybe<Scalars["String"]>;
  /** does the column match the given POSIX regular expression, case sensitive */
  _regex?: InputMaybe<Scalars["String"]>;
  /** does the column match the given SQL regular expression */
  _similar?: InputMaybe<Scalars["String"]>;
};

export type VerifyAppOutput = {
  __typename?: "VerifyAppOutput";
  success?: Maybe<Scalars["Boolean"]>;
};

/** Boolean expression to compare columns of type "_text". All fields are combined with logical 'AND'. */
export type _Text_Comparison_Exp = {
  _eq?: InputMaybe<Scalars["_text"]>;
  _gt?: InputMaybe<Scalars["_text"]>;
  _gte?: InputMaybe<Scalars["_text"]>;
  _in?: InputMaybe<Array<Scalars["_text"]>>;
  _is_null?: InputMaybe<Scalars["Boolean"]>;
  _lt?: InputMaybe<Scalars["_text"]>;
  _lte?: InputMaybe<Scalars["_text"]>;
  _neq?: InputMaybe<Scalars["_text"]>;
  _nin?: InputMaybe<Array<Scalars["_text"]>>;
};

/** columns and relationships of "action" */
export type Action = {
  __typename?: "action";
  /** Raw action value as passed by the dev to IDKit. */
  action: Scalars["String"];
  /** An object relationship */
  app: App;
  app_id: Scalars["String"];
  client_secret: Scalars["String"];
  created_at: Scalars["timestamptz"];
  creation_mode: Scalars["String"];
  description: Scalars["String"];
  /** Encoded and hashed value of app_id and action. Determines scope for uniqueness. Used for Semaphore ZKPs. */
  external_nullifier: Scalars["String"];
  id: Scalars["String"];
  kiosk_enabled: Scalars["Boolean"];
  /** Only for Sign in with World ID. Determines the maximum number of accounts a single person can have for the respective app. */
  max_accounts_per_user: Scalars["Int"];
  /** Only used for actions. Only for actions verified in the Developer Portal. Determines the maximum number of verifications that a user can perform for this action. */
  max_verifications: Scalars["Int"];
  /** Friendly name given to an action in the Developer Portal. */
  name: Scalars["String"];
  /** An array relationship */
  nullifiers: Array<Nullifier>;
  /** An aggregate relationship */
  nullifiers_aggregate: Nullifier_Aggregate;
  privacy_policy_uri?: Maybe<Scalars["String"]>;
  /** a computed field listing how many redirect_uris are added */
  redirect_count?: Maybe<Scalars["Int"]>;
  /** An array relationship */
  redirects: Array<Redirect>;
  /** An aggregate relationship */
  redirects_aggregate: Redirect_Aggregate;
  status: Scalars["String"];
  terms_uri?: Maybe<Scalars["String"]>;
  updated_at: Scalars["timestamptz"];
};

/** columns and relationships of "action" */
export type ActionNullifiersArgs = {
  distinct_on?: InputMaybe<Array<Nullifier_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Nullifier_Order_By>>;
  where?: InputMaybe<Nullifier_Bool_Exp>;
};

/** columns and relationships of "action" */
export type ActionNullifiers_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Nullifier_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Nullifier_Order_By>>;
  where?: InputMaybe<Nullifier_Bool_Exp>;
};

/** columns and relationships of "action" */
export type ActionRedirectsArgs = {
  distinct_on?: InputMaybe<Array<Redirect_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Redirect_Order_By>>;
  where?: InputMaybe<Redirect_Bool_Exp>;
};

/** columns and relationships of "action" */
export type ActionRedirects_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Redirect_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Redirect_Order_By>>;
  where?: InputMaybe<Redirect_Bool_Exp>;
};

/** aggregated selection of "action" */
export type Action_Aggregate = {
  __typename?: "action_aggregate";
  aggregate?: Maybe<Action_Aggregate_Fields>;
  nodes: Array<Action>;
};

export type Action_Aggregate_Bool_Exp = {
  bool_and?: InputMaybe<Action_Aggregate_Bool_Exp_Bool_And>;
  bool_or?: InputMaybe<Action_Aggregate_Bool_Exp_Bool_Or>;
  count?: InputMaybe<Action_Aggregate_Bool_Exp_Count>;
};

export type Action_Aggregate_Bool_Exp_Bool_And = {
  arguments: Action_Select_Column_Action_Aggregate_Bool_Exp_Bool_And_Arguments_Columns;
  distinct?: InputMaybe<Scalars["Boolean"]>;
  filter?: InputMaybe<Action_Bool_Exp>;
  predicate: Boolean_Comparison_Exp;
};

export type Action_Aggregate_Bool_Exp_Bool_Or = {
  arguments: Action_Select_Column_Action_Aggregate_Bool_Exp_Bool_Or_Arguments_Columns;
  distinct?: InputMaybe<Scalars["Boolean"]>;
  filter?: InputMaybe<Action_Bool_Exp>;
  predicate: Boolean_Comparison_Exp;
};

export type Action_Aggregate_Bool_Exp_Count = {
  arguments?: InputMaybe<Array<Action_Select_Column>>;
  distinct?: InputMaybe<Scalars["Boolean"]>;
  filter?: InputMaybe<Action_Bool_Exp>;
  predicate: Int_Comparison_Exp;
};

/** aggregate fields of "action" */
export type Action_Aggregate_Fields = {
  __typename?: "action_aggregate_fields";
  avg?: Maybe<Action_Avg_Fields>;
  count: Scalars["Int"];
  max?: Maybe<Action_Max_Fields>;
  min?: Maybe<Action_Min_Fields>;
  stddev?: Maybe<Action_Stddev_Fields>;
  stddev_pop?: Maybe<Action_Stddev_Pop_Fields>;
  stddev_samp?: Maybe<Action_Stddev_Samp_Fields>;
  sum?: Maybe<Action_Sum_Fields>;
  var_pop?: Maybe<Action_Var_Pop_Fields>;
  var_samp?: Maybe<Action_Var_Samp_Fields>;
  variance?: Maybe<Action_Variance_Fields>;
};

/** aggregate fields of "action" */
export type Action_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Action_Select_Column>>;
  distinct?: InputMaybe<Scalars["Boolean"]>;
};

/** order by aggregate values of table "action" */
export type Action_Aggregate_Order_By = {
  avg?: InputMaybe<Action_Avg_Order_By>;
  count?: InputMaybe<Order_By>;
  max?: InputMaybe<Action_Max_Order_By>;
  min?: InputMaybe<Action_Min_Order_By>;
  stddev?: InputMaybe<Action_Stddev_Order_By>;
  stddev_pop?: InputMaybe<Action_Stddev_Pop_Order_By>;
  stddev_samp?: InputMaybe<Action_Stddev_Samp_Order_By>;
  sum?: InputMaybe<Action_Sum_Order_By>;
  var_pop?: InputMaybe<Action_Var_Pop_Order_By>;
  var_samp?: InputMaybe<Action_Var_Samp_Order_By>;
  variance?: InputMaybe<Action_Variance_Order_By>;
};

/** input type for inserting array relation for remote table "action" */
export type Action_Arr_Rel_Insert_Input = {
  data: Array<Action_Insert_Input>;
  /** upsert condition */
  on_conflict?: InputMaybe<Action_On_Conflict>;
};

/** aggregate avg on columns */
export type Action_Avg_Fields = {
  __typename?: "action_avg_fields";
  /** Only for Sign in with World ID. Determines the maximum number of accounts a single person can have for the respective app. */
  max_accounts_per_user?: Maybe<Scalars["Float"]>;
  /** Only used for actions. Only for actions verified in the Developer Portal. Determines the maximum number of verifications that a user can perform for this action. */
  max_verifications?: Maybe<Scalars["Float"]>;
  /** a computed field listing how many redirect_uris are added */
  redirect_count?: Maybe<Scalars["Int"]>;
};

/** order by avg() on columns of table "action" */
export type Action_Avg_Order_By = {
  /** Only for Sign in with World ID. Determines the maximum number of accounts a single person can have for the respective app. */
  max_accounts_per_user?: InputMaybe<Order_By>;
  /** Only used for actions. Only for actions verified in the Developer Portal. Determines the maximum number of verifications that a user can perform for this action. */
  max_verifications?: InputMaybe<Order_By>;
};

/** Boolean expression to filter rows from the table "action". All fields are combined with a logical 'AND'. */
export type Action_Bool_Exp = {
  _and?: InputMaybe<Array<Action_Bool_Exp>>;
  _not?: InputMaybe<Action_Bool_Exp>;
  _or?: InputMaybe<Array<Action_Bool_Exp>>;
  action?: InputMaybe<String_Comparison_Exp>;
  app?: InputMaybe<App_Bool_Exp>;
  app_id?: InputMaybe<String_Comparison_Exp>;
  client_secret?: InputMaybe<String_Comparison_Exp>;
  created_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  creation_mode?: InputMaybe<String_Comparison_Exp>;
  description?: InputMaybe<String_Comparison_Exp>;
  external_nullifier?: InputMaybe<String_Comparison_Exp>;
  id?: InputMaybe<String_Comparison_Exp>;
  kiosk_enabled?: InputMaybe<Boolean_Comparison_Exp>;
  max_accounts_per_user?: InputMaybe<Int_Comparison_Exp>;
  max_verifications?: InputMaybe<Int_Comparison_Exp>;
  name?: InputMaybe<String_Comparison_Exp>;
  nullifiers?: InputMaybe<Nullifier_Bool_Exp>;
  nullifiers_aggregate?: InputMaybe<Nullifier_Aggregate_Bool_Exp>;
  privacy_policy_uri?: InputMaybe<String_Comparison_Exp>;
  redirect_count?: InputMaybe<Int_Comparison_Exp>;
  redirects?: InputMaybe<Redirect_Bool_Exp>;
  redirects_aggregate?: InputMaybe<Redirect_Aggregate_Bool_Exp>;
  status?: InputMaybe<String_Comparison_Exp>;
  terms_uri?: InputMaybe<String_Comparison_Exp>;
  updated_at?: InputMaybe<Timestamptz_Comparison_Exp>;
};

/** unique or primary key constraints on table "action" */
export enum Action_Constraint {
  /** unique or primary key constraint on columns "action", "app_id" */
  ActionAppIdActionKey = "action_app_id_action_key",
  /** unique or primary key constraint on columns "external_nullifier", "app_id" */
  ActionAppIdExternalNullifierKey = "action_app_id_external_nullifier_key",
  /** unique or primary key constraint on columns "id" */
  ActionPkey = "action_pkey",
}

/** input type for incrementing numeric columns in table "action" */
export type Action_Inc_Input = {
  /** Only for Sign in with World ID. Determines the maximum number of accounts a single person can have for the respective app. */
  max_accounts_per_user?: InputMaybe<Scalars["Int"]>;
  /** Only used for actions. Only for actions verified in the Developer Portal. Determines the maximum number of verifications that a user can perform for this action. */
  max_verifications?: InputMaybe<Scalars["Int"]>;
};

/** input type for inserting data into table "action" */
export type Action_Insert_Input = {
  /** Raw action value as passed by the dev to IDKit. */
  action?: InputMaybe<Scalars["String"]>;
  app?: InputMaybe<App_Obj_Rel_Insert_Input>;
  app_id?: InputMaybe<Scalars["String"]>;
  client_secret?: InputMaybe<Scalars["String"]>;
  created_at?: InputMaybe<Scalars["timestamptz"]>;
  creation_mode?: InputMaybe<Scalars["String"]>;
  description?: InputMaybe<Scalars["String"]>;
  /** Encoded and hashed value of app_id and action. Determines scope for uniqueness. Used for Semaphore ZKPs. */
  external_nullifier?: InputMaybe<Scalars["String"]>;
  id?: InputMaybe<Scalars["String"]>;
  kiosk_enabled?: InputMaybe<Scalars["Boolean"]>;
  /** Only for Sign in with World ID. Determines the maximum number of accounts a single person can have for the respective app. */
  max_accounts_per_user?: InputMaybe<Scalars["Int"]>;
  /** Only used for actions. Only for actions verified in the Developer Portal. Determines the maximum number of verifications that a user can perform for this action. */
  max_verifications?: InputMaybe<Scalars["Int"]>;
  /** Friendly name given to an action in the Developer Portal. */
  name?: InputMaybe<Scalars["String"]>;
  nullifiers?: InputMaybe<Nullifier_Arr_Rel_Insert_Input>;
  privacy_policy_uri?: InputMaybe<Scalars["String"]>;
  redirects?: InputMaybe<Redirect_Arr_Rel_Insert_Input>;
  status?: InputMaybe<Scalars["String"]>;
  terms_uri?: InputMaybe<Scalars["String"]>;
  updated_at?: InputMaybe<Scalars["timestamptz"]>;
};

/** aggregate max on columns */
export type Action_Max_Fields = {
  __typename?: "action_max_fields";
  /** Raw action value as passed by the dev to IDKit. */
  action?: Maybe<Scalars["String"]>;
  app_id?: Maybe<Scalars["String"]>;
  client_secret?: Maybe<Scalars["String"]>;
  created_at?: Maybe<Scalars["timestamptz"]>;
  creation_mode?: Maybe<Scalars["String"]>;
  description?: Maybe<Scalars["String"]>;
  /** Encoded and hashed value of app_id and action. Determines scope for uniqueness. Used for Semaphore ZKPs. */
  external_nullifier?: Maybe<Scalars["String"]>;
  id?: Maybe<Scalars["String"]>;
  /** Only for Sign in with World ID. Determines the maximum number of accounts a single person can have for the respective app. */
  max_accounts_per_user?: Maybe<Scalars["Int"]>;
  /** Only used for actions. Only for actions verified in the Developer Portal. Determines the maximum number of verifications that a user can perform for this action. */
  max_verifications?: Maybe<Scalars["Int"]>;
  /** Friendly name given to an action in the Developer Portal. */
  name?: Maybe<Scalars["String"]>;
  privacy_policy_uri?: Maybe<Scalars["String"]>;
  /** a computed field listing how many redirect_uris are added */
  redirect_count?: Maybe<Scalars["Int"]>;
  status?: Maybe<Scalars["String"]>;
  terms_uri?: Maybe<Scalars["String"]>;
  updated_at?: Maybe<Scalars["timestamptz"]>;
};

/** order by max() on columns of table "action" */
export type Action_Max_Order_By = {
  /** Raw action value as passed by the dev to IDKit. */
  action?: InputMaybe<Order_By>;
  app_id?: InputMaybe<Order_By>;
  client_secret?: InputMaybe<Order_By>;
  created_at?: InputMaybe<Order_By>;
  creation_mode?: InputMaybe<Order_By>;
  description?: InputMaybe<Order_By>;
  /** Encoded and hashed value of app_id and action. Determines scope for uniqueness. Used for Semaphore ZKPs. */
  external_nullifier?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  /** Only for Sign in with World ID. Determines the maximum number of accounts a single person can have for the respective app. */
  max_accounts_per_user?: InputMaybe<Order_By>;
  /** Only used for actions. Only for actions verified in the Developer Portal. Determines the maximum number of verifications that a user can perform for this action. */
  max_verifications?: InputMaybe<Order_By>;
  /** Friendly name given to an action in the Developer Portal. */
  name?: InputMaybe<Order_By>;
  privacy_policy_uri?: InputMaybe<Order_By>;
  status?: InputMaybe<Order_By>;
  terms_uri?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
};

/** aggregate min on columns */
export type Action_Min_Fields = {
  __typename?: "action_min_fields";
  /** Raw action value as passed by the dev to IDKit. */
  action?: Maybe<Scalars["String"]>;
  app_id?: Maybe<Scalars["String"]>;
  client_secret?: Maybe<Scalars["String"]>;
  created_at?: Maybe<Scalars["timestamptz"]>;
  creation_mode?: Maybe<Scalars["String"]>;
  description?: Maybe<Scalars["String"]>;
  /** Encoded and hashed value of app_id and action. Determines scope for uniqueness. Used for Semaphore ZKPs. */
  external_nullifier?: Maybe<Scalars["String"]>;
  id?: Maybe<Scalars["String"]>;
  /** Only for Sign in with World ID. Determines the maximum number of accounts a single person can have for the respective app. */
  max_accounts_per_user?: Maybe<Scalars["Int"]>;
  /** Only used for actions. Only for actions verified in the Developer Portal. Determines the maximum number of verifications that a user can perform for this action. */
  max_verifications?: Maybe<Scalars["Int"]>;
  /** Friendly name given to an action in the Developer Portal. */
  name?: Maybe<Scalars["String"]>;
  privacy_policy_uri?: Maybe<Scalars["String"]>;
  /** a computed field listing how many redirect_uris are added */
  redirect_count?: Maybe<Scalars["Int"]>;
  status?: Maybe<Scalars["String"]>;
  terms_uri?: Maybe<Scalars["String"]>;
  updated_at?: Maybe<Scalars["timestamptz"]>;
};

/** order by min() on columns of table "action" */
export type Action_Min_Order_By = {
  /** Raw action value as passed by the dev to IDKit. */
  action?: InputMaybe<Order_By>;
  app_id?: InputMaybe<Order_By>;
  client_secret?: InputMaybe<Order_By>;
  created_at?: InputMaybe<Order_By>;
  creation_mode?: InputMaybe<Order_By>;
  description?: InputMaybe<Order_By>;
  /** Encoded and hashed value of app_id and action. Determines scope for uniqueness. Used for Semaphore ZKPs. */
  external_nullifier?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  /** Only for Sign in with World ID. Determines the maximum number of accounts a single person can have for the respective app. */
  max_accounts_per_user?: InputMaybe<Order_By>;
  /** Only used for actions. Only for actions verified in the Developer Portal. Determines the maximum number of verifications that a user can perform for this action. */
  max_verifications?: InputMaybe<Order_By>;
  /** Friendly name given to an action in the Developer Portal. */
  name?: InputMaybe<Order_By>;
  privacy_policy_uri?: InputMaybe<Order_By>;
  status?: InputMaybe<Order_By>;
  terms_uri?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
};

/** response of any mutation on the table "action" */
export type Action_Mutation_Response = {
  __typename?: "action_mutation_response";
  /** number of rows affected by the mutation */
  affected_rows: Scalars["Int"];
  /** data from the rows affected by the mutation */
  returning: Array<Action>;
};

/** input type for inserting object relation for remote table "action" */
export type Action_Obj_Rel_Insert_Input = {
  data: Action_Insert_Input;
  /** upsert condition */
  on_conflict?: InputMaybe<Action_On_Conflict>;
};

/** on_conflict condition type for table "action" */
export type Action_On_Conflict = {
  constraint: Action_Constraint;
  update_columns?: Array<Action_Update_Column>;
  where?: InputMaybe<Action_Bool_Exp>;
};

/** Ordering options when selecting data from "action". */
export type Action_Order_By = {
  action?: InputMaybe<Order_By>;
  app?: InputMaybe<App_Order_By>;
  app_id?: InputMaybe<Order_By>;
  client_secret?: InputMaybe<Order_By>;
  created_at?: InputMaybe<Order_By>;
  creation_mode?: InputMaybe<Order_By>;
  description?: InputMaybe<Order_By>;
  external_nullifier?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  kiosk_enabled?: InputMaybe<Order_By>;
  max_accounts_per_user?: InputMaybe<Order_By>;
  max_verifications?: InputMaybe<Order_By>;
  name?: InputMaybe<Order_By>;
  nullifiers_aggregate?: InputMaybe<Nullifier_Aggregate_Order_By>;
  privacy_policy_uri?: InputMaybe<Order_By>;
  redirect_count?: InputMaybe<Order_By>;
  redirects_aggregate?: InputMaybe<Redirect_Aggregate_Order_By>;
  status?: InputMaybe<Order_By>;
  terms_uri?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
};

/** primary key columns input for table: action */
export type Action_Pk_Columns_Input = {
  id: Scalars["String"];
};

/** select columns of table "action" */
export enum Action_Select_Column {
  /** column name */
  Action = "action",
  /** column name */
  AppId = "app_id",
  /** column name */
  ClientSecret = "client_secret",
  /** column name */
  CreatedAt = "created_at",
  /** column name */
  CreationMode = "creation_mode",
  /** column name */
  Description = "description",
  /** column name */
  ExternalNullifier = "external_nullifier",
  /** column name */
  Id = "id",
  /** column name */
  KioskEnabled = "kiosk_enabled",
  /** column name */
  MaxAccountsPerUser = "max_accounts_per_user",
  /** column name */
  MaxVerifications = "max_verifications",
  /** column name */
  Name = "name",
  /** column name */
  PrivacyPolicyUri = "privacy_policy_uri",
  /** column name */
  Status = "status",
  /** column name */
  TermsUri = "terms_uri",
  /** column name */
  UpdatedAt = "updated_at",
}

/** select "action_aggregate_bool_exp_bool_and_arguments_columns" columns of table "action" */
export enum Action_Select_Column_Action_Aggregate_Bool_Exp_Bool_And_Arguments_Columns {
  /** column name */
  KioskEnabled = "kiosk_enabled",
}

/** select "action_aggregate_bool_exp_bool_or_arguments_columns" columns of table "action" */
export enum Action_Select_Column_Action_Aggregate_Bool_Exp_Bool_Or_Arguments_Columns {
  /** column name */
  KioskEnabled = "kiosk_enabled",
}

/** input type for updating data in table "action" */
export type Action_Set_Input = {
  /** Raw action value as passed by the dev to IDKit. */
  action?: InputMaybe<Scalars["String"]>;
  app_id?: InputMaybe<Scalars["String"]>;
  client_secret?: InputMaybe<Scalars["String"]>;
  created_at?: InputMaybe<Scalars["timestamptz"]>;
  creation_mode?: InputMaybe<Scalars["String"]>;
  description?: InputMaybe<Scalars["String"]>;
  /** Encoded and hashed value of app_id and action. Determines scope for uniqueness. Used for Semaphore ZKPs. */
  external_nullifier?: InputMaybe<Scalars["String"]>;
  id?: InputMaybe<Scalars["String"]>;
  kiosk_enabled?: InputMaybe<Scalars["Boolean"]>;
  /** Only for Sign in with World ID. Determines the maximum number of accounts a single person can have for the respective app. */
  max_accounts_per_user?: InputMaybe<Scalars["Int"]>;
  /** Only used for actions. Only for actions verified in the Developer Portal. Determines the maximum number of verifications that a user can perform for this action. */
  max_verifications?: InputMaybe<Scalars["Int"]>;
  /** Friendly name given to an action in the Developer Portal. */
  name?: InputMaybe<Scalars["String"]>;
  privacy_policy_uri?: InputMaybe<Scalars["String"]>;
  status?: InputMaybe<Scalars["String"]>;
  terms_uri?: InputMaybe<Scalars["String"]>;
  updated_at?: InputMaybe<Scalars["timestamptz"]>;
};

export type Action_Stats_Args = {
  actionId?: InputMaybe<Scalars["String"]>;
  startsAt?: InputMaybe<Scalars["timestamptz"]>;
  timespan?: InputMaybe<Scalars["String"]>;
};

/** Returning value of action_stats function */
export type Action_Stats_Returning = {
  __typename?: "action_stats_returning";
  /** An object relationship */
  action: Action;
  action_id: Scalars["String"];
  date: Scalars["timestamptz"];
  unique_users: Scalars["numeric"];
  verifications: Scalars["numeric"];
};

export type Action_Stats_Returning_Aggregate = {
  __typename?: "action_stats_returning_aggregate";
  aggregate?: Maybe<Action_Stats_Returning_Aggregate_Fields>;
  nodes: Array<Action_Stats_Returning>;
};

/** aggregate fields of "action_stats_returning" */
export type Action_Stats_Returning_Aggregate_Fields = {
  __typename?: "action_stats_returning_aggregate_fields";
  avg?: Maybe<Action_Stats_Returning_Avg_Fields>;
  count: Scalars["Int"];
  max?: Maybe<Action_Stats_Returning_Max_Fields>;
  min?: Maybe<Action_Stats_Returning_Min_Fields>;
  stddev?: Maybe<Action_Stats_Returning_Stddev_Fields>;
  stddev_pop?: Maybe<Action_Stats_Returning_Stddev_Pop_Fields>;
  stddev_samp?: Maybe<Action_Stats_Returning_Stddev_Samp_Fields>;
  sum?: Maybe<Action_Stats_Returning_Sum_Fields>;
  var_pop?: Maybe<Action_Stats_Returning_Var_Pop_Fields>;
  var_samp?: Maybe<Action_Stats_Returning_Var_Samp_Fields>;
  variance?: Maybe<Action_Stats_Returning_Variance_Fields>;
};

/** aggregate fields of "action_stats_returning" */
export type Action_Stats_Returning_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Action_Stats_Returning_Select_Column>>;
  distinct?: InputMaybe<Scalars["Boolean"]>;
};

/** aggregate avg on columns */
export type Action_Stats_Returning_Avg_Fields = {
  __typename?: "action_stats_returning_avg_fields";
  unique_users?: Maybe<Scalars["Float"]>;
  verifications?: Maybe<Scalars["Float"]>;
};

/** Boolean expression to filter rows from the table "action_stats_returning". All fields are combined with a logical 'AND'. */
export type Action_Stats_Returning_Bool_Exp = {
  _and?: InputMaybe<Array<Action_Stats_Returning_Bool_Exp>>;
  _not?: InputMaybe<Action_Stats_Returning_Bool_Exp>;
  _or?: InputMaybe<Array<Action_Stats_Returning_Bool_Exp>>;
  action?: InputMaybe<Action_Bool_Exp>;
  action_id?: InputMaybe<String_Comparison_Exp>;
  date?: InputMaybe<Timestamptz_Comparison_Exp>;
  unique_users?: InputMaybe<Numeric_Comparison_Exp>;
  verifications?: InputMaybe<Numeric_Comparison_Exp>;
};

/** unique or primary key constraints on table "action_stats_returning" */
export enum Action_Stats_Returning_Constraint {
  /** unique or primary key constraint on columns "action_id" */
  ActionStatsReturningPkey = "action_stats_returning_pkey",
}

/** input type for incrementing numeric columns in table "action_stats_returning" */
export type Action_Stats_Returning_Inc_Input = {
  unique_users?: InputMaybe<Scalars["numeric"]>;
  verifications?: InputMaybe<Scalars["numeric"]>;
};

/** input type for inserting data into table "action_stats_returning" */
export type Action_Stats_Returning_Insert_Input = {
  action?: InputMaybe<Action_Obj_Rel_Insert_Input>;
  action_id?: InputMaybe<Scalars["String"]>;
  date?: InputMaybe<Scalars["timestamptz"]>;
  unique_users?: InputMaybe<Scalars["numeric"]>;
  verifications?: InputMaybe<Scalars["numeric"]>;
};

/** aggregate max on columns */
export type Action_Stats_Returning_Max_Fields = {
  __typename?: "action_stats_returning_max_fields";
  action_id?: Maybe<Scalars["String"]>;
  date?: Maybe<Scalars["timestamptz"]>;
  unique_users?: Maybe<Scalars["numeric"]>;
  verifications?: Maybe<Scalars["numeric"]>;
};

/** aggregate min on columns */
export type Action_Stats_Returning_Min_Fields = {
  __typename?: "action_stats_returning_min_fields";
  action_id?: Maybe<Scalars["String"]>;
  date?: Maybe<Scalars["timestamptz"]>;
  unique_users?: Maybe<Scalars["numeric"]>;
  verifications?: Maybe<Scalars["numeric"]>;
};

/** response of any mutation on the table "action_stats_returning" */
export type Action_Stats_Returning_Mutation_Response = {
  __typename?: "action_stats_returning_mutation_response";
  /** number of rows affected by the mutation */
  affected_rows: Scalars["Int"];
  /** data from the rows affected by the mutation */
  returning: Array<Action_Stats_Returning>;
};

/** on_conflict condition type for table "action_stats_returning" */
export type Action_Stats_Returning_On_Conflict = {
  constraint: Action_Stats_Returning_Constraint;
  update_columns?: Array<Action_Stats_Returning_Update_Column>;
  where?: InputMaybe<Action_Stats_Returning_Bool_Exp>;
};

/** Ordering options when selecting data from "action_stats_returning". */
export type Action_Stats_Returning_Order_By = {
  action?: InputMaybe<Action_Order_By>;
  action_id?: InputMaybe<Order_By>;
  date?: InputMaybe<Order_By>;
  unique_users?: InputMaybe<Order_By>;
  verifications?: InputMaybe<Order_By>;
};

/** primary key columns input for table: action_stats_returning */
export type Action_Stats_Returning_Pk_Columns_Input = {
  action_id: Scalars["String"];
};

/** select columns of table "action_stats_returning" */
export enum Action_Stats_Returning_Select_Column {
  /** column name */
  ActionId = "action_id",
  /** column name */
  Date = "date",
  /** column name */
  UniqueUsers = "unique_users",
  /** column name */
  Verifications = "verifications",
}

/** input type for updating data in table "action_stats_returning" */
export type Action_Stats_Returning_Set_Input = {
  action_id?: InputMaybe<Scalars["String"]>;
  date?: InputMaybe<Scalars["timestamptz"]>;
  unique_users?: InputMaybe<Scalars["numeric"]>;
  verifications?: InputMaybe<Scalars["numeric"]>;
};

/** aggregate stddev on columns */
export type Action_Stats_Returning_Stddev_Fields = {
  __typename?: "action_stats_returning_stddev_fields";
  unique_users?: Maybe<Scalars["Float"]>;
  verifications?: Maybe<Scalars["Float"]>;
};

/** aggregate stddev_pop on columns */
export type Action_Stats_Returning_Stddev_Pop_Fields = {
  __typename?: "action_stats_returning_stddev_pop_fields";
  unique_users?: Maybe<Scalars["Float"]>;
  verifications?: Maybe<Scalars["Float"]>;
};

/** aggregate stddev_samp on columns */
export type Action_Stats_Returning_Stddev_Samp_Fields = {
  __typename?: "action_stats_returning_stddev_samp_fields";
  unique_users?: Maybe<Scalars["Float"]>;
  verifications?: Maybe<Scalars["Float"]>;
};

/** Streaming cursor of the table "action_stats_returning" */
export type Action_Stats_Returning_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Action_Stats_Returning_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Action_Stats_Returning_Stream_Cursor_Value_Input = {
  action_id?: InputMaybe<Scalars["String"]>;
  date?: InputMaybe<Scalars["timestamptz"]>;
  unique_users?: InputMaybe<Scalars["numeric"]>;
  verifications?: InputMaybe<Scalars["numeric"]>;
};

/** aggregate sum on columns */
export type Action_Stats_Returning_Sum_Fields = {
  __typename?: "action_stats_returning_sum_fields";
  unique_users?: Maybe<Scalars["numeric"]>;
  verifications?: Maybe<Scalars["numeric"]>;
};

/** update columns of table "action_stats_returning" */
export enum Action_Stats_Returning_Update_Column {
  /** column name */
  ActionId = "action_id",
  /** column name */
  Date = "date",
  /** column name */
  UniqueUsers = "unique_users",
  /** column name */
  Verifications = "verifications",
}

export type Action_Stats_Returning_Updates = {
  /** increments the numeric columns with given value of the filtered values */
  _inc?: InputMaybe<Action_Stats_Returning_Inc_Input>;
  /** sets the columns of the filtered rows to the given values */
  _set?: InputMaybe<Action_Stats_Returning_Set_Input>;
  /** filter the rows which have to be updated */
  where: Action_Stats_Returning_Bool_Exp;
};

/** aggregate var_pop on columns */
export type Action_Stats_Returning_Var_Pop_Fields = {
  __typename?: "action_stats_returning_var_pop_fields";
  unique_users?: Maybe<Scalars["Float"]>;
  verifications?: Maybe<Scalars["Float"]>;
};

/** aggregate var_samp on columns */
export type Action_Stats_Returning_Var_Samp_Fields = {
  __typename?: "action_stats_returning_var_samp_fields";
  unique_users?: Maybe<Scalars["Float"]>;
  verifications?: Maybe<Scalars["Float"]>;
};

/** aggregate variance on columns */
export type Action_Stats_Returning_Variance_Fields = {
  __typename?: "action_stats_returning_variance_fields";
  unique_users?: Maybe<Scalars["Float"]>;
  verifications?: Maybe<Scalars["Float"]>;
};

/** aggregate stddev on columns */
export type Action_Stddev_Fields = {
  __typename?: "action_stddev_fields";
  /** Only for Sign in with World ID. Determines the maximum number of accounts a single person can have for the respective app. */
  max_accounts_per_user?: Maybe<Scalars["Float"]>;
  /** Only used for actions. Only for actions verified in the Developer Portal. Determines the maximum number of verifications that a user can perform for this action. */
  max_verifications?: Maybe<Scalars["Float"]>;
  /** a computed field listing how many redirect_uris are added */
  redirect_count?: Maybe<Scalars["Int"]>;
};

/** order by stddev() on columns of table "action" */
export type Action_Stddev_Order_By = {
  /** Only for Sign in with World ID. Determines the maximum number of accounts a single person can have for the respective app. */
  max_accounts_per_user?: InputMaybe<Order_By>;
  /** Only used for actions. Only for actions verified in the Developer Portal. Determines the maximum number of verifications that a user can perform for this action. */
  max_verifications?: InputMaybe<Order_By>;
};

/** aggregate stddev_pop on columns */
export type Action_Stddev_Pop_Fields = {
  __typename?: "action_stddev_pop_fields";
  /** Only for Sign in with World ID. Determines the maximum number of accounts a single person can have for the respective app. */
  max_accounts_per_user?: Maybe<Scalars["Float"]>;
  /** Only used for actions. Only for actions verified in the Developer Portal. Determines the maximum number of verifications that a user can perform for this action. */
  max_verifications?: Maybe<Scalars["Float"]>;
  /** a computed field listing how many redirect_uris are added */
  redirect_count?: Maybe<Scalars["Int"]>;
};

/** order by stddev_pop() on columns of table "action" */
export type Action_Stddev_Pop_Order_By = {
  /** Only for Sign in with World ID. Determines the maximum number of accounts a single person can have for the respective app. */
  max_accounts_per_user?: InputMaybe<Order_By>;
  /** Only used for actions. Only for actions verified in the Developer Portal. Determines the maximum number of verifications that a user can perform for this action. */
  max_verifications?: InputMaybe<Order_By>;
};

/** aggregate stddev_samp on columns */
export type Action_Stddev_Samp_Fields = {
  __typename?: "action_stddev_samp_fields";
  /** Only for Sign in with World ID. Determines the maximum number of accounts a single person can have for the respective app. */
  max_accounts_per_user?: Maybe<Scalars["Float"]>;
  /** Only used for actions. Only for actions verified in the Developer Portal. Determines the maximum number of verifications that a user can perform for this action. */
  max_verifications?: Maybe<Scalars["Float"]>;
  /** a computed field listing how many redirect_uris are added */
  redirect_count?: Maybe<Scalars["Int"]>;
};

/** order by stddev_samp() on columns of table "action" */
export type Action_Stddev_Samp_Order_By = {
  /** Only for Sign in with World ID. Determines the maximum number of accounts a single person can have for the respective app. */
  max_accounts_per_user?: InputMaybe<Order_By>;
  /** Only used for actions. Only for actions verified in the Developer Portal. Determines the maximum number of verifications that a user can perform for this action. */
  max_verifications?: InputMaybe<Order_By>;
};

/** Streaming cursor of the table "action" */
export type Action_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Action_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Action_Stream_Cursor_Value_Input = {
  /** Raw action value as passed by the dev to IDKit. */
  action?: InputMaybe<Scalars["String"]>;
  app_id?: InputMaybe<Scalars["String"]>;
  client_secret?: InputMaybe<Scalars["String"]>;
  created_at?: InputMaybe<Scalars["timestamptz"]>;
  creation_mode?: InputMaybe<Scalars["String"]>;
  description?: InputMaybe<Scalars["String"]>;
  /** Encoded and hashed value of app_id and action. Determines scope for uniqueness. Used for Semaphore ZKPs. */
  external_nullifier?: InputMaybe<Scalars["String"]>;
  id?: InputMaybe<Scalars["String"]>;
  kiosk_enabled?: InputMaybe<Scalars["Boolean"]>;
  /** Only for Sign in with World ID. Determines the maximum number of accounts a single person can have for the respective app. */
  max_accounts_per_user?: InputMaybe<Scalars["Int"]>;
  /** Only used for actions. Only for actions verified in the Developer Portal. Determines the maximum number of verifications that a user can perform for this action. */
  max_verifications?: InputMaybe<Scalars["Int"]>;
  /** Friendly name given to an action in the Developer Portal. */
  name?: InputMaybe<Scalars["String"]>;
  privacy_policy_uri?: InputMaybe<Scalars["String"]>;
  status?: InputMaybe<Scalars["String"]>;
  terms_uri?: InputMaybe<Scalars["String"]>;
  updated_at?: InputMaybe<Scalars["timestamptz"]>;
};

/** aggregate sum on columns */
export type Action_Sum_Fields = {
  __typename?: "action_sum_fields";
  /** Only for Sign in with World ID. Determines the maximum number of accounts a single person can have for the respective app. */
  max_accounts_per_user?: Maybe<Scalars["Int"]>;
  /** Only used for actions. Only for actions verified in the Developer Portal. Determines the maximum number of verifications that a user can perform for this action. */
  max_verifications?: Maybe<Scalars["Int"]>;
  /** a computed field listing how many redirect_uris are added */
  redirect_count?: Maybe<Scalars["Int"]>;
};

/** order by sum() on columns of table "action" */
export type Action_Sum_Order_By = {
  /** Only for Sign in with World ID. Determines the maximum number of accounts a single person can have for the respective app. */
  max_accounts_per_user?: InputMaybe<Order_By>;
  /** Only used for actions. Only for actions verified in the Developer Portal. Determines the maximum number of verifications that a user can perform for this action. */
  max_verifications?: InputMaybe<Order_By>;
};

/** update columns of table "action" */
export enum Action_Update_Column {
  /** column name */
  Action = "action",
  /** column name */
  AppId = "app_id",
  /** column name */
  ClientSecret = "client_secret",
  /** column name */
  CreatedAt = "created_at",
  /** column name */
  CreationMode = "creation_mode",
  /** column name */
  Description = "description",
  /** column name */
  ExternalNullifier = "external_nullifier",
  /** column name */
  Id = "id",
  /** column name */
  KioskEnabled = "kiosk_enabled",
  /** column name */
  MaxAccountsPerUser = "max_accounts_per_user",
  /** column name */
  MaxVerifications = "max_verifications",
  /** column name */
  Name = "name",
  /** column name */
  PrivacyPolicyUri = "privacy_policy_uri",
  /** column name */
  Status = "status",
  /** column name */
  TermsUri = "terms_uri",
  /** column name */
  UpdatedAt = "updated_at",
}

export type Action_Updates = {
  /** increments the numeric columns with given value of the filtered values */
  _inc?: InputMaybe<Action_Inc_Input>;
  /** sets the columns of the filtered rows to the given values */
  _set?: InputMaybe<Action_Set_Input>;
  /** filter the rows which have to be updated */
  where: Action_Bool_Exp;
};

/** aggregate var_pop on columns */
export type Action_Var_Pop_Fields = {
  __typename?: "action_var_pop_fields";
  /** Only for Sign in with World ID. Determines the maximum number of accounts a single person can have for the respective app. */
  max_accounts_per_user?: Maybe<Scalars["Float"]>;
  /** Only used for actions. Only for actions verified in the Developer Portal. Determines the maximum number of verifications that a user can perform for this action. */
  max_verifications?: Maybe<Scalars["Float"]>;
  /** a computed field listing how many redirect_uris are added */
  redirect_count?: Maybe<Scalars["Int"]>;
};

/** order by var_pop() on columns of table "action" */
export type Action_Var_Pop_Order_By = {
  /** Only for Sign in with World ID. Determines the maximum number of accounts a single person can have for the respective app. */
  max_accounts_per_user?: InputMaybe<Order_By>;
  /** Only used for actions. Only for actions verified in the Developer Portal. Determines the maximum number of verifications that a user can perform for this action. */
  max_verifications?: InputMaybe<Order_By>;
};

/** aggregate var_samp on columns */
export type Action_Var_Samp_Fields = {
  __typename?: "action_var_samp_fields";
  /** Only for Sign in with World ID. Determines the maximum number of accounts a single person can have for the respective app. */
  max_accounts_per_user?: Maybe<Scalars["Float"]>;
  /** Only used for actions. Only for actions verified in the Developer Portal. Determines the maximum number of verifications that a user can perform for this action. */
  max_verifications?: Maybe<Scalars["Float"]>;
  /** a computed field listing how many redirect_uris are added */
  redirect_count?: Maybe<Scalars["Int"]>;
};

/** order by var_samp() on columns of table "action" */
export type Action_Var_Samp_Order_By = {
  /** Only for Sign in with World ID. Determines the maximum number of accounts a single person can have for the respective app. */
  max_accounts_per_user?: InputMaybe<Order_By>;
  /** Only used for actions. Only for actions verified in the Developer Portal. Determines the maximum number of verifications that a user can perform for this action. */
  max_verifications?: InputMaybe<Order_By>;
};

/** aggregate variance on columns */
export type Action_Variance_Fields = {
  __typename?: "action_variance_fields";
  /** Only for Sign in with World ID. Determines the maximum number of accounts a single person can have for the respective app. */
  max_accounts_per_user?: Maybe<Scalars["Float"]>;
  /** Only used for actions. Only for actions verified in the Developer Portal. Determines the maximum number of verifications that a user can perform for this action. */
  max_verifications?: Maybe<Scalars["Float"]>;
  /** a computed field listing how many redirect_uris are added */
  redirect_count?: Maybe<Scalars["Int"]>;
};

/** order by variance() on columns of table "action" */
export type Action_Variance_Order_By = {
  /** Only for Sign in with World ID. Determines the maximum number of accounts a single person can have for the respective app. */
  max_accounts_per_user?: InputMaybe<Order_By>;
  /** Only used for actions. Only for actions verified in the Developer Portal. Determines the maximum number of verifications that a user can perform for this action. */
  max_verifications?: InputMaybe<Order_By>;
};

/** columns and relationships of "api_key" */
export type Api_Key = {
  __typename?: "api_key";
  api_key: Scalars["String"];
  created_at: Scalars["timestamptz"];
  id: Scalars["String"];
  is_active: Scalars["Boolean"];
  name: Scalars["String"];
  /** An object relationship */
  team: Team;
  team_id: Scalars["String"];
  updated_at: Scalars["timestamptz"];
};

/** aggregated selection of "api_key" */
export type Api_Key_Aggregate = {
  __typename?: "api_key_aggregate";
  aggregate?: Maybe<Api_Key_Aggregate_Fields>;
  nodes: Array<Api_Key>;
};

export type Api_Key_Aggregate_Bool_Exp = {
  bool_and?: InputMaybe<Api_Key_Aggregate_Bool_Exp_Bool_And>;
  bool_or?: InputMaybe<Api_Key_Aggregate_Bool_Exp_Bool_Or>;
  count?: InputMaybe<Api_Key_Aggregate_Bool_Exp_Count>;
};

export type Api_Key_Aggregate_Bool_Exp_Bool_And = {
  arguments: Api_Key_Select_Column_Api_Key_Aggregate_Bool_Exp_Bool_And_Arguments_Columns;
  distinct?: InputMaybe<Scalars["Boolean"]>;
  filter?: InputMaybe<Api_Key_Bool_Exp>;
  predicate: Boolean_Comparison_Exp;
};

export type Api_Key_Aggregate_Bool_Exp_Bool_Or = {
  arguments: Api_Key_Select_Column_Api_Key_Aggregate_Bool_Exp_Bool_Or_Arguments_Columns;
  distinct?: InputMaybe<Scalars["Boolean"]>;
  filter?: InputMaybe<Api_Key_Bool_Exp>;
  predicate: Boolean_Comparison_Exp;
};

export type Api_Key_Aggregate_Bool_Exp_Count = {
  arguments?: InputMaybe<Array<Api_Key_Select_Column>>;
  distinct?: InputMaybe<Scalars["Boolean"]>;
  filter?: InputMaybe<Api_Key_Bool_Exp>;
  predicate: Int_Comparison_Exp;
};

/** aggregate fields of "api_key" */
export type Api_Key_Aggregate_Fields = {
  __typename?: "api_key_aggregate_fields";
  count: Scalars["Int"];
  max?: Maybe<Api_Key_Max_Fields>;
  min?: Maybe<Api_Key_Min_Fields>;
};

/** aggregate fields of "api_key" */
export type Api_Key_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Api_Key_Select_Column>>;
  distinct?: InputMaybe<Scalars["Boolean"]>;
};

/** order by aggregate values of table "api_key" */
export type Api_Key_Aggregate_Order_By = {
  count?: InputMaybe<Order_By>;
  max?: InputMaybe<Api_Key_Max_Order_By>;
  min?: InputMaybe<Api_Key_Min_Order_By>;
};

/** input type for inserting array relation for remote table "api_key" */
export type Api_Key_Arr_Rel_Insert_Input = {
  data: Array<Api_Key_Insert_Input>;
  /** upsert condition */
  on_conflict?: InputMaybe<Api_Key_On_Conflict>;
};

/** Boolean expression to filter rows from the table "api_key". All fields are combined with a logical 'AND'. */
export type Api_Key_Bool_Exp = {
  _and?: InputMaybe<Array<Api_Key_Bool_Exp>>;
  _not?: InputMaybe<Api_Key_Bool_Exp>;
  _or?: InputMaybe<Array<Api_Key_Bool_Exp>>;
  api_key?: InputMaybe<String_Comparison_Exp>;
  created_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  id?: InputMaybe<String_Comparison_Exp>;
  is_active?: InputMaybe<Boolean_Comparison_Exp>;
  name?: InputMaybe<String_Comparison_Exp>;
  team?: InputMaybe<Team_Bool_Exp>;
  team_id?: InputMaybe<String_Comparison_Exp>;
  updated_at?: InputMaybe<Timestamptz_Comparison_Exp>;
};

/** unique or primary key constraints on table "api_key" */
export enum Api_Key_Constraint {
  /** unique or primary key constraint on columns "id" */
  ApiKeyPkey = "api_key_pkey",
}

/** input type for inserting data into table "api_key" */
export type Api_Key_Insert_Input = {
  api_key?: InputMaybe<Scalars["String"]>;
  created_at?: InputMaybe<Scalars["timestamptz"]>;
  id?: InputMaybe<Scalars["String"]>;
  is_active?: InputMaybe<Scalars["Boolean"]>;
  name?: InputMaybe<Scalars["String"]>;
  team?: InputMaybe<Team_Obj_Rel_Insert_Input>;
  team_id?: InputMaybe<Scalars["String"]>;
  updated_at?: InputMaybe<Scalars["timestamptz"]>;
};

/** aggregate max on columns */
export type Api_Key_Max_Fields = {
  __typename?: "api_key_max_fields";
  api_key?: Maybe<Scalars["String"]>;
  created_at?: Maybe<Scalars["timestamptz"]>;
  id?: Maybe<Scalars["String"]>;
  name?: Maybe<Scalars["String"]>;
  team_id?: Maybe<Scalars["String"]>;
  updated_at?: Maybe<Scalars["timestamptz"]>;
};

/** order by max() on columns of table "api_key" */
export type Api_Key_Max_Order_By = {
  api_key?: InputMaybe<Order_By>;
  created_at?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  name?: InputMaybe<Order_By>;
  team_id?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
};

/** aggregate min on columns */
export type Api_Key_Min_Fields = {
  __typename?: "api_key_min_fields";
  api_key?: Maybe<Scalars["String"]>;
  created_at?: Maybe<Scalars["timestamptz"]>;
  id?: Maybe<Scalars["String"]>;
  name?: Maybe<Scalars["String"]>;
  team_id?: Maybe<Scalars["String"]>;
  updated_at?: Maybe<Scalars["timestamptz"]>;
};

/** order by min() on columns of table "api_key" */
export type Api_Key_Min_Order_By = {
  api_key?: InputMaybe<Order_By>;
  created_at?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  name?: InputMaybe<Order_By>;
  team_id?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
};

/** response of any mutation on the table "api_key" */
export type Api_Key_Mutation_Response = {
  __typename?: "api_key_mutation_response";
  /** number of rows affected by the mutation */
  affected_rows: Scalars["Int"];
  /** data from the rows affected by the mutation */
  returning: Array<Api_Key>;
};

/** on_conflict condition type for table "api_key" */
export type Api_Key_On_Conflict = {
  constraint: Api_Key_Constraint;
  update_columns?: Array<Api_Key_Update_Column>;
  where?: InputMaybe<Api_Key_Bool_Exp>;
};

/** Ordering options when selecting data from "api_key". */
export type Api_Key_Order_By = {
  api_key?: InputMaybe<Order_By>;
  created_at?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  is_active?: InputMaybe<Order_By>;
  name?: InputMaybe<Order_By>;
  team?: InputMaybe<Team_Order_By>;
  team_id?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
};

/** primary key columns input for table: api_key */
export type Api_Key_Pk_Columns_Input = {
  id: Scalars["String"];
};

/** select columns of table "api_key" */
export enum Api_Key_Select_Column {
  /** column name */
  ApiKey = "api_key",
  /** column name */
  CreatedAt = "created_at",
  /** column name */
  Id = "id",
  /** column name */
  IsActive = "is_active",
  /** column name */
  Name = "name",
  /** column name */
  TeamId = "team_id",
  /** column name */
  UpdatedAt = "updated_at",
}

/** select "api_key_aggregate_bool_exp_bool_and_arguments_columns" columns of table "api_key" */
export enum Api_Key_Select_Column_Api_Key_Aggregate_Bool_Exp_Bool_And_Arguments_Columns {
  /** column name */
  IsActive = "is_active",
}

/** select "api_key_aggregate_bool_exp_bool_or_arguments_columns" columns of table "api_key" */
export enum Api_Key_Select_Column_Api_Key_Aggregate_Bool_Exp_Bool_Or_Arguments_Columns {
  /** column name */
  IsActive = "is_active",
}

/** input type for updating data in table "api_key" */
export type Api_Key_Set_Input = {
  api_key?: InputMaybe<Scalars["String"]>;
  created_at?: InputMaybe<Scalars["timestamptz"]>;
  id?: InputMaybe<Scalars["String"]>;
  is_active?: InputMaybe<Scalars["Boolean"]>;
  name?: InputMaybe<Scalars["String"]>;
  team_id?: InputMaybe<Scalars["String"]>;
  updated_at?: InputMaybe<Scalars["timestamptz"]>;
};

/** Streaming cursor of the table "api_key" */
export type Api_Key_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Api_Key_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Api_Key_Stream_Cursor_Value_Input = {
  api_key?: InputMaybe<Scalars["String"]>;
  created_at?: InputMaybe<Scalars["timestamptz"]>;
  id?: InputMaybe<Scalars["String"]>;
  is_active?: InputMaybe<Scalars["Boolean"]>;
  name?: InputMaybe<Scalars["String"]>;
  team_id?: InputMaybe<Scalars["String"]>;
  updated_at?: InputMaybe<Scalars["timestamptz"]>;
};

/** update columns of table "api_key" */
export enum Api_Key_Update_Column {
  /** column name */
  ApiKey = "api_key",
  /** column name */
  CreatedAt = "created_at",
  /** column name */
  Id = "id",
  /** column name */
  IsActive = "is_active",
  /** column name */
  Name = "name",
  /** column name */
  TeamId = "team_id",
  /** column name */
  UpdatedAt = "updated_at",
}

export type Api_Key_Updates = {
  /** sets the columns of the filtered rows to the given values */
  _set?: InputMaybe<Api_Key_Set_Input>;
  /** filter the rows which have to be updated */
  where: Api_Key_Bool_Exp;
};

/** columns and relationships of "app" */
export type App = {
  __typename?: "app";
  /** An array relationship */
  actions: Array<Action>;
  /** An aggregate relationship */
  actions_aggregate: Action_Aggregate;
  /** An array relationship */
  app_metadata: Array<App_Metadata>;
  /** An aggregate relationship */
  app_metadata_aggregate: App_Metadata_Aggregate;
  created_at: Scalars["timestamptz"];
  description_internal: Scalars["String"];
  engine: Scalars["String"];
  id: Scalars["String"];
  is_archived: Scalars["Boolean"];
  is_staging: Scalars["Boolean"];
  logo_url: Scalars["String"];
  name: Scalars["String"];
  status: Scalars["String"];
  /** An object relationship */
  team: Team;
  team_id: Scalars["String"];
  updated_at: Scalars["timestamptz"];
  verified_at?: Maybe<Scalars["timestamptz"]>;
};

/** columns and relationships of "app" */
export type AppActionsArgs = {
  distinct_on?: InputMaybe<Array<Action_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Action_Order_By>>;
  where?: InputMaybe<Action_Bool_Exp>;
};

/** columns and relationships of "app" */
export type AppActions_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Action_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Action_Order_By>>;
  where?: InputMaybe<Action_Bool_Exp>;
};

/** columns and relationships of "app" */
export type AppApp_MetadataArgs = {
  distinct_on?: InputMaybe<Array<App_Metadata_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<App_Metadata_Order_By>>;
  where?: InputMaybe<App_Metadata_Bool_Exp>;
};

/** columns and relationships of "app" */
export type AppApp_Metadata_AggregateArgs = {
  distinct_on?: InputMaybe<Array<App_Metadata_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<App_Metadata_Order_By>>;
  where?: InputMaybe<App_Metadata_Bool_Exp>;
};

/** aggregated selection of "app" */
export type App_Aggregate = {
  __typename?: "app_aggregate";
  aggregate?: Maybe<App_Aggregate_Fields>;
  nodes: Array<App>;
};

export type App_Aggregate_Bool_Exp = {
  bool_and?: InputMaybe<App_Aggregate_Bool_Exp_Bool_And>;
  bool_or?: InputMaybe<App_Aggregate_Bool_Exp_Bool_Or>;
  count?: InputMaybe<App_Aggregate_Bool_Exp_Count>;
};

export type App_Aggregate_Bool_Exp_Bool_And = {
  arguments: App_Select_Column_App_Aggregate_Bool_Exp_Bool_And_Arguments_Columns;
  distinct?: InputMaybe<Scalars["Boolean"]>;
  filter?: InputMaybe<App_Bool_Exp>;
  predicate: Boolean_Comparison_Exp;
};

export type App_Aggregate_Bool_Exp_Bool_Or = {
  arguments: App_Select_Column_App_Aggregate_Bool_Exp_Bool_Or_Arguments_Columns;
  distinct?: InputMaybe<Scalars["Boolean"]>;
  filter?: InputMaybe<App_Bool_Exp>;
  predicate: Boolean_Comparison_Exp;
};

export type App_Aggregate_Bool_Exp_Count = {
  arguments?: InputMaybe<Array<App_Select_Column>>;
  distinct?: InputMaybe<Scalars["Boolean"]>;
  filter?: InputMaybe<App_Bool_Exp>;
  predicate: Int_Comparison_Exp;
};

/** aggregate fields of "app" */
export type App_Aggregate_Fields = {
  __typename?: "app_aggregate_fields";
  count: Scalars["Int"];
  max?: Maybe<App_Max_Fields>;
  min?: Maybe<App_Min_Fields>;
};

/** aggregate fields of "app" */
export type App_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<App_Select_Column>>;
  distinct?: InputMaybe<Scalars["Boolean"]>;
};

/** order by aggregate values of table "app" */
export type App_Aggregate_Order_By = {
  count?: InputMaybe<Order_By>;
  max?: InputMaybe<App_Max_Order_By>;
  min?: InputMaybe<App_Min_Order_By>;
};

/** input type for inserting array relation for remote table "app" */
export type App_Arr_Rel_Insert_Input = {
  data: Array<App_Insert_Input>;
  /** upsert condition */
  on_conflict?: InputMaybe<App_On_Conflict>;
};

/** Boolean expression to filter rows from the table "app". All fields are combined with a logical 'AND'. */
export type App_Bool_Exp = {
  _and?: InputMaybe<Array<App_Bool_Exp>>;
  _not?: InputMaybe<App_Bool_Exp>;
  _or?: InputMaybe<Array<App_Bool_Exp>>;
  actions?: InputMaybe<Action_Bool_Exp>;
  actions_aggregate?: InputMaybe<Action_Aggregate_Bool_Exp>;
  app_metadata?: InputMaybe<App_Metadata_Bool_Exp>;
  app_metadata_aggregate?: InputMaybe<App_Metadata_Aggregate_Bool_Exp>;
  created_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  description_internal?: InputMaybe<String_Comparison_Exp>;
  engine?: InputMaybe<String_Comparison_Exp>;
  id?: InputMaybe<String_Comparison_Exp>;
  is_archived?: InputMaybe<Boolean_Comparison_Exp>;
  is_staging?: InputMaybe<Boolean_Comparison_Exp>;
  logo_url?: InputMaybe<String_Comparison_Exp>;
  name?: InputMaybe<String_Comparison_Exp>;
  status?: InputMaybe<String_Comparison_Exp>;
  team?: InputMaybe<Team_Bool_Exp>;
  team_id?: InputMaybe<String_Comparison_Exp>;
  updated_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  verified_at?: InputMaybe<Timestamptz_Comparison_Exp>;
};

/** unique or primary key constraints on table "app" */
export enum App_Constraint {
  /** unique or primary key constraint on columns "id" */
  AppPkey = "app_pkey",
}

/** input type for inserting data into table "app" */
export type App_Insert_Input = {
  actions?: InputMaybe<Action_Arr_Rel_Insert_Input>;
  app_metadata?: InputMaybe<App_Metadata_Arr_Rel_Insert_Input>;
  created_at?: InputMaybe<Scalars["timestamptz"]>;
  description_internal?: InputMaybe<Scalars["String"]>;
  engine?: InputMaybe<Scalars["String"]>;
  id?: InputMaybe<Scalars["String"]>;
  is_archived?: InputMaybe<Scalars["Boolean"]>;
  is_staging?: InputMaybe<Scalars["Boolean"]>;
  logo_url?: InputMaybe<Scalars["String"]>;
  name?: InputMaybe<Scalars["String"]>;
  status?: InputMaybe<Scalars["String"]>;
  team?: InputMaybe<Team_Obj_Rel_Insert_Input>;
  team_id?: InputMaybe<Scalars["String"]>;
  updated_at?: InputMaybe<Scalars["timestamptz"]>;
  verified_at?: InputMaybe<Scalars["timestamptz"]>;
};

/** aggregate max on columns */
export type App_Max_Fields = {
  __typename?: "app_max_fields";
  created_at?: Maybe<Scalars["timestamptz"]>;
  description_internal?: Maybe<Scalars["String"]>;
  engine?: Maybe<Scalars["String"]>;
  id?: Maybe<Scalars["String"]>;
  logo_url?: Maybe<Scalars["String"]>;
  name?: Maybe<Scalars["String"]>;
  status?: Maybe<Scalars["String"]>;
  team_id?: Maybe<Scalars["String"]>;
  updated_at?: Maybe<Scalars["timestamptz"]>;
  verified_at?: Maybe<Scalars["timestamptz"]>;
};

/** order by max() on columns of table "app" */
export type App_Max_Order_By = {
  created_at?: InputMaybe<Order_By>;
  description_internal?: InputMaybe<Order_By>;
  engine?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  logo_url?: InputMaybe<Order_By>;
  name?: InputMaybe<Order_By>;
  status?: InputMaybe<Order_By>;
  team_id?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
  verified_at?: InputMaybe<Order_By>;
};

/** columns and relationships of "app_metadata" */
export type App_Metadata = {
  __typename?: "app_metadata";
  /** An object relationship */
  app: App;
  app_id: Scalars["String"];
  app_mode: Scalars["String"];
  app_website_url: Scalars["String"];
  category: Scalars["String"];
  created_at: Scalars["timestamptz"];
  description: Scalars["String"];
  hero_image_url: Scalars["String"];
  id: Scalars["String"];
  integration_url: Scalars["String"];
  is_developer_allow_listing: Scalars["Boolean"];
  is_reviewer_app_store_approved: Scalars["Boolean"];
  is_reviewer_world_app_approved: Scalars["Boolean"];
  is_row_verified: Scalars["Boolean"];
  logo_img_url: Scalars["String"];
  name: Scalars["String"];
  review_message: Scalars["String"];
  reviewed_by: Scalars["String"];
  showcase_img_urls?: Maybe<Scalars["_text"]>;
  source_code_url: Scalars["String"];
  support_email?: Maybe<Scalars["String"]>;
  supported_countries?: Maybe<Scalars["_text"]>;
  updated_at: Scalars["timestamptz"];
  verification_status: Scalars["String"];
  verified_at?: Maybe<Scalars["timestamptz"]>;
  whitelisted_addresses?: Maybe<Scalars["_text"]>;
  world_app_button_text: Scalars["String"];
  world_app_description: Scalars["String"];
};

/** aggregated selection of "app_metadata" */
export type App_Metadata_Aggregate = {
  __typename?: "app_metadata_aggregate";
  aggregate?: Maybe<App_Metadata_Aggregate_Fields>;
  nodes: Array<App_Metadata>;
};

export type App_Metadata_Aggregate_Bool_Exp = {
  bool_and?: InputMaybe<App_Metadata_Aggregate_Bool_Exp_Bool_And>;
  bool_or?: InputMaybe<App_Metadata_Aggregate_Bool_Exp_Bool_Or>;
  count?: InputMaybe<App_Metadata_Aggregate_Bool_Exp_Count>;
};

export type App_Metadata_Aggregate_Bool_Exp_Bool_And = {
  arguments: App_Metadata_Select_Column_App_Metadata_Aggregate_Bool_Exp_Bool_And_Arguments_Columns;
  distinct?: InputMaybe<Scalars["Boolean"]>;
  filter?: InputMaybe<App_Metadata_Bool_Exp>;
  predicate: Boolean_Comparison_Exp;
};

export type App_Metadata_Aggregate_Bool_Exp_Bool_Or = {
  arguments: App_Metadata_Select_Column_App_Metadata_Aggregate_Bool_Exp_Bool_Or_Arguments_Columns;
  distinct?: InputMaybe<Scalars["Boolean"]>;
  filter?: InputMaybe<App_Metadata_Bool_Exp>;
  predicate: Boolean_Comparison_Exp;
};

export type App_Metadata_Aggregate_Bool_Exp_Count = {
  arguments?: InputMaybe<Array<App_Metadata_Select_Column>>;
  distinct?: InputMaybe<Scalars["Boolean"]>;
  filter?: InputMaybe<App_Metadata_Bool_Exp>;
  predicate: Int_Comparison_Exp;
};

/** aggregate fields of "app_metadata" */
export type App_Metadata_Aggregate_Fields = {
  __typename?: "app_metadata_aggregate_fields";
  count: Scalars["Int"];
  max?: Maybe<App_Metadata_Max_Fields>;
  min?: Maybe<App_Metadata_Min_Fields>;
};

/** aggregate fields of "app_metadata" */
export type App_Metadata_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<App_Metadata_Select_Column>>;
  distinct?: InputMaybe<Scalars["Boolean"]>;
};

/** order by aggregate values of table "app_metadata" */
export type App_Metadata_Aggregate_Order_By = {
  count?: InputMaybe<Order_By>;
  max?: InputMaybe<App_Metadata_Max_Order_By>;
  min?: InputMaybe<App_Metadata_Min_Order_By>;
};

/** input type for inserting array relation for remote table "app_metadata" */
export type App_Metadata_Arr_Rel_Insert_Input = {
  data: Array<App_Metadata_Insert_Input>;
  /** upsert condition */
  on_conflict?: InputMaybe<App_Metadata_On_Conflict>;
};

/** Boolean expression to filter rows from the table "app_metadata". All fields are combined with a logical 'AND'. */
export type App_Metadata_Bool_Exp = {
  _and?: InputMaybe<Array<App_Metadata_Bool_Exp>>;
  _not?: InputMaybe<App_Metadata_Bool_Exp>;
  _or?: InputMaybe<Array<App_Metadata_Bool_Exp>>;
  app?: InputMaybe<App_Bool_Exp>;
  app_id?: InputMaybe<String_Comparison_Exp>;
  app_mode?: InputMaybe<String_Comparison_Exp>;
  app_website_url?: InputMaybe<String_Comparison_Exp>;
  category?: InputMaybe<String_Comparison_Exp>;
  created_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  description?: InputMaybe<String_Comparison_Exp>;
  hero_image_url?: InputMaybe<String_Comparison_Exp>;
  id?: InputMaybe<String_Comparison_Exp>;
  integration_url?: InputMaybe<String_Comparison_Exp>;
  is_developer_allow_listing?: InputMaybe<Boolean_Comparison_Exp>;
  is_reviewer_app_store_approved?: InputMaybe<Boolean_Comparison_Exp>;
  is_reviewer_world_app_approved?: InputMaybe<Boolean_Comparison_Exp>;
  is_row_verified?: InputMaybe<Boolean_Comparison_Exp>;
  logo_img_url?: InputMaybe<String_Comparison_Exp>;
  name?: InputMaybe<String_Comparison_Exp>;
  review_message?: InputMaybe<String_Comparison_Exp>;
  reviewed_by?: InputMaybe<String_Comparison_Exp>;
  showcase_img_urls?: InputMaybe<_Text_Comparison_Exp>;
  source_code_url?: InputMaybe<String_Comparison_Exp>;
  support_email?: InputMaybe<String_Comparison_Exp>;
  supported_countries?: InputMaybe<_Text_Comparison_Exp>;
  updated_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  verification_status?: InputMaybe<String_Comparison_Exp>;
  verified_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  whitelisted_addresses?: InputMaybe<_Text_Comparison_Exp>;
  world_app_button_text?: InputMaybe<String_Comparison_Exp>;
  world_app_description?: InputMaybe<String_Comparison_Exp>;
};

/** unique or primary key constraints on table "app_metadata" */
export enum App_Metadata_Constraint {
  /** unique or primary key constraint on columns "app_id", "is_row_verified" */
  AppMetadataAppIdIsRowVerifiedKey = "app_metadata_app_id_is_row_verified_key",
  /** unique or primary key constraint on columns "id" */
  AppMetadataPkey = "app_metadata_pkey",
  /** unique or primary key constraint on columns "app_id" */
  UniqueVerifiedAppId = "unique_verified_app_id",
}

/** input type for inserting data into table "app_metadata" */
export type App_Metadata_Insert_Input = {
  app?: InputMaybe<App_Obj_Rel_Insert_Input>;
  app_id?: InputMaybe<Scalars["String"]>;
  app_mode?: InputMaybe<Scalars["String"]>;
  app_website_url?: InputMaybe<Scalars["String"]>;
  category?: InputMaybe<Scalars["String"]>;
  created_at?: InputMaybe<Scalars["timestamptz"]>;
  description?: InputMaybe<Scalars["String"]>;
  hero_image_url?: InputMaybe<Scalars["String"]>;
  id?: InputMaybe<Scalars["String"]>;
  integration_url?: InputMaybe<Scalars["String"]>;
  is_developer_allow_listing?: InputMaybe<Scalars["Boolean"]>;
  is_reviewer_app_store_approved?: InputMaybe<Scalars["Boolean"]>;
  is_reviewer_world_app_approved?: InputMaybe<Scalars["Boolean"]>;
  is_row_verified?: InputMaybe<Scalars["Boolean"]>;
  logo_img_url?: InputMaybe<Scalars["String"]>;
  name?: InputMaybe<Scalars["String"]>;
  review_message?: InputMaybe<Scalars["String"]>;
  reviewed_by?: InputMaybe<Scalars["String"]>;
  showcase_img_urls?: InputMaybe<Scalars["_text"]>;
  source_code_url?: InputMaybe<Scalars["String"]>;
  support_email?: InputMaybe<Scalars["String"]>;
  supported_countries?: InputMaybe<Scalars["_text"]>;
  updated_at?: InputMaybe<Scalars["timestamptz"]>;
  verification_status?: InputMaybe<Scalars["String"]>;
  verified_at?: InputMaybe<Scalars["timestamptz"]>;
  whitelisted_addresses?: InputMaybe<Scalars["_text"]>;
  world_app_button_text?: InputMaybe<Scalars["String"]>;
  world_app_description?: InputMaybe<Scalars["String"]>;
};

/** aggregate max on columns */
export type App_Metadata_Max_Fields = {
  __typename?: "app_metadata_max_fields";
  app_id?: Maybe<Scalars["String"]>;
  app_mode?: Maybe<Scalars["String"]>;
  app_website_url?: Maybe<Scalars["String"]>;
  category?: Maybe<Scalars["String"]>;
  created_at?: Maybe<Scalars["timestamptz"]>;
  description?: Maybe<Scalars["String"]>;
  hero_image_url?: Maybe<Scalars["String"]>;
  id?: Maybe<Scalars["String"]>;
  integration_url?: Maybe<Scalars["String"]>;
  logo_img_url?: Maybe<Scalars["String"]>;
  name?: Maybe<Scalars["String"]>;
  review_message?: Maybe<Scalars["String"]>;
  reviewed_by?: Maybe<Scalars["String"]>;
  source_code_url?: Maybe<Scalars["String"]>;
  support_email?: Maybe<Scalars["String"]>;
  updated_at?: Maybe<Scalars["timestamptz"]>;
  verification_status?: Maybe<Scalars["String"]>;
  verified_at?: Maybe<Scalars["timestamptz"]>;
  world_app_button_text?: Maybe<Scalars["String"]>;
  world_app_description?: Maybe<Scalars["String"]>;
};

/** order by max() on columns of table "app_metadata" */
export type App_Metadata_Max_Order_By = {
  app_id?: InputMaybe<Order_By>;
  app_mode?: InputMaybe<Order_By>;
  app_website_url?: InputMaybe<Order_By>;
  category?: InputMaybe<Order_By>;
  created_at?: InputMaybe<Order_By>;
  description?: InputMaybe<Order_By>;
  hero_image_url?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  integration_url?: InputMaybe<Order_By>;
  logo_img_url?: InputMaybe<Order_By>;
  name?: InputMaybe<Order_By>;
  review_message?: InputMaybe<Order_By>;
  reviewed_by?: InputMaybe<Order_By>;
  source_code_url?: InputMaybe<Order_By>;
  support_email?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
  verification_status?: InputMaybe<Order_By>;
  verified_at?: InputMaybe<Order_By>;
  world_app_button_text?: InputMaybe<Order_By>;
  world_app_description?: InputMaybe<Order_By>;
};

/** aggregate min on columns */
export type App_Metadata_Min_Fields = {
  __typename?: "app_metadata_min_fields";
  app_id?: Maybe<Scalars["String"]>;
  app_mode?: Maybe<Scalars["String"]>;
  app_website_url?: Maybe<Scalars["String"]>;
  category?: Maybe<Scalars["String"]>;
  created_at?: Maybe<Scalars["timestamptz"]>;
  description?: Maybe<Scalars["String"]>;
  hero_image_url?: Maybe<Scalars["String"]>;
  id?: Maybe<Scalars["String"]>;
  integration_url?: Maybe<Scalars["String"]>;
  logo_img_url?: Maybe<Scalars["String"]>;
  name?: Maybe<Scalars["String"]>;
  review_message?: Maybe<Scalars["String"]>;
  reviewed_by?: Maybe<Scalars["String"]>;
  source_code_url?: Maybe<Scalars["String"]>;
  support_email?: Maybe<Scalars["String"]>;
  updated_at?: Maybe<Scalars["timestamptz"]>;
  verification_status?: Maybe<Scalars["String"]>;
  verified_at?: Maybe<Scalars["timestamptz"]>;
  world_app_button_text?: Maybe<Scalars["String"]>;
  world_app_description?: Maybe<Scalars["String"]>;
};

/** order by min() on columns of table "app_metadata" */
export type App_Metadata_Min_Order_By = {
  app_id?: InputMaybe<Order_By>;
  app_mode?: InputMaybe<Order_By>;
  app_website_url?: InputMaybe<Order_By>;
  category?: InputMaybe<Order_By>;
  created_at?: InputMaybe<Order_By>;
  description?: InputMaybe<Order_By>;
  hero_image_url?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  integration_url?: InputMaybe<Order_By>;
  logo_img_url?: InputMaybe<Order_By>;
  name?: InputMaybe<Order_By>;
  review_message?: InputMaybe<Order_By>;
  reviewed_by?: InputMaybe<Order_By>;
  source_code_url?: InputMaybe<Order_By>;
  support_email?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
  verification_status?: InputMaybe<Order_By>;
  verified_at?: InputMaybe<Order_By>;
  world_app_button_text?: InputMaybe<Order_By>;
  world_app_description?: InputMaybe<Order_By>;
};

/** response of any mutation on the table "app_metadata" */
export type App_Metadata_Mutation_Response = {
  __typename?: "app_metadata_mutation_response";
  /** number of rows affected by the mutation */
  affected_rows: Scalars["Int"];
  /** data from the rows affected by the mutation */
  returning: Array<App_Metadata>;
};

/** on_conflict condition type for table "app_metadata" */
export type App_Metadata_On_Conflict = {
  constraint: App_Metadata_Constraint;
  update_columns?: Array<App_Metadata_Update_Column>;
  where?: InputMaybe<App_Metadata_Bool_Exp>;
};

/** Ordering options when selecting data from "app_metadata". */
export type App_Metadata_Order_By = {
  app?: InputMaybe<App_Order_By>;
  app_id?: InputMaybe<Order_By>;
  app_mode?: InputMaybe<Order_By>;
  app_website_url?: InputMaybe<Order_By>;
  category?: InputMaybe<Order_By>;
  created_at?: InputMaybe<Order_By>;
  description?: InputMaybe<Order_By>;
  hero_image_url?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  integration_url?: InputMaybe<Order_By>;
  is_developer_allow_listing?: InputMaybe<Order_By>;
  is_reviewer_app_store_approved?: InputMaybe<Order_By>;
  is_reviewer_world_app_approved?: InputMaybe<Order_By>;
  is_row_verified?: InputMaybe<Order_By>;
  logo_img_url?: InputMaybe<Order_By>;
  name?: InputMaybe<Order_By>;
  review_message?: InputMaybe<Order_By>;
  reviewed_by?: InputMaybe<Order_By>;
  showcase_img_urls?: InputMaybe<Order_By>;
  source_code_url?: InputMaybe<Order_By>;
  support_email?: InputMaybe<Order_By>;
  supported_countries?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
  verification_status?: InputMaybe<Order_By>;
  verified_at?: InputMaybe<Order_By>;
  whitelisted_addresses?: InputMaybe<Order_By>;
  world_app_button_text?: InputMaybe<Order_By>;
  world_app_description?: InputMaybe<Order_By>;
};

/** primary key columns input for table: app_metadata */
export type App_Metadata_Pk_Columns_Input = {
  id: Scalars["String"];
};

/** select columns of table "app_metadata" */
export enum App_Metadata_Select_Column {
  /** column name */
  AppId = "app_id",
  /** column name */
  AppMode = "app_mode",
  /** column name */
  AppWebsiteUrl = "app_website_url",
  /** column name */
  Category = "category",
  /** column name */
  CreatedAt = "created_at",
  /** column name */
  Description = "description",
  /** column name */
  HeroImageUrl = "hero_image_url",
  /** column name */
  Id = "id",
  /** column name */
  IntegrationUrl = "integration_url",
  /** column name */
  IsDeveloperAllowListing = "is_developer_allow_listing",
  /** column name */
  IsReviewerAppStoreApproved = "is_reviewer_app_store_approved",
  /** column name */
  IsReviewerWorldAppApproved = "is_reviewer_world_app_approved",
  /** column name */
  IsRowVerified = "is_row_verified",
  /** column name */
  LogoImgUrl = "logo_img_url",
  /** column name */
  Name = "name",
  /** column name */
  ReviewMessage = "review_message",
  /** column name */
  ReviewedBy = "reviewed_by",
  /** column name */
  ShowcaseImgUrls = "showcase_img_urls",
  /** column name */
  SourceCodeUrl = "source_code_url",
  /** column name */
  SupportEmail = "support_email",
  /** column name */
  SupportedCountries = "supported_countries",
  /** column name */
  UpdatedAt = "updated_at",
  /** column name */
  VerificationStatus = "verification_status",
  /** column name */
  VerifiedAt = "verified_at",
  /** column name */
  WhitelistedAddresses = "whitelisted_addresses",
  /** column name */
  WorldAppButtonText = "world_app_button_text",
  /** column name */
  WorldAppDescription = "world_app_description",
}

/** select "app_metadata_aggregate_bool_exp_bool_and_arguments_columns" columns of table "app_metadata" */
export enum App_Metadata_Select_Column_App_Metadata_Aggregate_Bool_Exp_Bool_And_Arguments_Columns {
  /** column name */
  IsDeveloperAllowListing = "is_developer_allow_listing",
  /** column name */
  IsReviewerAppStoreApproved = "is_reviewer_app_store_approved",
  /** column name */
  IsReviewerWorldAppApproved = "is_reviewer_world_app_approved",
  /** column name */
  IsRowVerified = "is_row_verified",
}

/** select "app_metadata_aggregate_bool_exp_bool_or_arguments_columns" columns of table "app_metadata" */
export enum App_Metadata_Select_Column_App_Metadata_Aggregate_Bool_Exp_Bool_Or_Arguments_Columns {
  /** column name */
  IsDeveloperAllowListing = "is_developer_allow_listing",
  /** column name */
  IsReviewerAppStoreApproved = "is_reviewer_app_store_approved",
  /** column name */
  IsReviewerWorldAppApproved = "is_reviewer_world_app_approved",
  /** column name */
  IsRowVerified = "is_row_verified",
}

/** input type for updating data in table "app_metadata" */
export type App_Metadata_Set_Input = {
  app_id?: InputMaybe<Scalars["String"]>;
  app_mode?: InputMaybe<Scalars["String"]>;
  app_website_url?: InputMaybe<Scalars["String"]>;
  category?: InputMaybe<Scalars["String"]>;
  created_at?: InputMaybe<Scalars["timestamptz"]>;
  description?: InputMaybe<Scalars["String"]>;
  hero_image_url?: InputMaybe<Scalars["String"]>;
  id?: InputMaybe<Scalars["String"]>;
  integration_url?: InputMaybe<Scalars["String"]>;
  is_developer_allow_listing?: InputMaybe<Scalars["Boolean"]>;
  is_reviewer_app_store_approved?: InputMaybe<Scalars["Boolean"]>;
  is_reviewer_world_app_approved?: InputMaybe<Scalars["Boolean"]>;
  is_row_verified?: InputMaybe<Scalars["Boolean"]>;
  logo_img_url?: InputMaybe<Scalars["String"]>;
  name?: InputMaybe<Scalars["String"]>;
  review_message?: InputMaybe<Scalars["String"]>;
  reviewed_by?: InputMaybe<Scalars["String"]>;
  showcase_img_urls?: InputMaybe<Scalars["_text"]>;
  source_code_url?: InputMaybe<Scalars["String"]>;
  support_email?: InputMaybe<Scalars["String"]>;
  supported_countries?: InputMaybe<Scalars["_text"]>;
  updated_at?: InputMaybe<Scalars["timestamptz"]>;
  verification_status?: InputMaybe<Scalars["String"]>;
  verified_at?: InputMaybe<Scalars["timestamptz"]>;
  whitelisted_addresses?: InputMaybe<Scalars["_text"]>;
  world_app_button_text?: InputMaybe<Scalars["String"]>;
  world_app_description?: InputMaybe<Scalars["String"]>;
};

/** Streaming cursor of the table "app_metadata" */
export type App_Metadata_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: App_Metadata_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type App_Metadata_Stream_Cursor_Value_Input = {
  app_id?: InputMaybe<Scalars["String"]>;
  app_mode?: InputMaybe<Scalars["String"]>;
  app_website_url?: InputMaybe<Scalars["String"]>;
  category?: InputMaybe<Scalars["String"]>;
  created_at?: InputMaybe<Scalars["timestamptz"]>;
  description?: InputMaybe<Scalars["String"]>;
  hero_image_url?: InputMaybe<Scalars["String"]>;
  id?: InputMaybe<Scalars["String"]>;
  integration_url?: InputMaybe<Scalars["String"]>;
  is_developer_allow_listing?: InputMaybe<Scalars["Boolean"]>;
  is_reviewer_app_store_approved?: InputMaybe<Scalars["Boolean"]>;
  is_reviewer_world_app_approved?: InputMaybe<Scalars["Boolean"]>;
  is_row_verified?: InputMaybe<Scalars["Boolean"]>;
  logo_img_url?: InputMaybe<Scalars["String"]>;
  name?: InputMaybe<Scalars["String"]>;
  review_message?: InputMaybe<Scalars["String"]>;
  reviewed_by?: InputMaybe<Scalars["String"]>;
  showcase_img_urls?: InputMaybe<Scalars["_text"]>;
  source_code_url?: InputMaybe<Scalars["String"]>;
  support_email?: InputMaybe<Scalars["String"]>;
  supported_countries?: InputMaybe<Scalars["_text"]>;
  updated_at?: InputMaybe<Scalars["timestamptz"]>;
  verification_status?: InputMaybe<Scalars["String"]>;
  verified_at?: InputMaybe<Scalars["timestamptz"]>;
  whitelisted_addresses?: InputMaybe<Scalars["_text"]>;
  world_app_button_text?: InputMaybe<Scalars["String"]>;
  world_app_description?: InputMaybe<Scalars["String"]>;
};

/** update columns of table "app_metadata" */
export enum App_Metadata_Update_Column {
  /** column name */
  AppId = "app_id",
  /** column name */
  AppMode = "app_mode",
  /** column name */
  AppWebsiteUrl = "app_website_url",
  /** column name */
  Category = "category",
  /** column name */
  CreatedAt = "created_at",
  /** column name */
  Description = "description",
  /** column name */
  HeroImageUrl = "hero_image_url",
  /** column name */
  Id = "id",
  /** column name */
  IntegrationUrl = "integration_url",
  /** column name */
  IsDeveloperAllowListing = "is_developer_allow_listing",
  /** column name */
  IsReviewerAppStoreApproved = "is_reviewer_app_store_approved",
  /** column name */
  IsReviewerWorldAppApproved = "is_reviewer_world_app_approved",
  /** column name */
  IsRowVerified = "is_row_verified",
  /** column name */
  LogoImgUrl = "logo_img_url",
  /** column name */
  Name = "name",
  /** column name */
  ReviewMessage = "review_message",
  /** column name */
  ReviewedBy = "reviewed_by",
  /** column name */
  ShowcaseImgUrls = "showcase_img_urls",
  /** column name */
  SourceCodeUrl = "source_code_url",
  /** column name */
  SupportEmail = "support_email",
  /** column name */
  SupportedCountries = "supported_countries",
  /** column name */
  UpdatedAt = "updated_at",
  /** column name */
  VerificationStatus = "verification_status",
  /** column name */
  VerifiedAt = "verified_at",
  /** column name */
  WhitelistedAddresses = "whitelisted_addresses",
  /** column name */
  WorldAppButtonText = "world_app_button_text",
  /** column name */
  WorldAppDescription = "world_app_description",
}

export type App_Metadata_Updates = {
  /** sets the columns of the filtered rows to the given values */
  _set?: InputMaybe<App_Metadata_Set_Input>;
  /** filter the rows which have to be updated */
  where: App_Metadata_Bool_Exp;
};

/** aggregate min on columns */
export type App_Min_Fields = {
  __typename?: "app_min_fields";
  created_at?: Maybe<Scalars["timestamptz"]>;
  description_internal?: Maybe<Scalars["String"]>;
  engine?: Maybe<Scalars["String"]>;
  id?: Maybe<Scalars["String"]>;
  logo_url?: Maybe<Scalars["String"]>;
  name?: Maybe<Scalars["String"]>;
  status?: Maybe<Scalars["String"]>;
  team_id?: Maybe<Scalars["String"]>;
  updated_at?: Maybe<Scalars["timestamptz"]>;
  verified_at?: Maybe<Scalars["timestamptz"]>;
};

/** order by min() on columns of table "app" */
export type App_Min_Order_By = {
  created_at?: InputMaybe<Order_By>;
  description_internal?: InputMaybe<Order_By>;
  engine?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  logo_url?: InputMaybe<Order_By>;
  name?: InputMaybe<Order_By>;
  status?: InputMaybe<Order_By>;
  team_id?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
  verified_at?: InputMaybe<Order_By>;
};

/** response of any mutation on the table "app" */
export type App_Mutation_Response = {
  __typename?: "app_mutation_response";
  /** number of rows affected by the mutation */
  affected_rows: Scalars["Int"];
  /** data from the rows affected by the mutation */
  returning: Array<App>;
};

/** input type for inserting object relation for remote table "app" */
export type App_Obj_Rel_Insert_Input = {
  data: App_Insert_Input;
  /** upsert condition */
  on_conflict?: InputMaybe<App_On_Conflict>;
};

/** on_conflict condition type for table "app" */
export type App_On_Conflict = {
  constraint: App_Constraint;
  update_columns?: Array<App_Update_Column>;
  where?: InputMaybe<App_Bool_Exp>;
};

/** Ordering options when selecting data from "app". */
export type App_Order_By = {
  actions_aggregate?: InputMaybe<Action_Aggregate_Order_By>;
  app_metadata_aggregate?: InputMaybe<App_Metadata_Aggregate_Order_By>;
  created_at?: InputMaybe<Order_By>;
  description_internal?: InputMaybe<Order_By>;
  engine?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  is_archived?: InputMaybe<Order_By>;
  is_staging?: InputMaybe<Order_By>;
  logo_url?: InputMaybe<Order_By>;
  name?: InputMaybe<Order_By>;
  status?: InputMaybe<Order_By>;
  team?: InputMaybe<Team_Order_By>;
  team_id?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
  verified_at?: InputMaybe<Order_By>;
};

/** primary key columns input for table: app */
export type App_Pk_Columns_Input = {
  id: Scalars["String"];
};

/** columns and relationships of "app_rankings" */
export type App_Rankings = {
  __typename?: "app_rankings";
  country: Scalars["String"];
  id: Scalars["String"];
  platform: Scalars["String"];
  rankings?: Maybe<Scalars["_text"]>;
};

/** aggregated selection of "app_rankings" */
export type App_Rankings_Aggregate = {
  __typename?: "app_rankings_aggregate";
  aggregate?: Maybe<App_Rankings_Aggregate_Fields>;
  nodes: Array<App_Rankings>;
};

/** aggregate fields of "app_rankings" */
export type App_Rankings_Aggregate_Fields = {
  __typename?: "app_rankings_aggregate_fields";
  count: Scalars["Int"];
  max?: Maybe<App_Rankings_Max_Fields>;
  min?: Maybe<App_Rankings_Min_Fields>;
};

/** aggregate fields of "app_rankings" */
export type App_Rankings_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<App_Rankings_Select_Column>>;
  distinct?: InputMaybe<Scalars["Boolean"]>;
};

/** Boolean expression to filter rows from the table "app_rankings". All fields are combined with a logical 'AND'. */
export type App_Rankings_Bool_Exp = {
  _and?: InputMaybe<Array<App_Rankings_Bool_Exp>>;
  _not?: InputMaybe<App_Rankings_Bool_Exp>;
  _or?: InputMaybe<Array<App_Rankings_Bool_Exp>>;
  country?: InputMaybe<String_Comparison_Exp>;
  id?: InputMaybe<String_Comparison_Exp>;
  platform?: InputMaybe<String_Comparison_Exp>;
  rankings?: InputMaybe<_Text_Comparison_Exp>;
};

/** unique or primary key constraints on table "app_rankings" */
export enum App_Rankings_Constraint {
  /** unique or primary key constraint on columns "id" */
  AppRankingsPkey = "app_rankings_pkey",
  /** unique or primary key constraint on columns "platform", "country" */
  AppRankingsPlatformCountryUnique = "app_rankings_platform_country_unique",
}

/** input type for inserting data into table "app_rankings" */
export type App_Rankings_Insert_Input = {
  country?: InputMaybe<Scalars["String"]>;
  id?: InputMaybe<Scalars["String"]>;
  platform?: InputMaybe<Scalars["String"]>;
  rankings?: InputMaybe<Scalars["_text"]>;
};

/** aggregate max on columns */
export type App_Rankings_Max_Fields = {
  __typename?: "app_rankings_max_fields";
  country?: Maybe<Scalars["String"]>;
  id?: Maybe<Scalars["String"]>;
  platform?: Maybe<Scalars["String"]>;
};

/** aggregate min on columns */
export type App_Rankings_Min_Fields = {
  __typename?: "app_rankings_min_fields";
  country?: Maybe<Scalars["String"]>;
  id?: Maybe<Scalars["String"]>;
  platform?: Maybe<Scalars["String"]>;
};

/** response of any mutation on the table "app_rankings" */
export type App_Rankings_Mutation_Response = {
  __typename?: "app_rankings_mutation_response";
  /** number of rows affected by the mutation */
  affected_rows: Scalars["Int"];
  /** data from the rows affected by the mutation */
  returning: Array<App_Rankings>;
};

/** on_conflict condition type for table "app_rankings" */
export type App_Rankings_On_Conflict = {
  constraint: App_Rankings_Constraint;
  update_columns?: Array<App_Rankings_Update_Column>;
  where?: InputMaybe<App_Rankings_Bool_Exp>;
};

/** Ordering options when selecting data from "app_rankings". */
export type App_Rankings_Order_By = {
  country?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  platform?: InputMaybe<Order_By>;
  rankings?: InputMaybe<Order_By>;
};

/** primary key columns input for table: app_rankings */
export type App_Rankings_Pk_Columns_Input = {
  id: Scalars["String"];
};

/** select columns of table "app_rankings" */
export enum App_Rankings_Select_Column {
  /** column name */
  Country = "country",
  /** column name */
  Id = "id",
  /** column name */
  Platform = "platform",
  /** column name */
  Rankings = "rankings",
}

/** input type for updating data in table "app_rankings" */
export type App_Rankings_Set_Input = {
  country?: InputMaybe<Scalars["String"]>;
  id?: InputMaybe<Scalars["String"]>;
  platform?: InputMaybe<Scalars["String"]>;
  rankings?: InputMaybe<Scalars["_text"]>;
};

/** Streaming cursor of the table "app_rankings" */
export type App_Rankings_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: App_Rankings_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type App_Rankings_Stream_Cursor_Value_Input = {
  country?: InputMaybe<Scalars["String"]>;
  id?: InputMaybe<Scalars["String"]>;
  platform?: InputMaybe<Scalars["String"]>;
  rankings?: InputMaybe<Scalars["_text"]>;
};

/** update columns of table "app_rankings" */
export enum App_Rankings_Update_Column {
  /** column name */
  Country = "country",
  /** column name */
  Id = "id",
  /** column name */
  Platform = "platform",
  /** column name */
  Rankings = "rankings",
}

export type App_Rankings_Updates = {
  /** sets the columns of the filtered rows to the given values */
  _set?: InputMaybe<App_Rankings_Set_Input>;
  /** filter the rows which have to be updated */
  where: App_Rankings_Bool_Exp;
};

/** select columns of table "app" */
export enum App_Select_Column {
  /** column name */
  CreatedAt = "created_at",
  /** column name */
  DescriptionInternal = "description_internal",
  /** column name */
  Engine = "engine",
  /** column name */
  Id = "id",
  /** column name */
  IsArchived = "is_archived",
  /** column name */
  IsStaging = "is_staging",
  /** column name */
  LogoUrl = "logo_url",
  /** column name */
  Name = "name",
  /** column name */
  Status = "status",
  /** column name */
  TeamId = "team_id",
  /** column name */
  UpdatedAt = "updated_at",
  /** column name */
  VerifiedAt = "verified_at",
}

/** select "app_aggregate_bool_exp_bool_and_arguments_columns" columns of table "app" */
export enum App_Select_Column_App_Aggregate_Bool_Exp_Bool_And_Arguments_Columns {
  /** column name */
  IsArchived = "is_archived",
  /** column name */
  IsStaging = "is_staging",
}

/** select "app_aggregate_bool_exp_bool_or_arguments_columns" columns of table "app" */
export enum App_Select_Column_App_Aggregate_Bool_Exp_Bool_Or_Arguments_Columns {
  /** column name */
  IsArchived = "is_archived",
  /** column name */
  IsStaging = "is_staging",
}

/** input type for updating data in table "app" */
export type App_Set_Input = {
  created_at?: InputMaybe<Scalars["timestamptz"]>;
  description_internal?: InputMaybe<Scalars["String"]>;
  engine?: InputMaybe<Scalars["String"]>;
  id?: InputMaybe<Scalars["String"]>;
  is_archived?: InputMaybe<Scalars["Boolean"]>;
  is_staging?: InputMaybe<Scalars["Boolean"]>;
  logo_url?: InputMaybe<Scalars["String"]>;
  name?: InputMaybe<Scalars["String"]>;
  status?: InputMaybe<Scalars["String"]>;
  team_id?: InputMaybe<Scalars["String"]>;
  updated_at?: InputMaybe<Scalars["timestamptz"]>;
  verified_at?: InputMaybe<Scalars["timestamptz"]>;
};

export type App_Stats_Args = {
  appId?: InputMaybe<Scalars["String"]>;
  startsAt?: InputMaybe<Scalars["timestamptz"]>;
  timespan?: InputMaybe<Scalars["String"]>;
};

/** Returning value of app_stats function */
export type App_Stats_Returning = {
  __typename?: "app_stats_returning";
  /** An object relationship */
  app: App;
  app_id: Scalars["String"];
  date: Scalars["timestamptz"];
  unique_users: Scalars["numeric"];
  verifications: Scalars["numeric"];
};

export type App_Stats_Returning_Aggregate = {
  __typename?: "app_stats_returning_aggregate";
  aggregate?: Maybe<App_Stats_Returning_Aggregate_Fields>;
  nodes: Array<App_Stats_Returning>;
};

/** aggregate fields of "app_stats_returning" */
export type App_Stats_Returning_Aggregate_Fields = {
  __typename?: "app_stats_returning_aggregate_fields";
  avg?: Maybe<App_Stats_Returning_Avg_Fields>;
  count: Scalars["Int"];
  max?: Maybe<App_Stats_Returning_Max_Fields>;
  min?: Maybe<App_Stats_Returning_Min_Fields>;
  stddev?: Maybe<App_Stats_Returning_Stddev_Fields>;
  stddev_pop?: Maybe<App_Stats_Returning_Stddev_Pop_Fields>;
  stddev_samp?: Maybe<App_Stats_Returning_Stddev_Samp_Fields>;
  sum?: Maybe<App_Stats_Returning_Sum_Fields>;
  var_pop?: Maybe<App_Stats_Returning_Var_Pop_Fields>;
  var_samp?: Maybe<App_Stats_Returning_Var_Samp_Fields>;
  variance?: Maybe<App_Stats_Returning_Variance_Fields>;
};

/** aggregate fields of "app_stats_returning" */
export type App_Stats_Returning_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<App_Stats_Returning_Select_Column>>;
  distinct?: InputMaybe<Scalars["Boolean"]>;
};

/** aggregate avg on columns */
export type App_Stats_Returning_Avg_Fields = {
  __typename?: "app_stats_returning_avg_fields";
  unique_users?: Maybe<Scalars["Float"]>;
  verifications?: Maybe<Scalars["Float"]>;
};

/** Boolean expression to filter rows from the table "app_stats_returning". All fields are combined with a logical 'AND'. */
export type App_Stats_Returning_Bool_Exp = {
  _and?: InputMaybe<Array<App_Stats_Returning_Bool_Exp>>;
  _not?: InputMaybe<App_Stats_Returning_Bool_Exp>;
  _or?: InputMaybe<Array<App_Stats_Returning_Bool_Exp>>;
  app?: InputMaybe<App_Bool_Exp>;
  app_id?: InputMaybe<String_Comparison_Exp>;
  date?: InputMaybe<Timestamptz_Comparison_Exp>;
  unique_users?: InputMaybe<Numeric_Comparison_Exp>;
  verifications?: InputMaybe<Numeric_Comparison_Exp>;
};

/** unique or primary key constraints on table "app_stats_returning" */
export enum App_Stats_Returning_Constraint {
  /** unique or primary key constraint on columns "app_id" */
  AppStatsReturningPkey = "app_stats_returning_pkey",
}

/** input type for incrementing numeric columns in table "app_stats_returning" */
export type App_Stats_Returning_Inc_Input = {
  unique_users?: InputMaybe<Scalars["numeric"]>;
  verifications?: InputMaybe<Scalars["numeric"]>;
};

/** input type for inserting data into table "app_stats_returning" */
export type App_Stats_Returning_Insert_Input = {
  app?: InputMaybe<App_Obj_Rel_Insert_Input>;
  app_id?: InputMaybe<Scalars["String"]>;
  date?: InputMaybe<Scalars["timestamptz"]>;
  unique_users?: InputMaybe<Scalars["numeric"]>;
  verifications?: InputMaybe<Scalars["numeric"]>;
};

/** aggregate max on columns */
export type App_Stats_Returning_Max_Fields = {
  __typename?: "app_stats_returning_max_fields";
  app_id?: Maybe<Scalars["String"]>;
  date?: Maybe<Scalars["timestamptz"]>;
  unique_users?: Maybe<Scalars["numeric"]>;
  verifications?: Maybe<Scalars["numeric"]>;
};

/** aggregate min on columns */
export type App_Stats_Returning_Min_Fields = {
  __typename?: "app_stats_returning_min_fields";
  app_id?: Maybe<Scalars["String"]>;
  date?: Maybe<Scalars["timestamptz"]>;
  unique_users?: Maybe<Scalars["numeric"]>;
  verifications?: Maybe<Scalars["numeric"]>;
};

/** response of any mutation on the table "app_stats_returning" */
export type App_Stats_Returning_Mutation_Response = {
  __typename?: "app_stats_returning_mutation_response";
  /** number of rows affected by the mutation */
  affected_rows: Scalars["Int"];
  /** data from the rows affected by the mutation */
  returning: Array<App_Stats_Returning>;
};

/** on_conflict condition type for table "app_stats_returning" */
export type App_Stats_Returning_On_Conflict = {
  constraint: App_Stats_Returning_Constraint;
  update_columns?: Array<App_Stats_Returning_Update_Column>;
  where?: InputMaybe<App_Stats_Returning_Bool_Exp>;
};

/** Ordering options when selecting data from "app_stats_returning". */
export type App_Stats_Returning_Order_By = {
  app?: InputMaybe<App_Order_By>;
  app_id?: InputMaybe<Order_By>;
  date?: InputMaybe<Order_By>;
  unique_users?: InputMaybe<Order_By>;
  verifications?: InputMaybe<Order_By>;
};

/** primary key columns input for table: app_stats_returning */
export type App_Stats_Returning_Pk_Columns_Input = {
  app_id: Scalars["String"];
};

/** select columns of table "app_stats_returning" */
export enum App_Stats_Returning_Select_Column {
  /** column name */
  AppId = "app_id",
  /** column name */
  Date = "date",
  /** column name */
  UniqueUsers = "unique_users",
  /** column name */
  Verifications = "verifications",
}

/** input type for updating data in table "app_stats_returning" */
export type App_Stats_Returning_Set_Input = {
  app_id?: InputMaybe<Scalars["String"]>;
  date?: InputMaybe<Scalars["timestamptz"]>;
  unique_users?: InputMaybe<Scalars["numeric"]>;
  verifications?: InputMaybe<Scalars["numeric"]>;
};

/** aggregate stddev on columns */
export type App_Stats_Returning_Stddev_Fields = {
  __typename?: "app_stats_returning_stddev_fields";
  unique_users?: Maybe<Scalars["Float"]>;
  verifications?: Maybe<Scalars["Float"]>;
};

/** aggregate stddev_pop on columns */
export type App_Stats_Returning_Stddev_Pop_Fields = {
  __typename?: "app_stats_returning_stddev_pop_fields";
  unique_users?: Maybe<Scalars["Float"]>;
  verifications?: Maybe<Scalars["Float"]>;
};

/** aggregate stddev_samp on columns */
export type App_Stats_Returning_Stddev_Samp_Fields = {
  __typename?: "app_stats_returning_stddev_samp_fields";
  unique_users?: Maybe<Scalars["Float"]>;
  verifications?: Maybe<Scalars["Float"]>;
};

/** Streaming cursor of the table "app_stats_returning" */
export type App_Stats_Returning_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: App_Stats_Returning_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type App_Stats_Returning_Stream_Cursor_Value_Input = {
  app_id?: InputMaybe<Scalars["String"]>;
  date?: InputMaybe<Scalars["timestamptz"]>;
  unique_users?: InputMaybe<Scalars["numeric"]>;
  verifications?: InputMaybe<Scalars["numeric"]>;
};

/** aggregate sum on columns */
export type App_Stats_Returning_Sum_Fields = {
  __typename?: "app_stats_returning_sum_fields";
  unique_users?: Maybe<Scalars["numeric"]>;
  verifications?: Maybe<Scalars["numeric"]>;
};

/** update columns of table "app_stats_returning" */
export enum App_Stats_Returning_Update_Column {
  /** column name */
  AppId = "app_id",
  /** column name */
  Date = "date",
  /** column name */
  UniqueUsers = "unique_users",
  /** column name */
  Verifications = "verifications",
}

export type App_Stats_Returning_Updates = {
  /** increments the numeric columns with given value of the filtered values */
  _inc?: InputMaybe<App_Stats_Returning_Inc_Input>;
  /** sets the columns of the filtered rows to the given values */
  _set?: InputMaybe<App_Stats_Returning_Set_Input>;
  /** filter the rows which have to be updated */
  where: App_Stats_Returning_Bool_Exp;
};

/** aggregate var_pop on columns */
export type App_Stats_Returning_Var_Pop_Fields = {
  __typename?: "app_stats_returning_var_pop_fields";
  unique_users?: Maybe<Scalars["Float"]>;
  verifications?: Maybe<Scalars["Float"]>;
};

/** aggregate var_samp on columns */
export type App_Stats_Returning_Var_Samp_Fields = {
  __typename?: "app_stats_returning_var_samp_fields";
  unique_users?: Maybe<Scalars["Float"]>;
  verifications?: Maybe<Scalars["Float"]>;
};

/** aggregate variance on columns */
export type App_Stats_Returning_Variance_Fields = {
  __typename?: "app_stats_returning_variance_fields";
  unique_users?: Maybe<Scalars["Float"]>;
  verifications?: Maybe<Scalars["Float"]>;
};

/** Streaming cursor of the table "app" */
export type App_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: App_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type App_Stream_Cursor_Value_Input = {
  created_at?: InputMaybe<Scalars["timestamptz"]>;
  description_internal?: InputMaybe<Scalars["String"]>;
  engine?: InputMaybe<Scalars["String"]>;
  id?: InputMaybe<Scalars["String"]>;
  is_archived?: InputMaybe<Scalars["Boolean"]>;
  is_staging?: InputMaybe<Scalars["Boolean"]>;
  logo_url?: InputMaybe<Scalars["String"]>;
  name?: InputMaybe<Scalars["String"]>;
  status?: InputMaybe<Scalars["String"]>;
  team_id?: InputMaybe<Scalars["String"]>;
  updated_at?: InputMaybe<Scalars["timestamptz"]>;
  verified_at?: InputMaybe<Scalars["timestamptz"]>;
};

/** update columns of table "app" */
export enum App_Update_Column {
  /** column name */
  CreatedAt = "created_at",
  /** column name */
  DescriptionInternal = "description_internal",
  /** column name */
  Engine = "engine",
  /** column name */
  Id = "id",
  /** column name */
  IsArchived = "is_archived",
  /** column name */
  IsStaging = "is_staging",
  /** column name */
  LogoUrl = "logo_url",
  /** column name */
  Name = "name",
  /** column name */
  Status = "status",
  /** column name */
  TeamId = "team_id",
  /** column name */
  UpdatedAt = "updated_at",
  /** column name */
  VerifiedAt = "verified_at",
}

export type App_Updates = {
  /** sets the columns of the filtered rows to the given values */
  _set?: InputMaybe<App_Set_Input>;
  /** filter the rows which have to be updated */
  where: App_Bool_Exp;
};

/** columns and relationships of "auth_code" */
export type Auth_Code = {
  __typename?: "auth_code";
  app_id: Scalars["String"];
  auth_code: Scalars["String"];
  code_challenge?: Maybe<Scalars["String"]>;
  code_challenge_method?: Maybe<Scalars["String"]>;
  created_at: Scalars["timestamptz"];
  expires_at: Scalars["timestamptz"];
  id: Scalars["String"];
  nonce?: Maybe<Scalars["String"]>;
  nullifier_hash: Scalars["String"];
  redirect_uri: Scalars["String"];
  scope?: Maybe<Scalars["jsonb"]>;
  updated_at: Scalars["timestamptz"];
  verification_level: Scalars["String"];
};

/** columns and relationships of "auth_code" */
export type Auth_CodeScopeArgs = {
  path?: InputMaybe<Scalars["String"]>;
};

/** aggregated selection of "auth_code" */
export type Auth_Code_Aggregate = {
  __typename?: "auth_code_aggregate";
  aggregate?: Maybe<Auth_Code_Aggregate_Fields>;
  nodes: Array<Auth_Code>;
};

/** aggregate fields of "auth_code" */
export type Auth_Code_Aggregate_Fields = {
  __typename?: "auth_code_aggregate_fields";
  count: Scalars["Int"];
  max?: Maybe<Auth_Code_Max_Fields>;
  min?: Maybe<Auth_Code_Min_Fields>;
};

/** aggregate fields of "auth_code" */
export type Auth_Code_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Auth_Code_Select_Column>>;
  distinct?: InputMaybe<Scalars["Boolean"]>;
};

/** append existing jsonb value of filtered columns with new jsonb value */
export type Auth_Code_Append_Input = {
  scope?: InputMaybe<Scalars["jsonb"]>;
};

/** Boolean expression to filter rows from the table "auth_code". All fields are combined with a logical 'AND'. */
export type Auth_Code_Bool_Exp = {
  _and?: InputMaybe<Array<Auth_Code_Bool_Exp>>;
  _not?: InputMaybe<Auth_Code_Bool_Exp>;
  _or?: InputMaybe<Array<Auth_Code_Bool_Exp>>;
  app_id?: InputMaybe<String_Comparison_Exp>;
  auth_code?: InputMaybe<String_Comparison_Exp>;
  code_challenge?: InputMaybe<String_Comparison_Exp>;
  code_challenge_method?: InputMaybe<String_Comparison_Exp>;
  created_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  expires_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  id?: InputMaybe<String_Comparison_Exp>;
  nonce?: InputMaybe<String_Comparison_Exp>;
  nullifier_hash?: InputMaybe<String_Comparison_Exp>;
  redirect_uri?: InputMaybe<String_Comparison_Exp>;
  scope?: InputMaybe<Jsonb_Comparison_Exp>;
  updated_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  verification_level?: InputMaybe<String_Comparison_Exp>;
};

/** unique or primary key constraints on table "auth_code" */
export enum Auth_Code_Constraint {
  /** unique or primary key constraint on columns "id" */
  AuthCodePkey = "auth_code_pkey",
}

/** delete the field or element with specified path (for JSON arrays, negative integers count from the end) */
export type Auth_Code_Delete_At_Path_Input = {
  scope?: InputMaybe<Array<Scalars["String"]>>;
};

/** delete the array element with specified index (negative integers count from the end). throws an error if top level container is not an array */
export type Auth_Code_Delete_Elem_Input = {
  scope?: InputMaybe<Scalars["Int"]>;
};

/** delete key/value pair or string element. key/value pairs are matched based on their key value */
export type Auth_Code_Delete_Key_Input = {
  scope?: InputMaybe<Scalars["String"]>;
};

/** input type for inserting data into table "auth_code" */
export type Auth_Code_Insert_Input = {
  app_id?: InputMaybe<Scalars["String"]>;
  auth_code?: InputMaybe<Scalars["String"]>;
  code_challenge?: InputMaybe<Scalars["String"]>;
  code_challenge_method?: InputMaybe<Scalars["String"]>;
  created_at?: InputMaybe<Scalars["timestamptz"]>;
  expires_at?: InputMaybe<Scalars["timestamptz"]>;
  id?: InputMaybe<Scalars["String"]>;
  nonce?: InputMaybe<Scalars["String"]>;
  nullifier_hash?: InputMaybe<Scalars["String"]>;
  redirect_uri?: InputMaybe<Scalars["String"]>;
  scope?: InputMaybe<Scalars["jsonb"]>;
  updated_at?: InputMaybe<Scalars["timestamptz"]>;
  verification_level?: InputMaybe<Scalars["String"]>;
};

/** aggregate max on columns */
export type Auth_Code_Max_Fields = {
  __typename?: "auth_code_max_fields";
  app_id?: Maybe<Scalars["String"]>;
  auth_code?: Maybe<Scalars["String"]>;
  code_challenge?: Maybe<Scalars["String"]>;
  code_challenge_method?: Maybe<Scalars["String"]>;
  created_at?: Maybe<Scalars["timestamptz"]>;
  expires_at?: Maybe<Scalars["timestamptz"]>;
  id?: Maybe<Scalars["String"]>;
  nonce?: Maybe<Scalars["String"]>;
  nullifier_hash?: Maybe<Scalars["String"]>;
  redirect_uri?: Maybe<Scalars["String"]>;
  updated_at?: Maybe<Scalars["timestamptz"]>;
  verification_level?: Maybe<Scalars["String"]>;
};

/** aggregate min on columns */
export type Auth_Code_Min_Fields = {
  __typename?: "auth_code_min_fields";
  app_id?: Maybe<Scalars["String"]>;
  auth_code?: Maybe<Scalars["String"]>;
  code_challenge?: Maybe<Scalars["String"]>;
  code_challenge_method?: Maybe<Scalars["String"]>;
  created_at?: Maybe<Scalars["timestamptz"]>;
  expires_at?: Maybe<Scalars["timestamptz"]>;
  id?: Maybe<Scalars["String"]>;
  nonce?: Maybe<Scalars["String"]>;
  nullifier_hash?: Maybe<Scalars["String"]>;
  redirect_uri?: Maybe<Scalars["String"]>;
  updated_at?: Maybe<Scalars["timestamptz"]>;
  verification_level?: Maybe<Scalars["String"]>;
};

/** response of any mutation on the table "auth_code" */
export type Auth_Code_Mutation_Response = {
  __typename?: "auth_code_mutation_response";
  /** number of rows affected by the mutation */
  affected_rows: Scalars["Int"];
  /** data from the rows affected by the mutation */
  returning: Array<Auth_Code>;
};

/** on_conflict condition type for table "auth_code" */
export type Auth_Code_On_Conflict = {
  constraint: Auth_Code_Constraint;
  update_columns?: Array<Auth_Code_Update_Column>;
  where?: InputMaybe<Auth_Code_Bool_Exp>;
};

/** Ordering options when selecting data from "auth_code". */
export type Auth_Code_Order_By = {
  app_id?: InputMaybe<Order_By>;
  auth_code?: InputMaybe<Order_By>;
  code_challenge?: InputMaybe<Order_By>;
  code_challenge_method?: InputMaybe<Order_By>;
  created_at?: InputMaybe<Order_By>;
  expires_at?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  nonce?: InputMaybe<Order_By>;
  nullifier_hash?: InputMaybe<Order_By>;
  redirect_uri?: InputMaybe<Order_By>;
  scope?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
  verification_level?: InputMaybe<Order_By>;
};

/** primary key columns input for table: auth_code */
export type Auth_Code_Pk_Columns_Input = {
  id: Scalars["String"];
};

/** prepend existing jsonb value of filtered columns with new jsonb value */
export type Auth_Code_Prepend_Input = {
  scope?: InputMaybe<Scalars["jsonb"]>;
};

/** select columns of table "auth_code" */
export enum Auth_Code_Select_Column {
  /** column name */
  AppId = "app_id",
  /** column name */
  AuthCode = "auth_code",
  /** column name */
  CodeChallenge = "code_challenge",
  /** column name */
  CodeChallengeMethod = "code_challenge_method",
  /** column name */
  CreatedAt = "created_at",
  /** column name */
  ExpiresAt = "expires_at",
  /** column name */
  Id = "id",
  /** column name */
  Nonce = "nonce",
  /** column name */
  NullifierHash = "nullifier_hash",
  /** column name */
  RedirectUri = "redirect_uri",
  /** column name */
  Scope = "scope",
  /** column name */
  UpdatedAt = "updated_at",
  /** column name */
  VerificationLevel = "verification_level",
}

/** input type for updating data in table "auth_code" */
export type Auth_Code_Set_Input = {
  app_id?: InputMaybe<Scalars["String"]>;
  auth_code?: InputMaybe<Scalars["String"]>;
  code_challenge?: InputMaybe<Scalars["String"]>;
  code_challenge_method?: InputMaybe<Scalars["String"]>;
  created_at?: InputMaybe<Scalars["timestamptz"]>;
  expires_at?: InputMaybe<Scalars["timestamptz"]>;
  id?: InputMaybe<Scalars["String"]>;
  nonce?: InputMaybe<Scalars["String"]>;
  nullifier_hash?: InputMaybe<Scalars["String"]>;
  redirect_uri?: InputMaybe<Scalars["String"]>;
  scope?: InputMaybe<Scalars["jsonb"]>;
  updated_at?: InputMaybe<Scalars["timestamptz"]>;
  verification_level?: InputMaybe<Scalars["String"]>;
};

/** Streaming cursor of the table "auth_code" */
export type Auth_Code_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Auth_Code_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Auth_Code_Stream_Cursor_Value_Input = {
  app_id?: InputMaybe<Scalars["String"]>;
  auth_code?: InputMaybe<Scalars["String"]>;
  code_challenge?: InputMaybe<Scalars["String"]>;
  code_challenge_method?: InputMaybe<Scalars["String"]>;
  created_at?: InputMaybe<Scalars["timestamptz"]>;
  expires_at?: InputMaybe<Scalars["timestamptz"]>;
  id?: InputMaybe<Scalars["String"]>;
  nonce?: InputMaybe<Scalars["String"]>;
  nullifier_hash?: InputMaybe<Scalars["String"]>;
  redirect_uri?: InputMaybe<Scalars["String"]>;
  scope?: InputMaybe<Scalars["jsonb"]>;
  updated_at?: InputMaybe<Scalars["timestamptz"]>;
  verification_level?: InputMaybe<Scalars["String"]>;
};

/** update columns of table "auth_code" */
export enum Auth_Code_Update_Column {
  /** column name */
  AppId = "app_id",
  /** column name */
  AuthCode = "auth_code",
  /** column name */
  CodeChallenge = "code_challenge",
  /** column name */
  CodeChallengeMethod = "code_challenge_method",
  /** column name */
  CreatedAt = "created_at",
  /** column name */
  ExpiresAt = "expires_at",
  /** column name */
  Id = "id",
  /** column name */
  Nonce = "nonce",
  /** column name */
  NullifierHash = "nullifier_hash",
  /** column name */
  RedirectUri = "redirect_uri",
  /** column name */
  Scope = "scope",
  /** column name */
  UpdatedAt = "updated_at",
  /** column name */
  VerificationLevel = "verification_level",
}

export type Auth_Code_Updates = {
  /** append existing jsonb value of filtered columns with new jsonb value */
  _append?: InputMaybe<Auth_Code_Append_Input>;
  /** delete the field or element with specified path (for JSON arrays, negative integers count from the end) */
  _delete_at_path?: InputMaybe<Auth_Code_Delete_At_Path_Input>;
  /** delete the array element with specified index (negative integers count from the end). throws an error if top level container is not an array */
  _delete_elem?: InputMaybe<Auth_Code_Delete_Elem_Input>;
  /** delete key/value pair or string element. key/value pairs are matched based on their key value */
  _delete_key?: InputMaybe<Auth_Code_Delete_Key_Input>;
  /** prepend existing jsonb value of filtered columns with new jsonb value */
  _prepend?: InputMaybe<Auth_Code_Prepend_Input>;
  /** sets the columns of the filtered rows to the given values */
  _set?: InputMaybe<Auth_Code_Set_Input>;
  /** filter the rows which have to be updated */
  where: Auth_Code_Bool_Exp;
};

/** columns and relationships of "cache" */
export type Cache = {
  __typename?: "cache";
  created_at: Scalars["timestamptz"];
  id: Scalars["String"];
  key: Scalars["String"];
  updated_at: Scalars["timestamptz"];
  value?: Maybe<Scalars["String"]>;
};

/** aggregated selection of "cache" */
export type Cache_Aggregate = {
  __typename?: "cache_aggregate";
  aggregate?: Maybe<Cache_Aggregate_Fields>;
  nodes: Array<Cache>;
};

/** aggregate fields of "cache" */
export type Cache_Aggregate_Fields = {
  __typename?: "cache_aggregate_fields";
  count: Scalars["Int"];
  max?: Maybe<Cache_Max_Fields>;
  min?: Maybe<Cache_Min_Fields>;
};

/** aggregate fields of "cache" */
export type Cache_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Cache_Select_Column>>;
  distinct?: InputMaybe<Scalars["Boolean"]>;
};

/** Boolean expression to filter rows from the table "cache". All fields are combined with a logical 'AND'. */
export type Cache_Bool_Exp = {
  _and?: InputMaybe<Array<Cache_Bool_Exp>>;
  _not?: InputMaybe<Cache_Bool_Exp>;
  _or?: InputMaybe<Array<Cache_Bool_Exp>>;
  created_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  id?: InputMaybe<String_Comparison_Exp>;
  key?: InputMaybe<String_Comparison_Exp>;
  updated_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  value?: InputMaybe<String_Comparison_Exp>;
};

/** unique or primary key constraints on table "cache" */
export enum Cache_Constraint {
  /** unique or primary key constraint on columns "key" */
  CacheKeyKey = "cache_key_key",
  /** unique or primary key constraint on columns "id" */
  CachePkey = "cache_pkey",
}

/** input type for inserting data into table "cache" */
export type Cache_Insert_Input = {
  created_at?: InputMaybe<Scalars["timestamptz"]>;
  id?: InputMaybe<Scalars["String"]>;
  key?: InputMaybe<Scalars["String"]>;
  updated_at?: InputMaybe<Scalars["timestamptz"]>;
  value?: InputMaybe<Scalars["String"]>;
};

/** aggregate max on columns */
export type Cache_Max_Fields = {
  __typename?: "cache_max_fields";
  created_at?: Maybe<Scalars["timestamptz"]>;
  id?: Maybe<Scalars["String"]>;
  key?: Maybe<Scalars["String"]>;
  updated_at?: Maybe<Scalars["timestamptz"]>;
  value?: Maybe<Scalars["String"]>;
};

/** aggregate min on columns */
export type Cache_Min_Fields = {
  __typename?: "cache_min_fields";
  created_at?: Maybe<Scalars["timestamptz"]>;
  id?: Maybe<Scalars["String"]>;
  key?: Maybe<Scalars["String"]>;
  updated_at?: Maybe<Scalars["timestamptz"]>;
  value?: Maybe<Scalars["String"]>;
};

/** response of any mutation on the table "cache" */
export type Cache_Mutation_Response = {
  __typename?: "cache_mutation_response";
  /** number of rows affected by the mutation */
  affected_rows: Scalars["Int"];
  /** data from the rows affected by the mutation */
  returning: Array<Cache>;
};

/** on_conflict condition type for table "cache" */
export type Cache_On_Conflict = {
  constraint: Cache_Constraint;
  update_columns?: Array<Cache_Update_Column>;
  where?: InputMaybe<Cache_Bool_Exp>;
};

/** Ordering options when selecting data from "cache". */
export type Cache_Order_By = {
  created_at?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  key?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
  value?: InputMaybe<Order_By>;
};

/** primary key columns input for table: cache */
export type Cache_Pk_Columns_Input = {
  id: Scalars["String"];
};

/** select columns of table "cache" */
export enum Cache_Select_Column {
  /** column name */
  CreatedAt = "created_at",
  /** column name */
  Id = "id",
  /** column name */
  Key = "key",
  /** column name */
  UpdatedAt = "updated_at",
  /** column name */
  Value = "value",
}

/** input type for updating data in table "cache" */
export type Cache_Set_Input = {
  created_at?: InputMaybe<Scalars["timestamptz"]>;
  id?: InputMaybe<Scalars["String"]>;
  key?: InputMaybe<Scalars["String"]>;
  updated_at?: InputMaybe<Scalars["timestamptz"]>;
  value?: InputMaybe<Scalars["String"]>;
};

/** Streaming cursor of the table "cache" */
export type Cache_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Cache_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Cache_Stream_Cursor_Value_Input = {
  created_at?: InputMaybe<Scalars["timestamptz"]>;
  id?: InputMaybe<Scalars["String"]>;
  key?: InputMaybe<Scalars["String"]>;
  updated_at?: InputMaybe<Scalars["timestamptz"]>;
  value?: InputMaybe<Scalars["String"]>;
};

/** update columns of table "cache" */
export enum Cache_Update_Column {
  /** column name */
  CreatedAt = "created_at",
  /** column name */
  Id = "id",
  /** column name */
  Key = "key",
  /** column name */
  UpdatedAt = "updated_at",
  /** column name */
  Value = "value",
}

export type Cache_Updates = {
  /** sets the columns of the filtered rows to the given values */
  _set?: InputMaybe<Cache_Set_Input>;
  /** filter the rows which have to be updated */
  where: Cache_Bool_Exp;
};

/** ordering argument of a cursor */
export enum Cursor_Ordering {
  /** ascending ordering of the cursor */
  Asc = "ASC",
  /** descending ordering of the cursor */
  Desc = "DESC",
}

/** Invites */
export type Invite = {
  __typename?: "invite";
  email: Scalars["String"];
  expires_at: Scalars["timestamptz"];
  id: Scalars["String"];
  /** An object relationship */
  team: Team;
  team_id: Scalars["String"];
};

/** aggregated selection of "invite" */
export type Invite_Aggregate = {
  __typename?: "invite_aggregate";
  aggregate?: Maybe<Invite_Aggregate_Fields>;
  nodes: Array<Invite>;
};

/** aggregate fields of "invite" */
export type Invite_Aggregate_Fields = {
  __typename?: "invite_aggregate_fields";
  count: Scalars["Int"];
  max?: Maybe<Invite_Max_Fields>;
  min?: Maybe<Invite_Min_Fields>;
};

/** aggregate fields of "invite" */
export type Invite_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Invite_Select_Column>>;
  distinct?: InputMaybe<Scalars["Boolean"]>;
};

/** Boolean expression to filter rows from the table "invite". All fields are combined with a logical 'AND'. */
export type Invite_Bool_Exp = {
  _and?: InputMaybe<Array<Invite_Bool_Exp>>;
  _not?: InputMaybe<Invite_Bool_Exp>;
  _or?: InputMaybe<Array<Invite_Bool_Exp>>;
  email?: InputMaybe<String_Comparison_Exp>;
  expires_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  id?: InputMaybe<String_Comparison_Exp>;
  team?: InputMaybe<Team_Bool_Exp>;
  team_id?: InputMaybe<String_Comparison_Exp>;
};

/** unique or primary key constraints on table "invite" */
export enum Invite_Constraint {
  /** unique or primary key constraint on columns "id" */
  InvitePkey = "invite_pkey",
}

/** input type for inserting data into table "invite" */
export type Invite_Insert_Input = {
  email?: InputMaybe<Scalars["String"]>;
  expires_at?: InputMaybe<Scalars["timestamptz"]>;
  id?: InputMaybe<Scalars["String"]>;
  team?: InputMaybe<Team_Obj_Rel_Insert_Input>;
  team_id?: InputMaybe<Scalars["String"]>;
};

/** aggregate max on columns */
export type Invite_Max_Fields = {
  __typename?: "invite_max_fields";
  email?: Maybe<Scalars["String"]>;
  expires_at?: Maybe<Scalars["timestamptz"]>;
  id?: Maybe<Scalars["String"]>;
  team_id?: Maybe<Scalars["String"]>;
};

/** aggregate min on columns */
export type Invite_Min_Fields = {
  __typename?: "invite_min_fields";
  email?: Maybe<Scalars["String"]>;
  expires_at?: Maybe<Scalars["timestamptz"]>;
  id?: Maybe<Scalars["String"]>;
  team_id?: Maybe<Scalars["String"]>;
};

/** response of any mutation on the table "invite" */
export type Invite_Mutation_Response = {
  __typename?: "invite_mutation_response";
  /** number of rows affected by the mutation */
  affected_rows: Scalars["Int"];
  /** data from the rows affected by the mutation */
  returning: Array<Invite>;
};

/** on_conflict condition type for table "invite" */
export type Invite_On_Conflict = {
  constraint: Invite_Constraint;
  update_columns?: Array<Invite_Update_Column>;
  where?: InputMaybe<Invite_Bool_Exp>;
};

/** Ordering options when selecting data from "invite". */
export type Invite_Order_By = {
  email?: InputMaybe<Order_By>;
  expires_at?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  team?: InputMaybe<Team_Order_By>;
  team_id?: InputMaybe<Order_By>;
};

/** primary key columns input for table: invite */
export type Invite_Pk_Columns_Input = {
  id: Scalars["String"];
};

/** select columns of table "invite" */
export enum Invite_Select_Column {
  /** column name */
  Email = "email",
  /** column name */
  ExpiresAt = "expires_at",
  /** column name */
  Id = "id",
  /** column name */
  TeamId = "team_id",
}

/** input type for updating data in table "invite" */
export type Invite_Set_Input = {
  email?: InputMaybe<Scalars["String"]>;
  expires_at?: InputMaybe<Scalars["timestamptz"]>;
  id?: InputMaybe<Scalars["String"]>;
  team_id?: InputMaybe<Scalars["String"]>;
};

/** Streaming cursor of the table "invite" */
export type Invite_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Invite_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Invite_Stream_Cursor_Value_Input = {
  email?: InputMaybe<Scalars["String"]>;
  expires_at?: InputMaybe<Scalars["timestamptz"]>;
  id?: InputMaybe<Scalars["String"]>;
  team_id?: InputMaybe<Scalars["String"]>;
};

/** update columns of table "invite" */
export enum Invite_Update_Column {
  /** column name */
  Email = "email",
  /** column name */
  ExpiresAt = "expires_at",
  /** column name */
  Id = "id",
  /** column name */
  TeamId = "team_id",
}

export type Invite_Updates = {
  /** sets the columns of the filtered rows to the given values */
  _set?: InputMaybe<Invite_Set_Input>;
  /** filter the rows which have to be updated */
  where: Invite_Bool_Exp;
};

export type Jsonb_Cast_Exp = {
  String?: InputMaybe<String_Comparison_Exp>;
};

/** Boolean expression to compare columns of type "jsonb". All fields are combined with logical 'AND'. */
export type Jsonb_Comparison_Exp = {
  _cast?: InputMaybe<Jsonb_Cast_Exp>;
  /** is the column contained in the given json value */
  _contained_in?: InputMaybe<Scalars["jsonb"]>;
  /** does the column contain the given json value at the top level */
  _contains?: InputMaybe<Scalars["jsonb"]>;
  _eq?: InputMaybe<Scalars["jsonb"]>;
  _gt?: InputMaybe<Scalars["jsonb"]>;
  _gte?: InputMaybe<Scalars["jsonb"]>;
  /** does the string exist as a top-level key in the column */
  _has_key?: InputMaybe<Scalars["String"]>;
  /** do all of these strings exist as top-level keys in the column */
  _has_keys_all?: InputMaybe<Array<Scalars["String"]>>;
  /** do any of these strings exist as top-level keys in the column */
  _has_keys_any?: InputMaybe<Array<Scalars["String"]>>;
  _in?: InputMaybe<Array<Scalars["jsonb"]>>;
  _is_null?: InputMaybe<Scalars["Boolean"]>;
  _lt?: InputMaybe<Scalars["jsonb"]>;
  _lte?: InputMaybe<Scalars["jsonb"]>;
  _neq?: InputMaybe<Scalars["jsonb"]>;
  _nin?: InputMaybe<Array<Scalars["jsonb"]>>;
};

/** Stores valid JWKs used for offline signature verification */
export type Jwks = {
  __typename?: "jwks";
  created_at: Scalars["timestamptz"];
  expires_at: Scalars["timestamptz"];
  id: Scalars["String"];
  kms_id?: Maybe<Scalars["String"]>;
  public_jwk: Scalars["jsonb"];
  updated_at: Scalars["timestamptz"];
};

/** Stores valid JWKs used for offline signature verification */
export type JwksPublic_JwkArgs = {
  path?: InputMaybe<Scalars["String"]>;
};

/** aggregated selection of "jwks" */
export type Jwks_Aggregate = {
  __typename?: "jwks_aggregate";
  aggregate?: Maybe<Jwks_Aggregate_Fields>;
  nodes: Array<Jwks>;
};

/** aggregate fields of "jwks" */
export type Jwks_Aggregate_Fields = {
  __typename?: "jwks_aggregate_fields";
  count: Scalars["Int"];
  max?: Maybe<Jwks_Max_Fields>;
  min?: Maybe<Jwks_Min_Fields>;
};

/** aggregate fields of "jwks" */
export type Jwks_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Jwks_Select_Column>>;
  distinct?: InputMaybe<Scalars["Boolean"]>;
};

/** append existing jsonb value of filtered columns with new jsonb value */
export type Jwks_Append_Input = {
  public_jwk?: InputMaybe<Scalars["jsonb"]>;
};

/** Boolean expression to filter rows from the table "jwks". All fields are combined with a logical 'AND'. */
export type Jwks_Bool_Exp = {
  _and?: InputMaybe<Array<Jwks_Bool_Exp>>;
  _not?: InputMaybe<Jwks_Bool_Exp>;
  _or?: InputMaybe<Array<Jwks_Bool_Exp>>;
  created_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  expires_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  id?: InputMaybe<String_Comparison_Exp>;
  kms_id?: InputMaybe<String_Comparison_Exp>;
  public_jwk?: InputMaybe<Jsonb_Comparison_Exp>;
  updated_at?: InputMaybe<Timestamptz_Comparison_Exp>;
};

/** unique or primary key constraints on table "jwks" */
export enum Jwks_Constraint {
  /** unique or primary key constraint on columns "kms_id" */
  JwksKmsIdKey = "jwks_kms_id_key",
  /** unique or primary key constraint on columns "id" */
  JwksPkey = "jwks_pkey",
}

/** delete the field or element with specified path (for JSON arrays, negative integers count from the end) */
export type Jwks_Delete_At_Path_Input = {
  public_jwk?: InputMaybe<Array<Scalars["String"]>>;
};

/** delete the array element with specified index (negative integers count from the end). throws an error if top level container is not an array */
export type Jwks_Delete_Elem_Input = {
  public_jwk?: InputMaybe<Scalars["Int"]>;
};

/** delete key/value pair or string element. key/value pairs are matched based on their key value */
export type Jwks_Delete_Key_Input = {
  public_jwk?: InputMaybe<Scalars["String"]>;
};

/** input type for inserting data into table "jwks" */
export type Jwks_Insert_Input = {
  created_at?: InputMaybe<Scalars["timestamptz"]>;
  expires_at?: InputMaybe<Scalars["timestamptz"]>;
  id?: InputMaybe<Scalars["String"]>;
  kms_id?: InputMaybe<Scalars["String"]>;
  public_jwk?: InputMaybe<Scalars["jsonb"]>;
  updated_at?: InputMaybe<Scalars["timestamptz"]>;
};

/** aggregate max on columns */
export type Jwks_Max_Fields = {
  __typename?: "jwks_max_fields";
  created_at?: Maybe<Scalars["timestamptz"]>;
  expires_at?: Maybe<Scalars["timestamptz"]>;
  id?: Maybe<Scalars["String"]>;
  kms_id?: Maybe<Scalars["String"]>;
  updated_at?: Maybe<Scalars["timestamptz"]>;
};

/** aggregate min on columns */
export type Jwks_Min_Fields = {
  __typename?: "jwks_min_fields";
  created_at?: Maybe<Scalars["timestamptz"]>;
  expires_at?: Maybe<Scalars["timestamptz"]>;
  id?: Maybe<Scalars["String"]>;
  kms_id?: Maybe<Scalars["String"]>;
  updated_at?: Maybe<Scalars["timestamptz"]>;
};

/** response of any mutation on the table "jwks" */
export type Jwks_Mutation_Response = {
  __typename?: "jwks_mutation_response";
  /** number of rows affected by the mutation */
  affected_rows: Scalars["Int"];
  /** data from the rows affected by the mutation */
  returning: Array<Jwks>;
};

/** on_conflict condition type for table "jwks" */
export type Jwks_On_Conflict = {
  constraint: Jwks_Constraint;
  update_columns?: Array<Jwks_Update_Column>;
  where?: InputMaybe<Jwks_Bool_Exp>;
};

/** Ordering options when selecting data from "jwks". */
export type Jwks_Order_By = {
  created_at?: InputMaybe<Order_By>;
  expires_at?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  kms_id?: InputMaybe<Order_By>;
  public_jwk?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
};

/** primary key columns input for table: jwks */
export type Jwks_Pk_Columns_Input = {
  id: Scalars["String"];
};

/** prepend existing jsonb value of filtered columns with new jsonb value */
export type Jwks_Prepend_Input = {
  public_jwk?: InputMaybe<Scalars["jsonb"]>;
};

/** select columns of table "jwks" */
export enum Jwks_Select_Column {
  /** column name */
  CreatedAt = "created_at",
  /** column name */
  ExpiresAt = "expires_at",
  /** column name */
  Id = "id",
  /** column name */
  KmsId = "kms_id",
  /** column name */
  PublicJwk = "public_jwk",
  /** column name */
  UpdatedAt = "updated_at",
}

/** input type for updating data in table "jwks" */
export type Jwks_Set_Input = {
  created_at?: InputMaybe<Scalars["timestamptz"]>;
  expires_at?: InputMaybe<Scalars["timestamptz"]>;
  id?: InputMaybe<Scalars["String"]>;
  kms_id?: InputMaybe<Scalars["String"]>;
  public_jwk?: InputMaybe<Scalars["jsonb"]>;
  updated_at?: InputMaybe<Scalars["timestamptz"]>;
};

/** Streaming cursor of the table "jwks" */
export type Jwks_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Jwks_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Jwks_Stream_Cursor_Value_Input = {
  created_at?: InputMaybe<Scalars["timestamptz"]>;
  expires_at?: InputMaybe<Scalars["timestamptz"]>;
  id?: InputMaybe<Scalars["String"]>;
  kms_id?: InputMaybe<Scalars["String"]>;
  public_jwk?: InputMaybe<Scalars["jsonb"]>;
  updated_at?: InputMaybe<Scalars["timestamptz"]>;
};

/** update columns of table "jwks" */
export enum Jwks_Update_Column {
  /** column name */
  CreatedAt = "created_at",
  /** column name */
  ExpiresAt = "expires_at",
  /** column name */
  Id = "id",
  /** column name */
  KmsId = "kms_id",
  /** column name */
  PublicJwk = "public_jwk",
  /** column name */
  UpdatedAt = "updated_at",
}

export type Jwks_Updates = {
  /** append existing jsonb value of filtered columns with new jsonb value */
  _append?: InputMaybe<Jwks_Append_Input>;
  /** delete the field or element with specified path (for JSON arrays, negative integers count from the end) */
  _delete_at_path?: InputMaybe<Jwks_Delete_At_Path_Input>;
  /** delete the array element with specified index (negative integers count from the end). throws an error if top level container is not an array */
  _delete_elem?: InputMaybe<Jwks_Delete_Elem_Input>;
  /** delete key/value pair or string element. key/value pairs are matched based on their key value */
  _delete_key?: InputMaybe<Jwks_Delete_Key_Input>;
  /** prepend existing jsonb value of filtered columns with new jsonb value */
  _prepend?: InputMaybe<Jwks_Prepend_Input>;
  /** sets the columns of the filtered rows to the given values */
  _set?: InputMaybe<Jwks_Set_Input>;
  /** filter the rows which have to be updated */
  where: Jwks_Bool_Exp;
};

/** columns and relationships of "membership" */
export type Membership = {
  __typename?: "membership";
  created_at: Scalars["timestamptz"];
  id: Scalars["String"];
  role: Role_Enum;
  /** An object relationship */
  team: Team;
  team_id: Scalars["String"];
  updated_at: Scalars["timestamptz"];
  /** An object relationship */
  user: User;
  user_id: Scalars["String"];
};

/** aggregated selection of "membership" */
export type Membership_Aggregate = {
  __typename?: "membership_aggregate";
  aggregate?: Maybe<Membership_Aggregate_Fields>;
  nodes: Array<Membership>;
};

export type Membership_Aggregate_Bool_Exp = {
  count?: InputMaybe<Membership_Aggregate_Bool_Exp_Count>;
};

export type Membership_Aggregate_Bool_Exp_Count = {
  arguments?: InputMaybe<Array<Membership_Select_Column>>;
  distinct?: InputMaybe<Scalars["Boolean"]>;
  filter?: InputMaybe<Membership_Bool_Exp>;
  predicate: Int_Comparison_Exp;
};

/** aggregate fields of "membership" */
export type Membership_Aggregate_Fields = {
  __typename?: "membership_aggregate_fields";
  count: Scalars["Int"];
  max?: Maybe<Membership_Max_Fields>;
  min?: Maybe<Membership_Min_Fields>;
};

/** aggregate fields of "membership" */
export type Membership_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Membership_Select_Column>>;
  distinct?: InputMaybe<Scalars["Boolean"]>;
};

/** order by aggregate values of table "membership" */
export type Membership_Aggregate_Order_By = {
  count?: InputMaybe<Order_By>;
  max?: InputMaybe<Membership_Max_Order_By>;
  min?: InputMaybe<Membership_Min_Order_By>;
};

/** input type for inserting array relation for remote table "membership" */
export type Membership_Arr_Rel_Insert_Input = {
  data: Array<Membership_Insert_Input>;
  /** upsert condition */
  on_conflict?: InputMaybe<Membership_On_Conflict>;
};

/** Boolean expression to filter rows from the table "membership". All fields are combined with a logical 'AND'. */
export type Membership_Bool_Exp = {
  _and?: InputMaybe<Array<Membership_Bool_Exp>>;
  _not?: InputMaybe<Membership_Bool_Exp>;
  _or?: InputMaybe<Array<Membership_Bool_Exp>>;
  created_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  id?: InputMaybe<String_Comparison_Exp>;
  role?: InputMaybe<Role_Enum_Comparison_Exp>;
  team?: InputMaybe<Team_Bool_Exp>;
  team_id?: InputMaybe<String_Comparison_Exp>;
  updated_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  user?: InputMaybe<User_Bool_Exp>;
  user_id?: InputMaybe<String_Comparison_Exp>;
};

/** unique or primary key constraints on table "membership" */
export enum Membership_Constraint {
  /** unique or primary key constraint on columns "id" */
  MembershipPkey = "membership_pkey",
}

/** input type for inserting data into table "membership" */
export type Membership_Insert_Input = {
  created_at?: InputMaybe<Scalars["timestamptz"]>;
  id?: InputMaybe<Scalars["String"]>;
  role?: InputMaybe<Role_Enum>;
  team?: InputMaybe<Team_Obj_Rel_Insert_Input>;
  team_id?: InputMaybe<Scalars["String"]>;
  updated_at?: InputMaybe<Scalars["timestamptz"]>;
  user?: InputMaybe<User_Obj_Rel_Insert_Input>;
  user_id?: InputMaybe<Scalars["String"]>;
};

/** aggregate max on columns */
export type Membership_Max_Fields = {
  __typename?: "membership_max_fields";
  created_at?: Maybe<Scalars["timestamptz"]>;
  id?: Maybe<Scalars["String"]>;
  team_id?: Maybe<Scalars["String"]>;
  updated_at?: Maybe<Scalars["timestamptz"]>;
  user_id?: Maybe<Scalars["String"]>;
};

/** order by max() on columns of table "membership" */
export type Membership_Max_Order_By = {
  created_at?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  team_id?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
  user_id?: InputMaybe<Order_By>;
};

/** aggregate min on columns */
export type Membership_Min_Fields = {
  __typename?: "membership_min_fields";
  created_at?: Maybe<Scalars["timestamptz"]>;
  id?: Maybe<Scalars["String"]>;
  team_id?: Maybe<Scalars["String"]>;
  updated_at?: Maybe<Scalars["timestamptz"]>;
  user_id?: Maybe<Scalars["String"]>;
};

/** order by min() on columns of table "membership" */
export type Membership_Min_Order_By = {
  created_at?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  team_id?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
  user_id?: InputMaybe<Order_By>;
};

/** response of any mutation on the table "membership" */
export type Membership_Mutation_Response = {
  __typename?: "membership_mutation_response";
  /** number of rows affected by the mutation */
  affected_rows: Scalars["Int"];
  /** data from the rows affected by the mutation */
  returning: Array<Membership>;
};

/** on_conflict condition type for table "membership" */
export type Membership_On_Conflict = {
  constraint: Membership_Constraint;
  update_columns?: Array<Membership_Update_Column>;
  where?: InputMaybe<Membership_Bool_Exp>;
};

/** Ordering options when selecting data from "membership". */
export type Membership_Order_By = {
  created_at?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  role?: InputMaybe<Order_By>;
  team?: InputMaybe<Team_Order_By>;
  team_id?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
  user?: InputMaybe<User_Order_By>;
  user_id?: InputMaybe<Order_By>;
};

/** primary key columns input for table: membership */
export type Membership_Pk_Columns_Input = {
  id: Scalars["String"];
};

/** select columns of table "membership" */
export enum Membership_Select_Column {
  /** column name */
  CreatedAt = "created_at",
  /** column name */
  Id = "id",
  /** column name */
  Role = "role",
  /** column name */
  TeamId = "team_id",
  /** column name */
  UpdatedAt = "updated_at",
  /** column name */
  UserId = "user_id",
}

/** input type for updating data in table "membership" */
export type Membership_Set_Input = {
  created_at?: InputMaybe<Scalars["timestamptz"]>;
  id?: InputMaybe<Scalars["String"]>;
  role?: InputMaybe<Role_Enum>;
  team_id?: InputMaybe<Scalars["String"]>;
  updated_at?: InputMaybe<Scalars["timestamptz"]>;
  user_id?: InputMaybe<Scalars["String"]>;
};

/** Streaming cursor of the table "membership" */
export type Membership_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Membership_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Membership_Stream_Cursor_Value_Input = {
  created_at?: InputMaybe<Scalars["timestamptz"]>;
  id?: InputMaybe<Scalars["String"]>;
  role?: InputMaybe<Role_Enum>;
  team_id?: InputMaybe<Scalars["String"]>;
  updated_at?: InputMaybe<Scalars["timestamptz"]>;
  user_id?: InputMaybe<Scalars["String"]>;
};

/** update columns of table "membership" */
export enum Membership_Update_Column {
  /** column name */
  CreatedAt = "created_at",
  /** column name */
  Id = "id",
  /** column name */
  Role = "role",
  /** column name */
  TeamId = "team_id",
  /** column name */
  UpdatedAt = "updated_at",
  /** column name */
  UserId = "user_id",
}

export type Membership_Updates = {
  /** sets the columns of the filtered rows to the given values */
  _set?: InputMaybe<Membership_Set_Input>;
  /** filter the rows which have to be updated */
  where: Membership_Bool_Exp;
};

/** mutation root */
export type Mutation_Root = {
  __typename?: "mutation_root";
  /** delete data from the table: "action" */
  delete_action?: Maybe<Action_Mutation_Response>;
  /** delete single row from the table: "action" */
  delete_action_by_pk?: Maybe<Action>;
  /** delete data from the table: "action_stats_returning" */
  delete_action_stats_returning?: Maybe<Action_Stats_Returning_Mutation_Response>;
  /** delete single row from the table: "action_stats_returning" */
  delete_action_stats_returning_by_pk?: Maybe<Action_Stats_Returning>;
  /** delete data from the table: "api_key" */
  delete_api_key?: Maybe<Api_Key_Mutation_Response>;
  /** delete single row from the table: "api_key" */
  delete_api_key_by_pk?: Maybe<Api_Key>;
  /** delete data from the table: "app" */
  delete_app?: Maybe<App_Mutation_Response>;
  /** delete single row from the table: "app" */
  delete_app_by_pk?: Maybe<App>;
  /** delete data from the table: "app_metadata" */
  delete_app_metadata?: Maybe<App_Metadata_Mutation_Response>;
  /** delete single row from the table: "app_metadata" */
  delete_app_metadata_by_pk?: Maybe<App_Metadata>;
  /** delete data from the table: "app_rankings" */
  delete_app_rankings?: Maybe<App_Rankings_Mutation_Response>;
  /** delete single row from the table: "app_rankings" */
  delete_app_rankings_by_pk?: Maybe<App_Rankings>;
  /** delete data from the table: "app_stats_returning" */
  delete_app_stats_returning?: Maybe<App_Stats_Returning_Mutation_Response>;
  /** delete single row from the table: "app_stats_returning" */
  delete_app_stats_returning_by_pk?: Maybe<App_Stats_Returning>;
  /** delete data from the table: "auth_code" */
  delete_auth_code?: Maybe<Auth_Code_Mutation_Response>;
  /** delete single row from the table: "auth_code" */
  delete_auth_code_by_pk?: Maybe<Auth_Code>;
  /** delete data from the table: "cache" */
  delete_cache?: Maybe<Cache_Mutation_Response>;
  /** delete single row from the table: "cache" */
  delete_cache_by_pk?: Maybe<Cache>;
  /** delete data from the table: "invite" */
  delete_invite?: Maybe<Invite_Mutation_Response>;
  /** delete single row from the table: "invite" */
  delete_invite_by_pk?: Maybe<Invite>;
  /** delete data from the table: "jwks" */
  delete_jwks?: Maybe<Jwks_Mutation_Response>;
  /** delete single row from the table: "jwks" */
  delete_jwks_by_pk?: Maybe<Jwks>;
  /** delete data from the table: "membership" */
  delete_membership?: Maybe<Membership_Mutation_Response>;
  /** delete single row from the table: "membership" */
  delete_membership_by_pk?: Maybe<Membership>;
  /** delete data from the table: "nullifier" */
  delete_nullifier?: Maybe<Nullifier_Mutation_Response>;
  /** delete single row from the table: "nullifier" */
  delete_nullifier_by_pk?: Maybe<Nullifier>;
  /** delete data from the table: "redirect" */
  delete_redirect?: Maybe<Redirect_Mutation_Response>;
  /** delete single row from the table: "redirect" */
  delete_redirect_by_pk?: Maybe<Redirect>;
  /** delete data from the table: "role" */
  delete_role?: Maybe<Role_Mutation_Response>;
  /** delete single row from the table: "role" */
  delete_role_by_pk?: Maybe<Role>;
  /** delete data from the table: "team" */
  delete_team?: Maybe<Team_Mutation_Response>;
  /** delete single row from the table: "team" */
  delete_team_by_pk?: Maybe<Team>;
  delete_unverified_images?: Maybe<DeleteImageOutput>;
  /** delete data from the table: "user" */
  delete_user?: Maybe<User_Mutation_Response>;
  /** delete single row from the table: "user" */
  delete_user_by_pk?: Maybe<User>;
  /** insert data into the table: "action" */
  insert_action?: Maybe<Action_Mutation_Response>;
  /** insert a single row into the table: "action" */
  insert_action_one?: Maybe<Action>;
  /** insert data into the table: "action_stats_returning" */
  insert_action_stats_returning?: Maybe<Action_Stats_Returning_Mutation_Response>;
  /** insert a single row into the table: "action_stats_returning" */
  insert_action_stats_returning_one?: Maybe<Action_Stats_Returning>;
  /** insert data into the table: "api_key" */
  insert_api_key?: Maybe<Api_Key_Mutation_Response>;
  /** insert a single row into the table: "api_key" */
  insert_api_key_one?: Maybe<Api_Key>;
  /** insert data into the table: "app" */
  insert_app?: Maybe<App_Mutation_Response>;
  /** insert data into the table: "app_metadata" */
  insert_app_metadata?: Maybe<App_Metadata_Mutation_Response>;
  /** insert a single row into the table: "app_metadata" */
  insert_app_metadata_one?: Maybe<App_Metadata>;
  /** insert a single row into the table: "app" */
  insert_app_one?: Maybe<App>;
  /** insert data into the table: "app_rankings" */
  insert_app_rankings?: Maybe<App_Rankings_Mutation_Response>;
  /** insert a single row into the table: "app_rankings" */
  insert_app_rankings_one?: Maybe<App_Rankings>;
  /** insert data into the table: "app_stats_returning" */
  insert_app_stats_returning?: Maybe<App_Stats_Returning_Mutation_Response>;
  /** insert a single row into the table: "app_stats_returning" */
  insert_app_stats_returning_one?: Maybe<App_Stats_Returning>;
  /** insert data into the table: "auth_code" */
  insert_auth_code?: Maybe<Auth_Code_Mutation_Response>;
  /** insert a single row into the table: "auth_code" */
  insert_auth_code_one?: Maybe<Auth_Code>;
  /** insert data into the table: "cache" */
  insert_cache?: Maybe<Cache_Mutation_Response>;
  /** insert a single row into the table: "cache" */
  insert_cache_one?: Maybe<Cache>;
  /** insert data into the table: "invite" */
  insert_invite?: Maybe<Invite_Mutation_Response>;
  /** insert a single row into the table: "invite" */
  insert_invite_one?: Maybe<Invite>;
  /** insert data into the table: "jwks" */
  insert_jwks?: Maybe<Jwks_Mutation_Response>;
  /** insert a single row into the table: "jwks" */
  insert_jwks_one?: Maybe<Jwks>;
  /** insert data into the table: "membership" */
  insert_membership?: Maybe<Membership_Mutation_Response>;
  /** insert a single row into the table: "membership" */
  insert_membership_one?: Maybe<Membership>;
  /** insert data into the table: "nullifier" */
  insert_nullifier?: Maybe<Nullifier_Mutation_Response>;
  /** insert a single row into the table: "nullifier" */
  insert_nullifier_one?: Maybe<Nullifier>;
  /** insert data into the table: "redirect" */
  insert_redirect?: Maybe<Redirect_Mutation_Response>;
  /** insert a single row into the table: "redirect" */
  insert_redirect_one?: Maybe<Redirect>;
  /** insert data into the table: "role" */
  insert_role?: Maybe<Role_Mutation_Response>;
  /** insert a single row into the table: "role" */
  insert_role_one?: Maybe<Role>;
  /** insert data into the table: "team" */
  insert_team?: Maybe<Team_Mutation_Response>;
  /** insert a single row into the table: "team" */
  insert_team_one?: Maybe<Team>;
  /** insert data into the table: "user" */
  insert_user?: Maybe<User_Mutation_Response>;
  /** insert a single row into the table: "user" */
  insert_user_one?: Maybe<User>;
  /** Create invites and send emails */
  invite_team_members?: Maybe<InviteTeamMembersOutput>;
  /** Reset the given API key for the developer portal */
  reset_api_key?: Maybe<ResetApiOutput>;
  /** Reset the client secret for a Sign in with World ID application */
  reset_client_secret?: Maybe<ResetClientOutput>;
  /** update data of the table: "action" */
  update_action?: Maybe<Action_Mutation_Response>;
  /** update single row of the table: "action" */
  update_action_by_pk?: Maybe<Action>;
  /** update multiples rows of table: "action" */
  update_action_many?: Maybe<Array<Maybe<Action_Mutation_Response>>>;
  /** update data of the table: "action_stats_returning" */
  update_action_stats_returning?: Maybe<Action_Stats_Returning_Mutation_Response>;
  /** update single row of the table: "action_stats_returning" */
  update_action_stats_returning_by_pk?: Maybe<Action_Stats_Returning>;
  /** update multiples rows of table: "action_stats_returning" */
  update_action_stats_returning_many?: Maybe<
    Array<Maybe<Action_Stats_Returning_Mutation_Response>>
  >;
  /** update data of the table: "api_key" */
  update_api_key?: Maybe<Api_Key_Mutation_Response>;
  /** update single row of the table: "api_key" */
  update_api_key_by_pk?: Maybe<Api_Key>;
  /** update multiples rows of table: "api_key" */
  update_api_key_many?: Maybe<Array<Maybe<Api_Key_Mutation_Response>>>;
  /** update data of the table: "app" */
  update_app?: Maybe<App_Mutation_Response>;
  /** update single row of the table: "app" */
  update_app_by_pk?: Maybe<App>;
  /** update multiples rows of table: "app" */
  update_app_many?: Maybe<Array<Maybe<App_Mutation_Response>>>;
  /** update data of the table: "app_metadata" */
  update_app_metadata?: Maybe<App_Metadata_Mutation_Response>;
  /** update single row of the table: "app_metadata" */
  update_app_metadata_by_pk?: Maybe<App_Metadata>;
  /** update multiples rows of table: "app_metadata" */
  update_app_metadata_many?: Maybe<
    Array<Maybe<App_Metadata_Mutation_Response>>
  >;
  /** update data of the table: "app_rankings" */
  update_app_rankings?: Maybe<App_Rankings_Mutation_Response>;
  /** update single row of the table: "app_rankings" */
  update_app_rankings_by_pk?: Maybe<App_Rankings>;
  /** update multiples rows of table: "app_rankings" */
  update_app_rankings_many?: Maybe<
    Array<Maybe<App_Rankings_Mutation_Response>>
  >;
  /** update data of the table: "app_stats_returning" */
  update_app_stats_returning?: Maybe<App_Stats_Returning_Mutation_Response>;
  /** update single row of the table: "app_stats_returning" */
  update_app_stats_returning_by_pk?: Maybe<App_Stats_Returning>;
  /** update multiples rows of table: "app_stats_returning" */
  update_app_stats_returning_many?: Maybe<
    Array<Maybe<App_Stats_Returning_Mutation_Response>>
  >;
  /** update data of the table: "auth_code" */
  update_auth_code?: Maybe<Auth_Code_Mutation_Response>;
  /** update single row of the table: "auth_code" */
  update_auth_code_by_pk?: Maybe<Auth_Code>;
  /** update multiples rows of table: "auth_code" */
  update_auth_code_many?: Maybe<Array<Maybe<Auth_Code_Mutation_Response>>>;
  /** update data of the table: "cache" */
  update_cache?: Maybe<Cache_Mutation_Response>;
  /** update single row of the table: "cache" */
  update_cache_by_pk?: Maybe<Cache>;
  /** update multiples rows of table: "cache" */
  update_cache_many?: Maybe<Array<Maybe<Cache_Mutation_Response>>>;
  /** update data of the table: "invite" */
  update_invite?: Maybe<Invite_Mutation_Response>;
  /** update single row of the table: "invite" */
  update_invite_by_pk?: Maybe<Invite>;
  /** update multiples rows of table: "invite" */
  update_invite_many?: Maybe<Array<Maybe<Invite_Mutation_Response>>>;
  /** update data of the table: "jwks" */
  update_jwks?: Maybe<Jwks_Mutation_Response>;
  /** update single row of the table: "jwks" */
  update_jwks_by_pk?: Maybe<Jwks>;
  /** update multiples rows of table: "jwks" */
  update_jwks_many?: Maybe<Array<Maybe<Jwks_Mutation_Response>>>;
  /** update data of the table: "membership" */
  update_membership?: Maybe<Membership_Mutation_Response>;
  /** update single row of the table: "membership" */
  update_membership_by_pk?: Maybe<Membership>;
  /** update multiples rows of table: "membership" */
  update_membership_many?: Maybe<Array<Maybe<Membership_Mutation_Response>>>;
  /** update data of the table: "nullifier" */
  update_nullifier?: Maybe<Nullifier_Mutation_Response>;
  /** update single row of the table: "nullifier" */
  update_nullifier_by_pk?: Maybe<Nullifier>;
  /** update multiples rows of table: "nullifier" */
  update_nullifier_many?: Maybe<Array<Maybe<Nullifier_Mutation_Response>>>;
  /** update data of the table: "redirect" */
  update_redirect?: Maybe<Redirect_Mutation_Response>;
  /** update single row of the table: "redirect" */
  update_redirect_by_pk?: Maybe<Redirect>;
  /** update multiples rows of table: "redirect" */
  update_redirect_many?: Maybe<Array<Maybe<Redirect_Mutation_Response>>>;
  /** update data of the table: "role" */
  update_role?: Maybe<Role_Mutation_Response>;
  /** update single row of the table: "role" */
  update_role_by_pk?: Maybe<Role>;
  /** update multiples rows of table: "role" */
  update_role_many?: Maybe<Array<Maybe<Role_Mutation_Response>>>;
  /** update data of the table: "team" */
  update_team?: Maybe<Team_Mutation_Response>;
  /** update single row of the table: "team" */
  update_team_by_pk?: Maybe<Team>;
  /** update multiples rows of table: "team" */
  update_team_many?: Maybe<Array<Maybe<Team_Mutation_Response>>>;
  /** update data of the table: "user" */
  update_user?: Maybe<User_Mutation_Response>;
  /** update single row of the table: "user" */
  update_user_by_pk?: Maybe<User>;
  /** update multiples rows of table: "user" */
  update_user_many?: Maybe<Array<Maybe<User_Mutation_Response>>>;
  /** Verify an App */
  verify_app?: Maybe<VerifyAppOutput>;
};

/** mutation root */
export type Mutation_RootDelete_ActionArgs = {
  where: Action_Bool_Exp;
};

/** mutation root */
export type Mutation_RootDelete_Action_By_PkArgs = {
  id: Scalars["String"];
};

/** mutation root */
export type Mutation_RootDelete_Action_Stats_ReturningArgs = {
  where: Action_Stats_Returning_Bool_Exp;
};

/** mutation root */
export type Mutation_RootDelete_Action_Stats_Returning_By_PkArgs = {
  action_id: Scalars["String"];
};

/** mutation root */
export type Mutation_RootDelete_Api_KeyArgs = {
  where: Api_Key_Bool_Exp;
};

/** mutation root */
export type Mutation_RootDelete_Api_Key_By_PkArgs = {
  id: Scalars["String"];
};

/** mutation root */
export type Mutation_RootDelete_AppArgs = {
  where: App_Bool_Exp;
};

/** mutation root */
export type Mutation_RootDelete_App_By_PkArgs = {
  id: Scalars["String"];
};

/** mutation root */
export type Mutation_RootDelete_App_MetadataArgs = {
  where: App_Metadata_Bool_Exp;
};

/** mutation root */
export type Mutation_RootDelete_App_Metadata_By_PkArgs = {
  id: Scalars["String"];
};

/** mutation root */
export type Mutation_RootDelete_App_RankingsArgs = {
  where: App_Rankings_Bool_Exp;
};

/** mutation root */
export type Mutation_RootDelete_App_Rankings_By_PkArgs = {
  id: Scalars["String"];
};

/** mutation root */
export type Mutation_RootDelete_App_Stats_ReturningArgs = {
  where: App_Stats_Returning_Bool_Exp;
};

/** mutation root */
export type Mutation_RootDelete_App_Stats_Returning_By_PkArgs = {
  app_id: Scalars["String"];
};

/** mutation root */
export type Mutation_RootDelete_Auth_CodeArgs = {
  where: Auth_Code_Bool_Exp;
};

/** mutation root */
export type Mutation_RootDelete_Auth_Code_By_PkArgs = {
  id: Scalars["String"];
};

/** mutation root */
export type Mutation_RootDelete_CacheArgs = {
  where: Cache_Bool_Exp;
};

/** mutation root */
export type Mutation_RootDelete_Cache_By_PkArgs = {
  id: Scalars["String"];
};

/** mutation root */
export type Mutation_RootDelete_InviteArgs = {
  where: Invite_Bool_Exp;
};

/** mutation root */
export type Mutation_RootDelete_Invite_By_PkArgs = {
  id: Scalars["String"];
};

/** mutation root */
export type Mutation_RootDelete_JwksArgs = {
  where: Jwks_Bool_Exp;
};

/** mutation root */
export type Mutation_RootDelete_Jwks_By_PkArgs = {
  id: Scalars["String"];
};

/** mutation root */
export type Mutation_RootDelete_MembershipArgs = {
  where: Membership_Bool_Exp;
};

/** mutation root */
export type Mutation_RootDelete_Membership_By_PkArgs = {
  id: Scalars["String"];
};

/** mutation root */
export type Mutation_RootDelete_NullifierArgs = {
  where: Nullifier_Bool_Exp;
};

/** mutation root */
export type Mutation_RootDelete_Nullifier_By_PkArgs = {
  id: Scalars["String"];
};

/** mutation root */
export type Mutation_RootDelete_RedirectArgs = {
  where: Redirect_Bool_Exp;
};

/** mutation root */
export type Mutation_RootDelete_Redirect_By_PkArgs = {
  id: Scalars["String"];
};

/** mutation root */
export type Mutation_RootDelete_RoleArgs = {
  where: Role_Bool_Exp;
};

/** mutation root */
export type Mutation_RootDelete_Role_By_PkArgs = {
  value: Scalars["String"];
};

/** mutation root */
export type Mutation_RootDelete_TeamArgs = {
  where: Team_Bool_Exp;
};

/** mutation root */
export type Mutation_RootDelete_Team_By_PkArgs = {
  id: Scalars["String"];
};

/** mutation root */
export type Mutation_RootDelete_Unverified_ImagesArgs = {
  app_id: Scalars["String"];
};

/** mutation root */
export type Mutation_RootDelete_UserArgs = {
  where: User_Bool_Exp;
};

/** mutation root */
export type Mutation_RootDelete_User_By_PkArgs = {
  id: Scalars["String"];
};

/** mutation root */
export type Mutation_RootInsert_ActionArgs = {
  objects: Array<Action_Insert_Input>;
  on_conflict?: InputMaybe<Action_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_Action_OneArgs = {
  object: Action_Insert_Input;
  on_conflict?: InputMaybe<Action_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_Action_Stats_ReturningArgs = {
  objects: Array<Action_Stats_Returning_Insert_Input>;
  on_conflict?: InputMaybe<Action_Stats_Returning_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_Action_Stats_Returning_OneArgs = {
  object: Action_Stats_Returning_Insert_Input;
  on_conflict?: InputMaybe<Action_Stats_Returning_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_Api_KeyArgs = {
  objects: Array<Api_Key_Insert_Input>;
  on_conflict?: InputMaybe<Api_Key_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_Api_Key_OneArgs = {
  object: Api_Key_Insert_Input;
  on_conflict?: InputMaybe<Api_Key_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_AppArgs = {
  objects: Array<App_Insert_Input>;
  on_conflict?: InputMaybe<App_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_App_MetadataArgs = {
  objects: Array<App_Metadata_Insert_Input>;
  on_conflict?: InputMaybe<App_Metadata_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_App_Metadata_OneArgs = {
  object: App_Metadata_Insert_Input;
  on_conflict?: InputMaybe<App_Metadata_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_App_OneArgs = {
  object: App_Insert_Input;
  on_conflict?: InputMaybe<App_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_App_RankingsArgs = {
  objects: Array<App_Rankings_Insert_Input>;
  on_conflict?: InputMaybe<App_Rankings_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_App_Rankings_OneArgs = {
  object: App_Rankings_Insert_Input;
  on_conflict?: InputMaybe<App_Rankings_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_App_Stats_ReturningArgs = {
  objects: Array<App_Stats_Returning_Insert_Input>;
  on_conflict?: InputMaybe<App_Stats_Returning_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_App_Stats_Returning_OneArgs = {
  object: App_Stats_Returning_Insert_Input;
  on_conflict?: InputMaybe<App_Stats_Returning_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_Auth_CodeArgs = {
  objects: Array<Auth_Code_Insert_Input>;
  on_conflict?: InputMaybe<Auth_Code_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_Auth_Code_OneArgs = {
  object: Auth_Code_Insert_Input;
  on_conflict?: InputMaybe<Auth_Code_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_CacheArgs = {
  objects: Array<Cache_Insert_Input>;
  on_conflict?: InputMaybe<Cache_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_Cache_OneArgs = {
  object: Cache_Insert_Input;
  on_conflict?: InputMaybe<Cache_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_InviteArgs = {
  objects: Array<Invite_Insert_Input>;
  on_conflict?: InputMaybe<Invite_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_Invite_OneArgs = {
  object: Invite_Insert_Input;
  on_conflict?: InputMaybe<Invite_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_JwksArgs = {
  objects: Array<Jwks_Insert_Input>;
  on_conflict?: InputMaybe<Jwks_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_Jwks_OneArgs = {
  object: Jwks_Insert_Input;
  on_conflict?: InputMaybe<Jwks_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_MembershipArgs = {
  objects: Array<Membership_Insert_Input>;
  on_conflict?: InputMaybe<Membership_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_Membership_OneArgs = {
  object: Membership_Insert_Input;
  on_conflict?: InputMaybe<Membership_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_NullifierArgs = {
  objects: Array<Nullifier_Insert_Input>;
  on_conflict?: InputMaybe<Nullifier_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_Nullifier_OneArgs = {
  object: Nullifier_Insert_Input;
  on_conflict?: InputMaybe<Nullifier_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_RedirectArgs = {
  objects: Array<Redirect_Insert_Input>;
  on_conflict?: InputMaybe<Redirect_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_Redirect_OneArgs = {
  object: Redirect_Insert_Input;
  on_conflict?: InputMaybe<Redirect_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_RoleArgs = {
  objects: Array<Role_Insert_Input>;
  on_conflict?: InputMaybe<Role_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_Role_OneArgs = {
  object: Role_Insert_Input;
  on_conflict?: InputMaybe<Role_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_TeamArgs = {
  objects: Array<Team_Insert_Input>;
  on_conflict?: InputMaybe<Team_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_Team_OneArgs = {
  object: Team_Insert_Input;
  on_conflict?: InputMaybe<Team_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_UserArgs = {
  objects: Array<User_Insert_Input>;
  on_conflict?: InputMaybe<User_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_User_OneArgs = {
  object: User_Insert_Input;
  on_conflict?: InputMaybe<User_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInvite_Team_MembersArgs = {
  emails?: InputMaybe<Array<Scalars["String"]>>;
  team_id: Scalars["String"];
};

/** mutation root */
export type Mutation_RootReset_Api_KeyArgs = {
  id: Scalars["String"];
  team_id: Scalars["String"];
};

/** mutation root */
export type Mutation_RootReset_Client_SecretArgs = {
  app_id: Scalars["String"];
  team_id: Scalars["String"];
};

/** mutation root */
export type Mutation_RootUpdate_ActionArgs = {
  _inc?: InputMaybe<Action_Inc_Input>;
  _set?: InputMaybe<Action_Set_Input>;
  where: Action_Bool_Exp;
};

/** mutation root */
export type Mutation_RootUpdate_Action_By_PkArgs = {
  _inc?: InputMaybe<Action_Inc_Input>;
  _set?: InputMaybe<Action_Set_Input>;
  pk_columns: Action_Pk_Columns_Input;
};

/** mutation root */
export type Mutation_RootUpdate_Action_ManyArgs = {
  updates: Array<Action_Updates>;
};

/** mutation root */
export type Mutation_RootUpdate_Action_Stats_ReturningArgs = {
  _inc?: InputMaybe<Action_Stats_Returning_Inc_Input>;
  _set?: InputMaybe<Action_Stats_Returning_Set_Input>;
  where: Action_Stats_Returning_Bool_Exp;
};

/** mutation root */
export type Mutation_RootUpdate_Action_Stats_Returning_By_PkArgs = {
  _inc?: InputMaybe<Action_Stats_Returning_Inc_Input>;
  _set?: InputMaybe<Action_Stats_Returning_Set_Input>;
  pk_columns: Action_Stats_Returning_Pk_Columns_Input;
};

/** mutation root */
export type Mutation_RootUpdate_Action_Stats_Returning_ManyArgs = {
  updates: Array<Action_Stats_Returning_Updates>;
};

/** mutation root */
export type Mutation_RootUpdate_Api_KeyArgs = {
  _set?: InputMaybe<Api_Key_Set_Input>;
  where: Api_Key_Bool_Exp;
};

/** mutation root */
export type Mutation_RootUpdate_Api_Key_By_PkArgs = {
  _set?: InputMaybe<Api_Key_Set_Input>;
  pk_columns: Api_Key_Pk_Columns_Input;
};

/** mutation root */
export type Mutation_RootUpdate_Api_Key_ManyArgs = {
  updates: Array<Api_Key_Updates>;
};

/** mutation root */
export type Mutation_RootUpdate_AppArgs = {
  _set?: InputMaybe<App_Set_Input>;
  where: App_Bool_Exp;
};

/** mutation root */
export type Mutation_RootUpdate_App_By_PkArgs = {
  _set?: InputMaybe<App_Set_Input>;
  pk_columns: App_Pk_Columns_Input;
};

/** mutation root */
export type Mutation_RootUpdate_App_ManyArgs = {
  updates: Array<App_Updates>;
};

/** mutation root */
export type Mutation_RootUpdate_App_MetadataArgs = {
  _set?: InputMaybe<App_Metadata_Set_Input>;
  where: App_Metadata_Bool_Exp;
};

/** mutation root */
export type Mutation_RootUpdate_App_Metadata_By_PkArgs = {
  _set?: InputMaybe<App_Metadata_Set_Input>;
  pk_columns: App_Metadata_Pk_Columns_Input;
};

/** mutation root */
export type Mutation_RootUpdate_App_Metadata_ManyArgs = {
  updates: Array<App_Metadata_Updates>;
};

/** mutation root */
export type Mutation_RootUpdate_App_RankingsArgs = {
  _set?: InputMaybe<App_Rankings_Set_Input>;
  where: App_Rankings_Bool_Exp;
};

/** mutation root */
export type Mutation_RootUpdate_App_Rankings_By_PkArgs = {
  _set?: InputMaybe<App_Rankings_Set_Input>;
  pk_columns: App_Rankings_Pk_Columns_Input;
};

/** mutation root */
export type Mutation_RootUpdate_App_Rankings_ManyArgs = {
  updates: Array<App_Rankings_Updates>;
};

/** mutation root */
export type Mutation_RootUpdate_App_Stats_ReturningArgs = {
  _inc?: InputMaybe<App_Stats_Returning_Inc_Input>;
  _set?: InputMaybe<App_Stats_Returning_Set_Input>;
  where: App_Stats_Returning_Bool_Exp;
};

/** mutation root */
export type Mutation_RootUpdate_App_Stats_Returning_By_PkArgs = {
  _inc?: InputMaybe<App_Stats_Returning_Inc_Input>;
  _set?: InputMaybe<App_Stats_Returning_Set_Input>;
  pk_columns: App_Stats_Returning_Pk_Columns_Input;
};

/** mutation root */
export type Mutation_RootUpdate_App_Stats_Returning_ManyArgs = {
  updates: Array<App_Stats_Returning_Updates>;
};

/** mutation root */
export type Mutation_RootUpdate_Auth_CodeArgs = {
  _append?: InputMaybe<Auth_Code_Append_Input>;
  _delete_at_path?: InputMaybe<Auth_Code_Delete_At_Path_Input>;
  _delete_elem?: InputMaybe<Auth_Code_Delete_Elem_Input>;
  _delete_key?: InputMaybe<Auth_Code_Delete_Key_Input>;
  _prepend?: InputMaybe<Auth_Code_Prepend_Input>;
  _set?: InputMaybe<Auth_Code_Set_Input>;
  where: Auth_Code_Bool_Exp;
};

/** mutation root */
export type Mutation_RootUpdate_Auth_Code_By_PkArgs = {
  _append?: InputMaybe<Auth_Code_Append_Input>;
  _delete_at_path?: InputMaybe<Auth_Code_Delete_At_Path_Input>;
  _delete_elem?: InputMaybe<Auth_Code_Delete_Elem_Input>;
  _delete_key?: InputMaybe<Auth_Code_Delete_Key_Input>;
  _prepend?: InputMaybe<Auth_Code_Prepend_Input>;
  _set?: InputMaybe<Auth_Code_Set_Input>;
  pk_columns: Auth_Code_Pk_Columns_Input;
};

/** mutation root */
export type Mutation_RootUpdate_Auth_Code_ManyArgs = {
  updates: Array<Auth_Code_Updates>;
};

/** mutation root */
export type Mutation_RootUpdate_CacheArgs = {
  _set?: InputMaybe<Cache_Set_Input>;
  where: Cache_Bool_Exp;
};

/** mutation root */
export type Mutation_RootUpdate_Cache_By_PkArgs = {
  _set?: InputMaybe<Cache_Set_Input>;
  pk_columns: Cache_Pk_Columns_Input;
};

/** mutation root */
export type Mutation_RootUpdate_Cache_ManyArgs = {
  updates: Array<Cache_Updates>;
};

/** mutation root */
export type Mutation_RootUpdate_InviteArgs = {
  _set?: InputMaybe<Invite_Set_Input>;
  where: Invite_Bool_Exp;
};

/** mutation root */
export type Mutation_RootUpdate_Invite_By_PkArgs = {
  _set?: InputMaybe<Invite_Set_Input>;
  pk_columns: Invite_Pk_Columns_Input;
};

/** mutation root */
export type Mutation_RootUpdate_Invite_ManyArgs = {
  updates: Array<Invite_Updates>;
};

/** mutation root */
export type Mutation_RootUpdate_JwksArgs = {
  _append?: InputMaybe<Jwks_Append_Input>;
  _delete_at_path?: InputMaybe<Jwks_Delete_At_Path_Input>;
  _delete_elem?: InputMaybe<Jwks_Delete_Elem_Input>;
  _delete_key?: InputMaybe<Jwks_Delete_Key_Input>;
  _prepend?: InputMaybe<Jwks_Prepend_Input>;
  _set?: InputMaybe<Jwks_Set_Input>;
  where: Jwks_Bool_Exp;
};

/** mutation root */
export type Mutation_RootUpdate_Jwks_By_PkArgs = {
  _append?: InputMaybe<Jwks_Append_Input>;
  _delete_at_path?: InputMaybe<Jwks_Delete_At_Path_Input>;
  _delete_elem?: InputMaybe<Jwks_Delete_Elem_Input>;
  _delete_key?: InputMaybe<Jwks_Delete_Key_Input>;
  _prepend?: InputMaybe<Jwks_Prepend_Input>;
  _set?: InputMaybe<Jwks_Set_Input>;
  pk_columns: Jwks_Pk_Columns_Input;
};

/** mutation root */
export type Mutation_RootUpdate_Jwks_ManyArgs = {
  updates: Array<Jwks_Updates>;
};

/** mutation root */
export type Mutation_RootUpdate_MembershipArgs = {
  _set?: InputMaybe<Membership_Set_Input>;
  where: Membership_Bool_Exp;
};

/** mutation root */
export type Mutation_RootUpdate_Membership_By_PkArgs = {
  _set?: InputMaybe<Membership_Set_Input>;
  pk_columns: Membership_Pk_Columns_Input;
};

/** mutation root */
export type Mutation_RootUpdate_Membership_ManyArgs = {
  updates: Array<Membership_Updates>;
};

/** mutation root */
export type Mutation_RootUpdate_NullifierArgs = {
  _inc?: InputMaybe<Nullifier_Inc_Input>;
  _set?: InputMaybe<Nullifier_Set_Input>;
  where: Nullifier_Bool_Exp;
};

/** mutation root */
export type Mutation_RootUpdate_Nullifier_By_PkArgs = {
  _inc?: InputMaybe<Nullifier_Inc_Input>;
  _set?: InputMaybe<Nullifier_Set_Input>;
  pk_columns: Nullifier_Pk_Columns_Input;
};

/** mutation root */
export type Mutation_RootUpdate_Nullifier_ManyArgs = {
  updates: Array<Nullifier_Updates>;
};

/** mutation root */
export type Mutation_RootUpdate_RedirectArgs = {
  _set?: InputMaybe<Redirect_Set_Input>;
  where: Redirect_Bool_Exp;
};

/** mutation root */
export type Mutation_RootUpdate_Redirect_By_PkArgs = {
  _set?: InputMaybe<Redirect_Set_Input>;
  pk_columns: Redirect_Pk_Columns_Input;
};

/** mutation root */
export type Mutation_RootUpdate_Redirect_ManyArgs = {
  updates: Array<Redirect_Updates>;
};

/** mutation root */
export type Mutation_RootUpdate_RoleArgs = {
  _set?: InputMaybe<Role_Set_Input>;
  where: Role_Bool_Exp;
};

/** mutation root */
export type Mutation_RootUpdate_Role_By_PkArgs = {
  _set?: InputMaybe<Role_Set_Input>;
  pk_columns: Role_Pk_Columns_Input;
};

/** mutation root */
export type Mutation_RootUpdate_Role_ManyArgs = {
  updates: Array<Role_Updates>;
};

/** mutation root */
export type Mutation_RootUpdate_TeamArgs = {
  _set?: InputMaybe<Team_Set_Input>;
  where: Team_Bool_Exp;
};

/** mutation root */
export type Mutation_RootUpdate_Team_By_PkArgs = {
  _set?: InputMaybe<Team_Set_Input>;
  pk_columns: Team_Pk_Columns_Input;
};

/** mutation root */
export type Mutation_RootUpdate_Team_ManyArgs = {
  updates: Array<Team_Updates>;
};

/** mutation root */
export type Mutation_RootUpdate_UserArgs = {
  _set?: InputMaybe<User_Set_Input>;
  where: User_Bool_Exp;
};

/** mutation root */
export type Mutation_RootUpdate_User_By_PkArgs = {
  _set?: InputMaybe<User_Set_Input>;
  pk_columns: User_Pk_Columns_Input;
};

/** mutation root */
export type Mutation_RootUpdate_User_ManyArgs = {
  updates: Array<User_Updates>;
};

/** mutation root */
export type Mutation_RootVerify_AppArgs = {
  app_id: Scalars["String"];
  is_reviewer_app_store_approved: Scalars["Boolean"];
  is_reviewer_world_app_approved: Scalars["Boolean"];
  reviewer_name: Scalars["String"];
};

/** columns and relationships of "nullifier" */
export type Nullifier = {
  __typename?: "nullifier";
  /** An object relationship */
  action: Action;
  action_id: Scalars["String"];
  created_at: Scalars["timestamptz"];
  id: Scalars["String"];
  nullifier_hash: Scalars["String"];
  updated_at: Scalars["timestamptz"];
  uses: Scalars["Int"];
};

/** aggregated selection of "nullifier" */
export type Nullifier_Aggregate = {
  __typename?: "nullifier_aggregate";
  aggregate?: Maybe<Nullifier_Aggregate_Fields>;
  nodes: Array<Nullifier>;
};

export type Nullifier_Aggregate_Bool_Exp = {
  count?: InputMaybe<Nullifier_Aggregate_Bool_Exp_Count>;
};

export type Nullifier_Aggregate_Bool_Exp_Count = {
  arguments?: InputMaybe<Array<Nullifier_Select_Column>>;
  distinct?: InputMaybe<Scalars["Boolean"]>;
  filter?: InputMaybe<Nullifier_Bool_Exp>;
  predicate: Int_Comparison_Exp;
};

/** aggregate fields of "nullifier" */
export type Nullifier_Aggregate_Fields = {
  __typename?: "nullifier_aggregate_fields";
  avg?: Maybe<Nullifier_Avg_Fields>;
  count: Scalars["Int"];
  max?: Maybe<Nullifier_Max_Fields>;
  min?: Maybe<Nullifier_Min_Fields>;
  stddev?: Maybe<Nullifier_Stddev_Fields>;
  stddev_pop?: Maybe<Nullifier_Stddev_Pop_Fields>;
  stddev_samp?: Maybe<Nullifier_Stddev_Samp_Fields>;
  sum?: Maybe<Nullifier_Sum_Fields>;
  var_pop?: Maybe<Nullifier_Var_Pop_Fields>;
  var_samp?: Maybe<Nullifier_Var_Samp_Fields>;
  variance?: Maybe<Nullifier_Variance_Fields>;
};

/** aggregate fields of "nullifier" */
export type Nullifier_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Nullifier_Select_Column>>;
  distinct?: InputMaybe<Scalars["Boolean"]>;
};

/** order by aggregate values of table "nullifier" */
export type Nullifier_Aggregate_Order_By = {
  avg?: InputMaybe<Nullifier_Avg_Order_By>;
  count?: InputMaybe<Order_By>;
  max?: InputMaybe<Nullifier_Max_Order_By>;
  min?: InputMaybe<Nullifier_Min_Order_By>;
  stddev?: InputMaybe<Nullifier_Stddev_Order_By>;
  stddev_pop?: InputMaybe<Nullifier_Stddev_Pop_Order_By>;
  stddev_samp?: InputMaybe<Nullifier_Stddev_Samp_Order_By>;
  sum?: InputMaybe<Nullifier_Sum_Order_By>;
  var_pop?: InputMaybe<Nullifier_Var_Pop_Order_By>;
  var_samp?: InputMaybe<Nullifier_Var_Samp_Order_By>;
  variance?: InputMaybe<Nullifier_Variance_Order_By>;
};

/** input type for inserting array relation for remote table "nullifier" */
export type Nullifier_Arr_Rel_Insert_Input = {
  data: Array<Nullifier_Insert_Input>;
  /** upsert condition */
  on_conflict?: InputMaybe<Nullifier_On_Conflict>;
};

/** aggregate avg on columns */
export type Nullifier_Avg_Fields = {
  __typename?: "nullifier_avg_fields";
  uses?: Maybe<Scalars["Float"]>;
};

/** order by avg() on columns of table "nullifier" */
export type Nullifier_Avg_Order_By = {
  uses?: InputMaybe<Order_By>;
};

/** Boolean expression to filter rows from the table "nullifier". All fields are combined with a logical 'AND'. */
export type Nullifier_Bool_Exp = {
  _and?: InputMaybe<Array<Nullifier_Bool_Exp>>;
  _not?: InputMaybe<Nullifier_Bool_Exp>;
  _or?: InputMaybe<Array<Nullifier_Bool_Exp>>;
  action?: InputMaybe<Action_Bool_Exp>;
  action_id?: InputMaybe<String_Comparison_Exp>;
  created_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  id?: InputMaybe<String_Comparison_Exp>;
  nullifier_hash?: InputMaybe<String_Comparison_Exp>;
  updated_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  uses?: InputMaybe<Int_Comparison_Exp>;
};

/** unique or primary key constraints on table "nullifier" */
export enum Nullifier_Constraint {
  /** unique or primary key constraint on columns "id" */
  NullifierPkey = "nullifier_pkey",
  /** unique or primary key constraint on columns "nullifier_hash" */
  UniqueNullifierHash = "unique_nullifier_hash",
}

/** input type for incrementing numeric columns in table "nullifier" */
export type Nullifier_Inc_Input = {
  uses?: InputMaybe<Scalars["Int"]>;
};

/** input type for inserting data into table "nullifier" */
export type Nullifier_Insert_Input = {
  action?: InputMaybe<Action_Obj_Rel_Insert_Input>;
  action_id?: InputMaybe<Scalars["String"]>;
  created_at?: InputMaybe<Scalars["timestamptz"]>;
  id?: InputMaybe<Scalars["String"]>;
  nullifier_hash?: InputMaybe<Scalars["String"]>;
  updated_at?: InputMaybe<Scalars["timestamptz"]>;
  uses?: InputMaybe<Scalars["Int"]>;
};

/** aggregate max on columns */
export type Nullifier_Max_Fields = {
  __typename?: "nullifier_max_fields";
  action_id?: Maybe<Scalars["String"]>;
  created_at?: Maybe<Scalars["timestamptz"]>;
  id?: Maybe<Scalars["String"]>;
  nullifier_hash?: Maybe<Scalars["String"]>;
  updated_at?: Maybe<Scalars["timestamptz"]>;
  uses?: Maybe<Scalars["Int"]>;
};

/** order by max() on columns of table "nullifier" */
export type Nullifier_Max_Order_By = {
  action_id?: InputMaybe<Order_By>;
  created_at?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  nullifier_hash?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
  uses?: InputMaybe<Order_By>;
};

/** aggregate min on columns */
export type Nullifier_Min_Fields = {
  __typename?: "nullifier_min_fields";
  action_id?: Maybe<Scalars["String"]>;
  created_at?: Maybe<Scalars["timestamptz"]>;
  id?: Maybe<Scalars["String"]>;
  nullifier_hash?: Maybe<Scalars["String"]>;
  updated_at?: Maybe<Scalars["timestamptz"]>;
  uses?: Maybe<Scalars["Int"]>;
};

/** order by min() on columns of table "nullifier" */
export type Nullifier_Min_Order_By = {
  action_id?: InputMaybe<Order_By>;
  created_at?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  nullifier_hash?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
  uses?: InputMaybe<Order_By>;
};

/** response of any mutation on the table "nullifier" */
export type Nullifier_Mutation_Response = {
  __typename?: "nullifier_mutation_response";
  /** number of rows affected by the mutation */
  affected_rows: Scalars["Int"];
  /** data from the rows affected by the mutation */
  returning: Array<Nullifier>;
};

/** on_conflict condition type for table "nullifier" */
export type Nullifier_On_Conflict = {
  constraint: Nullifier_Constraint;
  update_columns?: Array<Nullifier_Update_Column>;
  where?: InputMaybe<Nullifier_Bool_Exp>;
};

/** Ordering options when selecting data from "nullifier". */
export type Nullifier_Order_By = {
  action?: InputMaybe<Action_Order_By>;
  action_id?: InputMaybe<Order_By>;
  created_at?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  nullifier_hash?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
  uses?: InputMaybe<Order_By>;
};

/** primary key columns input for table: nullifier */
export type Nullifier_Pk_Columns_Input = {
  id: Scalars["String"];
};

/** select columns of table "nullifier" */
export enum Nullifier_Select_Column {
  /** column name */
  ActionId = "action_id",
  /** column name */
  CreatedAt = "created_at",
  /** column name */
  Id = "id",
  /** column name */
  NullifierHash = "nullifier_hash",
  /** column name */
  UpdatedAt = "updated_at",
  /** column name */
  Uses = "uses",
}

/** input type for updating data in table "nullifier" */
export type Nullifier_Set_Input = {
  action_id?: InputMaybe<Scalars["String"]>;
  created_at?: InputMaybe<Scalars["timestamptz"]>;
  id?: InputMaybe<Scalars["String"]>;
  nullifier_hash?: InputMaybe<Scalars["String"]>;
  updated_at?: InputMaybe<Scalars["timestamptz"]>;
  uses?: InputMaybe<Scalars["Int"]>;
};

/** aggregate stddev on columns */
export type Nullifier_Stddev_Fields = {
  __typename?: "nullifier_stddev_fields";
  uses?: Maybe<Scalars["Float"]>;
};

/** order by stddev() on columns of table "nullifier" */
export type Nullifier_Stddev_Order_By = {
  uses?: InputMaybe<Order_By>;
};

/** aggregate stddev_pop on columns */
export type Nullifier_Stddev_Pop_Fields = {
  __typename?: "nullifier_stddev_pop_fields";
  uses?: Maybe<Scalars["Float"]>;
};

/** order by stddev_pop() on columns of table "nullifier" */
export type Nullifier_Stddev_Pop_Order_By = {
  uses?: InputMaybe<Order_By>;
};

/** aggregate stddev_samp on columns */
export type Nullifier_Stddev_Samp_Fields = {
  __typename?: "nullifier_stddev_samp_fields";
  uses?: Maybe<Scalars["Float"]>;
};

/** order by stddev_samp() on columns of table "nullifier" */
export type Nullifier_Stddev_Samp_Order_By = {
  uses?: InputMaybe<Order_By>;
};

/** Streaming cursor of the table "nullifier" */
export type Nullifier_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Nullifier_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Nullifier_Stream_Cursor_Value_Input = {
  action_id?: InputMaybe<Scalars["String"]>;
  created_at?: InputMaybe<Scalars["timestamptz"]>;
  id?: InputMaybe<Scalars["String"]>;
  nullifier_hash?: InputMaybe<Scalars["String"]>;
  updated_at?: InputMaybe<Scalars["timestamptz"]>;
  uses?: InputMaybe<Scalars["Int"]>;
};

/** aggregate sum on columns */
export type Nullifier_Sum_Fields = {
  __typename?: "nullifier_sum_fields";
  uses?: Maybe<Scalars["Int"]>;
};

/** order by sum() on columns of table "nullifier" */
export type Nullifier_Sum_Order_By = {
  uses?: InputMaybe<Order_By>;
};

/** update columns of table "nullifier" */
export enum Nullifier_Update_Column {
  /** column name */
  ActionId = "action_id",
  /** column name */
  CreatedAt = "created_at",
  /** column name */
  Id = "id",
  /** column name */
  NullifierHash = "nullifier_hash",
  /** column name */
  UpdatedAt = "updated_at",
  /** column name */
  Uses = "uses",
}

export type Nullifier_Updates = {
  /** increments the numeric columns with given value of the filtered values */
  _inc?: InputMaybe<Nullifier_Inc_Input>;
  /** sets the columns of the filtered rows to the given values */
  _set?: InputMaybe<Nullifier_Set_Input>;
  /** filter the rows which have to be updated */
  where: Nullifier_Bool_Exp;
};

/** aggregate var_pop on columns */
export type Nullifier_Var_Pop_Fields = {
  __typename?: "nullifier_var_pop_fields";
  uses?: Maybe<Scalars["Float"]>;
};

/** order by var_pop() on columns of table "nullifier" */
export type Nullifier_Var_Pop_Order_By = {
  uses?: InputMaybe<Order_By>;
};

/** aggregate var_samp on columns */
export type Nullifier_Var_Samp_Fields = {
  __typename?: "nullifier_var_samp_fields";
  uses?: Maybe<Scalars["Float"]>;
};

/** order by var_samp() on columns of table "nullifier" */
export type Nullifier_Var_Samp_Order_By = {
  uses?: InputMaybe<Order_By>;
};

/** aggregate variance on columns */
export type Nullifier_Variance_Fields = {
  __typename?: "nullifier_variance_fields";
  uses?: Maybe<Scalars["Float"]>;
};

/** order by variance() on columns of table "nullifier" */
export type Nullifier_Variance_Order_By = {
  uses?: InputMaybe<Order_By>;
};

/** Boolean expression to compare columns of type "numeric". All fields are combined with logical 'AND'. */
export type Numeric_Comparison_Exp = {
  _eq?: InputMaybe<Scalars["numeric"]>;
  _gt?: InputMaybe<Scalars["numeric"]>;
  _gte?: InputMaybe<Scalars["numeric"]>;
  _in?: InputMaybe<Array<Scalars["numeric"]>>;
  _is_null?: InputMaybe<Scalars["Boolean"]>;
  _lt?: InputMaybe<Scalars["numeric"]>;
  _lte?: InputMaybe<Scalars["numeric"]>;
  _neq?: InputMaybe<Scalars["numeric"]>;
  _nin?: InputMaybe<Array<Scalars["numeric"]>>;
};

/** column ordering options */
export enum Order_By {
  /** in ascending order, nulls last */
  Asc = "asc",
  /** in ascending order, nulls first */
  AscNullsFirst = "asc_nulls_first",
  /** in ascending order, nulls last */
  AscNullsLast = "asc_nulls_last",
  /** in descending order, nulls first */
  Desc = "desc",
  /** in descending order, nulls first */
  DescNullsFirst = "desc_nulls_first",
  /** in descending order, nulls last */
  DescNullsLast = "desc_nulls_last",
}

export type Query_Root = {
  __typename?: "query_root";
  /** fetch data from the table: "action" */
  action: Array<Action>;
  /** fetch aggregated fields from the table: "action" */
  action_aggregate: Action_Aggregate;
  /** fetch data from the table: "action" using primary key columns */
  action_by_pk?: Maybe<Action>;
  /** execute function "action_stats" which returns "action_stats_returning" */
  action_stats: Array<Action_Stats_Returning>;
  /** execute function "action_stats" and query aggregates on result of table type "action_stats_returning" */
  action_stats_aggregate: Action_Stats_Returning_Aggregate;
  /** fetch data from the table: "action_stats_returning" */
  action_stats_returning: Array<Action_Stats_Returning>;
  /** fetch aggregated fields from the table: "action_stats_returning" */
  action_stats_returning_aggregate: Action_Stats_Returning_Aggregate;
  /** fetch data from the table: "action_stats_returning" using primary key columns */
  action_stats_returning_by_pk?: Maybe<Action_Stats_Returning>;
  /** fetch data from the table: "api_key" */
  api_key: Array<Api_Key>;
  /** fetch aggregated fields from the table: "api_key" */
  api_key_aggregate: Api_Key_Aggregate;
  /** fetch data from the table: "api_key" using primary key columns */
  api_key_by_pk?: Maybe<Api_Key>;
  /** fetch data from the table: "app" */
  app: Array<App>;
  /** fetch aggregated fields from the table: "app" */
  app_aggregate: App_Aggregate;
  /** fetch data from the table: "app" using primary key columns */
  app_by_pk?: Maybe<App>;
  /** An array relationship */
  app_metadata: Array<App_Metadata>;
  /** An aggregate relationship */
  app_metadata_aggregate: App_Metadata_Aggregate;
  /** fetch data from the table: "app_metadata" using primary key columns */
  app_metadata_by_pk?: Maybe<App_Metadata>;
  /** fetch data from the table: "app_rankings" */
  app_rankings: Array<App_Rankings>;
  /** fetch aggregated fields from the table: "app_rankings" */
  app_rankings_aggregate: App_Rankings_Aggregate;
  /** fetch data from the table: "app_rankings" using primary key columns */
  app_rankings_by_pk?: Maybe<App_Rankings>;
  /** execute function "app_stats" which returns "app_stats_returning" */
  app_stats: Array<App_Stats_Returning>;
  /** execute function "app_stats" and query aggregates on result of table type "app_stats_returning" */
  app_stats_aggregate: App_Stats_Returning_Aggregate;
  /** fetch data from the table: "app_stats_returning" */
  app_stats_returning: Array<App_Stats_Returning>;
  /** fetch aggregated fields from the table: "app_stats_returning" */
  app_stats_returning_aggregate: App_Stats_Returning_Aggregate;
  /** fetch data from the table: "app_stats_returning" using primary key columns */
  app_stats_returning_by_pk?: Maybe<App_Stats_Returning>;
  /** fetch data from the table: "auth_code" */
  auth_code: Array<Auth_Code>;
  /** fetch aggregated fields from the table: "auth_code" */
  auth_code_aggregate: Auth_Code_Aggregate;
  /** fetch data from the table: "auth_code" using primary key columns */
  auth_code_by_pk?: Maybe<Auth_Code>;
  /** fetch data from the table: "cache" */
  cache: Array<Cache>;
  /** fetch aggregated fields from the table: "cache" */
  cache_aggregate: Cache_Aggregate;
  /** fetch data from the table: "cache" using primary key columns */
  cache_by_pk?: Maybe<Cache>;
  get_all_unverified_images?: Maybe<ImageGetAllUnverifiedImagesOutput>;
  /** Used by the reviewer to get in review app images */
  get_app_review_images?: Maybe<ImageGetAppReviewImagesOutput>;
  /** Gets the uploaded image to display */
  get_uploaded_image?: Maybe<GetUploadedImageOutput>;
  /** fetch data from the table: "invite" */
  invite: Array<Invite>;
  /** fetch aggregated fields from the table: "invite" */
  invite_aggregate: Invite_Aggregate;
  /** fetch data from the table: "invite" using primary key columns */
  invite_by_pk?: Maybe<Invite>;
  /** fetch data from the table: "jwks" */
  jwks: Array<Jwks>;
  /** fetch aggregated fields from the table: "jwks" */
  jwks_aggregate: Jwks_Aggregate;
  /** fetch data from the table: "jwks" using primary key columns */
  jwks_by_pk?: Maybe<Jwks>;
  /** fetch data from the table: "membership" */
  membership: Array<Membership>;
  /** fetch aggregated fields from the table: "membership" */
  membership_aggregate: Membership_Aggregate;
  /** fetch data from the table: "membership" using primary key columns */
  membership_by_pk?: Maybe<Membership>;
  /** fetch data from the table: "nullifier" */
  nullifier: Array<Nullifier>;
  /** fetch aggregated fields from the table: "nullifier" */
  nullifier_aggregate: Nullifier_Aggregate;
  /** fetch data from the table: "nullifier" using primary key columns */
  nullifier_by_pk?: Maybe<Nullifier>;
  /** fetch data from the table: "redirect" */
  redirect: Array<Redirect>;
  /** fetch aggregated fields from the table: "redirect" */
  redirect_aggregate: Redirect_Aggregate;
  /** fetch data from the table: "redirect" using primary key columns */
  redirect_by_pk?: Maybe<Redirect>;
  /** fetch data from the table: "role" */
  role: Array<Role>;
  /** fetch aggregated fields from the table: "role" */
  role_aggregate: Role_Aggregate;
  /** fetch data from the table: "role" using primary key columns */
  role_by_pk?: Maybe<Role>;
  /** fetch data from the table: "team" */
  team: Array<Team>;
  /** fetch aggregated fields from the table: "team" */
  team_aggregate: Team_Aggregate;
  /** fetch data from the table: "team" using primary key columns */
  team_by_pk?: Maybe<Team>;
  /** Generates a Signed URL to upload images */
  upload_image?: Maybe<PresignedPostOutput>;
  /** fetch data from the table: "user" */
  user: Array<User>;
  /** fetch aggregated fields from the table: "user" */
  user_aggregate: User_Aggregate;
  /** fetch data from the table: "user" using primary key columns */
  user_by_pk?: Maybe<User>;
};

export type Query_RootActionArgs = {
  distinct_on?: InputMaybe<Array<Action_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Action_Order_By>>;
  where?: InputMaybe<Action_Bool_Exp>;
};

export type Query_RootAction_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Action_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Action_Order_By>>;
  where?: InputMaybe<Action_Bool_Exp>;
};

export type Query_RootAction_By_PkArgs = {
  id: Scalars["String"];
};

export type Query_RootAction_StatsArgs = {
  args: Action_Stats_Args;
  distinct_on?: InputMaybe<Array<Action_Stats_Returning_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Action_Stats_Returning_Order_By>>;
  where?: InputMaybe<Action_Stats_Returning_Bool_Exp>;
};

export type Query_RootAction_Stats_AggregateArgs = {
  args: Action_Stats_Args;
  distinct_on?: InputMaybe<Array<Action_Stats_Returning_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Action_Stats_Returning_Order_By>>;
  where?: InputMaybe<Action_Stats_Returning_Bool_Exp>;
};

export type Query_RootAction_Stats_ReturningArgs = {
  distinct_on?: InputMaybe<Array<Action_Stats_Returning_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Action_Stats_Returning_Order_By>>;
  where?: InputMaybe<Action_Stats_Returning_Bool_Exp>;
};

export type Query_RootAction_Stats_Returning_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Action_Stats_Returning_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Action_Stats_Returning_Order_By>>;
  where?: InputMaybe<Action_Stats_Returning_Bool_Exp>;
};

export type Query_RootAction_Stats_Returning_By_PkArgs = {
  action_id: Scalars["String"];
};

export type Query_RootApi_KeyArgs = {
  distinct_on?: InputMaybe<Array<Api_Key_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Api_Key_Order_By>>;
  where?: InputMaybe<Api_Key_Bool_Exp>;
};

export type Query_RootApi_Key_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Api_Key_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Api_Key_Order_By>>;
  where?: InputMaybe<Api_Key_Bool_Exp>;
};

export type Query_RootApi_Key_By_PkArgs = {
  id: Scalars["String"];
};

export type Query_RootAppArgs = {
  distinct_on?: InputMaybe<Array<App_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<App_Order_By>>;
  where?: InputMaybe<App_Bool_Exp>;
};

export type Query_RootApp_AggregateArgs = {
  distinct_on?: InputMaybe<Array<App_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<App_Order_By>>;
  where?: InputMaybe<App_Bool_Exp>;
};

export type Query_RootApp_By_PkArgs = {
  id: Scalars["String"];
};

export type Query_RootApp_MetadataArgs = {
  distinct_on?: InputMaybe<Array<App_Metadata_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<App_Metadata_Order_By>>;
  where?: InputMaybe<App_Metadata_Bool_Exp>;
};

export type Query_RootApp_Metadata_AggregateArgs = {
  distinct_on?: InputMaybe<Array<App_Metadata_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<App_Metadata_Order_By>>;
  where?: InputMaybe<App_Metadata_Bool_Exp>;
};

export type Query_RootApp_Metadata_By_PkArgs = {
  id: Scalars["String"];
};

export type Query_RootApp_RankingsArgs = {
  distinct_on?: InputMaybe<Array<App_Rankings_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<App_Rankings_Order_By>>;
  where?: InputMaybe<App_Rankings_Bool_Exp>;
};

export type Query_RootApp_Rankings_AggregateArgs = {
  distinct_on?: InputMaybe<Array<App_Rankings_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<App_Rankings_Order_By>>;
  where?: InputMaybe<App_Rankings_Bool_Exp>;
};

export type Query_RootApp_Rankings_By_PkArgs = {
  id: Scalars["String"];
};

export type Query_RootApp_StatsArgs = {
  args: App_Stats_Args;
  distinct_on?: InputMaybe<Array<App_Stats_Returning_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<App_Stats_Returning_Order_By>>;
  where?: InputMaybe<App_Stats_Returning_Bool_Exp>;
};

export type Query_RootApp_Stats_AggregateArgs = {
  args: App_Stats_Args;
  distinct_on?: InputMaybe<Array<App_Stats_Returning_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<App_Stats_Returning_Order_By>>;
  where?: InputMaybe<App_Stats_Returning_Bool_Exp>;
};

export type Query_RootApp_Stats_ReturningArgs = {
  distinct_on?: InputMaybe<Array<App_Stats_Returning_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<App_Stats_Returning_Order_By>>;
  where?: InputMaybe<App_Stats_Returning_Bool_Exp>;
};

export type Query_RootApp_Stats_Returning_AggregateArgs = {
  distinct_on?: InputMaybe<Array<App_Stats_Returning_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<App_Stats_Returning_Order_By>>;
  where?: InputMaybe<App_Stats_Returning_Bool_Exp>;
};

export type Query_RootApp_Stats_Returning_By_PkArgs = {
  app_id: Scalars["String"];
};

export type Query_RootAuth_CodeArgs = {
  distinct_on?: InputMaybe<Array<Auth_Code_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Auth_Code_Order_By>>;
  where?: InputMaybe<Auth_Code_Bool_Exp>;
};

export type Query_RootAuth_Code_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Auth_Code_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Auth_Code_Order_By>>;
  where?: InputMaybe<Auth_Code_Bool_Exp>;
};

export type Query_RootAuth_Code_By_PkArgs = {
  id: Scalars["String"];
};

export type Query_RootCacheArgs = {
  distinct_on?: InputMaybe<Array<Cache_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Cache_Order_By>>;
  where?: InputMaybe<Cache_Bool_Exp>;
};

export type Query_RootCache_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Cache_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Cache_Order_By>>;
  where?: InputMaybe<Cache_Bool_Exp>;
};

export type Query_RootCache_By_PkArgs = {
  id: Scalars["String"];
};

export type Query_RootGet_All_Unverified_ImagesArgs = {
  app_id: Scalars["String"];
  team_id: Scalars["String"];
};

export type Query_RootGet_App_Review_ImagesArgs = {
  app_id: Scalars["String"];
};

export type Query_RootGet_Uploaded_ImageArgs = {
  app_id: Scalars["String"];
  content_type_ending: Scalars["String"];
  image_type: Scalars["String"];
  team_id: Scalars["String"];
};

export type Query_RootInviteArgs = {
  distinct_on?: InputMaybe<Array<Invite_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Invite_Order_By>>;
  where?: InputMaybe<Invite_Bool_Exp>;
};

export type Query_RootInvite_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Invite_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Invite_Order_By>>;
  where?: InputMaybe<Invite_Bool_Exp>;
};

export type Query_RootInvite_By_PkArgs = {
  id: Scalars["String"];
};

export type Query_RootJwksArgs = {
  distinct_on?: InputMaybe<Array<Jwks_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Jwks_Order_By>>;
  where?: InputMaybe<Jwks_Bool_Exp>;
};

export type Query_RootJwks_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Jwks_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Jwks_Order_By>>;
  where?: InputMaybe<Jwks_Bool_Exp>;
};

export type Query_RootJwks_By_PkArgs = {
  id: Scalars["String"];
};

export type Query_RootMembershipArgs = {
  distinct_on?: InputMaybe<Array<Membership_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Membership_Order_By>>;
  where?: InputMaybe<Membership_Bool_Exp>;
};

export type Query_RootMembership_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Membership_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Membership_Order_By>>;
  where?: InputMaybe<Membership_Bool_Exp>;
};

export type Query_RootMembership_By_PkArgs = {
  id: Scalars["String"];
};

export type Query_RootNullifierArgs = {
  distinct_on?: InputMaybe<Array<Nullifier_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Nullifier_Order_By>>;
  where?: InputMaybe<Nullifier_Bool_Exp>;
};

export type Query_RootNullifier_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Nullifier_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Nullifier_Order_By>>;
  where?: InputMaybe<Nullifier_Bool_Exp>;
};

export type Query_RootNullifier_By_PkArgs = {
  id: Scalars["String"];
};

export type Query_RootRedirectArgs = {
  distinct_on?: InputMaybe<Array<Redirect_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Redirect_Order_By>>;
  where?: InputMaybe<Redirect_Bool_Exp>;
};

export type Query_RootRedirect_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Redirect_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Redirect_Order_By>>;
  where?: InputMaybe<Redirect_Bool_Exp>;
};

export type Query_RootRedirect_By_PkArgs = {
  id: Scalars["String"];
};

export type Query_RootRoleArgs = {
  distinct_on?: InputMaybe<Array<Role_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Role_Order_By>>;
  where?: InputMaybe<Role_Bool_Exp>;
};

export type Query_RootRole_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Role_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Role_Order_By>>;
  where?: InputMaybe<Role_Bool_Exp>;
};

export type Query_RootRole_By_PkArgs = {
  value: Scalars["String"];
};

export type Query_RootTeamArgs = {
  distinct_on?: InputMaybe<Array<Team_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Team_Order_By>>;
  where?: InputMaybe<Team_Bool_Exp>;
};

export type Query_RootTeam_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Team_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Team_Order_By>>;
  where?: InputMaybe<Team_Bool_Exp>;
};

export type Query_RootTeam_By_PkArgs = {
  id: Scalars["String"];
};

export type Query_RootUpload_ImageArgs = {
  app_id: Scalars["String"];
  content_type_ending: Scalars["String"];
  image_type: Scalars["String"];
  team_id: Scalars["String"];
};

export type Query_RootUserArgs = {
  distinct_on?: InputMaybe<Array<User_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<User_Order_By>>;
  where?: InputMaybe<User_Bool_Exp>;
};

export type Query_RootUser_AggregateArgs = {
  distinct_on?: InputMaybe<Array<User_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<User_Order_By>>;
  where?: InputMaybe<User_Bool_Exp>;
};

export type Query_RootUser_By_PkArgs = {
  id: Scalars["String"];
};

/** columns and relationships of "redirect" */
export type Redirect = {
  __typename?: "redirect";
  /** An object relationship */
  action?: Maybe<Action>;
  action_id: Scalars["String"];
  created_at: Scalars["timestamptz"];
  id: Scalars["String"];
  redirect_uri: Scalars["String"];
  updated_at: Scalars["timestamptz"];
};

/** aggregated selection of "redirect" */
export type Redirect_Aggregate = {
  __typename?: "redirect_aggregate";
  aggregate?: Maybe<Redirect_Aggregate_Fields>;
  nodes: Array<Redirect>;
};

export type Redirect_Aggregate_Bool_Exp = {
  count?: InputMaybe<Redirect_Aggregate_Bool_Exp_Count>;
};

export type Redirect_Aggregate_Bool_Exp_Count = {
  arguments?: InputMaybe<Array<Redirect_Select_Column>>;
  distinct?: InputMaybe<Scalars["Boolean"]>;
  filter?: InputMaybe<Redirect_Bool_Exp>;
  predicate: Int_Comparison_Exp;
};

/** aggregate fields of "redirect" */
export type Redirect_Aggregate_Fields = {
  __typename?: "redirect_aggregate_fields";
  count: Scalars["Int"];
  max?: Maybe<Redirect_Max_Fields>;
  min?: Maybe<Redirect_Min_Fields>;
};

/** aggregate fields of "redirect" */
export type Redirect_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Redirect_Select_Column>>;
  distinct?: InputMaybe<Scalars["Boolean"]>;
};

/** order by aggregate values of table "redirect" */
export type Redirect_Aggregate_Order_By = {
  count?: InputMaybe<Order_By>;
  max?: InputMaybe<Redirect_Max_Order_By>;
  min?: InputMaybe<Redirect_Min_Order_By>;
};

/** input type for inserting array relation for remote table "redirect" */
export type Redirect_Arr_Rel_Insert_Input = {
  data: Array<Redirect_Insert_Input>;
  /** upsert condition */
  on_conflict?: InputMaybe<Redirect_On_Conflict>;
};

/** Boolean expression to filter rows from the table "redirect". All fields are combined with a logical 'AND'. */
export type Redirect_Bool_Exp = {
  _and?: InputMaybe<Array<Redirect_Bool_Exp>>;
  _not?: InputMaybe<Redirect_Bool_Exp>;
  _or?: InputMaybe<Array<Redirect_Bool_Exp>>;
  action?: InputMaybe<Action_Bool_Exp>;
  action_id?: InputMaybe<String_Comparison_Exp>;
  created_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  id?: InputMaybe<String_Comparison_Exp>;
  redirect_uri?: InputMaybe<String_Comparison_Exp>;
  updated_at?: InputMaybe<Timestamptz_Comparison_Exp>;
};

/** unique or primary key constraints on table "redirect" */
export enum Redirect_Constraint {
  /** unique or primary key constraint on columns "id" */
  RedirectPkey = "redirect_pkey",
}

/** input type for inserting data into table "redirect" */
export type Redirect_Insert_Input = {
  action?: InputMaybe<Action_Obj_Rel_Insert_Input>;
  action_id?: InputMaybe<Scalars["String"]>;
  created_at?: InputMaybe<Scalars["timestamptz"]>;
  id?: InputMaybe<Scalars["String"]>;
  redirect_uri?: InputMaybe<Scalars["String"]>;
  updated_at?: InputMaybe<Scalars["timestamptz"]>;
};

/** aggregate max on columns */
export type Redirect_Max_Fields = {
  __typename?: "redirect_max_fields";
  action_id?: Maybe<Scalars["String"]>;
  created_at?: Maybe<Scalars["timestamptz"]>;
  id?: Maybe<Scalars["String"]>;
  redirect_uri?: Maybe<Scalars["String"]>;
  updated_at?: Maybe<Scalars["timestamptz"]>;
};

/** order by max() on columns of table "redirect" */
export type Redirect_Max_Order_By = {
  action_id?: InputMaybe<Order_By>;
  created_at?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  redirect_uri?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
};

/** aggregate min on columns */
export type Redirect_Min_Fields = {
  __typename?: "redirect_min_fields";
  action_id?: Maybe<Scalars["String"]>;
  created_at?: Maybe<Scalars["timestamptz"]>;
  id?: Maybe<Scalars["String"]>;
  redirect_uri?: Maybe<Scalars["String"]>;
  updated_at?: Maybe<Scalars["timestamptz"]>;
};

/** order by min() on columns of table "redirect" */
export type Redirect_Min_Order_By = {
  action_id?: InputMaybe<Order_By>;
  created_at?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  redirect_uri?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
};

/** response of any mutation on the table "redirect" */
export type Redirect_Mutation_Response = {
  __typename?: "redirect_mutation_response";
  /** number of rows affected by the mutation */
  affected_rows: Scalars["Int"];
  /** data from the rows affected by the mutation */
  returning: Array<Redirect>;
};

/** on_conflict condition type for table "redirect" */
export type Redirect_On_Conflict = {
  constraint: Redirect_Constraint;
  update_columns?: Array<Redirect_Update_Column>;
  where?: InputMaybe<Redirect_Bool_Exp>;
};

/** Ordering options when selecting data from "redirect". */
export type Redirect_Order_By = {
  action?: InputMaybe<Action_Order_By>;
  action_id?: InputMaybe<Order_By>;
  created_at?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  redirect_uri?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
};

/** primary key columns input for table: redirect */
export type Redirect_Pk_Columns_Input = {
  id: Scalars["String"];
};

/** select columns of table "redirect" */
export enum Redirect_Select_Column {
  /** column name */
  ActionId = "action_id",
  /** column name */
  CreatedAt = "created_at",
  /** column name */
  Id = "id",
  /** column name */
  RedirectUri = "redirect_uri",
  /** column name */
  UpdatedAt = "updated_at",
}

/** input type for updating data in table "redirect" */
export type Redirect_Set_Input = {
  action_id?: InputMaybe<Scalars["String"]>;
  created_at?: InputMaybe<Scalars["timestamptz"]>;
  id?: InputMaybe<Scalars["String"]>;
  redirect_uri?: InputMaybe<Scalars["String"]>;
  updated_at?: InputMaybe<Scalars["timestamptz"]>;
};

/** Streaming cursor of the table "redirect" */
export type Redirect_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Redirect_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Redirect_Stream_Cursor_Value_Input = {
  action_id?: InputMaybe<Scalars["String"]>;
  created_at?: InputMaybe<Scalars["timestamptz"]>;
  id?: InputMaybe<Scalars["String"]>;
  redirect_uri?: InputMaybe<Scalars["String"]>;
  updated_at?: InputMaybe<Scalars["timestamptz"]>;
};

/** update columns of table "redirect" */
export enum Redirect_Update_Column {
  /** column name */
  ActionId = "action_id",
  /** column name */
  CreatedAt = "created_at",
  /** column name */
  Id = "id",
  /** column name */
  RedirectUri = "redirect_uri",
  /** column name */
  UpdatedAt = "updated_at",
}

export type Redirect_Updates = {
  /** sets the columns of the filtered rows to the given values */
  _set?: InputMaybe<Redirect_Set_Input>;
  /** filter the rows which have to be updated */
  where: Redirect_Bool_Exp;
};

/** columns and relationships of "role" */
export type Role = {
  __typename?: "role";
  comment?: Maybe<Scalars["String"]>;
  value: Scalars["String"];
};

/** aggregated selection of "role" */
export type Role_Aggregate = {
  __typename?: "role_aggregate";
  aggregate?: Maybe<Role_Aggregate_Fields>;
  nodes: Array<Role>;
};

/** aggregate fields of "role" */
export type Role_Aggregate_Fields = {
  __typename?: "role_aggregate_fields";
  count: Scalars["Int"];
  max?: Maybe<Role_Max_Fields>;
  min?: Maybe<Role_Min_Fields>;
};

/** aggregate fields of "role" */
export type Role_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Role_Select_Column>>;
  distinct?: InputMaybe<Scalars["Boolean"]>;
};

/** Boolean expression to filter rows from the table "role". All fields are combined with a logical 'AND'. */
export type Role_Bool_Exp = {
  _and?: InputMaybe<Array<Role_Bool_Exp>>;
  _not?: InputMaybe<Role_Bool_Exp>;
  _or?: InputMaybe<Array<Role_Bool_Exp>>;
  comment?: InputMaybe<String_Comparison_Exp>;
  value?: InputMaybe<String_Comparison_Exp>;
};

/** unique or primary key constraints on table "role" */
export enum Role_Constraint {
  /** unique or primary key constraint on columns "value" */
  RolePkey = "role_pkey",
}

export enum Role_Enum {
  /** Users with the privilege to manage other users */
  Admin = "ADMIN",
  /** Member user */
  Member = "MEMBER",
  /** Owner of the team */
  Owner = "OWNER",
}

/** Boolean expression to compare columns of type "role_enum". All fields are combined with logical 'AND'. */
export type Role_Enum_Comparison_Exp = {
  _eq?: InputMaybe<Role_Enum>;
  _in?: InputMaybe<Array<Role_Enum>>;
  _is_null?: InputMaybe<Scalars["Boolean"]>;
  _neq?: InputMaybe<Role_Enum>;
  _nin?: InputMaybe<Array<Role_Enum>>;
};

/** input type for inserting data into table "role" */
export type Role_Insert_Input = {
  comment?: InputMaybe<Scalars["String"]>;
  value?: InputMaybe<Scalars["String"]>;
};

/** aggregate max on columns */
export type Role_Max_Fields = {
  __typename?: "role_max_fields";
  comment?: Maybe<Scalars["String"]>;
  value?: Maybe<Scalars["String"]>;
};

/** aggregate min on columns */
export type Role_Min_Fields = {
  __typename?: "role_min_fields";
  comment?: Maybe<Scalars["String"]>;
  value?: Maybe<Scalars["String"]>;
};

/** response of any mutation on the table "role" */
export type Role_Mutation_Response = {
  __typename?: "role_mutation_response";
  /** number of rows affected by the mutation */
  affected_rows: Scalars["Int"];
  /** data from the rows affected by the mutation */
  returning: Array<Role>;
};

/** on_conflict condition type for table "role" */
export type Role_On_Conflict = {
  constraint: Role_Constraint;
  update_columns?: Array<Role_Update_Column>;
  where?: InputMaybe<Role_Bool_Exp>;
};

/** Ordering options when selecting data from "role". */
export type Role_Order_By = {
  comment?: InputMaybe<Order_By>;
  value?: InputMaybe<Order_By>;
};

/** primary key columns input for table: role */
export type Role_Pk_Columns_Input = {
  value: Scalars["String"];
};

/** select columns of table "role" */
export enum Role_Select_Column {
  /** column name */
  Comment = "comment",
  /** column name */
  Value = "value",
}

/** input type for updating data in table "role" */
export type Role_Set_Input = {
  comment?: InputMaybe<Scalars["String"]>;
  value?: InputMaybe<Scalars["String"]>;
};

/** Streaming cursor of the table "role" */
export type Role_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Role_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Role_Stream_Cursor_Value_Input = {
  comment?: InputMaybe<Scalars["String"]>;
  value?: InputMaybe<Scalars["String"]>;
};

/** update columns of table "role" */
export enum Role_Update_Column {
  /** column name */
  Comment = "comment",
  /** column name */
  Value = "value",
}

export type Role_Updates = {
  /** sets the columns of the filtered rows to the given values */
  _set?: InputMaybe<Role_Set_Input>;
  /** filter the rows which have to be updated */
  where: Role_Bool_Exp;
};

export type Subscription_Root = {
  __typename?: "subscription_root";
  /** fetch data from the table: "action" */
  action: Array<Action>;
  /** fetch aggregated fields from the table: "action" */
  action_aggregate: Action_Aggregate;
  /** fetch data from the table: "action" using primary key columns */
  action_by_pk?: Maybe<Action>;
  /** execute function "action_stats" which returns "action_stats_returning" */
  action_stats: Array<Action_Stats_Returning>;
  /** execute function "action_stats" and query aggregates on result of table type "action_stats_returning" */
  action_stats_aggregate: Action_Stats_Returning_Aggregate;
  /** fetch data from the table: "action_stats_returning" */
  action_stats_returning: Array<Action_Stats_Returning>;
  /** fetch aggregated fields from the table: "action_stats_returning" */
  action_stats_returning_aggregate: Action_Stats_Returning_Aggregate;
  /** fetch data from the table: "action_stats_returning" using primary key columns */
  action_stats_returning_by_pk?: Maybe<Action_Stats_Returning>;
  /** fetch data from the table in a streaming manner: "action_stats_returning" */
  action_stats_returning_stream: Array<Action_Stats_Returning>;
  /** fetch data from the table in a streaming manner: "action" */
  action_stream: Array<Action>;
  /** fetch data from the table: "api_key" */
  api_key: Array<Api_Key>;
  /** fetch aggregated fields from the table: "api_key" */
  api_key_aggregate: Api_Key_Aggregate;
  /** fetch data from the table: "api_key" using primary key columns */
  api_key_by_pk?: Maybe<Api_Key>;
  /** fetch data from the table in a streaming manner: "api_key" */
  api_key_stream: Array<Api_Key>;
  /** fetch data from the table: "app" */
  app: Array<App>;
  /** fetch aggregated fields from the table: "app" */
  app_aggregate: App_Aggregate;
  /** fetch data from the table: "app" using primary key columns */
  app_by_pk?: Maybe<App>;
  /** An array relationship */
  app_metadata: Array<App_Metadata>;
  /** An aggregate relationship */
  app_metadata_aggregate: App_Metadata_Aggregate;
  /** fetch data from the table: "app_metadata" using primary key columns */
  app_metadata_by_pk?: Maybe<App_Metadata>;
  /** fetch data from the table in a streaming manner: "app_metadata" */
  app_metadata_stream: Array<App_Metadata>;
  /** fetch data from the table: "app_rankings" */
  app_rankings: Array<App_Rankings>;
  /** fetch aggregated fields from the table: "app_rankings" */
  app_rankings_aggregate: App_Rankings_Aggregate;
  /** fetch data from the table: "app_rankings" using primary key columns */
  app_rankings_by_pk?: Maybe<App_Rankings>;
  /** fetch data from the table in a streaming manner: "app_rankings" */
  app_rankings_stream: Array<App_Rankings>;
  /** execute function "app_stats" which returns "app_stats_returning" */
  app_stats: Array<App_Stats_Returning>;
  /** execute function "app_stats" and query aggregates on result of table type "app_stats_returning" */
  app_stats_aggregate: App_Stats_Returning_Aggregate;
  /** fetch data from the table: "app_stats_returning" */
  app_stats_returning: Array<App_Stats_Returning>;
  /** fetch aggregated fields from the table: "app_stats_returning" */
  app_stats_returning_aggregate: App_Stats_Returning_Aggregate;
  /** fetch data from the table: "app_stats_returning" using primary key columns */
  app_stats_returning_by_pk?: Maybe<App_Stats_Returning>;
  /** fetch data from the table in a streaming manner: "app_stats_returning" */
  app_stats_returning_stream: Array<App_Stats_Returning>;
  /** fetch data from the table in a streaming manner: "app" */
  app_stream: Array<App>;
  /** fetch data from the table: "auth_code" */
  auth_code: Array<Auth_Code>;
  /** fetch aggregated fields from the table: "auth_code" */
  auth_code_aggregate: Auth_Code_Aggregate;
  /** fetch data from the table: "auth_code" using primary key columns */
  auth_code_by_pk?: Maybe<Auth_Code>;
  /** fetch data from the table in a streaming manner: "auth_code" */
  auth_code_stream: Array<Auth_Code>;
  /** fetch data from the table: "cache" */
  cache: Array<Cache>;
  /** fetch aggregated fields from the table: "cache" */
  cache_aggregate: Cache_Aggregate;
  /** fetch data from the table: "cache" using primary key columns */
  cache_by_pk?: Maybe<Cache>;
  /** fetch data from the table in a streaming manner: "cache" */
  cache_stream: Array<Cache>;
  /** fetch data from the table: "invite" */
  invite: Array<Invite>;
  /** fetch aggregated fields from the table: "invite" */
  invite_aggregate: Invite_Aggregate;
  /** fetch data from the table: "invite" using primary key columns */
  invite_by_pk?: Maybe<Invite>;
  /** fetch data from the table in a streaming manner: "invite" */
  invite_stream: Array<Invite>;
  /** fetch data from the table: "jwks" */
  jwks: Array<Jwks>;
  /** fetch aggregated fields from the table: "jwks" */
  jwks_aggregate: Jwks_Aggregate;
  /** fetch data from the table: "jwks" using primary key columns */
  jwks_by_pk?: Maybe<Jwks>;
  /** fetch data from the table in a streaming manner: "jwks" */
  jwks_stream: Array<Jwks>;
  /** fetch data from the table: "membership" */
  membership: Array<Membership>;
  /** fetch aggregated fields from the table: "membership" */
  membership_aggregate: Membership_Aggregate;
  /** fetch data from the table: "membership" using primary key columns */
  membership_by_pk?: Maybe<Membership>;
  /** fetch data from the table in a streaming manner: "membership" */
  membership_stream: Array<Membership>;
  /** fetch data from the table: "nullifier" */
  nullifier: Array<Nullifier>;
  /** fetch aggregated fields from the table: "nullifier" */
  nullifier_aggregate: Nullifier_Aggregate;
  /** fetch data from the table: "nullifier" using primary key columns */
  nullifier_by_pk?: Maybe<Nullifier>;
  /** fetch data from the table in a streaming manner: "nullifier" */
  nullifier_stream: Array<Nullifier>;
  /** fetch data from the table: "redirect" */
  redirect: Array<Redirect>;
  /** fetch aggregated fields from the table: "redirect" */
  redirect_aggregate: Redirect_Aggregate;
  /** fetch data from the table: "redirect" using primary key columns */
  redirect_by_pk?: Maybe<Redirect>;
  /** fetch data from the table in a streaming manner: "redirect" */
  redirect_stream: Array<Redirect>;
  /** fetch data from the table: "role" */
  role: Array<Role>;
  /** fetch aggregated fields from the table: "role" */
  role_aggregate: Role_Aggregate;
  /** fetch data from the table: "role" using primary key columns */
  role_by_pk?: Maybe<Role>;
  /** fetch data from the table in a streaming manner: "role" */
  role_stream: Array<Role>;
  /** fetch data from the table: "team" */
  team: Array<Team>;
  /** fetch aggregated fields from the table: "team" */
  team_aggregate: Team_Aggregate;
  /** fetch data from the table: "team" using primary key columns */
  team_by_pk?: Maybe<Team>;
  /** fetch data from the table in a streaming manner: "team" */
  team_stream: Array<Team>;
  /** fetch data from the table: "user" */
  user: Array<User>;
  /** fetch aggregated fields from the table: "user" */
  user_aggregate: User_Aggregate;
  /** fetch data from the table: "user" using primary key columns */
  user_by_pk?: Maybe<User>;
  /** fetch data from the table in a streaming manner: "user" */
  user_stream: Array<User>;
};

export type Subscription_RootActionArgs = {
  distinct_on?: InputMaybe<Array<Action_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Action_Order_By>>;
  where?: InputMaybe<Action_Bool_Exp>;
};

export type Subscription_RootAction_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Action_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Action_Order_By>>;
  where?: InputMaybe<Action_Bool_Exp>;
};

export type Subscription_RootAction_By_PkArgs = {
  id: Scalars["String"];
};

export type Subscription_RootAction_StatsArgs = {
  args: Action_Stats_Args;
  distinct_on?: InputMaybe<Array<Action_Stats_Returning_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Action_Stats_Returning_Order_By>>;
  where?: InputMaybe<Action_Stats_Returning_Bool_Exp>;
};

export type Subscription_RootAction_Stats_AggregateArgs = {
  args: Action_Stats_Args;
  distinct_on?: InputMaybe<Array<Action_Stats_Returning_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Action_Stats_Returning_Order_By>>;
  where?: InputMaybe<Action_Stats_Returning_Bool_Exp>;
};

export type Subscription_RootAction_Stats_ReturningArgs = {
  distinct_on?: InputMaybe<Array<Action_Stats_Returning_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Action_Stats_Returning_Order_By>>;
  where?: InputMaybe<Action_Stats_Returning_Bool_Exp>;
};

export type Subscription_RootAction_Stats_Returning_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Action_Stats_Returning_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Action_Stats_Returning_Order_By>>;
  where?: InputMaybe<Action_Stats_Returning_Bool_Exp>;
};

export type Subscription_RootAction_Stats_Returning_By_PkArgs = {
  action_id: Scalars["String"];
};

export type Subscription_RootAction_Stats_Returning_StreamArgs = {
  batch_size: Scalars["Int"];
  cursor: Array<InputMaybe<Action_Stats_Returning_Stream_Cursor_Input>>;
  where?: InputMaybe<Action_Stats_Returning_Bool_Exp>;
};

export type Subscription_RootAction_StreamArgs = {
  batch_size: Scalars["Int"];
  cursor: Array<InputMaybe<Action_Stream_Cursor_Input>>;
  where?: InputMaybe<Action_Bool_Exp>;
};

export type Subscription_RootApi_KeyArgs = {
  distinct_on?: InputMaybe<Array<Api_Key_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Api_Key_Order_By>>;
  where?: InputMaybe<Api_Key_Bool_Exp>;
};

export type Subscription_RootApi_Key_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Api_Key_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Api_Key_Order_By>>;
  where?: InputMaybe<Api_Key_Bool_Exp>;
};

export type Subscription_RootApi_Key_By_PkArgs = {
  id: Scalars["String"];
};

export type Subscription_RootApi_Key_StreamArgs = {
  batch_size: Scalars["Int"];
  cursor: Array<InputMaybe<Api_Key_Stream_Cursor_Input>>;
  where?: InputMaybe<Api_Key_Bool_Exp>;
};

export type Subscription_RootAppArgs = {
  distinct_on?: InputMaybe<Array<App_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<App_Order_By>>;
  where?: InputMaybe<App_Bool_Exp>;
};

export type Subscription_RootApp_AggregateArgs = {
  distinct_on?: InputMaybe<Array<App_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<App_Order_By>>;
  where?: InputMaybe<App_Bool_Exp>;
};

export type Subscription_RootApp_By_PkArgs = {
  id: Scalars["String"];
};

export type Subscription_RootApp_MetadataArgs = {
  distinct_on?: InputMaybe<Array<App_Metadata_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<App_Metadata_Order_By>>;
  where?: InputMaybe<App_Metadata_Bool_Exp>;
};

export type Subscription_RootApp_Metadata_AggregateArgs = {
  distinct_on?: InputMaybe<Array<App_Metadata_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<App_Metadata_Order_By>>;
  where?: InputMaybe<App_Metadata_Bool_Exp>;
};

export type Subscription_RootApp_Metadata_By_PkArgs = {
  id: Scalars["String"];
};

export type Subscription_RootApp_Metadata_StreamArgs = {
  batch_size: Scalars["Int"];
  cursor: Array<InputMaybe<App_Metadata_Stream_Cursor_Input>>;
  where?: InputMaybe<App_Metadata_Bool_Exp>;
};

export type Subscription_RootApp_RankingsArgs = {
  distinct_on?: InputMaybe<Array<App_Rankings_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<App_Rankings_Order_By>>;
  where?: InputMaybe<App_Rankings_Bool_Exp>;
};

export type Subscription_RootApp_Rankings_AggregateArgs = {
  distinct_on?: InputMaybe<Array<App_Rankings_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<App_Rankings_Order_By>>;
  where?: InputMaybe<App_Rankings_Bool_Exp>;
};

export type Subscription_RootApp_Rankings_By_PkArgs = {
  id: Scalars["String"];
};

export type Subscription_RootApp_Rankings_StreamArgs = {
  batch_size: Scalars["Int"];
  cursor: Array<InputMaybe<App_Rankings_Stream_Cursor_Input>>;
  where?: InputMaybe<App_Rankings_Bool_Exp>;
};

export type Subscription_RootApp_StatsArgs = {
  args: App_Stats_Args;
  distinct_on?: InputMaybe<Array<App_Stats_Returning_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<App_Stats_Returning_Order_By>>;
  where?: InputMaybe<App_Stats_Returning_Bool_Exp>;
};

export type Subscription_RootApp_Stats_AggregateArgs = {
  args: App_Stats_Args;
  distinct_on?: InputMaybe<Array<App_Stats_Returning_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<App_Stats_Returning_Order_By>>;
  where?: InputMaybe<App_Stats_Returning_Bool_Exp>;
};

export type Subscription_RootApp_Stats_ReturningArgs = {
  distinct_on?: InputMaybe<Array<App_Stats_Returning_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<App_Stats_Returning_Order_By>>;
  where?: InputMaybe<App_Stats_Returning_Bool_Exp>;
};

export type Subscription_RootApp_Stats_Returning_AggregateArgs = {
  distinct_on?: InputMaybe<Array<App_Stats_Returning_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<App_Stats_Returning_Order_By>>;
  where?: InputMaybe<App_Stats_Returning_Bool_Exp>;
};

export type Subscription_RootApp_Stats_Returning_By_PkArgs = {
  app_id: Scalars["String"];
};

export type Subscription_RootApp_Stats_Returning_StreamArgs = {
  batch_size: Scalars["Int"];
  cursor: Array<InputMaybe<App_Stats_Returning_Stream_Cursor_Input>>;
  where?: InputMaybe<App_Stats_Returning_Bool_Exp>;
};

export type Subscription_RootApp_StreamArgs = {
  batch_size: Scalars["Int"];
  cursor: Array<InputMaybe<App_Stream_Cursor_Input>>;
  where?: InputMaybe<App_Bool_Exp>;
};

export type Subscription_RootAuth_CodeArgs = {
  distinct_on?: InputMaybe<Array<Auth_Code_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Auth_Code_Order_By>>;
  where?: InputMaybe<Auth_Code_Bool_Exp>;
};

export type Subscription_RootAuth_Code_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Auth_Code_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Auth_Code_Order_By>>;
  where?: InputMaybe<Auth_Code_Bool_Exp>;
};

export type Subscription_RootAuth_Code_By_PkArgs = {
  id: Scalars["String"];
};

export type Subscription_RootAuth_Code_StreamArgs = {
  batch_size: Scalars["Int"];
  cursor: Array<InputMaybe<Auth_Code_Stream_Cursor_Input>>;
  where?: InputMaybe<Auth_Code_Bool_Exp>;
};

export type Subscription_RootCacheArgs = {
  distinct_on?: InputMaybe<Array<Cache_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Cache_Order_By>>;
  where?: InputMaybe<Cache_Bool_Exp>;
};

export type Subscription_RootCache_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Cache_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Cache_Order_By>>;
  where?: InputMaybe<Cache_Bool_Exp>;
};

export type Subscription_RootCache_By_PkArgs = {
  id: Scalars["String"];
};

export type Subscription_RootCache_StreamArgs = {
  batch_size: Scalars["Int"];
  cursor: Array<InputMaybe<Cache_Stream_Cursor_Input>>;
  where?: InputMaybe<Cache_Bool_Exp>;
};

export type Subscription_RootInviteArgs = {
  distinct_on?: InputMaybe<Array<Invite_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Invite_Order_By>>;
  where?: InputMaybe<Invite_Bool_Exp>;
};

export type Subscription_RootInvite_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Invite_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Invite_Order_By>>;
  where?: InputMaybe<Invite_Bool_Exp>;
};

export type Subscription_RootInvite_By_PkArgs = {
  id: Scalars["String"];
};

export type Subscription_RootInvite_StreamArgs = {
  batch_size: Scalars["Int"];
  cursor: Array<InputMaybe<Invite_Stream_Cursor_Input>>;
  where?: InputMaybe<Invite_Bool_Exp>;
};

export type Subscription_RootJwksArgs = {
  distinct_on?: InputMaybe<Array<Jwks_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Jwks_Order_By>>;
  where?: InputMaybe<Jwks_Bool_Exp>;
};

export type Subscription_RootJwks_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Jwks_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Jwks_Order_By>>;
  where?: InputMaybe<Jwks_Bool_Exp>;
};

export type Subscription_RootJwks_By_PkArgs = {
  id: Scalars["String"];
};

export type Subscription_RootJwks_StreamArgs = {
  batch_size: Scalars["Int"];
  cursor: Array<InputMaybe<Jwks_Stream_Cursor_Input>>;
  where?: InputMaybe<Jwks_Bool_Exp>;
};

export type Subscription_RootMembershipArgs = {
  distinct_on?: InputMaybe<Array<Membership_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Membership_Order_By>>;
  where?: InputMaybe<Membership_Bool_Exp>;
};

export type Subscription_RootMembership_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Membership_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Membership_Order_By>>;
  where?: InputMaybe<Membership_Bool_Exp>;
};

export type Subscription_RootMembership_By_PkArgs = {
  id: Scalars["String"];
};

export type Subscription_RootMembership_StreamArgs = {
  batch_size: Scalars["Int"];
  cursor: Array<InputMaybe<Membership_Stream_Cursor_Input>>;
  where?: InputMaybe<Membership_Bool_Exp>;
};

export type Subscription_RootNullifierArgs = {
  distinct_on?: InputMaybe<Array<Nullifier_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Nullifier_Order_By>>;
  where?: InputMaybe<Nullifier_Bool_Exp>;
};

export type Subscription_RootNullifier_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Nullifier_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Nullifier_Order_By>>;
  where?: InputMaybe<Nullifier_Bool_Exp>;
};

export type Subscription_RootNullifier_By_PkArgs = {
  id: Scalars["String"];
};

export type Subscription_RootNullifier_StreamArgs = {
  batch_size: Scalars["Int"];
  cursor: Array<InputMaybe<Nullifier_Stream_Cursor_Input>>;
  where?: InputMaybe<Nullifier_Bool_Exp>;
};

export type Subscription_RootRedirectArgs = {
  distinct_on?: InputMaybe<Array<Redirect_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Redirect_Order_By>>;
  where?: InputMaybe<Redirect_Bool_Exp>;
};

export type Subscription_RootRedirect_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Redirect_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Redirect_Order_By>>;
  where?: InputMaybe<Redirect_Bool_Exp>;
};

export type Subscription_RootRedirect_By_PkArgs = {
  id: Scalars["String"];
};

export type Subscription_RootRedirect_StreamArgs = {
  batch_size: Scalars["Int"];
  cursor: Array<InputMaybe<Redirect_Stream_Cursor_Input>>;
  where?: InputMaybe<Redirect_Bool_Exp>;
};

export type Subscription_RootRoleArgs = {
  distinct_on?: InputMaybe<Array<Role_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Role_Order_By>>;
  where?: InputMaybe<Role_Bool_Exp>;
};

export type Subscription_RootRole_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Role_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Role_Order_By>>;
  where?: InputMaybe<Role_Bool_Exp>;
};

export type Subscription_RootRole_By_PkArgs = {
  value: Scalars["String"];
};

export type Subscription_RootRole_StreamArgs = {
  batch_size: Scalars["Int"];
  cursor: Array<InputMaybe<Role_Stream_Cursor_Input>>;
  where?: InputMaybe<Role_Bool_Exp>;
};

export type Subscription_RootTeamArgs = {
  distinct_on?: InputMaybe<Array<Team_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Team_Order_By>>;
  where?: InputMaybe<Team_Bool_Exp>;
};

export type Subscription_RootTeam_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Team_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Team_Order_By>>;
  where?: InputMaybe<Team_Bool_Exp>;
};

export type Subscription_RootTeam_By_PkArgs = {
  id: Scalars["String"];
};

export type Subscription_RootTeam_StreamArgs = {
  batch_size: Scalars["Int"];
  cursor: Array<InputMaybe<Team_Stream_Cursor_Input>>;
  where?: InputMaybe<Team_Bool_Exp>;
};

export type Subscription_RootUserArgs = {
  distinct_on?: InputMaybe<Array<User_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<User_Order_By>>;
  where?: InputMaybe<User_Bool_Exp>;
};

export type Subscription_RootUser_AggregateArgs = {
  distinct_on?: InputMaybe<Array<User_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<User_Order_By>>;
  where?: InputMaybe<User_Bool_Exp>;
};

export type Subscription_RootUser_By_PkArgs = {
  id: Scalars["String"];
};

export type Subscription_RootUser_StreamArgs = {
  batch_size: Scalars["Int"];
  cursor: Array<InputMaybe<User_Stream_Cursor_Input>>;
  where?: InputMaybe<User_Bool_Exp>;
};

/** columns and relationships of "team" */
export type Team = {
  __typename?: "team";
  /** An array relationship */
  api_keys: Array<Api_Key>;
  /** An aggregate relationship */
  api_keys_aggregate: Api_Key_Aggregate;
  /** An array relationship */
  apps: Array<App>;
  /** An aggregate relationship */
  apps_aggregate: App_Aggregate;
  created_at: Scalars["timestamptz"];
  id: Scalars["String"];
  /** An array relationship */
  memberships: Array<Membership>;
  /** An aggregate relationship */
  memberships_aggregate: Membership_Aggregate;
  name?: Maybe<Scalars["String"]>;
  /** A computed field that returns a quantity of team owners */
  team_owners_count?: Maybe<Scalars["Int"]>;
  updated_at: Scalars["timestamptz"];
};

/** columns and relationships of "team" */
export type TeamApi_KeysArgs = {
  distinct_on?: InputMaybe<Array<Api_Key_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Api_Key_Order_By>>;
  where?: InputMaybe<Api_Key_Bool_Exp>;
};

/** columns and relationships of "team" */
export type TeamApi_Keys_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Api_Key_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Api_Key_Order_By>>;
  where?: InputMaybe<Api_Key_Bool_Exp>;
};

/** columns and relationships of "team" */
export type TeamAppsArgs = {
  distinct_on?: InputMaybe<Array<App_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<App_Order_By>>;
  where?: InputMaybe<App_Bool_Exp>;
};

/** columns and relationships of "team" */
export type TeamApps_AggregateArgs = {
  distinct_on?: InputMaybe<Array<App_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<App_Order_By>>;
  where?: InputMaybe<App_Bool_Exp>;
};

/** columns and relationships of "team" */
export type TeamMembershipsArgs = {
  distinct_on?: InputMaybe<Array<Membership_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Membership_Order_By>>;
  where?: InputMaybe<Membership_Bool_Exp>;
};

/** columns and relationships of "team" */
export type TeamMemberships_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Membership_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Membership_Order_By>>;
  where?: InputMaybe<Membership_Bool_Exp>;
};

/** aggregated selection of "team" */
export type Team_Aggregate = {
  __typename?: "team_aggregate";
  aggregate?: Maybe<Team_Aggregate_Fields>;
  nodes: Array<Team>;
};

/** aggregate fields of "team" */
export type Team_Aggregate_Fields = {
  __typename?: "team_aggregate_fields";
  avg?: Maybe<Team_Avg_Fields>;
  count: Scalars["Int"];
  max?: Maybe<Team_Max_Fields>;
  min?: Maybe<Team_Min_Fields>;
  stddev?: Maybe<Team_Stddev_Fields>;
  stddev_pop?: Maybe<Team_Stddev_Pop_Fields>;
  stddev_samp?: Maybe<Team_Stddev_Samp_Fields>;
  sum?: Maybe<Team_Sum_Fields>;
  var_pop?: Maybe<Team_Var_Pop_Fields>;
  var_samp?: Maybe<Team_Var_Samp_Fields>;
  variance?: Maybe<Team_Variance_Fields>;
};

/** aggregate fields of "team" */
export type Team_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Team_Select_Column>>;
  distinct?: InputMaybe<Scalars["Boolean"]>;
};

/** aggregate avg on columns */
export type Team_Avg_Fields = {
  __typename?: "team_avg_fields";
  /** A computed field that returns a quantity of team owners */
  team_owners_count?: Maybe<Scalars["Int"]>;
};

/** Boolean expression to filter rows from the table "team". All fields are combined with a logical 'AND'. */
export type Team_Bool_Exp = {
  _and?: InputMaybe<Array<Team_Bool_Exp>>;
  _not?: InputMaybe<Team_Bool_Exp>;
  _or?: InputMaybe<Array<Team_Bool_Exp>>;
  api_keys?: InputMaybe<Api_Key_Bool_Exp>;
  api_keys_aggregate?: InputMaybe<Api_Key_Aggregate_Bool_Exp>;
  apps?: InputMaybe<App_Bool_Exp>;
  apps_aggregate?: InputMaybe<App_Aggregate_Bool_Exp>;
  created_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  id?: InputMaybe<String_Comparison_Exp>;
  memberships?: InputMaybe<Membership_Bool_Exp>;
  memberships_aggregate?: InputMaybe<Membership_Aggregate_Bool_Exp>;
  name?: InputMaybe<String_Comparison_Exp>;
  team_owners_count?: InputMaybe<Int_Comparison_Exp>;
  updated_at?: InputMaybe<Timestamptz_Comparison_Exp>;
};

/** unique or primary key constraints on table "team" */
export enum Team_Constraint {
  /** unique or primary key constraint on columns "id" */
  TeamPkey = "team_pkey",
}

/** input type for inserting data into table "team" */
export type Team_Insert_Input = {
  api_keys?: InputMaybe<Api_Key_Arr_Rel_Insert_Input>;
  apps?: InputMaybe<App_Arr_Rel_Insert_Input>;
  created_at?: InputMaybe<Scalars["timestamptz"]>;
  id?: InputMaybe<Scalars["String"]>;
  memberships?: InputMaybe<Membership_Arr_Rel_Insert_Input>;
  name?: InputMaybe<Scalars["String"]>;
  updated_at?: InputMaybe<Scalars["timestamptz"]>;
};

/** aggregate max on columns */
export type Team_Max_Fields = {
  __typename?: "team_max_fields";
  created_at?: Maybe<Scalars["timestamptz"]>;
  id?: Maybe<Scalars["String"]>;
  name?: Maybe<Scalars["String"]>;
  /** A computed field that returns a quantity of team owners */
  team_owners_count?: Maybe<Scalars["Int"]>;
  updated_at?: Maybe<Scalars["timestamptz"]>;
};

/** aggregate min on columns */
export type Team_Min_Fields = {
  __typename?: "team_min_fields";
  created_at?: Maybe<Scalars["timestamptz"]>;
  id?: Maybe<Scalars["String"]>;
  name?: Maybe<Scalars["String"]>;
  /** A computed field that returns a quantity of team owners */
  team_owners_count?: Maybe<Scalars["Int"]>;
  updated_at?: Maybe<Scalars["timestamptz"]>;
};

/** response of any mutation on the table "team" */
export type Team_Mutation_Response = {
  __typename?: "team_mutation_response";
  /** number of rows affected by the mutation */
  affected_rows: Scalars["Int"];
  /** data from the rows affected by the mutation */
  returning: Array<Team>;
};

/** input type for inserting object relation for remote table "team" */
export type Team_Obj_Rel_Insert_Input = {
  data: Team_Insert_Input;
  /** upsert condition */
  on_conflict?: InputMaybe<Team_On_Conflict>;
};

/** on_conflict condition type for table "team" */
export type Team_On_Conflict = {
  constraint: Team_Constraint;
  update_columns?: Array<Team_Update_Column>;
  where?: InputMaybe<Team_Bool_Exp>;
};

/** Ordering options when selecting data from "team". */
export type Team_Order_By = {
  api_keys_aggregate?: InputMaybe<Api_Key_Aggregate_Order_By>;
  apps_aggregate?: InputMaybe<App_Aggregate_Order_By>;
  created_at?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  memberships_aggregate?: InputMaybe<Membership_Aggregate_Order_By>;
  name?: InputMaybe<Order_By>;
  team_owners_count?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
};

/** primary key columns input for table: team */
export type Team_Pk_Columns_Input = {
  id: Scalars["String"];
};

/** select columns of table "team" */
export enum Team_Select_Column {
  /** column name */
  CreatedAt = "created_at",
  /** column name */
  Id = "id",
  /** column name */
  Name = "name",
  /** column name */
  UpdatedAt = "updated_at",
}

/** input type for updating data in table "team" */
export type Team_Set_Input = {
  created_at?: InputMaybe<Scalars["timestamptz"]>;
  id?: InputMaybe<Scalars["String"]>;
  name?: InputMaybe<Scalars["String"]>;
  updated_at?: InputMaybe<Scalars["timestamptz"]>;
};

/** aggregate stddev on columns */
export type Team_Stddev_Fields = {
  __typename?: "team_stddev_fields";
  /** A computed field that returns a quantity of team owners */
  team_owners_count?: Maybe<Scalars["Int"]>;
};

/** aggregate stddev_pop on columns */
export type Team_Stddev_Pop_Fields = {
  __typename?: "team_stddev_pop_fields";
  /** A computed field that returns a quantity of team owners */
  team_owners_count?: Maybe<Scalars["Int"]>;
};

/** aggregate stddev_samp on columns */
export type Team_Stddev_Samp_Fields = {
  __typename?: "team_stddev_samp_fields";
  /** A computed field that returns a quantity of team owners */
  team_owners_count?: Maybe<Scalars["Int"]>;
};

/** Streaming cursor of the table "team" */
export type Team_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Team_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Team_Stream_Cursor_Value_Input = {
  created_at?: InputMaybe<Scalars["timestamptz"]>;
  id?: InputMaybe<Scalars["String"]>;
  name?: InputMaybe<Scalars["String"]>;
  updated_at?: InputMaybe<Scalars["timestamptz"]>;
};

/** aggregate sum on columns */
export type Team_Sum_Fields = {
  __typename?: "team_sum_fields";
  /** A computed field that returns a quantity of team owners */
  team_owners_count?: Maybe<Scalars["Int"]>;
};

/** update columns of table "team" */
export enum Team_Update_Column {
  /** column name */
  CreatedAt = "created_at",
  /** column name */
  Id = "id",
  /** column name */
  Name = "name",
  /** column name */
  UpdatedAt = "updated_at",
}

export type Team_Updates = {
  /** sets the columns of the filtered rows to the given values */
  _set?: InputMaybe<Team_Set_Input>;
  /** filter the rows which have to be updated */
  where: Team_Bool_Exp;
};

/** aggregate var_pop on columns */
export type Team_Var_Pop_Fields = {
  __typename?: "team_var_pop_fields";
  /** A computed field that returns a quantity of team owners */
  team_owners_count?: Maybe<Scalars["Int"]>;
};

/** aggregate var_samp on columns */
export type Team_Var_Samp_Fields = {
  __typename?: "team_var_samp_fields";
  /** A computed field that returns a quantity of team owners */
  team_owners_count?: Maybe<Scalars["Int"]>;
};

/** aggregate variance on columns */
export type Team_Variance_Fields = {
  __typename?: "team_variance_fields";
  /** A computed field that returns a quantity of team owners */
  team_owners_count?: Maybe<Scalars["Int"]>;
};

/** Boolean expression to compare columns of type "timestamptz". All fields are combined with logical 'AND'. */
export type Timestamptz_Comparison_Exp = {
  _eq?: InputMaybe<Scalars["timestamptz"]>;
  _gt?: InputMaybe<Scalars["timestamptz"]>;
  _gte?: InputMaybe<Scalars["timestamptz"]>;
  _in?: InputMaybe<Array<Scalars["timestamptz"]>>;
  _is_null?: InputMaybe<Scalars["Boolean"]>;
  _lt?: InputMaybe<Scalars["timestamptz"]>;
  _lte?: InputMaybe<Scalars["timestamptz"]>;
  _neq?: InputMaybe<Scalars["timestamptz"]>;
  _nin?: InputMaybe<Array<Scalars["timestamptz"]>>;
};

/** columns and relationships of "user" */
export type User = {
  __typename?: "user";
  auth0Id?: Maybe<Scalars["String"]>;
  created_at: Scalars["timestamptz"];
  email?: Maybe<Scalars["String"]>;
  id: Scalars["String"];
  ironclad_id: Scalars["String"];
  is_allow_tracking?: Maybe<Scalars["Boolean"]>;
  is_subscribed: Scalars["Boolean"];
  /** An array relationship */
  memberships: Array<Membership>;
  /** An aggregate relationship */
  memberships_aggregate: Membership_Aggregate;
  name: Scalars["String"];
  posthog_id?: Maybe<Scalars["String"]>;
  /** An object relationship */
  team?: Maybe<Team>;
  team_id?: Maybe<Scalars["String"]>;
  updated_at: Scalars["timestamptz"];
  world_id_nullifier?: Maybe<Scalars["String"]>;
};

/** columns and relationships of "user" */
export type UserMembershipsArgs = {
  distinct_on?: InputMaybe<Array<Membership_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Membership_Order_By>>;
  where?: InputMaybe<Membership_Bool_Exp>;
};

/** columns and relationships of "user" */
export type UserMemberships_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Membership_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Membership_Order_By>>;
  where?: InputMaybe<Membership_Bool_Exp>;
};

/** aggregated selection of "user" */
export type User_Aggregate = {
  __typename?: "user_aggregate";
  aggregate?: Maybe<User_Aggregate_Fields>;
  nodes: Array<User>;
};

/** aggregate fields of "user" */
export type User_Aggregate_Fields = {
  __typename?: "user_aggregate_fields";
  count: Scalars["Int"];
  max?: Maybe<User_Max_Fields>;
  min?: Maybe<User_Min_Fields>;
};

/** aggregate fields of "user" */
export type User_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<User_Select_Column>>;
  distinct?: InputMaybe<Scalars["Boolean"]>;
};

/** Boolean expression to filter rows from the table "user". All fields are combined with a logical 'AND'. */
export type User_Bool_Exp = {
  _and?: InputMaybe<Array<User_Bool_Exp>>;
  _not?: InputMaybe<User_Bool_Exp>;
  _or?: InputMaybe<Array<User_Bool_Exp>>;
  auth0Id?: InputMaybe<String_Comparison_Exp>;
  created_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  email?: InputMaybe<String_Comparison_Exp>;
  id?: InputMaybe<String_Comparison_Exp>;
  ironclad_id?: InputMaybe<String_Comparison_Exp>;
  is_allow_tracking?: InputMaybe<Boolean_Comparison_Exp>;
  is_subscribed?: InputMaybe<Boolean_Comparison_Exp>;
  memberships?: InputMaybe<Membership_Bool_Exp>;
  memberships_aggregate?: InputMaybe<Membership_Aggregate_Bool_Exp>;
  name?: InputMaybe<String_Comparison_Exp>;
  posthog_id?: InputMaybe<String_Comparison_Exp>;
  team?: InputMaybe<Team_Bool_Exp>;
  team_id?: InputMaybe<String_Comparison_Exp>;
  updated_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  world_id_nullifier?: InputMaybe<String_Comparison_Exp>;
};

/** unique or primary key constraints on table "user" */
export enum User_Constraint {
  /** unique or primary key constraint on columns "auth0Id" */
  UserAuth0IdKey = "user_auth0Id_key",
  /** unique or primary key constraint on columns "email" */
  UserEmailKey = "user_email_key",
  /** unique or primary key constraint on columns "id" */
  UserPkey = "user_pkey",
  /** unique or primary key constraint on columns "posthog_id" */
  UserPosthogIdKey = "user_posthog_id_key",
}

/** input type for inserting data into table "user" */
export type User_Insert_Input = {
  auth0Id?: InputMaybe<Scalars["String"]>;
  created_at?: InputMaybe<Scalars["timestamptz"]>;
  email?: InputMaybe<Scalars["String"]>;
  id?: InputMaybe<Scalars["String"]>;
  ironclad_id?: InputMaybe<Scalars["String"]>;
  is_allow_tracking?: InputMaybe<Scalars["Boolean"]>;
  is_subscribed?: InputMaybe<Scalars["Boolean"]>;
  memberships?: InputMaybe<Membership_Arr_Rel_Insert_Input>;
  name?: InputMaybe<Scalars["String"]>;
  posthog_id?: InputMaybe<Scalars["String"]>;
  team?: InputMaybe<Team_Obj_Rel_Insert_Input>;
  team_id?: InputMaybe<Scalars["String"]>;
  updated_at?: InputMaybe<Scalars["timestamptz"]>;
  world_id_nullifier?: InputMaybe<Scalars["String"]>;
};

/** aggregate max on columns */
export type User_Max_Fields = {
  __typename?: "user_max_fields";
  auth0Id?: Maybe<Scalars["String"]>;
  created_at?: Maybe<Scalars["timestamptz"]>;
  email?: Maybe<Scalars["String"]>;
  id?: Maybe<Scalars["String"]>;
  ironclad_id?: Maybe<Scalars["String"]>;
  name?: Maybe<Scalars["String"]>;
  posthog_id?: Maybe<Scalars["String"]>;
  team_id?: Maybe<Scalars["String"]>;
  updated_at?: Maybe<Scalars["timestamptz"]>;
  world_id_nullifier?: Maybe<Scalars["String"]>;
};

/** aggregate min on columns */
export type User_Min_Fields = {
  __typename?: "user_min_fields";
  auth0Id?: Maybe<Scalars["String"]>;
  created_at?: Maybe<Scalars["timestamptz"]>;
  email?: Maybe<Scalars["String"]>;
  id?: Maybe<Scalars["String"]>;
  ironclad_id?: Maybe<Scalars["String"]>;
  name?: Maybe<Scalars["String"]>;
  posthog_id?: Maybe<Scalars["String"]>;
  team_id?: Maybe<Scalars["String"]>;
  updated_at?: Maybe<Scalars["timestamptz"]>;
  world_id_nullifier?: Maybe<Scalars["String"]>;
};

/** response of any mutation on the table "user" */
export type User_Mutation_Response = {
  __typename?: "user_mutation_response";
  /** number of rows affected by the mutation */
  affected_rows: Scalars["Int"];
  /** data from the rows affected by the mutation */
  returning: Array<User>;
};

/** input type for inserting object relation for remote table "user" */
export type User_Obj_Rel_Insert_Input = {
  data: User_Insert_Input;
  /** upsert condition */
  on_conflict?: InputMaybe<User_On_Conflict>;
};

/** on_conflict condition type for table "user" */
export type User_On_Conflict = {
  constraint: User_Constraint;
  update_columns?: Array<User_Update_Column>;
  where?: InputMaybe<User_Bool_Exp>;
};

/** Ordering options when selecting data from "user". */
export type User_Order_By = {
  auth0Id?: InputMaybe<Order_By>;
  created_at?: InputMaybe<Order_By>;
  email?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  ironclad_id?: InputMaybe<Order_By>;
  is_allow_tracking?: InputMaybe<Order_By>;
  is_subscribed?: InputMaybe<Order_By>;
  memberships_aggregate?: InputMaybe<Membership_Aggregate_Order_By>;
  name?: InputMaybe<Order_By>;
  posthog_id?: InputMaybe<Order_By>;
  team?: InputMaybe<Team_Order_By>;
  team_id?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
  world_id_nullifier?: InputMaybe<Order_By>;
};

/** primary key columns input for table: user */
export type User_Pk_Columns_Input = {
  id: Scalars["String"];
};

/** select columns of table "user" */
export enum User_Select_Column {
  /** column name */
  Auth0Id = "auth0Id",
  /** column name */
  CreatedAt = "created_at",
  /** column name */
  Email = "email",
  /** column name */
  Id = "id",
  /** column name */
  IroncladId = "ironclad_id",
  /** column name */
  IsAllowTracking = "is_allow_tracking",
  /** column name */
  IsSubscribed = "is_subscribed",
  /** column name */
  Name = "name",
  /** column name */
  PosthogId = "posthog_id",
  /** column name */
  TeamId = "team_id",
  /** column name */
  UpdatedAt = "updated_at",
  /** column name */
  WorldIdNullifier = "world_id_nullifier",
}

/** input type for updating data in table "user" */
export type User_Set_Input = {
  auth0Id?: InputMaybe<Scalars["String"]>;
  created_at?: InputMaybe<Scalars["timestamptz"]>;
  email?: InputMaybe<Scalars["String"]>;
  id?: InputMaybe<Scalars["String"]>;
  ironclad_id?: InputMaybe<Scalars["String"]>;
  is_allow_tracking?: InputMaybe<Scalars["Boolean"]>;
  is_subscribed?: InputMaybe<Scalars["Boolean"]>;
  name?: InputMaybe<Scalars["String"]>;
  posthog_id?: InputMaybe<Scalars["String"]>;
  team_id?: InputMaybe<Scalars["String"]>;
  updated_at?: InputMaybe<Scalars["timestamptz"]>;
  world_id_nullifier?: InputMaybe<Scalars["String"]>;
};

/** Streaming cursor of the table "user" */
export type User_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: User_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type User_Stream_Cursor_Value_Input = {
  auth0Id?: InputMaybe<Scalars["String"]>;
  created_at?: InputMaybe<Scalars["timestamptz"]>;
  email?: InputMaybe<Scalars["String"]>;
  id?: InputMaybe<Scalars["String"]>;
  ironclad_id?: InputMaybe<Scalars["String"]>;
  is_allow_tracking?: InputMaybe<Scalars["Boolean"]>;
  is_subscribed?: InputMaybe<Scalars["Boolean"]>;
  name?: InputMaybe<Scalars["String"]>;
  posthog_id?: InputMaybe<Scalars["String"]>;
  team_id?: InputMaybe<Scalars["String"]>;
  updated_at?: InputMaybe<Scalars["timestamptz"]>;
  world_id_nullifier?: InputMaybe<Scalars["String"]>;
};

/** update columns of table "user" */
export enum User_Update_Column {
  /** column name */
  Auth0Id = "auth0Id",
  /** column name */
  CreatedAt = "created_at",
  /** column name */
  Email = "email",
  /** column name */
  Id = "id",
  /** column name */
  IroncladId = "ironclad_id",
  /** column name */
  IsAllowTracking = "is_allow_tracking",
  /** column name */
  IsSubscribed = "is_subscribed",
  /** column name */
  Name = "name",
  /** column name */
  PosthogId = "posthog_id",
  /** column name */
  TeamId = "team_id",
  /** column name */
  UpdatedAt = "updated_at",
  /** column name */
  WorldIdNullifier = "world_id_nullifier",
}

export type User_Updates = {
  /** sets the columns of the filtered rows to the given values */
  _set?: InputMaybe<User_Set_Input>;
  /** filter the rows which have to be updated */
  where: User_Bool_Exp;
};
