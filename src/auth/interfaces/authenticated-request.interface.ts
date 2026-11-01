import { Role } from '@prisma/client';
import { Request } from 'express';

export interface AuthenticatedReq extends Request {
  user: {
    id: string;
    email: string;
    role: Role;
  };
}
