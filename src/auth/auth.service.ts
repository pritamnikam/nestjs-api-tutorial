import { ForbiddenException, Injectable } from "@nestjs/common";
import { PrismaClient, Prisma } from '@prisma/client'
import { PrismaService } from "../prisma/prisma.service";
import { AuthDto } from "./dto";
import * as argon from "argon2"
import { JwtService } from "@nestjs/jwt/dist";
import { ConfigService } from '@nestjs/config/dist';

@Injectable()
export class AuthService{

    constructor(
        private prisma: PrismaService,
        private jwt: JwtService,
        private config: ConfigService
    ) {
        
    }

    async signup(dto: AuthDto) {
        // console.log({dto});
        try {
            // 1. generate the passowrd
            const hash = await argon.hash(dto.password);

            // 2. Save the user in DB
            const user = await this.prisma.user.create({
                data: {
                    email: dto.email,
                    hash,
                }
            });

            // 3. return the saved user
            // delete user.hash;
            // return user;
            return await this.signToken(user.id, user.email);
        }
        catch(error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === "P2002") {
                    throw new ForbiddenException("Credential taken.");
                }
            }

            else {
                throw error;
            }
        }
    }

    async signin(dto: AuthDto) {
        // console.log({dto});
        
        // 1. find the user by email
        const user = await this.prisma.user.findUnique({
            where: {
                email: dto.email,
            }
        });

        // if user doen not exists throw exception
        if (!user) {
            throw new ForbiddenException('Credential incorrect.');
        }

        // 2. compare password
        const pwdMatches = await argon.verify(
            user.hash, 
            dto.password
        );

        // if password incorrect throw excdption
        if (!pwdMatches) {
            throw new ForbiddenException('Password incorrect.');
        }

        // 3. send back user
        // delete user.hash;
        // return user;
        return await this.signToken(user.id, user.email);
    }

    async signToken(
        userId: number, 
        email: string
    ) : Promise<{access_token: string}> {

        const payload = {
            sub: userId,
            email
        }

        const secret = this.config.get('JWT_SECRET');
        const token = await this.jwt.signAsync(
            payload,
            {
                expiresIn: '15m',
                secret: secret,
            }
        );

        return {
            access_token: token,
        };
    }
}