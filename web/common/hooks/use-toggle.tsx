import React from "react";

export function useToggle(initialState: boolean = false): Readonly<{
  isOn: boolean;
  toggle: () => void;
  toggleOn: () => void;
  toggleOff: () => void;
}> {
  const [state, setState] = React.useState<boolean>(initialState);

  return {
    isOn: state,
    toggle: () => setState(!state),
    toggleOn: () => setState(true),
    toggleOff: () => setState(false),
  };
}
