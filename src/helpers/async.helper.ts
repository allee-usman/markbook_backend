import { Request, Response, NextFunction, RequestHandler } from 'express'

// Wraps an async controller so errors are forwarded to Express error handler ─
// Usage: export const myController = catchAsync(async (req, res, next) => { ... })
const catchAsync = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>,
): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next)
  }
}

export default catchAsync