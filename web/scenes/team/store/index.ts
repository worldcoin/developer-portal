import { Dispatch, SetStateAction } from "react";
import { create } from "zustand";

export type TeamMember = {
  image: string;
  name: string;
  email: string;
  verified: boolean;
};

type Team = {
  name: string;
  members: TeamMember[];
};

type Filter = {
  query: string;
};

export enum InviteMembersState {
  LOADING,
  SUCCESS,
  ERROR,
}

export enum RemoveMembersState {
  LOADING,
  SUCCESS,
  ERROR,
}

const tempTeam = {
  name: "Team 1",

  members: [
    {
      image: "",
      name: "Steven Wilks",
      email: "steven.w34s@email.com",
      verified: true,
    },
    {
      image: "",
      name: "Christina Goldsmith",
      email: "christina.goldsmith@email.com",
      verified: true,
    },
    {
      image: "",
      name: "Bessie Cooper",
      email: "bess.cooper@email.com",
      verified: false,
    },
    {
      image: "",
      name: "Esther Howard",
      email: "esther.h@email.com",
      verified: true,
    },
    {
      image: "",
      name: "Darlene Robertson",
      email: "darlene.robertson@email.com",
      verified: false,
    },
  ],
};

type TeamStore = {
  team: Team | null;
  setTeam: (team: Team) => void;
  fetchTeam: () => Promise<void>;
  filter: Filter;
  setFilter: Dispatch<SetStateAction<Filter>>;
  applyFilter: () => void;
  filteredMembers: Array<TeamMember>;
  membersForInvite: Array<string>;
  setMembersForInvite: Dispatch<SetStateAction<Array<string>>>;
  inviteMembersState: null | InviteMembersState;
  inviteMembers: () => Promise<void>;
  memberForRemove: null | TeamMember;
  setMemberForRemove: (member: TeamMember | null) => void;
  removeMemberState: null | RemoveMembersState;
  removeMember: () => Promise<void>;
};

export const useTeamStore = create<TeamStore>((set, get) => ({
  team: null,
  setTeam: (team: Team) => set({ team }),

  fetchTeam: async () => {
    const team = tempTeam;
    set(() => ({ team }));
  },

  filter: { query: "" },

  setFilter: (filter: Filter | ((prevState: Filter) => Filter)) =>
    set(() => ({
      filter: typeof filter === "function" ? filter(get().filter) : filter,
    })),

  applyFilter: () => {
    const { query } = get().filter;
    set(() => ({
      filteredMembers: tempTeam.members.filter((member) => {
        return member.name.includes(query) || member.email.includes(query);
      }),
    }));
  },

  filteredMembers: tempTeam.members,

  membersForInvite: [],

  setMembersForInvite: (
    members: Array<string> | ((prevState: Array<string>) => Array<string>)
  ) => {
    if (typeof members === "function") {
      set(() => ({ membersForInvite: members(get().membersForInvite) }));
    } else {
      set(() => ({ membersForInvite: members }));
    }
  },

  inviteMembersState: null,

  inviteMembers: async () => {
    set(() => ({ inviteMembersState: InviteMembersState.LOADING }));

    const { team, membersForInvite } = get();

    //TODO: Replace with relevant logic
    if (team) {
      setTimeout(() => {
        set(() => ({
          team: {
            ...team,
            members: [
              ...team.members,
              ...membersForInvite.map((item) => ({
                image: "",
                email: item,
                name: `New Member ${team.members.length + 1}`,
                verified: false,
              })),
            ],
          },
        }));
        set(() => ({
          inviteMembersState: InviteMembersState.SUCCESS,
          membersForInvite: [],
        }));
        setTimeout(() => set(() => ({ inviteMembersState: null })), 5000);
      }, 1500);
    }
  },

  memberForRemove: null,

  setMemberForRemove: (member: TeamMember | null) =>
    set(() => ({ memberForRemove: member })),

  removeMemberState: null,

  removeMember: async () => {
    const team = get().team;

    const updatedList = team?.members.filter(
      (member) => member !== get().memberForRemove
    );

    if (team && updatedList) {
      set(() => ({
        team: { ...team, members: updatedList },
        memberForRemove: null,
      }));
    }
  },
}));

export const getTeamStore = (store: TeamStore) => ({
  team: store.team,
  setTeam: store.setTeam,
  fetchTeam: store.fetchTeam,
  filter: store.filter,
  setFilter: store.setFilter,
  applyFilter: store.applyFilter,
  membersForInvite: store.membersForInvite,
  setMembersForInvite: store.setMembersForInvite,
  inviteMembersStatus: store.inviteMembersState,
  inviteMembers: store.inviteMembers,
  memberForRemove: store.memberForRemove,
  setMemberForRemove: store.setMemberForRemove,
  removeMembersState: store.removeMemberState,
  removeMember: store.removeMember,
});
