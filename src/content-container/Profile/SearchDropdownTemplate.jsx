import { Select } from '@mantine/core';
import { useStore } from '@nanostores/react';
import { nanoid } from 'nanoid';
// import { user } from "../../stores/user"
import { plan } from "../../stores/plan"

export function Search() {
  // data = data.data
  let data =['1','2']
   const $plan = useStore(plan);
  const setPlan = (e) => {
    console.log(12312312312, e, $plan)
    // console.log(e.target.name, e.target.value);
    // plan.set({
    //   ...$plan,
    //   plan: e,
    // });
  };

  $plan.plan == '' ? $plan.plan =  "aBasic" : $plan.plan = $plan.plan
  console.log(44442312312312, $plan)
  return (
    <Select
      placeholder="Demo"
      label=""
      defaultValue="Choose a Workspace"
      data={data}
      onChange={setPlan} 
      name="plan" 
      styles={(theme) => ({
        item: {
          // applies styles to selected item
          '&[data-selected]': {
            '&, &:hover': {
              backgroundColor:
                theme.colorScheme === 'dark' ? theme.colors.teal[9] : theme.colors.teal[1],
              color: theme.colorScheme === 'dark' ? theme.white : theme.colors.teal[9],
            },
          },

          // applies styles to hovered item (with mouse or keyboard)
          '&[data-hovered]': {},
        },
      })}
    />
  );
}