import { ReactNode } from 'react';
export function Analytics(props: {
  beforeSend?: (event: any) => any;
  debug?: boolean;
  mode?: 'auto' | 'production' | 'development';
}): ReactNode;
