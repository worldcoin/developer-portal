'use client'
import { Select, SelectButton, SelectOption, SelectOptions } from '@/components/Select'
import { useState } from 'react'
//import { CheckIcon } from '@/components/icons'

type Team = {
  id: string
  name: string
}

const TEAMS = [
  { id: '1', name: 'Team 1' },
  { id: '2', name: 'Team 2' },
  { id: '3', name: 'Team 3' },
  { id: '4', name: 'Team 4' },
  { id: '5', name: 'Team 5' },
  { id: '6', name: 'Team 6' },
  { id: '7', name: 'Team 7' },
]

export const TeamSelector = () => {

  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)

  return (
    <Select
      value={selectedTeam}
      onChange={setSelectedTeam}
      by={(a: Team | null, b: Team | null) => a?.id === b?.id}
    >
      <SelectButton>
        {selectedTeam?.name ?? 'Select team'}
        {/* OR */}
        {/*{({ value }: { value: Team }) => (*/}
        {/*  <div>{value?.name ?? 'Select team'}</div>*/}
        {/*)}*/}
      </SelectButton>

      <SelectOptions>
        {TEAMS.map(team => (
          <SelectOption key={team.id} value={team}>
            {({ selected }) => (
              <div className="grid grid-cols-1fr/auto">
                {team.name}

                {/*{selected && (*/}
                {/*  <CheckIcon/>*/}
                {/*)}*/}
              </div>
            )}
          </SelectOption>
        ))}
      </SelectOptions>
    </Select>
  )
}
