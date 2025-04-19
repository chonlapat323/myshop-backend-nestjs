import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

type ValidatedUser = {
  id: number;
  email: string;
  role: string;
};
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    super({
      //jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req) => req?.cookies?.token || null,
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'), // ควรใช้ environment variable
    });
  }

  async validate(payload: ValidatedUser) {
    return { userId: payload.id, email: payload.email, role: payload.role };
  }
}
