import type { NextFunction, Request, Response } from "express";

type AsyncHandler = (
    req: Request,
    res: Response,
    next: NextFunction
)=> Promise<any>

const asyncHandler = (requestHandler: AsyncHandler) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(requestHandler(req, res, next)).catch(next);
  };
};

export {asyncHandler}