import type { RequestHandler } from 'express';
import type { ZodError, ZodTypeAny } from 'zod';
import { ApiError } from './errorHandler.js';

const formatZodError = (error: ZodError) => {
  return error.issues
    .map((issue) => {
      const path = issue.path.length ? issue.path.join('.') : 'request';
      return `${path}: ${issue.message}`;
    })
    .join(', ');
};

const applyValidatedData = (
  target: unknown,
  parsedData: unknown
) => {
  if (
    target &&
    typeof target === 'object' &&
    !Array.isArray(target) &&
    parsedData &&
    typeof parsedData === 'object' &&
    !Array.isArray(parsedData)
  ) {
    const targetObj = target as Record<string, unknown>;
    const parsedObj = parsedData as Record<string, unknown>;

    for (const key of Object.keys(targetObj)) {
      delete targetObj[key];
    }

    Object.assign(targetObj, parsedObj);
  }
};

const makeValidator = (
  schema: ZodTypeAny,
  source: 'body' | 'query' | 'params'
): RequestHandler => {
  return (req, _res, next) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      return next(
        new ApiError(
          400,
          formatZodError(result.error),
          'VALIDATION_ERROR'
        )
      );
    }

    // Mutate the existing object instead of reassigning req[source]
    applyValidatedData(req[source], result.data);

    return next();
  };
};

export const validateBody = (schema: ZodTypeAny): RequestHandler =>
  makeValidator(schema, 'body');

export const validateQuery = (schema: ZodTypeAny): RequestHandler =>
  makeValidator(schema, 'query');

export const validateParams = (schema: ZodTypeAny): RequestHandler =>
  makeValidator(schema, 'params');