
<div className="flex h-full items-center justify-between gap-3 sm:justify-center">
  <Switch.Root
    className="group flex w-20 max-w-xs items-center rounded-2xl border-[6px] border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1E293B] p-1.5 text-sm shadow-inner transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 data-[state=checked]:bg-blue-500 dark:data-[state=checked]:bg-blue-500"
    id="shadcn"
    name="shadcn"
    checked={shadcn}
    onCheckedChange={(value) => setShadcn(value)}
  >
    <Switch.Thumb className="size-7 rounded-lg bg-gray-200 dark:bg-gray-700 shadow-[0px_1px_2px] shadow-gray-400 dark:shadow-black transition data-[state=checked]:translate-x-7 data-[state=checked]:bg-white dark:data-[state=checked]:bg-white data-[state=checked]:shadow-gray-600" />
  </Switch.Root>
</div>

<div id="contentDiv" style={{ display: shadcn ? 'block' : 'none' }}>
  {/* Content to be shown or hidden */}
  <p>This is the content inside the div.</p>
</div>

<script>
import { useState } from 'react';

import Switch from '@headlessui/react';

function MyComponent() {
  const [shadcn, setShadcn] = useState(false);

  return (
    <div className="flex h-full items-center justify-between gap-3 sm:justify-center">
      <Switch.Root
        className="group flex w-20 max-w-xs items-center rounded-2xl border-[6px] border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1E293B] p-1.5 text-sm shadow-inner transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 data-[state=checked]:bg-blue-500 dark:data-[state=checked]:bg-blue-500"
        id="shadcn"
        name="shadcn"
        checked={shadcn}
        onCheckedChange={(value) => setShadcn(value)}
      >
        <Switch.Thumb className="size-7 rounded-lg bg-gray-200 dark:bg-gray-700 shadow-[0px_1px_2px] shadow-gray-400 dark:shadow-black transition data-[state=checked]:translate-x-7 data-[state=checked]:bg-white dark:data-[state=checked]:bg-white data-[state=checked]:shadow-gray-600" />
      </Switch.Root>
    </div>

    <div id="contentDiv" style={{ display: shadcn ? 'block' : 'none' }}>
      {/* Content to be shown or hidden */}
      <p>This is the content inside the div.</p>
    </div>
  );
}

export default MyComponent;
</script>

