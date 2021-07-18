export const HTTP_STATUS_CODES = Object.freeze({
  OK: 20,
  FORBIDDEN: 403,
  METHOD_NOT_ALLOWED: 405,
  WS_CLOSE_ERROR_CODE: 4000,
});

export const GROUP_REGEXPS = Object.freeze({
  main: /^$|\/$/,
  activity: /^(\/?)activity/,
});

export const GROUP_NAMES = Object.freeze({
  MAIN: 'main',
  ACTIVITY: 'activity',
});

export const ACTIONS = Object.freeze({
  ADD_POST: 'add-post',
});