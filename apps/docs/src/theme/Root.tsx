import { Fragment, type ReactNode } from 'react';
import { Analytics } from '@vercel/analytics/react';

const Root = ({ children }: { children: ReactNode }) => (
  <Fragment>
    {children}
    <Analytics />
  </Fragment>
);

export default Root;
