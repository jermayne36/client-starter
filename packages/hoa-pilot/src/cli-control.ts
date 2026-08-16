export function positiveControlExitCode(rawControlBlocked: boolean): 0 | 1 {
  // @fail-closed(hoa-cli-positive-control)
  return rawControlBlocked ? 0 : 1;
}
