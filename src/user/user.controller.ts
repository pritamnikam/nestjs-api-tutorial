import { 
    Controller, 
    Get, 
    UseGuards, 
    Patch,
} from '@nestjs/common';

import { AuthGuard } from '@nestjs/passport';
import { GetUser } from '../auth/decorator';
import { JwtGuard } from '../auth/guard';
import { User } from '@prisma/client'
import { Body } from '@nestjs/common/decorators/http/route-params.decorator';
import { EditUserDto } from './dto';
import { UserService } from './user.service';

@UseGuards(JwtGuard)
@Controller('users')
export class UserController {

    constructor(private userService: UserService) {}

    @Get('me')
    getMe(
        @GetUser() user: User
    ) {
        return user;
    }

    @Patch()
    editUser(
        @GetUser('id') userId: number,
        @Body() dto: EditUserDto
    ) {
        return this.userService.editUser(userId, dto);
    }
}
