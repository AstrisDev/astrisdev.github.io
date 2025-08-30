import { ReactElement, useEffect } from 'react';
import ReactGA from 'react-ga4';

export const GAWrapper: React.FC<{ tag?: string; children: ReactElement }> = (props) => {
  // Initialize GA
  useEffect(() => {
    if (props.tag) {
      ReactGA.initialize(props.tag);
    }
  }, [props.tag]);
  return <>{props.children}</>;
};
