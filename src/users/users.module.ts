import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './presentation/auth.controller';
import { UserController } from './presentation/user.controller';
import { LoginUseCase } from './application/login.usecase';
import { SetupStatusUseCase } from './application/setup-status.usecase';
import { SetupUseCase } from './application/setup.usecase';
import { CreateUserUseCase } from './application/create-user.usecase';
import { FindUserUseCase } from './application/find-user.usecase';
import { FindAllUsersUseCase } from './application/find-all-users.usecase';
import { DeleteUserUseCase } from './application/delete-user.usecase';
import { UpdateUserUseCase } from './application/update-user.usecase';
import { RestoreUserUseCase } from './application/restore-user.usecase';
import { BcryptPasswordHasher } from './infra/bcrypt.hasher';
import { PrismaUserRepository } from './infra/prisma.user.repository';
import { DatabaseModule } from '../infra/database/database.module';

@Module({
  imports: [
    DatabaseModule,
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || 'lari-nails-secret-key-123456789',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [AuthController, UserController],
  providers: [
    LoginUseCase,
    SetupStatusUseCase,
    SetupUseCase,
    CreateUserUseCase,
    FindUserUseCase,
    FindAllUsersUseCase,
    DeleteUserUseCase,
    UpdateUserUseCase,
    RestoreUserUseCase,
    {
      provide: 'IUserRepository',
      useClass: PrismaUserRepository,
    },
    {
      provide: 'IPasswordHasher',
      useClass: BcryptPasswordHasher,
    },
  ],
  exports: [
    LoginUseCase,
    SetupStatusUseCase,
    SetupUseCase,
    CreateUserUseCase,
    FindUserUseCase,
    FindAllUsersUseCase,
    DeleteUserUseCase,
    UpdateUserUseCase,
    RestoreUserUseCase,
    JwtModule,
    'IUserRepository',
  ],
})
export class UsersModule {}
