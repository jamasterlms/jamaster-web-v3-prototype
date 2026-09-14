export const isStandaloneRoute = (route: string) =>
  /^(student|teacher)(\/|$)|^(help|access|unauthorized|forbidden|offline|maintenance|error|login|forgot-password|reset-password|redirect|branch-selection|polling|payment|unsubscribe)(\/|$)/.test(
    route.replace(/^\//, '').split('?')[0],
  );
