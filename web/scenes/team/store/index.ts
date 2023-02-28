import { create } from "zustand";

type TeamMember = {
  image: string;
  name: string;
  email: string;
};

type Team = {
  name: string;
  members: TeamMember[];
};

const tempTeam = {
  name: "Team 1",

  members: [
    {
      name: "Member 1",
      email: "member1@test.com",
      image: "",
    },
    {
      name: "Member 2",
      email: "member2@test.com",
      image: "",
    },
  ],
};

type TeamStore = {
  team: Team | null;
  setTeam: (team: Team) => void;
  fetchTeam: () => Promise<void>;
  inviteMembers: (members: TeamMember[]) => Promise<void>;
  removeMember: (email: string) => Promise<void>;
};

export const useTeamStore = create<TeamStore>((set, get) => ({
  team: null,
  setTeam: (team: Team) => set({ team }),
  fetchTeam: async () => {
    const team = tempTeam;
    set(() => ({ team }));
  },

  inviteMembers: async (members: TeamMember[]) => {
    const team = get().team;

    //TODO: Replace with relevant logic
    if (team) {
      set(() => ({
        team: { ...team, members: [...team.members, ...members] },
      }));
    }
  },

  removeMember: async (email: string) => {
    const team = get().team;

    const updatedList = team?.members.filter(
      (member) => member.email !== email
    );

    if (team && updatedList) {
      set(() => ({
        team: { ...team, members: updatedList },
      }));
    }
  },
}));

export const getTeamStore = (store: TeamStore) => ({
  team: store.team,
  setTeam: store.setTeam,
  fetchTeam: store.fetchTeam,
  inviteMembers: store.inviteMembers,
  removeMember: store.removeMember,
});
