/* eslint-disable @typescript-eslint/unbound-method */
import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Delete,
  Patch,
  UseFilters,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CreateUserUseCase } from '../application/create-user.usecase';
import { FindAllUsersUseCase } from '../application/find-all-users.usecase';
import { FindUserUseCase } from '../application/find-user.usecase';
import { DeleteUserUseCase } from '../application/delete-user.usecase';
import { UpdateUserUseCase } from '../application/update-user.usecase';
import { RestoreUserUseCase } from '../application/restore-user.usecase';
import { CreateUserDto } from './dtos/create-user.dto';
import { UpdateUserDto } from './dtos/update-user.dto';
import { IdUserDto } from './dtos/id-user.dto';
import { UserPresenter } from './presenters/users.presenter';
import { UserDomainExceptionFilter } from './filters/user.domain.filter';
import { Roles } from '../../infra/security/decorators/roles.decorator';

@Controller('users')
@UseFilters(UserDomainExceptionFilter)
export class UserController {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly findAllUsersUseCase: FindAllUsersUseCase,
    private readonly findUserUseCase: FindUserUseCase,
    private readonly deleteUserUseCase: DeleteUserUseCase,
    private readonly updateUserUseCase: UpdateUserUseCase,
    private readonly restoreUserUseCase: RestoreUserUseCase,
  ) {}

  @Roles('admin')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: CreateUserDto) {
    const user = await this.createUserUseCase.execute(body);
    return {
      message: 'Usuario criado com sucesso',
      user: UserPresenter.toHTTP(user),
    };
  }

  @Roles('admin')
  @Get()
  async findAll() {
    const users = await this.findAllUsersUseCase.execute();
    return users.map(UserPresenter.toHTTP);
  }

  @Get(':id')
  async findById(@Param() params: IdUserDto) {
    const user = await this.findUserUseCase.execute(params.id);
    return UserPresenter.toHTTP(user);
  }

  @Patch(':id')
  async update(@Param() params: IdUserDto, @Body() body: UpdateUserDto) {
    const user = await this.updateUserUseCase.execute({
      id: params.id,
      ...body,
    });
    return {
      message: 'Usuario atualizado com sucesso',
      user: UserPresenter.toHTTP(user),
    };
  }

  @Roles('admin')
  @Patch(':id/restore')
  async restore(@Param() params: IdUserDto) {
    const user = await this.restoreUserUseCase.execute(params.id);
    return {
      message: 'Usuario reativado com sucesso',
      user: UserPresenter.toHTTP(user),
    };
  }

  @Roles('admin')
  @Delete(':id')
  async delete(@Param() params: IdUserDto) {
    await this.deleteUserUseCase.execute(params.id);
    return { message: 'Usuario deletado com sucesso' };
  }
}
