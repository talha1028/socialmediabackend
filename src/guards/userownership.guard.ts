import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { UserRole } from '../entities/user.entity';

@Injectable()
export class UserOwnershipGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const { id } = request.params;

    if (!user) {
      throw new ForbiddenException('Unauthorized access');
    }

    // ✅ Allow if user is ADMIN or SUPERADMIN
    if (user.role === UserRole.ADMIN || user.role === UserRole.SUPERADMIN) {
      return true;
    }

    // ✅ Allow if user owns the resource
    if (user.userId === Number(id)) {
      return true;
    }

    throw new ForbiddenException(
      'You are not allowed to access or modify this resource',
    );
  }
}
