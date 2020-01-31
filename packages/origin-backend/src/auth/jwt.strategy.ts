import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IUserWithRelationsIds } from '@energyweb/origin-backend-core';

import { UserService } from '../pods/user/user.service';
import { IJWTPayload } from './auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    private readonly configService: ConfigService;

    constructor(
        @Inject(ConfigService) _configService: ConfigService,
        private readonly userService: UserService
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: _configService.get<string>('JWT_SECRET')
        });

        this.configService = _configService;
    }

    async validate(payload: IJWTPayload): Promise<IUserWithRelationsIds> {
        const user = await this.userService.findByEmail(payload.email);

        if (user) {
            return user;
        }

        return null;
    }
}
