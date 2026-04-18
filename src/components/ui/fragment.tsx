import * as React from "react";

/**
 * A wrapper around React.Fragment that filters out invalid props like data-lov-id
 * which are automatically added by development tools like lovable-tagger.
 *
 * React.Fragment only accepts 'key' and 'children' props, so this component
 * ensures only valid props are passed through.
 *
 * This component uses a render function approach to avoid passing any props
 * to React.Fragment except for key and children.
 */
export const Fragment: React.FC<{
  children: React.ReactNode;
  key?: React.Key;
  [key: string]: any; // Allow any other props to be passed in but they'll be filtered out
}> = (props) => {
  // Extract only the key and children props
  const { children, key } = props;

  // Use a render function to create a new React.Fragment with only valid props
  return React.createElement(React.Fragment, { key }, children);
};

Fragment.displayName = "Fragment";
