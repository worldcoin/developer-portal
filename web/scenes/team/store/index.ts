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
  setMembers: (members: Array<TeamMember>) => void;
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

  setMembers: (members) => {
    const { team, applyFilter } = get();

    if (team) {
      set(() => ({ team: { ...team, members } }));
      applyFilter();
    }
  },

  setTeam: (team: Team) => set({ team }),

  fetchTeam: async () => {
    const team = tempTeam;
    set(() => ({ team }));
  },

  filter: { query: "" },

  setFilter: (filter) =>
    set(() => ({
      filter: typeof filter === "function" ? filter(get().filter) : filter,
    })),

  applyFilter: () => {
    const {
      filter: { query },
      team,
    } = get();

    console.log(team);

    if (team) {
      set(() => ({
        filteredMembers: team.members.filter((member) => {
          return member.name.includes(query) || member.email.includes(query);
        }),
      }));
    }
  },

  filteredMembers: tempTeam.members,

  membersForInvite: [],

  setMembersForInvite: (members) => {
    if (typeof members === "function") {
      set(() => ({ membersForInvite: members(get().membersForInvite) }));
    } else {
      set(() => ({ membersForInvite: members }));
    }
  },

  inviteMembersState: null,

  inviteMembers: async () => {
    set(() => ({ inviteMembersState: InviteMembersState.LOADING }));

    const { team, setMembers, membersForInvite, setMembersForInvite } = get();

    //TODO: Replace with relevant logic
    if (team) {
      setTimeout(() => {
        setMembers([
          ...team.members,
          ...membersForInvite.map((item, idx) => ({
            image: "",
            email: item,
            name: `New Member ${team.members.length + idx + 1}`,
            verified: false,
          })),
        ]);

        set(() => ({ inviteMembersState: InviteMembersState.SUCCESS }));
        setMembersForInvite([]);
        setTimeout(() => set(() => ({ inviteMembersState: null })), 5000);
      }, 1500);
    }
  },

  memberForRemove: null,

  setMemberForRemove: (member) => set(() => ({ memberForRemove: member })),

  removeMemberState: null,

  removeMember: async () => {
    const { team, setMembers, setMemberForRemove } = get();

    const updatedList = team?.members.filter(
      (member) => member !== get().memberForRemove
    );

    if (team && updatedList) {
      setMembers(updatedList);
      setMemberForRemove(null);
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
