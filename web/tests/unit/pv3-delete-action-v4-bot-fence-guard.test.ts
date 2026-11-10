// Deleting an action cascades to its nullifiers. Bot Fence bills from those
// nullifiers, so its `wid/waf/<window>/<index>` actions must not be deletable.

// #region Mocks
jest.mock("@/api/helpers/graphql", () => ({
  getAPIServiceGraphqlClient: jest.fn().mockResolvedValue({}),
}));

const DeleteActionV4 = jest.fn();
jest.mock(
  "@/scenes/common/Teams/TeamId/Apps/AppId/WorldIdActions/ActionId/Danger/page/graphql/server/delete-action-v4.generated",
  () => ({ getSdk: () => ({ DeleteActionV4 }) }),
);

const GetActionV4WithApp = jest.fn();
jest.mock(
  "@/scenes/common/Teams/TeamId/Apps/AppId/WorldIdActions/ActionId/Settings/UpdateActionV4Form/server/graphql/server/get-action-v4-with-app.generated",
  () => ({ getSdk: () => ({ GetActionV4WithApp }) }),
);

jest.mock("@/lib/permissions", () => ({
  getIsUserAllowedToUpdateApp: jest.fn().mockResolvedValue(true),
}));

jest.mock("@/api/helpers/errors", () => ({
  errorFormAction: ({ message }: { message: string }) => ({
    success: false,
    message,
  }),
}));

jest.mock("@/lib/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

import { deleteActionV4ServerSide } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldIdActions/ActionId/page/DeleteAction/server";
// #endregion

// #region Test Data
const APP_ID = "app_0123456789abcdef0123456789abcdef";
const ACTION_ID = "action_v4_1";

const actionRecord = (action: string) => ({
  action_v4_by_pk: {
    id: ACTION_ID,
    action,
    environment: "production",
    rp_registration: { app_id: APP_ID },
  },
});
// #endregion

beforeEach(() => {
  jest.clearAllMocks();
  DeleteActionV4.mockResolvedValue({
    delete_action_v4_by_pk: { id: ACTION_ID },
  });
});

// #region Bot Fence guard
describe("deleteActionV4ServerSide [Bot Fence guard]", () => {
  it("refuses to delete a Bot Fence window action", async () => {
    GetActionV4WithApp.mockResolvedValue(actionRecord("wid/waf/600/2989728"));

    const result = await deleteActionV4ServerSide(ACTION_ID, APP_ID);

    expect(result).toEqual({
      success: false,
      message: "Bot Fence actions can't be deleted",
    });
    expect(DeleteActionV4).not.toHaveBeenCalled();
  });

  it("still deletes customer actions that only share the wid/waf/ prefix", async () => {
    GetActionV4WithApp.mockResolvedValue(actionRecord("wid/waf/signup"));

    const result = await deleteActionV4ServerSide(ACTION_ID, APP_ID);

    expect(result).toEqual({
      success: true,
      message: "Action deleted successfully",
    });
    expect(DeleteActionV4).toHaveBeenCalledWith({ id: ACTION_ID });
  });
});
// #endregion
