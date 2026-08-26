import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface AuthenticatedRequest extends Request {
  userId?: string;
  role?: string;
  operatorId?: string;
  companyId?: string;
}

export const authMiddleware = (  req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  let token: string | undefined;
  //console.log("jwtsecret: ",process.env.JWT_SECRET);
  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, Please add token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string | number;
      roles: string;
      operatorId?: string;
      companyId?: string;
    };

    req.userId = String(decoded.userId);
    req.role = decoded.roles;
    req.operatorId = decoded.operatorId || 'e111111d-2e65-4d7a-85d1-125035feee1a';
    req.companyId = decoded.companyId;

    next();
  } catch (err) {
    return res.status(401).json({ message: 'Not valid' });
  }
};
