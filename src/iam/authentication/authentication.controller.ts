import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthenticationService } from './authentication.service';
import { SignUpDto } from './dto/sign-up.dto';
import { SignInDto } from './dto/sign-in.dto';
import { AuthType } from './enums/auth-type.enum';
import { Auth } from '../decorators/auth.decorator';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { RefreshTokenData, TokenData } from './entities/token-data.entity';

@ApiTags('Authentication')
@Auth(AuthType.None)
@Controller('authentication')
export class AuthenticationController {
  constructor(private readonly authService: AuthenticationService) {}

  @Post('sign-up')
  @ApiOkResponse({
    description: 'Refresh tokens',
    type: TokenData,
  })
  signUp(@Body() signUpDto: SignUpDto): Promise<TokenData> {
    return this.authService.signUp(signUpDto);
  }

  @Post('sign-in')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'Sign in and return tokens with active user',
    type: TokenData,
  })
  signIn(@Body() signInDto: SignInDto): Promise<TokenData> {
    return this.authService.signIn(signInDto);
  }

  @Post('refresh-tokens')
  @ApiOkResponse({
    description: 'Refresh tokens',
    type: RefreshTokenData,
  })
  @HttpCode(HttpStatus.OK)
  refreshTokens(@Body() refreshTokenDto: RefreshTokenDto): Promise<TokenData> {
    return this.authService.refreshTokens(refreshTokenDto);
  }
}
