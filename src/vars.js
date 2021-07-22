export const HTTP_STATUS_CODES = Object.freeze({
  OK: 200,
  FORBIDDEN: 403,
  METHOD_NOT_ALLOWED: 405,
  WS_CLOSE_ERROR_CODE: 4000,
});

export const GROUP_REGEXPS = Object.freeze({
  main: /^\/?$/,
  activity: /^\/?activity\/?$/,
  topic: /^\/?\d+\/.*\/?$/,
});

export const GROUP_NAMES = Object.freeze({
  MAIN: 'main',
  ACTIVITY: 'activity',
  TOPIC: 'topic',
});

export const ACTIONS = Object.freeze({
  ADD_POST: 'q_post',
  COMMENT_POST: 'c_post',
});
