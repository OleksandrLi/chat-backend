import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import jwtConfig from '../config/jwt.config';
import { HashingService } from '../hashing/hashing.service';
import { SignInDto } from './dto/sign-in.dto';
import { SignUpDto } from './dto/sign-up.dto';
import { ActiveUserData } from '../interfaces/active-user-data.interface';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { TokenData } from './entities/token-data.entity';

interface MyToken {
  rememberMe: boolean;
}

@Injectable()
export class AuthenticationService {
  constructor(
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
    private readonly hashingService: HashingService,
    private readonly jwtService: JwtService,
    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
  ) {}

  async signUp(signUpDto: SignUpDto): Promise<TokenData> {
    try {
      const user = signUpDto as User;
      user.image = '';
      user.password = await this.hashingService.hash(signUpDto.password);

      await this.usersRepository.save(user);
      return await this.generateTokens(user);
    } catch (err) {
      const pgUniqueViolationErrorCode = '23505';
      if (err.code === pgUniqueViolationErrorCode) {
        throw new ConflictException('This email is already in use');
      }
      throw err;
    }
  }

  async signIn(signInDto: SignInDto): Promise<TokenData> {
    const user = await this.usersRepository.findOneBy({
      email: signInDto.email,
    });
    if (!user) {
      throw new ForbiddenException('User does not exists');
    }
    const isEqual = await this.hashingService.compare(
      signInDto.password,
      user.password,
    );
    if (!isEqual) {
      throw new BadRequestException('Password does not match');
    }

    return await this.generateTokens(user, undefined, signInDto.rememberMe);
  }

  async generateTokens(
    user: User,
    isRefresh?: boolean,
    rememberMe?: boolean,
  ): Promise<TokenData> {
    const [accessToken, refreshToken] = await Promise.all([
      this.signToken<Partial<ActiveUserData>>(
        user.id,
        this.jwtConfiguration.accessTokenTtl,
        { email: user.email, name: user.name, image: user.image },
      ),
      this.signToken(
        user.id,
        !rememberMe
          ? this.jwtConfiguration.refreshTokenTtl
          : this.jwtConfiguration.refreshTokenTtlRememberMe,
        { rememberMe },
      ),
    ]);
    const data = {
      accessToken,
      refreshToken,
    } as TokenData;

    if (!isRefresh) {
      data.user = {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        isOnline: user.isOnline,
      };
    }

    return data;
  }

  async refreshTokens(refreshTokenDto: RefreshTokenDto): Promise<TokenData> {
    try {
      const decodedJwt = this.jwtService.decode(
        refreshTokenDto.refreshToken,
      ) as MyToken;
      const { sub } = await this.jwtService.verifyAsync<
        Pick<ActiveUserData, 'sub'>
      >(refreshTokenDto.refreshToken, {
        secret: this.jwtConfiguration.secret,
        audience: this.jwtConfiguration.audience,
        issuer: this.jwtConfiguration.issuer,
      });
      const user = await this.usersRepository.findOneByOrFail({
        id: sub,
      });
      return this.generateTokens(user, true, decodedJwt.rememberMe);
    } catch (err) {
      throw new UnauthorizedException();
    }
  }

  private async signToken<T>(
    userId: number,
    expiresIn: number,
    payload?: T,
  ): Promise<string> {
    return await this.jwtService.signAsync(
      {
        sub: userId,
        ...payload,
      },
      {
        audience: this.jwtConfiguration.audience,
        issuer: this.jwtConfiguration.issuer,
        secret: this.jwtConfiguration.secret,
        expiresIn,
      },
    );
  }
}
