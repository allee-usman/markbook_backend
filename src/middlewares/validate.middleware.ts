import { Request, Response, NextFunction } from 'express'
import { ZodSchema, ZodError } from 'zod'
import { sendError } from '../helpers/response.helper'
import { HTTP_STATUS } from '../constants'

// ── Validate request against a Zod schema ─────────────────────────────────────
// Schema should have shape: z.object({ body?: ..., params?: ..., query?: ... })
const validate =
  (schema: ZodSchema) =>
    (req: Request, res: Response, next: NextFunction): void => {
      const result = schema.safeParse({
        body: req.body,
        params: req.params,
        query: req.query,
      })

      if (!result.success) {
        // Format Zod errors into a clean array of { field, message }
        const errors = (result.error as ZodError).errors.map((err) => ({
          field: err.path.slice(1).join('.'), // remove 'body'/'params'/'query' prefix
          message: err.message,
        }))

        sendError(res, 'Validation failed', HTTP_STATUS.BAD_REQUEST, errors)
        return
      }

      // Attach parsed+coerced data back to req so controllers get clean data
      if (result.data.body) req.body = result.data.body
      if (result.data.params) req.params = result.data.params
      if (result.data.query) req.query = result.data.query

      next()
    }

export default validate